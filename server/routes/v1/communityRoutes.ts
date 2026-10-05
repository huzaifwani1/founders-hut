import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireVerification, AuthRequest } from '../../middleware/auth';
import { requestLimiter } from '../../middleware/rateLimiter';

const router = Router();
const prisma = new PrismaClient();

// 1. List all founder communities with user membership state
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { category } = req.query;

    const communities = await prisma.community.findMany({
      where: {
        status: 'ACTIVE',
        ...(category && category !== 'ALL' ? { category: String(category) } : {})
      },
      include: {
        memberships: {
          where: { userId, status: 'ACTIVE' },
          select: { role: true, joinedAt: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const formatted = communities.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      category: c.category,
      description: c.description,
      icon: c.icon,
      isPrivate: c.isPrivate,
      creatorId: c.creatorId,
      membersCount: c.membersCount,
      isJoined: c.memberships.length > 0,
      userRole: c.memberships[0]?.role || null
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('List communities error:', error);
    return res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

// 2. Create a new community (Verified members)
router.post('/', authenticateToken, requireVerification, requestLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, description, category, isPrivate } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Community name and description are required' });
    }

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    const validCategory = ['SECTOR', 'STAGE', 'TOPIC', 'REGION'].includes(category) ? category : 'TOPIC';

    const community = await prisma.community.create({
      data: {
        name: name.trim(),
        slug: uniqueSlug,
        category: validCategory,
        description: description.trim(),
        isPrivate: !!isPrivate,
        creatorId: userId,
        membersCount: 1,
        memberships: {
          create: {
            userId,
            role: 'OWNER',
            status: 'ACTIVE'
          }
        }
      }
    });

    return res.status(201).json(community);
  } catch (error) {
    console.error('Create community error:', error);
    return res.status(500).json({ error: 'Failed to create community' });
  }
});

// 3. Get single community details
router.get('/:slugOrId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { slugOrId } = req.params;

    const community = await prisma.community.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }]
      },
      include: {
        creator: { select: { id: true, email: true, profile: true } },
        memberships: {
          where: { userId, status: 'ACTIVE' },
          select: { role: true, joinedAt: true }
        }
      }
    });

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    const isJoined = community.memberships.length > 0;
    const userRole = community.memberships[0]?.role || null;

    // Fetch discussions / posts filtered for blocked users
    const blockedUserIds = (
      await prisma.userBlock.findMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
        select: { blockerId: true, blockedId: true }
      })
    ).map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId));

    const posts = await prisma.post.findMany({
      where: {
        communityId: community.id,
        deletedAt: null,
        authorId: { notIn: blockedUserIds }
      },
      include: {
        author: { select: { id: true, email: true, profile: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      ...community,
      isJoined,
      userRole,
      discussions: posts
    });
  } catch (error) {
    console.error('Get community details error:', error);
    return res.status(500).json({ error: 'Failed to fetch community details' });
  }
});

// 3b. Post a discussion in a community
router.post('/:id/discussions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const communityId = req.params.id;
    const userId = req.user!.id;
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    const membership = await prisma.communityMembership.findFirst({
      where: { communityId, userId, status: 'ACTIVE' }
    });

    if (!membership && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: You must join this community before posting' });
    }

    const post = await prisma.post.create({
      data: {
        authorId: userId,
        type: 'SHORT_POST',
        title: title.trim(),
        body: body.trim(),
        visibility: 'COMMUNITY_ONLY',
        communityId
      },
      include: {
        author: { select: { id: true, email: true, profile: true } }
      }
    });

    return res.status(201).json(post);
  } catch (error) {
    console.error('Create community discussion error:', error);
    return res.status(500).json({ error: 'Failed to create discussion' });
  }
});

// 4. Join a community
router.post('/:id/join', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const communityId = req.params.id;
    const userId = req.user!.id;

    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    const existing = await prisma.communityMembership.findUnique({
      where: { communityId_userId: { communityId, userId } }
    });

    if (existing && existing.status === 'ACTIVE') {
      return res.json({ message: 'Already an active member', membership: existing });
    }

    let membership;
    if (existing) {
      membership = await prisma.communityMembership.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE', role: 'MEMBER' }
      });
    } else {
      membership = await prisma.communityMembership.create({
        data: { communityId, userId, role: 'MEMBER', status: 'ACTIVE' }
      });
    }

    await prisma.community.update({
      where: { id: communityId },
      data: { membersCount: { increment: 1 } }
    });

    return res.status(201).json({ message: 'Joined community successfully', membership });
  } catch (error) {
    console.error('Join community error:', error);
    return res.status(500).json({ error: 'Failed to join community' });
  }
});

// 5. Leave a community
router.post('/:id/leave', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const communityId = req.params.id;
    const userId = req.user!.id;

    const existing = await prisma.communityMembership.findUnique({
      where: { communityId_userId: { communityId, userId } }
    });

    if (!existing || existing.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Membership record not found' });
    }

    await prisma.communityMembership.delete({ where: { id: existing.id } });
    await prisma.community.update({
      where: { id: communityId },
      data: { membersCount: { decrement: 1 } }
    });

    return res.json({ message: 'Left community successfully' });
  } catch (error) {
    console.error('Leave community error:', error);
    return res.status(500).json({ error: 'Failed to leave community' });
  }
});

// 6. Get community members directory
router.get('/:id/members', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const communityId = req.params.id;
    const members = await prisma.communityMembership.findMany({
      where: { communityId, status: 'ACTIVE' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
            verifications: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        }
      },
      orderBy: { joinedAt: 'asc' }
    });

    const formatted = members.map((m) => ({
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.user
    }));

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch community members' });
  }
});

// 7. Get community posts
router.get('/:id/posts', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const communityId = req.params.id;

    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    if (community.isPrivate) {
      const isMember = await prisma.communityMembership.findFirst({
        where: { communityId, userId, status: 'ACTIVE' }
      });
      if (!isMember && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Private community access required' });
      }
    }

    const posts = await prisma.post.findMany({
      where: { communityId, deletedAt: null },
      include: {
        author: { select: { id: true, email: true, profile: true, verifications: { orderBy: { createdAt: 'desc' }, take: 1 } } },
        community: { select: { id: true, name: true, slug: true } },
        comments: { where: { deletedAt: null } },
        usefulReactions: { select: { userId: true } },
        saves: { select: { userId: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = posts.map((post) => ({
      ...post,
      usefulCount: post.usefulReactions.length,
      isUsefulByMe: post.usefulReactions.some((r) => r.userId === userId),
      isSavedByMe: post.saves.some((s) => s.userId === userId),
      commentsCount: post.comments.length
    }));

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch community posts' });
  }
});

// 8. Get community requests
router.get('/:id/requests', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const communityId = req.params.id;
    const requests = await prisma.request.findMany({
      where: { communityId },
      include: {
        author: { select: { id: true, email: true, profile: true, verifications: { orderBy: { createdAt: 'desc' }, take: 1 } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch community requests' });
  }
});

export default router;
