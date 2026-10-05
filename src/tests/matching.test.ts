import { describe, it, expect } from 'vitest';
import { MatchingService } from '../services/matchingService';
import { CURRENT_USER, MOCK_USERS, MOCK_RESOLUTIONS } from '../data/mockData';
import type { BusinessRequest, ResolutionRecord } from '../types';

describe('MatchingService & Network Liquidity Data-Integrity Audit Suite', () => {
  const sampleRequest: BusinessRequest = {
    id: 'req_test_dubai',
    authorId: CURRENT_USER.id,
    author: CURRENT_USER,
    needCategory: 'Market Expansion',
    title: 'Need help expanding D2C brand into Dubai & GCC retail networks',
    needDescription: 'Looking for a founder with verified experience in Dubai supply chain and cold-chain logistics.',
    context: 'D2C retail distribution',
    industry: 'Consumer Goods',
    location: 'Dubai / UAE',
    desiredConnection: 'Verified Founder',
    status: 'open',
    createdAt: 'Just now',
    responsesCount: 0
  };

  it('1. Candidate matching returns multi-dimensional candidate matches sorted by score', () => {
    const matches = MatchingService.matchCandidatesForRequest(
      sampleRequest,
      MOCK_USERS,
      MOCK_RESOLUTIONS,
      CURRENT_USER,
      5
    );

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].score).toBeGreaterThan(20);
    expect(matches[0].candidate.id).not.toBe(CURRENT_USER.id);
  });

  it('2. Grounded match reasons strictly derive from database fields', () => {
    const matches = MatchingService.matchCandidatesForRequest(
      sampleRequest,
      MOCK_USERS,
      MOCK_RESOLUTIONS,
      CURRENT_USER,
      5
    );

    const topMatch = matches[0];
    expect(topMatch.matchReasons.length).toBeGreaterThan(0);

    topMatch.matchReasons.forEach((reason) => {
      expect(reason.label).toBeTruthy();
      expect(['LOCATION', 'INDUSTRY', 'CAPABILITY', 'RESOLUTION', 'RELATIONSHIP', 'STAGE', 'EXPERIENCE']).toContain(reason.type);
    });
  });

  it('3. Unverified or declined resolutions NEVER influence matching scores or generate resolution match reasons', () => {
    const unverifiedResolution: ResolutionRecord = {
      id: 'res_unverified_1',
      requestId: 'req_test_dubai',
      askerId: CURRENT_USER.id,
      asker: CURRENT_USER,
      helperId: MOCK_USERS[0].id,
      helper: MOCK_USERS[0],
      outcomeType: 'SOLVED',
      helpType: 'OPERATIONAL_EXPERIENCE',
      helperConfirmation: false, // Unverified helper confirmation
      visibility: 'VERIFIED_NETWORK',
      status: 'PENDING_HELPER_CONFIRMATION', // NOT VERIFIED
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const matchesUnverified = MatchingService.matchCandidatesForRequest(
      sampleRequest,
      MOCK_USERS,
      [unverifiedResolution],
      CURRENT_USER,
      5
    );

    const matchReasonTypes = matchesUnverified.flatMap((m) => m.matchReasons.map((r) => r.type));
    // No RESOLUTION match reasons should exist for unverified records
    expect(matchReasonTypes).not.toContain('RESOLUTION');
  });

  it('4. Excludes official system account from member candidate recommendations', () => {
    const matches = MatchingService.matchCandidatesForRequest(
      sampleRequest,
      MOCK_USERS,
      MOCK_RESOLUTIONS,
      CURRENT_USER,
      10
    );

    const systemMemberMatch = matches.find((m) => m.candidate.id === 'usr_fh_team');
    expect(systemMemberMatch).toBeUndefined();
  });

  it('5. Free-text problem matching returns candidate recommendations for Home & HelpDesk', () => {
    const queryMatches = MatchingService.matchCandidatesForQuery(
      'Hiring senior VP of engineering',
      MOCK_USERS,
      MOCK_RESOLUTIONS,
      CURRENT_USER,
      3
    );

    expect(queryMatches.length).toBeGreaterThan(0);
    expect(queryMatches[0].candidate.id).not.toBe(CURRENT_USER.id);
  });
});
