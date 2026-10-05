import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireVerification, AuthRequest } from '../../middleware/auth';
import { requestLimiter } from '../../middleware/rateLimiter';

const router = Router();
const prisma = new PrismaClient();

// Helper: Check if user is active member of community
async function isUserCommunityMember(userId: string, communityId: string): Promise<boolean> {
  const membership = await prisma.communityMembership.findUnique({
    where: {
      communityId_userId: {
        communityId,
        userId
      }
    }
  });
  return !!membership && membership.status === 'ACTIVE';
}

// 1. GET /api/v1/posts (Feed with Visibility Filtering & Block Rules)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { feedType, communityId, authorId } = req.query;

    // Get user's active community memberships
    const memberships = await prisma.communityMembership.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { communityId: true }
    });
    const joinedCommunityIds = new Set(memberships.map((m) => m.communityId));

    // Get blocked users
    const blocks = await prisma.userBlock.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }]
      }
    });
    const blockedUserIds = new Set<string>();
    blocks.forEach((b) => {
      blockedUserIds.add(b.blockerId === userId ? b.blockedId : b.blockerId);
    });

    // Saved post IDs for user
    const savedPosts = await prisma.postSave.findMany({
      where: { userId },
      select: { postId: true }
    });
    const savedPostIds = new Set(savedPosts.map((s) => s.postId));

    let whereClause: any = {
      deletedAt: null
    };

    if (authorId) {
      whereClause.authorId = String(authorId);
    }

    if (communityId) {
      whereClause.communityId = String(communityId);
    }

    if (feedType === 'saved') {
      whereClause.id = { in: Array.from(savedPostIds) };
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            profile: true,
            verifications: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        },
        community: {
          select: { id: true, name: true, slug: true }
        },
        recipient: {
          select: { id: true, email: true, profile: true }
        },
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, email: true, profile: true }
            }
          }
        },
        usefulReactions: {
          select: { userId: true }
        },
        saves: {
          select: { userId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enforce Visibility Security Rules
    const visiblePosts = posts.filter((post) => {
      // 1. Hide posts from blocked users
      if (post.authorId !== userId && blockedUserIds.has(post.authorId)) return false;

      // 2. Author and Admin can always see their posts
      if (post.authorId === userId || req.user!.role === 'ADMIN') return true;

      // 3. PRIVATE posts: only visible to author or designated recipient
      if (post.visibility === 'PRIVATE') {
        return post.recipientId === userId;
      }

      // 4. COMMUNITY_ONLY posts: only visible if user is an active member of that community
      if (post.visibility === 'COMMUNITY_ONLY') {
        return post.communityId ? joinedCommunityIds.has(post.communityId) : false;
      }

      // 5. PUBLIC_TO_VERIFIED_NETWORK: visible to all authenticated verified members
      return true;
    });

    // Format post objects with user interaction flags
    const formatted = visiblePosts.map((post) => ({
      ...post,
      usefulCount: post.usefulReactions.length,
      isUsefulByMe: post.usefulReactions.some((r) => r.userId === userId),
      isSavedByMe: post.saves.some((s) => s.userId === userId),
      commentsCount: post.comments.length
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Fetch feed error:', error);
    return res.status(500).json({ error: 'Failed to fetch posts feed' });
  }
});

// 2. GET /api/v1/posts/:id (Single Post Detail)
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: { id: true, email: true, profile: true, verifications: { orderBy: { createdAt: 'desc' }, take: 1 } }
        },
        community: {
          select: { id: true, name: true, slug: true }
        },
        recipient: {
          select: { id: true, email: true, profile: true }
        },
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, email: true, profile: true } }
          }
        },
        usefulReactions: { select: { userId: true } },
        saves: { select: { userId: true } }
      }
    });

    if (!post || post.deletedAt) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Security Check: Blocked user check
    const block = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: post.authorId },
          { blockerId: post.authorId, blockedId: userId }
        ]
      }
    });

    if (block && post.authorId !== userId) {
      return res.status(403).json({ error: 'Access denied: Content unavailable' });
    }

    // Visibility Check
    if (post.authorId !== userId && req.user!.role !== 'ADMIN') {
      if (post.visibility === 'PRIVATE' && post.recipientId !== userId) {
        return res.status(403).json({ error: 'Forbidden: Private post' });
      }
      if (post.visibility === 'COMMUNITY_ONLY' && post.communityId) {
        const isMember = await isUserCommunityMember(userId, post.communityId);
        if (!isMember) {
          return res.status(403).json({ error: 'Forbidden: Community membership required' });
        }
      }
    }

    return res.json({
      ...post,
      usefulCount: post.usefulReactions.length,
      isUsefulByMe: post.usefulReactions.some((r) => r.userId === userId),
      isSavedByMe: post.saves.some((s) => s.userId === userId),
      commentsCount: post.comments.length
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// 3. POST /api/v1/posts (Create Post)
router.post('/', authenticateToken, requireVerification, requestLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { type, title, body, linkUrl, visibility, communityId, recipientId } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Post body content is required' });
    }

    const postType = ['SHORT_POST', 'ARTICLE', 'LINK'].includes(type) ? type : 'SHORT_POST';
    const validVisibility = ['PUBLIC_TO_VERIFIED_NETWORK', 'COMMUNITY_ONLY', 'PRIVATE'].includes(visibility)
      ? visibility
      : 'PUBLIC_TO_VERIFIED_NETWORK';

    // Permission check for COMMUNITY_ONLY
    if (validVisibility === 'COMMUNITY_ONLY') {
      if (!communityId) {
        return res.status(400).json({ error: 'communityId is required for COMMUNITY_ONLY posts' });
      }
      const isMember = await isUserCommunityMember(userId, communityId);
      if (!isMember && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: You must be a member of the community to post in it' });
      }
    }

    // Permission check for PRIVATE
    if (validVisibility === 'PRIVATE') {
      if (!recipientId) {
        return res.status(400).json({ error: 'recipientId is required for PRIVATE posts' });
      }
      const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
      if (!recipient) {
        return res.status(404).json({ error: 'Recipient user not found' });
      }
    }

    const post = await prisma.post.create({
      data: {
        authorId: userId,
        type: postType,
        title: title || null,
        body: body.trim(),
        linkUrl: linkUrl || null,
        visibility: validVisibility,
        communityId: validVisibility === 'COMMUNITY_ONLY' ? communityId : (communityId || null),
        recipientId: validVisibility === 'PRIVATE' ? recipientId : null
      },
      include: {
        author: { select: { id: true, email: true, profile: true, verifications: { orderBy: { createdAt: 'desc' }, take: 1 } } },
        community: { select: { id: true, name: true, slug: true } },
        recipient: { select: { id: true, email: true, profile: true } }
      }
    });

    // Notify recipient if private
    if (validVisibility === 'PRIVATE' && recipientId) {
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: 'POST_SHARED_PRIVATELY',
          title: 'Private Post Shared',
          detail: `${req.user!.email} shared a post with you privately.`
        }
      });
    }

    return res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({ error: 'Failed to create post' });
  }
});

// 4. PUT /api/v1/posts/:id (Update Own Post)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });

    if (!post || post.deletedAt) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.authorId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own posts' });
    }

    const { title, body, linkUrl } = req.body;
    const updated = await prisma.post.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(body ? { body: body.trim() } : {}),
        ...(linkUrl !== undefined ? { linkUrl } : {})
      }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update post' });
  }
});

// 5. DELETE /api/v1/posts/:id (Soft Delete Own Post)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });

    if (!post || post.deletedAt) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.authorId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own posts' });
    }

    await prisma.post.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() }
    });

    return res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete post' });
  }
});

// 6. POST /api/v1/posts/:id/useful (Toggle Useful Reaction)
router.post('/:id/useful', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const postId = req.params.id;

    const existing = await prisma.postUsefulReaction.findUnique({
      where: { postId_userId: { postId, userId } }
    });

    if (existing) {
      await prisma.postUsefulReaction.delete({
        where: { id: existing.id }
      });
      return res.json({ useful: false });
    } else {
      await prisma.postUsefulReaction.create({
        data: { postId, userId }
      });
      return res.json({ useful: true });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to toggle useful reaction' });
  }
});

// 7. POST /api/v1/posts/:id/save (Toggle Bookmark/Save)
router.post('/:id/save', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const postId = req.params.id;

    const existing = await prisma.postSave.findUnique({
      where: { postId_userId: { postId, userId } }
    });

    if (existing) {
      await prisma.postSave.delete({
        where: { id: existing.id }
      });
      return res.json({ saved: false });
    } else {
      await prisma.postSave.create({
        data: { postId, userId }
      });
      return res.json({ saved: true });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to toggle save' });
  }
});

// 8. POST /api/v1/posts/:id/share-private (Private Content Sharing)
router.post('/:id/share-private', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user!.id;
    const postId = req.params.id;
    const { recipientId, message } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'recipientId is required' });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const recipient = await prisma.user.findUnique({ where: { id: recipientId }, include: { profile: true } });
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient user not found' });
    }

    // Check block
    const block = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: recipientId },
          { blockerId: recipientId, blockedId: senderId }
        ]
      }
    });
    if (block) {
      return res.status(403).json({ error: 'Cannot share with blocked user' });
    }

    const share = await prisma.privateShare.create({
      data: {
        postId,
        senderId,
        recipientId,
        message: message || null
      }
    });

    const senderProfile = await prisma.profile.findUnique({ where: { userId: senderId } });
    const senderName = senderProfile ? senderProfile.name : req.user!.email;

    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'POST_SHARED_PRIVATELY',
        title: 'Post shared with you',
        detail: `${senderName} shared a post with you.`
      }
    });

    return res.status(201).json(share);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to share post privately' });
  }
});

// 9. POST /api/v1/posts/:id/comments (Add Comment/Reply)
router.post('/:id/comments', authenticateToken, requireVerification, requestLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const authorId = req.user!.id;
    const postId = req.params.id;
    const { body, parentCommentId } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Comment body is required' });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Visibility permission check
    if (post.visibility === 'COMMUNITY_ONLY' && post.communityId) {
      const isMember = await isUserCommunityMember(authorId, post.communityId);
      if (!isMember && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Community membership required to comment' });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId,
        parentCommentId: parentCommentId || null,
        body: body.trim()
      },
      include: {
        author: { select: { id: true, email: true, profile: true } }
      }
    });

    // Notify post author if different
    if (post.authorId !== authorId) {
      const authorProfile = await prisma.profile.findUnique({ where: { userId: authorId } });
      const commenterName = authorProfile ? authorProfile.name : req.user!.email;
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'COMMENT_ADDED',
          title: 'New Comment',
          detail: `${commenterName} commented on your post.`
        }
      });
    }

    return res.status(201).json(comment);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add comment' });
  }
});

// 10. DELETE /api/v1/posts/comments/:commentId (Delete Comment)
router.delete('/comments/:commentId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } });

    if (!comment || comment.deletedAt) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.authorId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own comments' });
    }

    await prisma.comment.update({
      where: { id: req.params.commentId },
      data: { deletedAt: new Date() }
    });

    return res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
