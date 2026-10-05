import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const ALLOWED_EVENT_TYPES = [
  'account_created',
  'verification_submitted',
  'verification_approved',
  'activation_completed',
  'profile_viewed',
  'search_performed',
  'request_created',
  'help_offered',
  'introduction_requested',
  'introduction_accepted',
  'connection_created',
  'message_sent',
];

// Record privacy-conscious product analytics event
router.post('/event', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventType, metadata } = req.body;

    if (!eventType || typeof eventType !== 'string') {
      res.status(400).json({ error: 'eventType is required' });
      return;
    }

    if (!ALLOWED_EVENT_TYPES.includes(eventType)) {
      res.status(400).json({ error: `Invalid eventType. Allowed events: ${ALLOWED_EVENT_TYPES.join(', ')}` });
      return;
    }

    // Sanitize metadata to strictly exclude message text, passwords, or tokens
    let sanitizedMetadata: string | null = null;
    if (metadata && typeof metadata === 'object') {
      const copy = { ...metadata };
      delete copy.text;
      delete copy.content;
      delete copy.password;
      delete copy.token;
      delete copy.secret;
      sanitizedMetadata = JSON.stringify(copy);
    }

    const event = await prisma.analyticsEvent.create({
      data: {
        userId: req.user!.id,
        eventType,
        metadata: sanitizedMetadata,
      },
    });

    res.status(201).json({ message: 'Analytics event recorded', eventId: event.id });
  } catch (error) {
    console.error('Analytics event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
