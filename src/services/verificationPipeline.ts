import type { VerificationLevel, VerificationPillars } from '../types';

export interface VerificationClaim {
  userId: string;
  name: string;
  workEmail: string;
  role: string;
  companyName: string;
  invitedByUserId?: string;
  emailVerified?: boolean;
}

export interface VerificationProviderResult {
  providerName: string;
  claimEstablished: boolean;
  confidenceScore: number; // 0 to 100
  evidenceDetails: string;
  pillarUpdated?: 'identity' | 'domain' | 'entity' | 'founder' | 'invitation';
  metadata?: Record<string, any>;
}

export interface IVerificationProvider {
  name: string;
  verify(claim: VerificationClaim): Promise<VerificationProviderResult>;
}

/**
 * Helper to check if an email uses a non-free corporate domain.
 */
export function isCorporateEmailDomain(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1].toLowerCase().trim();
  const freeProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'protonmail.com', 'aol.com', 'mail.com',
    'zoho.com', 'yandex.com', 'gmx.com'
  ];
  return !freeProviders.includes(domain);
}

/**
 * 1. Work Email & Corporate Domain Authentication Provider
 * Requires single-use email verification token to establish mailbox control.
 * Domain syntax filtering alone does NOT establish mailbox control.
 */
export class CorporateDomainProvider implements IVerificationProvider {
  name = 'Work Email Token Provider';

  async verify(claim: VerificationClaim): Promise<VerificationProviderResult> {
    const emailParts = claim.workEmail.split('@');
    if (emailParts.length !== 2) {
      return {
        providerName: this.name,
        claimEstablished: false,
        confidenceScore: 0,
        evidenceDetails: 'Invalid email address format.'
      };
    }

    const domain = emailParts[1].toLowerCase();
    const isCorporate = isCorporateEmailDomain(claim.workEmail);

    if (!isCorporate) {
      return {
        providerName: this.name,
        claimEstablished: false,
        confidenceScore: 20,
        evidenceDetails: 'Public consumer email domain used. Work email required for corporate domain verification.'
      };
    }

    // Work email control requires token verification
    if (claim.emailVerified) {
      return {
        providerName: this.name,
        claimEstablished: true,
        confidenceScore: 100,
        evidenceDetails: `Work email @${domain} mailbox control verified via single-use token.`,
        pillarUpdated: 'domain',
        metadata: { domain }
      };
    }

    return {
      providerName: this.name,
      claimEstablished: false,
      confidenceScore: 40,
      evidenceDetails: `Work email domain @${domain} formatted. Token verification pending.`,
      pillarUpdated: 'domain',
      metadata: { domain }
    };
  }
}

/**
 * 2. Business Registry Provider
 * Does NOT use hardcoded company names or "pvt ltd" / "inc" string checks.
 * Requires actual official database record or manual admin review.
 */
export class BusinessRegistryProvider implements IVerificationProvider {
  name = 'Business Registry Provider';

  async verify(claim: VerificationClaim): Promise<VerificationProviderResult> {
    const compName = claim.companyName ? claim.companyName.trim() : '';

    if (!compName) {
      return {
        providerName: this.name,
        claimEstablished: false,
        confidenceScore: 0,
        evidenceDetails: 'No company name provided.'
      };
    }

    // Real evidence check: Unregistered until verified by admin or live API integration
    return {
      providerName: this.name,
      claimEstablished: false,
      confidenceScore: 30,
      evidenceDetails: `Company "${compName}" queued for official registry verification / manual review.`
    };
  }
}

/**
 * 3. Corporate Officer & Director Registry Provider
 * Does NOT infer founder status from self-declared role strings or fixture company names.
 */
export class CorporateOfficerProvider implements IVerificationProvider {
  name = 'Corporate Officer & Director Registry Provider';

  async verify(claim: VerificationClaim): Promise<VerificationProviderResult> {
    const roleLower = claim.role.toLowerCase();
    const isFounderRole = roleLower.includes('founder') || roleLower.includes('ceo') || roleLower.includes('co-founder');

    if (!isFounderRole) {
      return {
        providerName: this.name,
        claimEstablished: false,
        confidenceScore: 20,
        evidenceDetails: `Role "${claim.role}" is professional/executive level.`
      };
    }

    return {
      providerName: this.name,
      claimEstablished: false,
      confidenceScore: 40,
      evidenceDetails: `Self-declared role "${claim.role}". Founder status requires cap table audit or manual review.`
    };
  }
}

/**
 * 4. Invitation Provenance Provider
 * Trust signal only. NEVER grants Verified Founder level independently.
 */
export class InvitationProvenanceProvider implements IVerificationProvider {
  name = 'Invitation Provenance Provider';

  async verify(claim: VerificationClaim): Promise<VerificationProviderResult> {
    if (claim.invitedByUserId) {
      return {
        providerName: this.name,
        claimEstablished: true,
        confidenceScore: 75,
        evidenceDetails: `Invitation provenance verified from verified member (ID: ${claim.invitedByUserId}).`,
        pillarUpdated: 'invitation'
      };
    }

    return {
      providerName: this.name,
      claimEstablished: false,
      confidenceScore: 0,
      evidenceDetails: 'No invitation code attached.'
    };
  }
}

/**
 * 5. Manual Review Fallback Provider
 * Queues unresolved founder/entity claims for manual admin review.
 */
export class ManualReviewFallbackProvider implements IVerificationProvider {
  name = 'Manual Review Fallback Provider';

  async verify(claim: VerificationClaim): Promise<VerificationProviderResult> {
    return {
      providerName: this.name,
      claimEstablished: false,
      confidenceScore: 50,
      evidenceDetails: `Claim queued for manual review for ${claim.companyName}.`
    };
  }
}

/**
 * Verification Pipeline Engine (Client Bridge & Evidence Aggregator)
 * Ensures no self-assigned Verified Founder badge can be produced locally.
 */
export class VerificationPipelineEngine {
  private providers: IVerificationProvider[];

  constructor(customProviders?: IVerificationProvider[]) {
    this.providers = customProviders || [
      new CorporateDomainProvider(),
      new BusinessRegistryProvider(),
      new CorporateOfficerProvider(),
      new InvitationProvenanceProvider(),
      new ManualReviewFallbackProvider()
    ];
  }

  async runPipeline(claim: VerificationClaim): Promise<{
    level: VerificationLevel;
    pillars: VerificationPillars;
    evidenceLog: VerificationProviderResult[];
    overallConfidence: number;
    explanation: string;
  }> {
    const results: VerificationProviderResult[] = [];

    for (const provider of this.providers) {
      try {
        const res = await provider.verify(claim);
        results.push(res);
      } catch (err: any) {
        results.push({
          providerName: provider.name,
          claimEstablished: false,
          confidenceScore: 0,
          evidenceDetails: `Provider check error: ${err.message}`
        });
      }
    }

    const entityRes = results.find((r) => r.pillarUpdated === 'entity');
    const founderRes = results.find((r) => r.pillarUpdated === 'founder');
    const introRes = results.find((r) => r.pillarUpdated === 'invitation');

    const isCorporateDomain = isCorporateEmailDomain(claim.workEmail);
    const domainVerified = Boolean(claim.emailVerified && isCorporateDomain);
    const entityVerified = entityRes?.claimEstablished || false;
    const founderVerified = founderRes?.claimEstablished || false;
    const invitationSignal = introRes?.claimEstablished || false;

    const isFounderRole = claim.role.toLowerCase().includes('founder') || claim.role.toLowerCase().includes('ceo') || claim.role.toLowerCase().includes('co-founder');
    const manualReviewPending = isFounderRole && !founderVerified;

    const pillars: VerificationPillars = {
      identityVerified: Boolean(claim.emailVerified),
      corporateDomainVerified: domainVerified,
      entityVerified: entityVerified,
      founderStatusVerified: founderVerified,
      invitationTrustSignal: invitationSignal,
      manualReviewPending: manualReviewPending
    };

    let calculatedLevel: VerificationLevel = 'unverified';
    let explanation = '';

    if (founderVerified && entityVerified && domainVerified) {
      calculatedLevel = 'verified_founder';
      explanation = 'Verified Founder: Corporate email + entity existence + independent founder evidence confirmed.';
    } else if (entityVerified && domainVerified) {
      calculatedLevel = 'verified_professional';
      explanation = 'Verified Professional: Corporate email ownership + verified business entity.';
    } else if (domainVerified) {
      calculatedLevel = 'verified_member';
      explanation = 'Verified Member: Corporate work email ownership verified.';
    } else if (claim.emailVerified) {
      calculatedLevel = 'verified_member';
      explanation = 'Verified Member: Email ownership confirmed.';
    } else {
      calculatedLevel = 'pending';
      explanation = 'Pending: Email verification token dispatched. Verify email to activate badge.';
    }

    const avgConfidence = Math.round(
      results.reduce((acc, r) => acc + r.confidenceScore, 0) / (results.length || 1)
    );

    return {
      level: calculatedLevel,
      pillars,
      evidenceLog: results,
      overallConfidence: avgConfidence,
      explanation
    };
  }
}
