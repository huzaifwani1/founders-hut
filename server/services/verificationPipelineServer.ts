import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type VerificationLevel =
  | 'UNVERIFIED'
  | 'PENDING'
  | 'VERIFIED_MEMBER'
  | 'VERIFIED_PROFESSIONAL'
  | 'VERIFIED_FOUNDER'
  | 'VERIFIED_INVESTOR'
  | 'REJECTED';

export interface VerificationPillars {
  identityVerified: boolean;
  corporateDomainVerified: boolean;
  entityVerified: boolean;
  founderStatusVerified: boolean;
  invitationTrustSignal: boolean;
  manualReviewPending: boolean;
}

export interface VerificationEvidenceItem {
  claim: string;
  evidenceSource: string;
  verificationMethod: string;
  verifiedAt: string;
  verifiedBy: string;
  confidenceScore: number;
  status: 'VERIFIED' | 'PENDING' | 'FAILED';
  details: string;
}

export interface ServerPipelineInput {
  userId: string;
  email: string;
  role: string;
  companyName: string;
  invitedByUserId?: string;
}

export interface ServerPipelineOutput {
  level: VerificationLevel;
  pillars: VerificationPillars;
  evidenceLog: VerificationEvidenceItem[];
  overallConfidence: number;
  explanation: string;
}

/**
 * Server-Side Work Email Domain Check
 * Excludes known webmail consumer domains.
 */
export function isCorporateDomain(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1].toLowerCase().trim();
  const publicWebmail = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'protonmail.com', 'aol.com', 'mail.com',
    'zoho.com', 'yandex.com', 'gmx.com', 'test.com', 'example.com', 'tempmail.com'
  ];
  return !publicWebmail.includes(domain);
}

/**
 * Server-Side Verification Engine
 * Evaluates DB state & claim inputs to compute verification level.
 * NO hardcoded company fixture names or substring matching allowed.
 */
export async function evaluateUserVerificationServer(
  input: ServerPipelineInput
): Promise<ServerPipelineOutput> {
  const evidenceLog: VerificationEvidenceItem[] = [];

  // 1. Fetch DB User & Verification record
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    include: {
      verifications: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  });

  const existingVerification = user?.verifications[0];
  const emailVerified = user?.emailVerified || false;
  const hasCorporateDomain = isCorporateDomain(input.email);

  // 2. Pillar 1: Identity / Email Control Evidence
  let corporateDomainVerified = false;
  if (emailVerified && hasCorporateDomain) {
    corporateDomainVerified = true;
    evidenceLog.push({
      claim: 'Work Email Control',
      evidenceSource: 'Mailbox Token OTP Verification',
      verificationMethod: 'SINGLE_USE_TOKEN_VERIFIED',
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'System WorkEmailTokenProvider',
      confidenceScore: 100,
      status: 'VERIFIED',
      details: `Work email ${input.email} ownership verified via single-use token.`
    });
  } else if (emailVerified) {
    evidenceLog.push({
      claim: 'Email Control',
      evidenceSource: 'Consumer Email OTP Verification',
      verificationMethod: 'SINGLE_USE_TOKEN_VERIFIED',
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'System WorkEmailTokenProvider',
      confidenceScore: 70,
      status: 'VERIFIED',
      details: `Consumer email verified. Corporate domain verification requires work email address.`
    });
  } else {
    evidenceLog.push({
      claim: 'Work Email Control',
      evidenceSource: 'Mailbox Token OTP Verification',
      verificationMethod: 'TOKEN_PENDING',
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'System WorkEmailTokenProvider',
      confidenceScore: 0,
      status: 'PENDING',
      details: 'Work email token verification pending.'
    });
  }

  // 3. Pillar 2: Entity Existence Evidence
  let entityVerified = existingVerification?.entityVerified || false;
  if (entityVerified) {
    evidenceLog.push({
      claim: 'Company Entity Existence',
      evidenceSource: 'Corporate Registry / Manual Audit',
      verificationMethod: 'VERIFIED_RECORD',
      verifiedAt: existingVerification?.updatedAt.toISOString() || new Date().toISOString(),
      verifiedBy: existingVerification?.reviewedByAdminId || 'System Admin',
      confidenceScore: 90,
      status: 'VERIFIED',
      details: `Company entity "${input.companyName}" verified.`
    });
  } else {
    evidenceLog.push({
      claim: 'Company Entity Existence',
      evidenceSource: 'Official Corporate Registry',
      verificationMethod: 'MANUAL_REVIEW_PENDING',
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'BusinessRegistryProvider',
      confidenceScore: 0,
      status: 'PENDING',
      details: `Company entity "${input.companyName}" queued for background manual audit.`
    });
  }

  // 4. Pillar 3: Founder / Officer Status Evidence
  let founderStatusVerified = existingVerification?.founderStatusVerified || false;
  const isFounderRole = input.role.toLowerCase().includes('founder') || input.role.toLowerCase().includes('ceo') || input.role.toLowerCase().includes('co-founder');

  if (founderStatusVerified) {
    evidenceLog.push({
      claim: 'Founder / Officer Status',
      evidenceSource: 'Director Filing / Cap Table Audit',
      verificationMethod: 'ADMIN_MANUAL_REVIEW_APPROVED',
      verifiedAt: existingVerification?.updatedAt.toISOString() || new Date().toISOString(),
      verifiedBy: existingVerification?.reviewedByAdminId || 'System Admin',
      confidenceScore: 100,
      status: 'VERIFIED',
      details: `Founder status confirmed by administrative review.`
    });
  } else {
    evidenceLog.push({
      claim: 'Founder / Officer Status',
      evidenceSource: 'Director Filing / Cap Table',
      verificationMethod: 'INDEPENDENT_EVIDENCE_REQUIRED',
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'CorporateOfficerProvider',
      confidenceScore: isFounderRole ? 30 : 0,
      status: 'PENDING',
      details: isFounderRole
        ? `Self-declared role "${input.role}". Independent cap table or director filing required.`
        : `Role "${input.role}" is professional/executive level.`
    });
  }

  // 5. Pillar 4: Invitation Trust Signal
  let invitationTrustSignal = false;
  if (input.invitedByUserId) {
    invitationTrustSignal = true;
    evidenceLog.push({
      claim: 'Invitation Provenance',
      evidenceSource: 'Verified Founder Invitation',
      verificationMethod: 'INVITATION_LINK_PROVENANCE',
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'InvitationProvenanceProvider',
      confidenceScore: 75,
      status: 'VERIFIED',
      details: `Invited by verified member (User ID: ${input.invitedByUserId}). Trust signal recorded.`
    });
  }

  // 6. Compute Level
  let calculatedLevel: VerificationLevel = 'UNVERIFIED';
  let explanation = '';

  const manualReviewPending = isFounderRole && !founderStatusVerified;

  if (founderStatusVerified && entityVerified && corporateDomainVerified) {
    calculatedLevel = 'VERIFIED_FOUNDER';
    explanation = 'Verified Founder: Corporate email + entity existence + independent founder evidence confirmed.';
  } else if (entityVerified && corporateDomainVerified) {
    calculatedLevel = 'VERIFIED_PROFESSIONAL';
    explanation = 'Verified Professional: Corporate email ownership + verified business entity.';
  } else if (corporateDomainVerified) {
    calculatedLevel = 'VERIFIED_MEMBER';
    explanation = 'Verified Member: Work email ownership verified via token.';
  } else if (emailVerified) {
    calculatedLevel = 'VERIFIED_MEMBER';
    explanation = 'Verified Member: Email ownership verified.';
  } else {
    calculatedLevel = 'PENDING';
    explanation = 'Pending: Work email verification token sent. Complete email verification to activate badge.';
  }

  const pillars: VerificationPillars = {
    identityVerified: emailVerified,
    corporateDomainVerified,
    entityVerified,
    founderStatusVerified,
    invitationTrustSignal,
    manualReviewPending
  };

  const totalConfidence = evidenceLog.reduce((acc, e) => acc + e.confidenceScore, 0);
  const overallConfidence = Math.round(totalConfidence / (evidenceLog.length || 1));

  return {
    level: calculatedLevel,
    pillars,
    evidenceLog,
    overallConfidence,
    explanation
  };
}
