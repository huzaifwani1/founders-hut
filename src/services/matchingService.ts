import type { UserProfile, BusinessRequest, ResolutionRecord } from '../types';

export interface GroundedMatchReason {
  label: string;
  type: 'LOCATION' | 'INDUSTRY' | 'CAPABILITY' | 'RESOLUTION' | 'RELATIONSHIP' | 'STAGE' | 'EXPERIENCE';
}

export interface CandidateMatchResult {
  candidate: UserProfile;
  score: number;
  matchReasons: GroundedMatchReason[];
  primaryReason: string;
  relevantCapability?: string;
  verifiedResolutionsCount?: number;
}

export class MatchingService {
  /**
   * Matches candidate users for a given business request based on multi-dimensional relevance.
   * Grounded strictly in actual database fields:
   * 1. Capabilities (canHelpWith / skills)
   * 2. Verified Resolutions history (ResolutionRecords with status = 'VERIFIED')
   * 3. Industry / Sector alignment
   * 4. Location / Geography alignment
   * 5. Company Stage alignment
   * 6. Introduction Pathway & Mutual Connections
   * 7. Verification level (Verified Founder / Executive / Professional)
   */
  static matchCandidatesForRequest(
    request: BusinessRequest,
    allUsers: UserProfile[],
    resolutions: ResolutionRecord[] = [],
    currentUser: UserProfile,
    limit: number = 4
  ): CandidateMatchResult[] {
    const requestText = `${request.title} ${request.needDescription} ${request.needCategory} ${request.industry} ${request.location}`.toLowerCase();

    const results: CandidateMatchResult[] = [];

    for (const candidate of allUsers) {
      // Exclude self (request author) and current logged-in user
      if (candidate.id === request.authorId || candidate.id === currentUser.id) continue;
      // Exclude official team account from standard member matching
      if (candidate.id === 'usr_fh_team') continue;
      // Exclude development seed and test users
      if (
        candidate.name.includes('[DEV SEED]') ||
        candidate.name.includes('Attacker User') ||
        candidate.name.includes('IDOR test') ||
        candidate.id.startsWith('search_p0_') ||
        candidate.id.startsWith('sender_p0_') ||
        candidate.id.startsWith('requests_health_')
      ) continue;

      let score = 0;
      const matchReasons: GroundedMatchReason[] = [];
      let relevantCap: string | undefined = undefined;

      // 1. Capability Alignment (canHelpWith & skills)
      for (const helpClaim of candidate.canHelpWith || []) {
        const claimLower = helpClaim.toLowerCase();
        if (requestText.includes(claimLower) || this.textSharesKeywords(requestText, claimLower)) {
          score += 35;
          matchReasons.push({
            label: `Can help with: ${helpClaim}`,
            type: 'CAPABILITY'
          });
          if (!relevantCap) relevantCap = helpClaim;
        }
      }

      for (const skill of candidate.skills || []) {
        const skillLower = skill.toLowerCase();
        if (requestText.includes(skillLower) || this.textSharesKeywords(requestText, skillLower)) {
          score += 20;
          matchReasons.push({
            label: `Skill: ${skill}`,
            type: 'CAPABILITY'
          });
          if (!relevantCap) relevantCap = skill;
        }
      }

      // 2. Verified Resolutions History (Evidence Loop)
      const verifiedResolutions = resolutions.filter(
        (r) => r.helperId === candidate.id && r.status === 'VERIFIED'
      );

      let verifiedCountInDomain = 0;
      for (const res of verifiedResolutions) {
        const resText = `${res.summary || ''} ${res.helpType} ${res.outcomeCategory || ''} ${res.requestId}`.toLowerCase();
        if (this.textSharesKeywords(requestText, resText) || requestText.includes(res.helpType.toLowerCase())) {
          verifiedCountInDomain++;
        }
      }

      if (verifiedCountInDomain > 0) {
        score += 30 + (verifiedCountInDomain * 10);
        matchReasons.push({
          label: `${verifiedCountInDomain} verified problem${verifiedCountInDomain > 1 ? 's' : ''} solved in this domain`,
          type: 'RESOLUTION'
        });
      } else if (verifiedResolutions.length > 0) {
        score += 10;
        matchReasons.push({
          label: `${verifiedResolutions.length} verified resolution${verifiedResolutions.length > 1 ? 's' : ''} on network`,
          type: 'RESOLUTION'
        });
      }

      // 3. Location / Geography Grounding
      if (candidate.location) {
        const candidateLocLower = candidate.location.toLowerCase();
        const requestLocLower = (request.location || '').toLowerCase();

        if (requestLocLower && candidateLocLower.includes(requestLocLower)) {
          score += 25;
          matchReasons.push({
            label: `Based in ${candidate.location}`,
            type: 'LOCATION'
          });
        } else if (requestText.includes('dubai') || requestText.includes('uae') || requestText.includes('gcc')) {
          if (candidateLocLower.includes('dubai') || candidateLocLower.includes('uae') || candidateLocLower.includes('gcc') || candidateLocLower.includes('middle east')) {
            score += 30;
            matchReasons.push({
              label: `Based in ${candidate.location} (GCC region)`,
              type: 'LOCATION'
            });
          }
        } else if (requestText.includes('us') || requestText.includes('sf') || requestText.includes('new york')) {
          if (candidateLocLower.includes('us') || candidateLocLower.includes('san francisco') || candidateLocLower.includes('new york')) {
            score += 25;
            matchReasons.push({
              label: `Based in ${candidate.location}`,
              type: 'LOCATION'
            });
          }
        }
      }

      // 4. Industry / Sector Grounding
      if (candidate.industry) {
        const candidateIndLower = candidate.industry.toLowerCase();
        if (requestText.includes(candidateIndLower) || (request.industry && request.industry.toLowerCase().includes(candidateIndLower))) {
          score += 20;
          matchReasons.push({
            label: `${candidate.industry} founder`,
            type: 'INDUSTRY'
          });
        }
      }

      // 5. Company Stage Grounding
      if (candidate.companyStage && requestText.includes(candidate.companyStage.toLowerCase())) {
        score += 15;
        matchReasons.push({
          label: `${candidate.companyStage} stage experience`,
          type: 'STAGE'
        });
      }

      // 6. Verified Founder / Professional Status Grounding
      if (candidate.verificationLevel === 'verified_founder') {
        score += 15;
        matchReasons.push({
          label: `Verified Founder (${candidate.company})`,
          type: 'EXPERIENCE'
        });
      } else if (candidate.verificationLevel === 'verified_executive') {
        score += 10;
        matchReasons.push({
          label: `Verified Executive (${candidate.company})`,
          type: 'EXPERIENCE'
        });
      }

      // 7. Relationship / Introduction Pathway Grounding
      if (candidate.pathway && candidate.pathway.facilitator) {
        score += 25;
        matchReasons.push({
          label: `${candidate.pathway.facilitator.name.split(' ')[0]} knows both of you`,
          type: 'RELATIONSHIP'
        });
      } else if (candidate.mutualConnectionsCount > 0) {
        score += 10;
        matchReasons.push({
          label: `${candidate.mutualConnectionsCount} mutual connection${candidate.mutualConnectionsCount > 1 ? 's' : ''}`,
          type: 'RELATIONSHIP'
        });
      }

      // Only include candidates with meaningful match signals (score >= 15)
      if (score >= 15) {
        const primaryReason = matchReasons[0]?.label || `Relevant expertise in ${candidate.industry || 'founder operations'}`;
        results.push({
          candidate,
          score,
          matchReasons,
          primaryReason,
          relevantCapability: relevantCap || candidate.canHelpWith?.[0] || candidate.role,
          verifiedResolutionsCount: verifiedCountInDomain || verifiedResolutions.length
        });
      }
    }

    // Sort descending by score
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Matches candidates based on a free-text problem or query (e.g., from "What are you working through right now?").
   */
  static matchCandidatesForQuery(
    queryText: string,
    allUsers: UserProfile[],
    resolutions: ResolutionRecord[] = [],
    currentUser: UserProfile,
    limit: number = 3
  ): CandidateMatchResult[] {
    if (!queryText || !queryText.trim()) return [];

    const dummyRequest: BusinessRequest = {
      id: `query_${Date.now()}`,
      authorId: currentUser.id,
      author: currentUser,
      needCategory: 'General Advice',
      title: queryText,
      needDescription: queryText,
      context: queryText,
      industry: currentUser.industry || 'Technology',
      location: currentUser.location || 'India',
      desiredConnection: 'Verified Founder',
      status: 'open',
      createdAt: 'Just now',
      responsesCount: 0
    };

    return this.matchCandidatesForRequest(dummyRequest, allUsers, resolutions, currentUser, limit);
  }

  /**
   * Helper utility checking shared operational keywords between texts.
   */
  private static textSharesKeywords(textA: string, textB: string): boolean {
    const keywords = [
      'd2c', 'dubai', 'uae', 'gcc', 'expansion', 'retail', 'hiring', 'talent', 'fundraising',
      'investor', 'seed', 'series a', 'manufacturing', 'supply chain', 'pricing', 'saas',
      'legal', 'us', 'export', 'logistics', 'cold-chain', 'board', 'marketing'
    ];

    return keywords.some(
      (kw) => textA.toLowerCase().includes(kw) && textB.toLowerCase().includes(kw)
    );
  }
}

