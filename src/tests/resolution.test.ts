import { describe, it, expect } from 'vitest';
import { ResolutionService } from '../services/resolutionService';
import type { UserProfile, BusinessRequest, ResolutionRecord } from '../types';

const mockAsker: UserProfile = {
  id: 'usr_asker',
  name: 'Asker Founder',
  initials: 'AF',
  avatar: '',
  role: 'CEO',
  company: 'Alpha Tech',
  companyStage: 'Series A',
  industry: 'SaaS',
  location: 'Bengaluru',
  verificationLevel: 'verified_founder',
  verificationPillars: { identityVerified: true, corporateDomainVerified: true, entityVerified: true, founderStatusVerified: true },
  bio: 'Building SaaS',
  canHelpWith: [],
  lookingFor: [],
  experience: [],
  skills: [],
  mutualConnectionsCount: 2
};

const mockHelper: UserProfile = {
  id: 'usr_helper',
  name: 'Helper Founder',
  initials: 'HF',
  avatar: '',
  role: 'CTO',
  company: 'Beta Systems',
  companyStage: 'Series B',
  industry: 'Fintech',
  location: 'Singapore',
  verificationLevel: 'verified_founder',
  verificationPillars: { identityVerified: true, corporateDomainVerified: true, entityVerified: true, founderStatusVerified: true },
  bio: 'Fintech expert',
  canHelpWith: ['Venture Debt', 'Cross-Border Treasury'],
  lookingFor: [],
  experience: [],
  skills: ['Fintech'],
  mutualConnectionsCount: 3
};

const mockThirdParty: UserProfile = {
  id: 'usr_other',
  name: 'Third Party',
  initials: 'TP',
  avatar: '',
  role: 'VP Product',
  company: 'Gamma Corp',
  companyStage: 'Growth',
  industry: 'Consumer',
  location: 'Mumbai',
  verificationLevel: 'verified_executive',
  verificationPillars: { identityVerified: true, corporateDomainVerified: true, entityVerified: true, founderStatusVerified: false },
  bio: 'Product exec',
  canHelpWith: [],
  lookingFor: [],
  experience: [],
  skills: [],
  mutualConnectionsCount: 1
};

const mockRequest: BusinessRequest = {
  id: 'req_test_1',
  authorId: 'usr_asker',
  author: mockAsker,
  needCategory: 'Market Expansion',
  title: 'UAE market entry and freezone setup',
  needDescription: 'Need operational guidance on freezone registration in Dubai',
  context: 'Expanding into GCC',
  industry: 'Fintech',
  location: 'Dubai',
  desiredConnection: 'UAE founder',
  status: 'open',
  createdAt: '1 day ago',
  responsesCount: 2
};

describe('ResolutionService - Dual Confirmation & State Machine', () => {
  it('creates resolution record in PENDING_HELPER_CONFIRMATION status', () => {
    const { record, auditLog } = ResolutionService.createResolutionRecord({
      requestId: mockRequest.id,
      asker: mockAsker,
      helper: mockHelper,
      outcomeType: 'SOLVED',
      outcomeCategory: 'ACTIONABLE_ADVICE',
      helpType: 'OPERATIONAL_EXPERIENCE',
      askerAssessment: 'Provided step-by-step guidance on Dubai entity setup.',
      summary: 'Helped with UAE expansion and freezone setup.'
    });

    expect(record.status).toBe('PENDING_HELPER_CONFIRMATION');
    expect(record.helperConfirmation).toBe(false);
    expect(record.askerId).toBe('usr_asker');
    expect(record.helperId).toBe('usr_helper');
    expect(auditLog.action).toBe('RESOLUTION_CREATED');
  });

  it('rejects self-resolution creation', () => {
    expect(() =>
      ResolutionService.createResolutionRecord({
        requestId: mockRequest.id,
        asker: mockAsker,
        helper: mockAsker, // Same user
        outcomeType: 'SOLVED',
        helpType: 'STRATEGIC_ADVICE'
      })
    ).toThrow('Self-resolution is not permitted');
  });

  it('rejects duplicate active resolution creation', () => {
    const { record } = ResolutionService.createResolutionRecord({
      requestId: mockRequest.id,
      asker: mockAsker,
      helper: mockHelper,
      outcomeType: 'SOLVED',
      helpType: 'STRATEGIC_ADVICE'
    });

    expect(() =>
      ResolutionService.createResolutionRecord(
        {
          requestId: mockRequest.id,
          asker: mockAsker,
          helper: mockHelper,
          outcomeType: 'SOLVED',
          helpType: 'STRATEGIC_ADVICE'
        },
        [record]
      )
    ).toThrow('A resolution record already exists');
  });

  it('allows helper to confirm resolution and transition status to VERIFIED', () => {
    const { record } = ResolutionService.createResolutionRecord({
      requestId: mockRequest.id,
      asker: mockAsker,
      helper: mockHelper,
      outcomeType: 'SOLVED',
      helpType: 'OPERATIONAL_EXPERIENCE',
      summary: 'Guided freezone entity setup.'
    });

    const { record: confirmedRecord, auditLog } = ResolutionService.confirmHelperResolution(
      record,
      'usr_helper',
      true
    );

    expect(confirmedRecord.status).toBe('VERIFIED');
    expect(confirmedRecord.helperConfirmation).toBe(true);
    expect(auditLog.action).toBe('RESOLUTION_VERIFIED');
  });

  it('allows helper to decline resolution and transition status to DECLINED', () => {
    const { record } = ResolutionService.createResolutionRecord({
      requestId: mockRequest.id,
      asker: mockAsker,
      helper: mockHelper,
      outcomeType: 'SOLVED',
      helpType: 'OPERATIONAL_EXPERIENCE'
    });

    const { record: declinedRecord, auditLog } = ResolutionService.confirmHelperResolution(
      record,
      'usr_helper',
      false
    );

    expectdeclinedRecordStatus: expect(declinedRecord.status).toBe('DECLINED');
    expect(declinedRecord.helperConfirmation).toBe(false);
    expect(auditLog.action).toBe('RESOLUTION_DECLINED');
  });

  it('enforces helper authorization on confirmation', () => {
    const { record } = ResolutionService.createResolutionRecord({
      requestId: mockRequest.id,
      asker: mockAsker,
      helper: mockHelper,
      outcomeType: 'SOLVED',
      helpType: 'OPERATIONAL_EXPERIENCE'
    });

    expect(() =>
      ResolutionService.confirmHelperResolution(record, 'usr_other', true)
    ).toThrow('Unauthorized');
  });
});

describe('ResolutionService - Privacy & Visibility Rules', () => {
  it('hides PRIVATE resolutions from third parties', () => {
    const { record } = ResolutionService.createResolutionRecord({
      requestId: mockRequest.id,
      asker: mockAsker,
      helper: mockHelper,
      outcomeType: 'SOLVED',
      helpType: 'OPERATIONAL_EXPERIENCE',
      visibility: 'PRIVATE'
    });

    const verifiedRecord = { ...record, status: 'VERIFIED' as const, helperConfirmation: true };

    const viewerResults = ResolutionService.getVerifiedResolutionsForUser(
      [verifiedRecord],
      'usr_helper',
      'usr_other'
    );
    expect(viewerResults.length).toBe(0);

    const participantResults = ResolutionService.getVerifiedResolutionsForUser(
      [verifiedRecord],
      'usr_helper',
      'usr_helper'
    );
    expect(participantResults.length).toBe(1);
  });
});

describe('ResolutionService - Grounded Matching', () => {
  it('matches resolvers with relevant verified resolution experience', () => {
    const { record } = ResolutionService.createResolutionRecord({
      requestId: mockRequest.id,
      asker: mockAsker,
      helper: mockHelper,
      outcomeType: 'SOLVED',
      helpType: 'OPERATIONAL_EXPERIENCE',
      summary: 'Helped founders with UAE market entry and distribution.'
    });

    const verifiedRecord: ResolutionRecord = {
      ...record,
      status: 'VERIFIED',
      helperConfirmation: true
    };

    const matches = ResolutionService.getResolversForRequest(
      mockRequest,
      [verifiedRecord],
      [mockAsker, mockHelper, mockThirdParty],
      'usr_asker'
    );

    expect(matches.length).toBe(1);
    expect(matches[0].resolver.id).toBe('usr_helper');
    expect(matches[0].category).toBe('International Expansion');
  });
});
