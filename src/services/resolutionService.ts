import type {
  ResolutionRecord,
  OutcomeType,
  OutcomeCategory,
  HelpType,
  ResolutionVisibility,
  ResolutionStatus,
  UserProfile,
  BusinessRequest,
  ResolutionSummaryByCategory,
  GroundedResolverMatch
} from '../types';

export interface CreateResolutionInput {
  requestId: string;
  asker: UserProfile;
  helper: UserProfile;
  introductionId?: string;
  outcomeType: OutcomeType;
  outcomeCategory?: OutcomeCategory;
  helpType: HelpType;
  askerAssessment?: string;
  summary?: string;
  visibility?: ResolutionVisibility;
}

export class ResolutionService {
  /**
   * Creates a new ResolutionRecord initiated by the Asker.
   * State starts as PENDING_HELPER_CONFIRMATION.
   * Dual confirmation requires helper confirmation before becoming VERIFIED.
   */
  static createResolutionRecord(
    input: CreateResolutionInput,
    existingResolutions: ResolutionRecord[] = []
  ): { record: ResolutionRecord; auditLog: any } {
    // Authorization & Validation Guard
    if (input.asker.id === input.helper.id) {
      throw new Error('Self-resolution is not permitted. Asker and Helper must be different users.');
    }

    // Duplicate Prevention Guard: Only 1 active resolution per (requestId, helperId)
    const existing = existingResolutions.find(
      (r) => r.requestId === input.requestId && r.helperId === input.helper.id && r.status !== 'DECLINED'
    );
    if (existing) {
      throw new Error('A resolution record already exists between this asker and helper for this request.');
    }

    const newRecord: ResolutionRecord = {
      id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      requestId: input.requestId,
      askerId: input.asker.id,
      asker: input.asker,
      helperId: input.helper.id,
      helper: input.helper,
      introductionId: input.introductionId || null,
      outcomeType: input.outcomeType,
      outcomeCategory: input.outcomeCategory || 'ACTIONABLE_ADVICE',
      helpType: input.helpType,
      askerAssessment: input.askerAssessment || null,
      helperConfirmation: false,
      summary: input.summary || null,
      visibility: input.visibility || 'VERIFIED_NETWORK',
      status: 'PENDING_HELPER_CONFIRMATION',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const auditLog = {
      action: 'RESOLUTION_CREATED',
      targetType: 'RESOLUTION_RECORD',
      targetId: newRecord.id,
      adminId: input.asker.id,
      metadata: JSON.stringify({
        requestId: input.requestId,
        helperId: input.helper.id,
        outcomeType: input.outcomeType
      }),
      createdAt: new Date().toISOString()
    };

    return { record: newRecord, auditLog };
  }

  /**
   * Confirms or declines a resolution record from the Helper side.
   * Only the designated helperId is authorized to confirm.
   */
  static confirmHelperResolution(
    resolution: ResolutionRecord,
    helperId: string,
    confirmed: boolean
  ): { record: ResolutionRecord; auditLog: any } {
    // Server-side Authorization Guard
    if (resolution.helperId !== helperId) {
      throw new Error('Unauthorized: Only the designated helper can confirm or decline this resolution.');
    }

    const updatedStatus: ResolutionStatus = confirmed ? 'VERIFIED' : 'DECLINED';

    const updatedRecord: ResolutionRecord = {
      ...resolution,
      helperConfirmation: confirmed,
      status: updatedStatus,
      updatedAt: new Date().toISOString()
    };

    const auditLog = {
      action: confirmed ? 'RESOLUTION_VERIFIED' : 'RESOLUTION_DECLINED',
      targetType: 'RESOLUTION_RECORD',
      targetId: resolution.id,
      adminId: helperId,
      metadata: JSON.stringify({
        askerId: resolution.askerId,
        requestId: resolution.requestId,
        outcomeType: resolution.outcomeType,
        status: updatedStatus
      }),
      createdAt: new Date().toISOString()
    };

    return { record: updatedRecord, auditLog };
  }

  /**
   * Returns verified resolutions for a user's profile, applying privacy and visibility rules.
   */
  static getVerifiedResolutionsForUser(
    resolutions: ResolutionRecord[],
    targetUserId: string,
    viewerId: string
  ): ResolutionRecord[] {
    return resolutions.filter((r) => {
      // Must belong to target user as helper or asker
      if (r.helperId !== targetUserId && r.askerId !== targetUserId) return false;

      // Must be VERIFIED
      if (r.status !== 'VERIFIED') return false;

      // Visibility Enforcements
      if (r.visibility === 'PRIVATE') {
        return viewerId === r.askerId || viewerId === r.helperId;
      }
      if (r.visibility === 'PARTICIPANTS_ONLY') {
        return viewerId === r.askerId || viewerId === r.helperId;
      }
      if (r.visibility === 'VERIFIED_NETWORK') {
        return true;
      }
      return true;
    });
  }

  /**
   * Groups helper's verified resolutions into category counts for profile display.
   * e.g., "International Expansion: 7 verified resolutions"
   */
  static getProfileCategorySummaries(
    resolutions: ResolutionRecord[],
    helperId: string,
    viewerId: string
  ): ResolutionSummaryByCategory[] {
    const verified = this.getVerifiedResolutionsForUser(resolutions, helperId, viewerId).filter(
      (r) => r.helperId === helperId
    );

    const map = new Map<string, { count: number; snippet?: string }>();

    for (const r of verified) {
      let catName = 'Strategic Guidance';
      if (r.requestId.includes('uae') || r.summary?.toLowerCase().includes('uae') || r.summary?.toLowerCase().includes('expansion')) {
        catName = 'International Expansion';
      } else if (r.helpType === 'HIRING_HELP' || r.outcomeCategory === 'HIRE') {
        catName = 'Senior Hiring';
      } else if (r.requestId.includes('fund') || r.outcomeCategory === 'DEAL' || r.summary?.toLowerCase().includes('fundraising')) {
        catName = 'Fundraising & Capital';
      } else if (r.helpType === 'VENDOR_CONNECTION' || r.outcomeCategory === 'VENDOR') {
        catName = 'Vendor & Infrastructure';
      } else if (r.outcomeCategory === 'ACTIONABLE_ADVICE' || r.helpType === 'STRATEGIC_ADVICE') {
        catName = 'Strategic Advisory';
      } else if (r.outcomeCategory === 'PARTNERSHIP') {
        catName = 'Strategic Partnerships';
      }

      const existing = map.get(catName) || { count: 0 };
      const sampleSnippet = r.summary && r.visibility === 'VERIFIED_NETWORK' ? r.summary : existing.snippet;
      map.set(catName, { count: existing.count + 1, snippet: sampleSnippet });
    }

    return Array.from(map.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      sampleProofSnippet: data.snippet
    }));
  }

  /**
   * Finds grounded resolvers for a given business request.
   * Returns founders with actual verified records in matching problem domains.
   */
  static getResolversForRequest(
    request: BusinessRequest,
    resolutions: ResolutionRecord[],
    allUsers: UserProfile[],
    viewerId: string
  ): GroundedResolverMatch[] {
    const verifiedResolutions = resolutions.filter((r) => r.status === 'VERIFIED');
    const requestText = `${request.title} ${request.needDescription} ${request.needCategory} ${request.industry}`.toLowerCase();

    const resolverMap = new Map<string, GroundedResolverMatch>();

    for (const r of verifiedResolutions) {
      // Don't suggest the request author themselves
      if (r.helperId === request.authorId) continue;

      const helper = allUsers.find((u) => u.id === r.helperId) || r.helper;
      if (!helper) continue;

      // Privacy check
      if (r.visibility === 'PRIVATE' && viewerId !== r.askerId && viewerId !== r.helperId) continue;

      let isMatch = false;
      let categoryName = 'General Guidance';

      if (requestText.includes('uae') || requestText.includes('expansion') || requestText.includes('international') || request.needCategory.includes('Expansion')) {
        if (r.summary?.toLowerCase().includes('uae') || r.summary?.toLowerCase().includes('expansion') || r.requestId.includes('uae') || r.helpType === 'OPERATIONAL_EXPERIENCE') {
          isMatch = true;
          categoryName = 'International Expansion';
        }
      }

      if (!isMatch && (requestText.includes('hir') || request.needCategory.includes('Hiring'))) {
        if (r.helpType === 'HIRING_HELP' || r.outcomeCategory === 'HIRE') {
          isMatch = true;
          categoryName = 'Senior Hiring';
        }
      }

      if (!isMatch && (requestText.includes('fund') || request.needCategory.includes('Fundraising'))) {
        if (r.outcomeCategory === 'DEAL' || r.summary?.toLowerCase().includes('fundraising')) {
          isMatch = true;
          categoryName = 'Fundraising';
        }
      }

      if (!isMatch) {
        if (request.needCategory.toLowerCase().includes(r.helpType.toLowerCase())) {
          isMatch = true;
          categoryName = request.needCategory;
        }
      }

      if (isMatch) {
        const existing = resolverMap.get(helper.id);
        const snippet = r.summary || `Helped founders with ${categoryName.toLowerCase()} and strategic execution.`;
        if (existing) {
          existing.verifiedCount += 1;
        } else {
          resolverMap.set(helper.id, {
            resolver: helper,
            category: categoryName,
            verifiedCount: 1,
            proofSnippet: snippet,
            resolutionId: r.id
          });
        }
      }
    }

    return Array.from(resolverMap.values());
  }
}
