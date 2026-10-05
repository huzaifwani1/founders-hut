import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, AuthRequest } from '../../middleware/auth';
import { logAuditEvent } from '../../middleware/auditLogger';
import { emailService } from '../../services/emailService';

const router = Router();
const prisma = new PrismaClient();

// Get all pending verification submissions
router.get('/verifications/pending', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const pendingVerifications = await prisma.verification.findMany({
      where: { level: 'PENDING' },
      include: {
        user: { select: { id: true, email: true, profile: true } },
        documents: true
      },
      orderBy: { createdAt: 'asc' }
    });

    return res.json(pendingVerifications);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch pending verifications' });
  }
});

// Admin Review & Approve/Reject Verification
router.post('/verifications/:id/review', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { action, level, identityVerified, corporateDomainVerified, entityVerified, founderStatusVerified, rejectionReason } = req.body;
    const verificationId = req.params.id;

    const verification = await prisma.verification.findUnique({ where: { id: verificationId } });
    if (!verification) {
      return res.status(404).json({ error: 'Verification audit record not found' });
    }

    const targetUserRecord = await prisma.user.findUnique({ where: { id: verification.userId } });

    const isApproved = action === 'APPROVE';
    const newLevel = isApproved
      ? (level || 'VERIFIED_MEMBER')
      : 'REJECTED';

    const updatedVerification = await prisma.verification.update({
      where: { id: verificationId },
      data: {
        level: newLevel,
        identityVerified: identityVerified !== undefined ? Boolean(identityVerified) : isApproved,
        corporateDomainVerified: corporateDomainVerified !== undefined ? Boolean(corporateDomainVerified) : true,
        entityVerified: entityVerified !== undefined ? Boolean(entityVerified) : isApproved,
        // Crucial safety rule: Do NOT automatically mark founderStatusVerified unless explicitly established
        founderStatusVerified: founderStatusVerified !== undefined ? Boolean(founderStatusVerified) : false,
        reviewedByAdminId: req.user!.id,
        rejectionReason: !isApproved ? rejectionReason || 'Failed verification audit' : null
      }
    });

    // Update user onboardingStep to 7 (Completed) on approval
    if (isApproved) {
      await prisma.user.update({
        where: { id: verification.userId },
        data: { onboardingStep: 7 }
      });
    }

    // Create Notification for user
    await prisma.notification.create({
      data: {
        userId: verification.userId,
        type: 'VERIFICATION_UPDATE',
        title: isApproved ? 'Verification Approved' : 'Verification Action Required',
        detail: isApproved
          ? `Your executive profile has been audited and granted ${newLevel} badge.`
          : `Audit update: ${rejectionReason || 'Please resubmit corporate credentials.'}`
      }
    });

    // Send email notification
    if (targetUserRecord?.email) {
      if (isApproved) {
        await emailService.sendVerificationApproved(targetUserRecord.email, newLevel);
      } else {
        await emailService.sendVerificationRejected(targetUserRecord.email, rejectionReason || 'Verification rejected');
      }
    }

    // Log Immutable Security Audit Event
    await logAuditEvent(
      req.user!.id,
      isApproved ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
      'VERIFICATION',
      verificationId,
      req.ip,
      { newLevel, rejectionReason }
    );

    return res.json({
      message: `Verification ${isApproved ? 'approved' : 'rejected'} successfully`,
      verification: updatedVerification
    });
  } catch (error) {
    console.error('Admin verification review error:', error);
    return res.status(500).json({ error: 'Failed to process verification audit review' });
  }
});

// Admin Account Suspension Toggle
router.post('/users/:id/suspend', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;
    const { isSuspended } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: Boolean(isSuspended) }
    });

    await logAuditEvent(
      req.user!.id,
      isSuspended ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
      'USER',
      userId,
      req.ip
    );

    return res.json({ message: `User ${isSuspended ? 'suspended' : 'reinstated'} successfully`, user });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update user suspension status' });
  }
});

// Fetch Audit Logs
router.get('/audit-logs', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        admin: { select: { id: true, email: true, profile: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch security audit logs' });
  }
});

export default router;
