import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface VerificationAuditPayload {
  userId: string;
  documentType: string;
  fileRef: string;
}

export interface VerificationReviewPayload {
  userId: string;
  adminId: string;
  action: 'APPROVE' | 'REJECT';
  level?: string;
  reason?: string;
}

export interface VerificationProvider {
  submitDocument(payload: VerificationAuditPayload): Promise<any>;
  reviewVerification(payload: VerificationReviewPayload): Promise<any>;
  getVerificationStatus(userId: string): Promise<any>;
}

/**
 * ManualReviewProvider for MVP
 * Persists identity, corporate domain, entity, and cap table documents in the database
 * and logs structured audit events for administrative review.
 */
export class ManualReviewProvider implements VerificationProvider {
  async submitDocument(payload: VerificationAuditPayload): Promise<any> {
    const { userId, documentType, fileRef } = payload;

    let verification = await prisma.verification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      verification = await prisma.verification.create({
        data: {
          userId,
          level: 'PENDING'
        }
      });
    } else {
      await prisma.verification.update({
        where: { id: verification.id },
        data: { level: 'PENDING' }
      });
    }

    const doc = await prisma.verificationDocument.create({
      data: {
        verificationId: verification.id,
        type: documentType,
        fileRef,
        status: 'PENDING'
      }
    });

    return { verificationId: verification.id, documentId: doc.id, status: 'PENDING' };
  }

  async reviewVerification(payload: VerificationReviewPayload): Promise<any> {
    const { userId, adminId, action, level, reason } = payload;

    const verification = await prisma.verification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      throw new Error('Verification record not found for user');
    }

    const newLevel = action === 'APPROVE' ? (level || 'VERIFIED_MEMBER') : 'REJECTED';

    const updated = await prisma.verification.update({
      where: { id: verification.id },
      data: {
        level: newLevel,
        reviewedByAdminId: adminId,
        rejectionReason: action === 'REJECT' ? (reason || 'Credentials unverified') : null,
        identityVerified: action === 'APPROVE',
        corporateDomainVerified: action === 'APPROVE',
        entityVerified: action === 'APPROVE',
        founderStatusVerified: action === 'APPROVE' && newLevel === 'VERIFIED_FOUNDER'
      }
    });

    // Update user onboarding step to completed if approved
    if (action === 'APPROVE') {
      await prisma.user.update({
        where: { id: userId },
        data: { onboardingStep: 7 }
      });
    }

    // Persist Audit Log event
    await prisma.auditLog.create({
      data: {
        adminId,
        action: action === 'APPROVE' ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
        targetType: 'USER',
        targetId: userId,
        metadata: JSON.stringify({ level: newLevel, reason })
      }
    });

    return updated;
  }

  async getVerificationStatus(userId: string): Promise<any> {
    return prisma.verification.findFirst({
      where: { userId },
      include: { documents: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const verificationService: VerificationProvider = new ManualReviewProvider();
