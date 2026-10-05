import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireVerification, AuthRequest } from '../../middleware/auth';
import { messageLimiter } from '../../middleware/rateLimiter';

const router = Router();
const prisma = new PrismaClient();

// Get conversations for current user
router.get('/conversations', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participantAId: req.user!.id },
          { participantBId: req.user!.id }
        ]
      },
      include: {
        participantA: { select: { id: true, email: true, profile: true, verifications: { orderBy: { createdAt: 'desc' }, take: 1 } } },
        participantB: { select: { id: true, email: true, profile: true, verifications: { orderBy: { createdAt: 'desc' }, take: 1 } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const formatted = conversations.map((conv) => {
      const isUserA = conv.participantAId === req.user!.id;
      const participant = isUserA ? conv.participantB : conv.participantA;
      return {
        id: conv.id,
        participant,
        topic: conv.topic,
        facilitatedBy: conv.facilitatedBy,
        lastMessage: conv.messages[0]?.text || 'Conversation initiated',
        lastMessageTime: conv.messages[0]?.createdAt || conv.updatedAt,
        unreadCount: 0
      };
    });

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages in a conversation with IDOR authorization protection
router.get('/conversations/:id/messages', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const conv = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Strict IDOR Authorization Guard
    if (conv.participantAId !== req.user!.id && conv.participantBId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: You are not an authorized participant in this conversation' });
    }

    return res.json(conv.messages);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send 1-to-1 message with rate limiter and authorization guard
router.post('/conversations/:id/messages', authenticateToken, requireVerification, messageLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text cannot be empty' });
    }

    const conv = await prisma.conversation.findUnique({ where: { id: req.params.id } });
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if communication is blocked
    const otherId = conv.participantAId === req.user!.id ? conv.participantBId : conv.participantAId;
    const blockExists = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: req.user!.id, blockedId: otherId },
          { blockerId: otherId, blockedId: req.user!.id },
        ],
      },
    });

    if (blockExists) {
      return res.status(403).json({ error: 'Forbidden: Communication with this member is blocked' });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: req.user!.id,
        text
      }
    });

    await prisma.conversation.update({
      where: { id: conv.id },
      data: {
        lastMessage: text,
        lastMessageTime: new Date(),
        updatedAt: new Date()
      }
    });

    return res.status(201).json(message);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// Start a new conversation with a target verified user
router.post('/start', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { recipientId, initialMessage, topic, facilitatedBy } = req.body;
    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID required' });
    }

    let targetUserId = recipientId;
    const targetProfile = await prisma.profile.findFirst({
      where: { OR: [{ userId: recipientId }, { id: recipientId }] }
    });
    if (targetProfile) {
      targetUserId = targetProfile.userId;
    }

    // Check if block relationship exists
    const blockExists = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: req.user!.id, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: req.user!.id },
        ],
      },
    });

    if (blockExists) {
      return res.status(403).json({ error: 'Forbidden: Communication with this member is blocked' });
    }

    // Check if recipient allows DMs
    if (targetProfile && !targetProfile.allowDirectMessages && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'This executive does not accept unsolicited direct messages' });
    }

    // Check for existing conversation
    let conv = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participantAId: req.user!.id, participantBId: targetUserId },
          { participantAId: targetUserId, participantBId: req.user!.id }
        ]
      }
    });

    if (!conv) {
      conv = await prisma.conversation.create({
        data: {
          participantAId: req.user!.id,
          participantBId: targetUserId,
          topic: topic || null,
          facilitatedBy: facilitatedBy || null
        }
      });
    }

    if (initialMessage && initialMessage.trim()) {
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: req.user!.id,
          text: initialMessage
        }
      });
    }

    const fullConv = await prisma.conversation.findUnique({
      where: { id: conv.id },
      include: {
        participantA: { select: { id: true, email: true, profile: true, verifications: { orderBy: { createdAt: 'desc' }, take: 1 } } },
        participantB: { select: { id: true, email: true, profile: true, verifications: { orderBy: { createdAt: 'desc' }, take: 1 } } },
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    return res.status(201).json(fullConv);
  } catch (error) {
    console.error('Error starting conversation:', error);
    return res.status(500).json({ error: 'Failed to initiate conversation', details: String(error) });
  }
});

export default router;
