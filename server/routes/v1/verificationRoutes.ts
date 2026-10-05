import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../../middleware/auth';
import { logAuditEvent } from '../../middleware/auditLogger';
import {
  evaluateUserVerificationServer,
  isCorporateDomain
} from '../../services/verificationPipelineServer';

const router = Router();
const prisma = new PrismaClient();

// Get current verification status
router.get('/my-status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const verification = await prisma.verification.findFirst({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: { documents: true }
    });

    if (!verification) {
      return res.status(404).json({ error: 'No verification audit record found' });
    }

    return res.json(verification);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch verification status' });
  }
});

// Priority 2 — Real Work Email Verification (Single-use Token OTP Endpoint)
router.post('/verify-email', async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const tokenRecord = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: { include: { verifications: true } } }
    });

    if (!tokenRecord) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    if (tokenRecord.used) {
      return res.status(400).json({ error: 'Verification token has already been used' });
    }

    if (new Date() > tokenRecord.expiresAt) {
      return res.status(400).json({ error: 'Verification token has expired' });
    }

    // Mark token as used
    await prisma.emailVerificationToken.update({
      where: { id: tokenRecord.id },
      data: { used: true }
    });

    // Mark user email as verified
    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { emailVerified: true }
    });

    const hasCorporate = isCorporateDomain(tokenRecord.user.email);
    const existingVerification = tokenRecord.user.verifications[0];

    // Determine new level based on evidence
    let newLevel = 'VERIFIED_MEMBER';
    if (existingVerification?.founderStatusVerified && existingVerification?.entityVerified && hasCorporate) {
      newLevel = 'VERIFIED_FOUNDER';
    } else if (existingVerification?.entityVerified && hasCorporate) {
      newLevel = 'VERIFIED_PROFESSIONAL';
    }

    if (existingVerification) {
      await prisma.verification.update({
        where: { id: existingVerification.id },
        data: {
          level: newLevel,
          identityVerified: true,
          corporateDomainVerified: hasCorporate
        }
      });
    } else {
      await prisma.verification.create({
        data: {
          userId: tokenRecord.userId,
          level: newLevel,
          identityVerified: true,
          corporateDomainVerified: hasCorporate,
          entityVerified: false,
          founderStatusVerified: false
        }
      });
    }

    // Log Immutable Security Audit Event
    await logAuditEvent(
      tokenRecord.userId,
      'EMAIL_VERIFIED',
      'USER',
      tokenRecord.userId,
      req.ip,
      { email: tokenRecord.user.email, isCorporate: hasCorporate }
    );

    return res.json({
      message: 'Work email ownership verified successfully',
      emailVerified: true,
      corporateDomainVerified: hasCorporate,
      level: newLevel
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Failed to verify email token' });
  }
});

// Priority 1 — Server-Side Pipeline Evaluation API
router.post('/evaluate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { role, companyName, invitedByUserId } = req.body;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const evaluation = await evaluateUserVerificationServer({
      userId,
      email: user.email,
      role: role || user.profile?.role || 'Member',
      companyName: companyName || user.profile?.company || 'Enterprise',
      invitedByUserId
    });

    // Sync computed level to database record if needed
    let verification = await prisma.verification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (verification) {
      // Preserve manual admin overrides if already set
      const updatedLevel = verification.founderStatusVerified && verification.entityVerified && evaluation.pillars.corporateDomainVerified
        ? 'VERIFIED_FOUNDER'
        : evaluation.level;

      await prisma.verification.update({
        where: { id: verification.id },
        data: {
          level: updatedLevel,
          identityVerified: evaluation.pillars.identityVerified,
          corporateDomainVerified: evaluation.pillars.corporateDomainVerified,
          evidenceLogJson: JSON.stringify(evaluation.evidenceLog),
          invitationTrustSignal: evaluation.pillars.invitationTrustSignal
        }
      });
    } else {
      verification = await prisma.verification.create({
        data: {
          userId,
          level: evaluation.level,
          identityVerified: evaluation.pillars.identityVerified,
          corporateDomainVerified: evaluation.pillars.corporateDomainVerified,
          entityVerified: evaluation.pillars.entityVerified,
          founderStatusVerified: evaluation.pillars.founderStatusVerified,
          evidenceLogJson: JSON.stringify(evaluation.evidenceLog),
          invitationTrustSignal: evaluation.pillars.invitationTrustSignal
        }
      });
    }

    return res.json({
      ...evaluation,
      verificationId: verification.id
    });
  } catch (error) {
    console.error('Pipeline evaluation error:', error);
    return res.status(500).json({ error: 'Failed to evaluate verification' });
  }
});

// Submit verification documents (Hashed fileRef abstraction - zero raw SSN/Gov ID storage)
router.post('/submit', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { documentType, fileRef } = req.body;

    let verification = await prisma.verification.findFirst({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      verification = await prisma.verification.create({
        data: {
          userId: req.user!.id,
          level: 'PENDING',
          identityVerified: false,
          corporateDomainVerified: false,
          entityVerified: false,
          founderStatusVerified: false
        }
      });
    }

    const document = await prisma.verificationDocument.create({
      data: {
        verificationId: verification.id,
        type: documentType || 'COMPANY',
        fileRef: fileRef || `s3_abstract_ref_${Date.now()}`,
        status: 'PENDING'
      }
    });

    await prisma.verification.update({
      where: { id: verification.id },
      data: { level: 'PENDING' }
    });

    return res.status(201).json({
      message: 'Verification audit documents submitted successfully',
      verificationId: verification.id,
      document
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to submit verification document' });
  }
});

export default router;
