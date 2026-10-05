import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get intros relevant to current user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const intros = await prisma.introduction.findMany({
      where: {
        OR: [
          { fromUserId: req.user!.id },
          { toUserId: req.user!.id },
          { facilitatorId: req.user!.id },
          { suggestedUserId: req.user!.id }
        ]
      },
      include: {
        fromUser: { select: { id: true, email: true, profile: true } },
        toUser: { select: { id: true, email: true, profile: true } },
        facilitator: { select: { id: true, email: true, profile: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(intros);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch introductions' });
  }
});

// Request introduction or suggest someone (3-party introduction)
router.post('/request', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { toUserId, facilitatorId, suggestedUserId, reason } = req.body;

    if (!toUserId || !reason) {
      return res.status(400).json({ error: 'Recipient user ID and reason are required' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Recipient user not found' });
    }

    // Check if interaction is blocked between users
    const blockExists = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: req.user!.id, blockedId: toUserId },
          { blockerId: toUserId, blockedId: req.user!.id },
        ],
      },
    });

    if (blockExists) {
      return res.status(403).json({ error: 'Forbidden: Member interaction is blocked' });
    }

    // Check for duplicate active or accepted introduction request
    const existingIntro = await prisma.introduction.findFirst({
      where: {
        fromUserId: req.user!.id,
        toUserId,
        suggestedUserId: suggestedUserId || null,
        status: { in: ['REQUESTED', 'ACCEPTED', 'CONNECTED'] }
      }
    });

    if (existingIntro) {
      return res.status(409).json({ error: 'Conflict: An active or connected introduction already exists between these members' });
    }

    const newIntro = await prisma.introduction.create({
      data: {
        fromUserId: req.user!.id,
        toUserId,
        facilitatorId: facilitatorId || req.user!.id,
        suggestedUserId: suggestedUserId || null,
        reason,
        status: 'REQUESTED'
      },
      include: {
        fromUser: { select: { id: true, email: true, profile: true } },
        toUser: { select: { id: true, email: true, profile: true } }
      }
    });

    return res.status(201).json(newIntro);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to request introduction' });
  }
});

// Update intro state machine (ACCEPTED / DECLINED / CONNECTED)
router.put('/:id/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const intro = await prisma.introduction.findUnique({ where: { id: req.params.id } });

    if (!intro) {
      return res.status(404).json({ error: 'Introduction request not found' });
    }

    // Recipient Authorization check:
    // Only the persisted target recipient (intro.toUserId) or ADMIN can ACCEPT or DECLINE an introduction!
    // Requester (fromUserId) and Facilitator (facilitatorId) are forbidden from accepting or declining.
    if (req.user!.id !== intro.toUserId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only the target recipient can accept or decline this introduction' });
    }

    const updated = await prisma.introduction.update({
      where: { id: req.params.id },
      data: { status }
    });

    // If DECLINED: Ensure NO connection and NO conversation thread are created!
    if (status === 'DECLINED') {
      return res.json(updated);
    }

    // If ACCEPTED or CONNECTED: Auto-create connection & conversation thread between target users
    if (status === 'ACCEPTED' || status === 'CONNECTED') {
      const targetUser = intro.suggestedUserId || intro.fromUserId;

      const existingConn = await prisma.connection.findFirst({
        where: {
          OR: [
            { userAId: targetUser, userBId: intro.toUserId },
            { userAId: intro.toUserId, userBId: targetUser }
          ]
        }
      });

      if (!existingConn) {
        await prisma.connection.create({
          data: {
            userAId: targetUser,
            userBId: intro.toUserId,
            relationshipNotes: `Warm introduction regarding "${intro.reason}"`
          }
        });
      }

      // Auto-create 1-to-1 conversation container
      let conv = await prisma.conversation.findFirst({
        where: {
          OR: [
            { participantAId: targetUser, participantBId: intro.toUserId },
            { participantAId: intro.toUserId, participantBId: targetUser }
          ]
        }
      });

      if (!conv) {
        conv = await prisma.conversation.create({
          data: {
            participantAId: targetUser,
            participantBId: intro.toUserId,
            topic: intro.reason,
            facilitatedBy: 'Warm Introduction Pathway',
            lastMessage: 'Introduction accepted. You are now directly connected.'
          }
        });
      }
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update introduction status' });
  }
});

export default router;
