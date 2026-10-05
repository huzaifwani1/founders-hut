export type VerificationLevel = 'verified_founder' | 'verified_executive' | 'verified_professional' | 'verified_member' | 'verified_investor' | 'pending' | 'unverified';

export type FounderStage = 'IDEA' | 'MVP' | 'FIRST_CUSTOMER' | 'EARLY_REVENUE' | 'GROWTH' | 'FUNDRAISING' | 'SCALE';

export interface VerificationPillars {
  identityVerified: boolean; // Government ID / Passport matched to name
  corporateDomainVerified: boolean; // Work email MX & SSO auth (@company.com)
  entityVerified: boolean; // MCA / SEC / Companies House registration check
  founderStatusVerified: boolean; // Cap table / VC portfolio / Officer filing check
  mcaCinDinVerified?: boolean; // India MCA corporate registration check
  invitationTrustSignal?: boolean; // Provenance from verified member invitation
  manualReviewPending?: boolean; // Unresolved claim queued for manual review
}

export interface MetricItem {
  value: string;
  isSelfReported: boolean; // Clearly marks if metric is self-reported vs audited
  verificationSource?: string; // e.g. "Self-Reported by Founder", "Verified via PitchBook / Crunchbase"
}

export type RequestVisibility = 'PUBLIC_TO_VERIFIED_NETWORK' | 'CONNECTIONS_ONLY' | 'PRIVATE';

export interface IntroductionPathway {
  facilitator: UserProfile;
  reason: string; // e.g., "Ahmed is connected to both of you."
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  role: string;
  company: string;
  companyStage: 'Bootstrapped' | 'Seed' | 'Series A' | 'Series B+' | 'Growth' | 'Public' | string;
  industry: string;
  location: string;
  verificationLevel: VerificationLevel;
  verificationPillars: VerificationPillars;
  bio: string; // User-provided
  yearsBuilding?: number | null; // Explicitly entered by founder
  founderStage?: FounderStage; // Current journey stage
  isDevSeed?: boolean; // Internal metadata only - isolated from user display
  canHelpWith: string[]; // User-provided claims
  lookingFor: string[]; // User-provided needs
  experience: {
    title: string;
    company: string;
    period: string;
    highlight?: string;
    isVerifiedRole?: boolean; // Verified fact via LinkedIn / corporate domain
  }[];
  skills: string[];
  metrics?: {
    arr?: MetricItem;
    teamSize?: MetricItem;
    fundingRaised?: MetricItem;
  };
  mutualConnectionsCount: number;
  pathway?: IntroductionPathway | null; // Real connection pathway (You -> Facilitator -> Target)
  introducedBy?: {
    name: string;
    role: string;
    avatar: string;
    context: string;
  };
  isConnection?: boolean;
  isPendingIntro?: boolean;
  relationshipNotes?: string; // High quality connection context (e.g. "Met at Scaling AI Roundtable")
  matchReason?: string; // Grounded DB match reason (e.g. "Relevant because they built a UAE distribution network")
}

export type RequestStatus = 'open' | 'responses' | 'introduction' | 'resolved';

export interface BusinessRequest {
  id: string;
  authorId: string;
  author: UserProfile;
  needCategory: 'Hiring & Talent' | 'Fundraising & Advisory' | 'Market Expansion' | 'Vendor & Tech Stack' | 'Strategic Advice' | 'General Intro' | string;
  title: string;
  needDescription: string;
  context: string;
  industry: string;
  location: string;
  desiredConnection: string;
  visibility?: RequestVisibility;
  status: RequestStatus;
  conciergeStatus?: 'AUTOMATED_MATCHED' | 'NO_STRONG_MATCH' | 'CONCIERGE_REVIEW' | 'MANUALLY_MATCHED';
  resolutionContext?: string; // e.g. "Resolved through an introduction."
  createdAt: string;
  responsesCount: number;
  urgent?: boolean;
}

export interface Introduction {
  id: string;
  // Authoritative persisted recipient identity. UI permission checks must use
  // this rather than a display-only related profile.
  toUserId?: string;
  fromUser: UserProfile;
  toUser: UserProfile;
  facilitator: UserProfile;
  suggestedUser?: UserProfile;
  reason: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'DECLINED' | 'CONNECTED';
  createdAt: string;
  declineReason?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isSystemNotice?: boolean;
}

export interface Conversation {
  id: string;
  participant: UserProfile;
  facilitator?: UserProfile; // 3-party facilitated conversation support
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  introContext?: {
    facilitatedBy: string;
    topic: string;
    requesterName?: string;
    facilitatorName?: string;
    targetName?: string;
  };
  messages: ChatMessage[];
}

export interface PrivateEvent {
  id: string;
  title: string;
  topic: string;
  host: UserProfile;
  date: string;
  time: string;
  attendeesCount: number;
  maxSeats: number;
  isAttending?: boolean;
  tag: string;
}

export interface NetworkActivity {
  id: string;
  user: UserProfile;
  type: 'funding' | 'expansion' | 'hiring' | 'request_resolved';
  title: string;
  detail: string;
  timestamp: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  category: 'SECTOR' | 'STAGE' | 'TOPIC' | 'REGION';
  description: string;
  icon?: string;
  isPrivate: boolean;
  membersCount: number;
  isJoined?: boolean;
  userRole?: string | null;
}

export interface CommunityDiscussion {
  id: string;
  communityId: string;
  author: UserProfile;
  title: string;
  body: string;
  topicCategory: 'QUESTION' | 'DISCUSSION' | 'RESOURCE' | 'EVENT';
  createdAt: string;
}

export interface InvestorProfile {
  id: string;
  userId: string;
  user: UserProfile;
  investorType: 'ANGEL' | 'VC' | 'FAMILY_OFFICE' | 'SYNDICATE' | 'CORPORATE_VC';
  firmName?: string;
  stageFocus: string[];
  chequeRangeMin?: string;
  chequeRangeMax?: string;
  sectors: string[];
  geographies: string[];
  portfolioHighlights?: string;
  currentFocus?: string;
  introPreferences: 'WARM_INTRO_ONLY' | 'DIRECT' | 'FOUNDER_MATCH';
  isVerifiedInvestor: boolean;
}

export type HelpIntentKey = 
  | 'START_COMPANY'
  | 'VALIDATE_IDEA'
  | 'BUILD_MVP'
  | 'FIND_FIRST_CUSTOMER'
  | 'HIRE'
  | 'FIND_COFOUNDER'
  | 'RAISE_FUNDING'
  | 'FIND_INVESTORS'
  | 'FIND_MANUFACTURER'
  | 'ENTER_NEW_MARKET';

export type HighSignalNotificationType = 
  | 'INTRO_REQUESTED'
  | 'INTRO_ACCEPTED'
  | 'INTRO_DECLINED'
  | 'REQUEST_MATCH'
  | 'NEW_MEMBER_MATCH'
  | 'RESOLUTION_PROMPT'
  | 'RESOLUTION_VERIFIED';

export interface AppNotification {
  id: string;
  userId: string;
  type: HighSignalNotificationType;
  title: string;
  detail: string;
  isRead: boolean;
  createdAt: string;
  targetId?: string;
}

export type PostVisibility = 'PUBLIC_TO_VERIFIED_NETWORK' | 'COMMUNITY_ONLY' | 'PRIVATE';
export type PostType = 'SHORT_POST' | 'ARTICLE' | 'LINK';

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  author: UserProfile;
  parentCommentId?: string | null;
  body: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  author: UserProfile;
  type: PostType;
  title?: string | null;
  body: string;
  linkUrl?: string | null;
  visibility: PostVisibility;
  communityId?: string | null;
  community?: { id: string; name: string; slug: string } | null;
  recipientId?: string | null;
  recipient?: UserProfile | null;
  createdAt: string;
  usefulCount: number;
  isUsefulByMe: boolean;
  isSavedByMe: boolean;
  commentsCount: number;
  comments?: PostComment[];
  matchReason?: string;
}

export interface PrivateShare {
  id: string;
  postId: string;
  post: Post;
  senderId: string;
  sender: UserProfile;
  recipientId: string;
  recipient: UserProfile;
  message?: string | null;
  createdAt: string;
}

// Problems Solved / Verified Resolution Layer Types
export type OutcomeType = 'SOLVED' | 'PARTIALLY_SOLVED' | 'STILL_IN_PROGRESS' | 'NOT_HELPFUL';

export type OutcomeCategory =
  | 'FOUND_RIGHT_PERSON'
  | 'ACTIONABLE_ADVICE'
  | 'BUSINESS_DECISION'
  | 'DEAL'
  | 'HIRE'
  | 'PARTNERSHIP'
  | 'VENDOR'
  | 'AVOIDED_MISTAKE'
  | 'OTHER';

export type HelpType =
  | 'OPERATIONAL_EXPERIENCE'
  | 'STRATEGIC_ADVICE'
  | 'WARM_INTRODUCTION'
  | 'VENDOR_CONNECTION'
  | 'PARTNER_CONNECTION'
  | 'HIRING_HELP'
  | 'DOCUMENT_REVIEW'
  | 'OTHER';

export type ResolutionVisibility = 'PRIVATE' | 'PARTICIPANTS_ONLY' | 'VERIFIED_NETWORK';

export type ResolutionStatus = 'PENDING_HELPER_CONFIRMATION' | 'VERIFIED' | 'DECLINED' | 'UNVERIFIED';

export interface ResolutionRecord {
  id: string;
  requestId: string;
  askerId: string;
  asker: UserProfile;
  helperId: string;
  helper: UserProfile;
  introductionId?: string | null;
  outcomeType: OutcomeType;
  outcomeCategory?: OutcomeCategory | null;
  helpType: HelpType;
  askerAssessment?: string | null;
  helperConfirmation: boolean;
  summary?: string | null;
  visibility: ResolutionVisibility;
  status: ResolutionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ResolutionSummaryByCategory {
  category: string;
  count: number;
  sampleProofSnippet?: string;
}

export interface GroundedResolverMatch {
  resolver: UserProfile;
  category: string;
  verifiedCount: number;
  proofSnippet: string;
  resolutionId: string;
}

// Formatters for Developer Enums to Human-Readable Labels
export function formatEnumLabel(value: string | undefined | null): string {
  if (!value) return '';
  
  const map: Record<string, string> = {
    'PRE_SEED': 'Pre-Seed',
    'SEED': 'Seed',
    'SERIES_A': 'Series A',
    'SERIES_B_PLUS': 'Series B+',
    'GROWTH': 'Growth',
    'PUBLIC': 'Public',
    'BOOTSTRAPPED': 'Bootstrapped',
    'EARLY_REVENUE': 'Early Revenue',
    'FIRST_CUSTOMER': 'First Customer',
    'MVP': 'MVP',
    'IDEA': 'Idea Stage',
    'FUNDRAISING': 'Fundraising',
    'SCALE': 'Scaling Phase',
    'CONNECTIONS_ONLY': 'Connections Only',
    'PUBLIC_TO_VERIFIED_NETWORK': 'Verified Network Only',
    'COMMUNITY_ONLY': 'Community Only',
    'PRIVATE': 'Private',
    'PARTICIPANTS_ONLY': 'Participants Only',
    'VERIFIED_NETWORK': 'Verified Network',
    'SHORT_POST': 'Post',
    'ARTICLE': 'Article',
    'LINK': 'Link',
    'verified_founder': 'Verified Founder',
    'verified_executive': 'Verified Executive',
    'verified_professional': 'Verified Professional',
    'verified_member': 'Verified Member',
    'verified_investor': 'Verified Investor',
    'pending': 'Pending Verification',
    'unverified': 'Unverified',
    'ANGEL': 'Angel Investor',
    'VC': 'Venture Capital',
    'FAMILY_OFFICE': 'Family Office',
    'SYNDICATE': 'Syndicate',
    'CORPORATE_VC': 'Corporate VC',
    'WARM_INTRO_ONLY': 'Warm Intro Required',
    'FOUNDER_MATCH': 'Founder Match Only',
    'DIRECT': 'Direct Intro Allowed',
    'SOLVED': 'Solved',
    'PARTIALLY_SOLVED': 'Partially Solved',
    'STILL_IN_PROGRESS': 'Still in Progress',
    'NOT_HELPFUL': 'Not Helpful',
    'FOUND_RIGHT_PERSON': 'Found Right Person',
    'ACTIONABLE_ADVICE': 'Actionable Advice',
    'BUSINESS_DECISION': 'Business Decision',
    'DEAL': 'Deal Closed',
    'HIRE': 'Key Hire',
    'PARTNERSHIP': 'Strategic Partnership',
    'VENDOR': 'Vendor Selected',
    'AVOIDED_MISTAKE': 'Avoided Costly Mistake',
    'OPERATIONAL_EXPERIENCE': 'Operational Experience',
    'STRATEGIC_ADVICE': 'Strategic Advice',
    'WARM_INTRODUCTION': 'Warm Introduction',
    'VENDOR_CONNECTION': 'Vendor Connection',
    'PARTNER_CONNECTION': 'Partner Connection',
    'HIRING_HELP': 'Hiring Support',
    'DOCUMENT_REVIEW': 'Document Review'
  };

  if (map[value]) return map[value];
  
  // Generic title-case conversion (e.g. "ENTERPRISE_SAAS" -> "Enterprise Saas")
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

