import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireVerification, AuthRequest } from '../../middleware/auth';
import { requestLimiter } from '../../middleware/rateLimiter';

const router = Router();
const prisma = new PrismaClient();

// Get all requests with visibility filtering
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query;
    const userId = req.user!.id;

    // Find connections of current user
    const userConnections = await prisma.connection.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }]
      },
      select: { userAId: true, userBId: true }
    });

    const connectedUserIds = new Set<string>();
    userConnections.forEach((c) => {
      connectedUserIds.add(c.userAId === userId ? c.userBId : c.userAId);
    });

    // Find blocks involving current user
    const blocks = await prisma.userBlock.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
    });

    const blockedUserIds = new Set<string>();
    blocks.forEach((b) => {
      blockedUserIds.add(b.blockerId === userId ? b.blockedId : b.blockerId);
    });

    const requests = await prisma.request.findMany({
      where: {
        ...(category && category !== 'all' ? { needCategory: String(category) } : {})
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            profile: true,
            verifications: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enforce Request Visibility & Block Rules:
    // 1. Author can always see their own requests.
    // 2. Hide requests from blocked members.
    // 3. PUBLIC_TO_VERIFIED_NETWORK is visible to all non-blocked authenticated members.
    // 4. CONNECTIONS_ONLY is visible only to direct connections of the author.
    // 5. PRIVATE is visible only to the author.
    const visibleRequests = requests.filter((r) => {
      if (r.authorId !== userId && blockedUserIds.has(r.authorId)) return false;
      if (r.authorId === userId || req.user!.role === 'ADMIN') return true;
      if (r.visibility === 'PRIVATE') return false;
      if (r.visibility === 'CONNECTIONS_ONLY') return connectedUserIds.has(r.authorId);
      return true; // PUBLIC_TO_VERIFIED_NETWORK
    });

    return res.json(visibleRequests);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch business requests' });
  }
});

// Post new structured request with visibility selection
router.post('/', authenticateToken, requireVerification, requestLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { needCategory, title, needDescription, context, industry, location, desiredConnection, urgency, visibility } = req.body;

    if (!title || !needDescription) {
      return res.status(400).json({ error: 'Title and need description are required' });
    }

    const validVisibility = ['PUBLIC_TO_VERIFIED_NETWORK', 'CONNECTIONS_ONLY', 'PRIVATE'].includes(visibility)
      ? visibility
      : 'PUBLIC_TO_VERIFIED_NETWORK';

    const newRequest = await prisma.request.create({
      data: {
        authorId: req.user!.id,
        needCategory: needCategory || 'EXPANSION',
        title,
        needDescription,
        context: context || null,
        industry: industry || 'Cross-Industry',
        location: location || 'Remote / Pan-India',
        desiredConnection: desiredConnection || null,
        urgency: urgency === 'URGENT' ? 'URGENT' : 'NORMAL',
        visibility: validVisibility
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            profile: true,
            verifications: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        }
      }
    });

    return res.status(201).json(newRequest);
  } catch (error) {
    console.error('Create request error:', error);
    return res.status(500).json({ error: 'Failed to create business request' });
  }
});

// Update request status / details
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status, title, needDescription, visibility } = req.body;
    const request = await prisma.request.findUnique({ where: { id: req.params.id } });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // IDOR Authorization Check
    if (request.authorId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: You can only update your own requests' });
    }

    const updated = await prisma.request.update({
      where: { id: req.params.id },
      data: {
        ...(status ? { status } : {}),
        ...(title ? { title } : {}),
        ...(needDescription ? { needDescription } : {}),
        ...(visibility ? { visibility } : {})
      }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update request' });
  }
});

// Delete request IDOR check
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const request = await prisma.request.findUnique({ where: { id: req.params.id } });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // IDOR Check
    if (request.authorId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own requests' });
    }

    await prisma.request.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete request' });
  }
});

export default router;
