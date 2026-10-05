import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

function formatUserSummary(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.profile?.name || 'Executive Member',
    role: user.profile?.role || 'Founder',
    company: user.profile?.company || 'Enterprise',
    profile: user.profile
  };
}

// Get resolution records relevant to current user (or filtered by user/request)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { requestId, helperId, askerId } = req.query;

    const whereClause: any = {};

    if (requestId) {
      whereClause.requestId = String(requestId);
    }
    if (helperId) {
      whereClause.helperId = String(helperId);
    }
    if (askerId) {
      whereClause.askerId = String(askerId);
    }

    // If no specific filter, default to resolutions involving current user
    if (!requestId && !helperId && !askerId) {
      whereClause.OR = [{ askerId: userId }, { helperId: userId }];
    }

    const resolutions = await prisma.resolutionRecord.findMany({
      where: whereClause,
      include: {
        asker: { select: { id: true, email: true, profile: true } },
        helper: { select: { id: true, email: true, profile: true } },
        request: { select: { id: true, title: true, needCategory: true, urgency: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enforce visibility rules
    const visibleResolutions = resolutions
      .filter((r) => {
        if (r.askerId === userId || r.helperId === userId || req.user!.role === 'ADMIN') return true;
        if (r.status !== 'VERIFIED') return false;
        if (r.visibility === 'PRIVATE' || r.visibility === 'PARTICIPANTS_ONLY') return false;
        return true; // VERIFIED_NETWORK
      })
      .map((r) => ({
        ...r,
        asker: formatUserSummary(r.asker),
        helper: formatUserSummary(r.helper)
      }));

    return res.json(visibleResolutions);
  } catch (error) {
    console.error('Fetch resolutions error:', error);
    return res.status(500).json({ error: 'Failed to fetch resolution records' });
  }
});

// Create a new resolution record (initiated by asker)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const askerId = req.user!.id;
    const {
      requestId,
      helperId,
      introductionId,
      outcomeType,
      outcomeCategory,
      helpType,
      askerAssessment,
      summary,
      visibility
    } = req.body;

    if (!requestId || !helperId || !outcomeType || !helpType) {
      return res.status(400).json({ error: 'requestId, helperId, outcomeType, and helpType are required' });
    }

    if (askerId === helperId) {
      return res.status(400).json({ error: 'Self-resolution is not permitted. Asker and helper must be different users.' });
    }

    // Verify request exists
    const request = await prisma.request.findUnique({ where: { id: requestId } });
    if (!request) {
      return res.status(404).json({ error: 'Associated business request not found' });
    }

    // Verify helper exists
    const helper = await prisma.user.findUnique({ where: { id: helperId } });
    if (!helper) {
      return res.status(404).json({ error: 'Designated helper user not found' });
    }

    // Check duplicate non-declined resolution record for (requestId, helperId)
    const existing = await prisma.resolutionRecord.findFirst({
      where: {
        requestId,
        helperId,
        status: { not: 'DECLINED' }
      }
    });

    if (existing) {
      return res.status(409).json({ error: 'Conflict: A resolution record already exists between this asker and helper for this request' });
    }

    const validVisibility = ['PRIVATE', 'PARTICIPANTS_ONLY', 'VERIFIED_NETWORK'].includes(visibility)
      ? visibility
      : 'VERIFIED_NETWORK';

    const resolution = await prisma.resolutionRecord.create({
      data: {
        requestId,
        askerId,
        helperId,
        introductionId: introductionId || null,
        outcomeType,
        outcomeCategory: outcomeCategory || 'ACTIONABLE_ADVICE',
        helpType,
        askerAssessment: askerAssessment || null,
        helperConfirmation: false,
        summary: summary || null,
        visibility: validVisibility,
        status: 'PENDING_HELPER_CONFIRMATION'
      },
      include: {
        asker: { select: { id: true, email: true, profile: true } },
        helper: { select: { id: true, email: true, profile: true } },
        request: { select: { id: true, title: true } }
      }
    });

    // Notify helper that confirmation is requested
    await prisma.notification.create({
      data: {
        userId: helperId,
        type: 'RESOLUTION_CONFIRMATION_REQUESTED',
        title: 'Problem Solved Confirmation Requested',
        detail: `Confirmation requested for help provided on "${request.title}".`,
        isRead: false
      }
    });

    return res.status(201).json({
      ...resolution,
      asker: formatUserSummary(resolution.asker),
      helper: formatUserSummary(resolution.helper)
    });
  } catch (error) {
    console.error('Create resolution error:', error);
    return res.status(500).json({ error: 'Failed to create resolution record' });
  }
});

// Helper confirmation endpoint (confirm or decline resolution)
router.put('/:id/confirm', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const helperId = req.user!.id;
    const { confirmed } = req.body;

    const resolution = await prisma.resolutionRecord.findUnique({ where: { id: req.params.id } });
    if (!resolution) {
      return res.status(404).json({ error: 'Resolution record not found' });
    }

    // Only the designated helper or admin can confirm/decline
    if (resolution.helperId !== helperId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only the designated helper can confirm or decline this resolution' });
    }

    const updatedStatus = confirmed ? 'VERIFIED' : 'DECLINED';

    const updated = await prisma.resolutionRecord.update({
      where: { id: req.params.id },
      data: {
        helperConfirmation: !!confirmed,
        status: updatedStatus
      },
      include: {
        asker: { select: { id: true, email: true, profile: true } },
        helper: { select: { id: true, email: true, profile: true } },
        request: { select: { id: true, title: true } }
      }
    });

    if (confirmed) {
      // Notify asker that resolution is verified
      await prisma.notification.create({
        data: {
          userId: resolution.askerId,
          type: 'RESOLUTION_VERIFIED',
          title: 'Resolution Verified',
          detail: `Your helper confirmed the resolution for "${updated.request?.title || 'Request'}". It is now part of your verified network history.`,
          isRead: false
        }
      });
    }

    return res.json({
      ...updated,
      asker: formatUserSummary(updated.asker),
      helper: formatUserSummary(updated.helper)
    });
  } catch (error) {
    console.error('Confirm resolution error:', error);
    return res.status(500).json({ error: 'Failed to update resolution confirmation' });
  }
});

export default router;
