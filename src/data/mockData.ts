import type { UserProfile, BusinessRequest, Conversation, PrivateEvent, NetworkActivity, Community, CommunityDiscussion, InvestorProfile, ResolutionRecord } from '../types';

export const CURRENT_USER: UserProfile = {
  id: 'usr_me',
  name: 'Vikramaditya Oberoi',
  initials: 'VO',
  isDevSeed: true,
  yearsBuilding: 7,
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  role: 'Co-Founder & CEO',
  company: 'Aether Metrics',
  companyStage: 'Series A',
  industry: 'Enterprise Software / AI',
  location: 'Bengaluru / San Francisco',
  verificationLevel: 'verified_founder',
  verificationPillars: {
    identityVerified: true,
    corporateDomainVerified: true,
    entityVerified: true,
    founderStatusVerified: true
  },
  bio: 'Building enterprise telemetry for autonomous AI agents. Previously VP of Product at Razorpay. Angel investor in 14 B2B startups.',
  canHelpWith: [
    'Enterprise SaaS pricing & packaging models',
    'Scaling B2B sales teams from $1M to $10M ARR',
    'US market expansion & Delaware C-Corp entity setup',
    'Introductions to US West Coast VC partners'
  ],
  lookingFor: [
    'Founders who have deployed LLM agent monitoring in high-compliance fintech',
    'Senior VP of Engineering candidate with distributed systems background',
    'Introductions to CFOs of mid-market healthcare enterprises'
  ],
  experience: [
    { title: 'Co-Founder & CEO', company: 'Aether Metrics', period: '2023 - Present', highlight: 'Raised $6.5M Series A led by Nexus & Lightspeed.', isVerifiedRole: true },
    { title: 'VP of Product', company: 'Razorpay', period: '2019 - 2023', highlight: 'Grew payments infrastructure product line by 4x.', isVerifiedRole: true },
    { title: 'Product Lead', company: 'InMobi', period: '2016 - 2019', isVerifiedRole: true }
  ],
  skills: ['B2B SaaS', 'Fundraising', 'GTM Strategy', 'Executive Hiring', 'Product Architecture'],
  metrics: {
    arr: { value: '$4.2M', isSelfReported: true, verificationSource: 'Self-Reported by Founder' },
    teamSize: { value: '38 members', isSelfReported: false, verificationSource: 'Verified via Corporate Payroll' }
  },
  mutualConnectionsCount: 3
};

export const MOCK_COMMUNITIES: Community[] = [
  {
    id: 'comm_1',
    name: 'SaaS Founders Circle',
    slug: 'saas-founders',
    category: 'SECTOR',
    description: 'High-signal peer circle for B2B & Vertical SaaS founders scaling past $1M ARR.',
    icon: 'Layers',
    isPrivate: true,
    membersCount: 142,
    isJoined: true
  },
  {
    id: 'comm_2',
    name: 'AI & Autonomous Systems',
    slug: 'ai-founders',
    category: 'SECTOR',
    description: 'Founders building production LLM infrastructure, agents, and enterprise AI tooling.',
    icon: 'Cpu',
    isPrivate: true,
    membersCount: 98,
    isJoined: true
  },
  {
    id: 'comm_3',
    name: 'First-Time Founders Guild',
    slug: 'first-time-founders',
    category: 'STAGE',
    description: 'Zero-to-one tactical support: idea validation, incorporation, MVP, and first customers.',
    icon: 'Compass',
    isPrivate: true,
    membersCount: 210,
    isJoined: false
  },
  {
    id: 'comm_4',
    name: 'Fundraising & Capital Strategy',
    slug: 'fundraising-circle',
    category: 'TOPIC',
    description: 'Cap table design, term-sheet negotiation, VC deck teardowns, and investor intros.',
    icon: 'TrendingUp',
    isPrivate: true,
    membersCount: 175,
    isJoined: true
  },
  {
    id: 'comm_5',
    name: 'Hardware & Manufacturing',
    slug: 'manufacturing-hardware',
    category: 'SECTOR',
    description: 'Supply chain optimization, factory sourcing, prototyping, and factory audit notes.',
    icon: 'Factory',
    isPrivate: true,
    membersCount: 64,
    isJoined: false
  },
  {
    id: 'comm_6',
    name: 'D2C & Consumer Brands',
    slug: 'd2c-founders',
    category: 'SECTOR',
    description: 'CAC/LTV economics, omnichannel distribution, supply chain, and retail partnerships.',
    icon: 'ShoppingBag',
    isPrivate: true,
    membersCount: 115,
    isJoined: false
  },
  {
    id: 'comm_7',
    name: 'International Expansion',
    slug: 'international-expansion',
    category: 'TOPIC',
    description: 'US Delaware C-Corp setup, Dubai entity registration, Singapore expansion, global tax.',
    icon: 'Globe',
    isPrivate: true,
    membersCount: 130,
    isJoined: true
  },
  {
    id: 'comm_8',
    name: 'India & Middle East Executive Hub',
    slug: 'regional-me-india',
    category: 'REGION',
    description: 'Cross-border corridor for founders operating across India, UAE, Saudi, and GCC.',
    icon: 'MapPin',
    isPrivate: true,
    membersCount: 188,
    isJoined: false
  }
];

export const ANANYA_SHARMA_PROFILE: UserProfile = {
  id: 'usr_5',
  name: 'Ananya Sharma',
  initials: 'AS',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
  role: 'Managing Partner',
  company: 'Vanguard Capital',
  companyStage: 'Public',
  industry: 'Venture Capital / Growth',
  location: 'Mumbai / Bengaluru',
  verificationLevel: 'verified_executive',
  verificationPillars: {
    identityVerified: true,
    corporateDomainVerified: true,
    entityVerified: true,
    founderStatusVerified: false
  },
  bio: 'Early-stage investor focused on B2B SaaS, FinTech, and Consumer Infrastructure across India & SEA. Board member at 6 scale-ups.',
  canHelpWith: [
    'Series A & B term sheet evaluation',
    'Board governance best practices',
    'Key customer intros for enterprise startups'
  ],
  lookingFor: [
    'Meeting seed-stage founders building AI-native infrastructure'
  ],
  experience: [
    { title: 'Managing Partner', company: 'Vanguard Capital', period: '2018 - Present', isVerifiedRole: true },
    { title: 'Principal', company: 'Sequoia Capital India', period: '2013 - 2018', isVerifiedRole: true }
  ],
  skills: ['Venture Capital', 'Board Governance', 'Growth Strategy', 'Cap Table Management'],
  mutualConnectionsCount: 4,
  relationshipNotes: 'Board advisor connection since Series A round.',
  isConnection: true
};

export const DEVIKA_SINGHANIA_PROFILE: UserProfile = {
  id: 'usr_2',
  name: 'Devika Singhania',
  initials: 'DS',
  isDevSeed: true,
  yearsBuilding: 6,
  avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
  role: 'Co-Founder & CTO',
  company: 'Quantis AI',
  companyStage: 'Series A',
  industry: 'DeepTech / AI Infrastructure',
  location: 'Bengaluru / London',
  verificationLevel: 'verified_founder',
  verificationPillars: {
    identityVerified: true,
    corporateDomainVerified: true,
    entityVerified: true,
    founderStatusVerified: true
  },
  bio: 'Ex-DeepMind research lead. Building deterministic evaluation platforms for financial LLMs. Y Combinator W22 alum. Scaling high-throughput Rust backends.',
  canHelpWith: [
    'LLM evaluation & benchmark design for regulated domains',
    'Architecting sub-10ms inference pipelines in Rust & C++',
    'Hiring senior AI research engineers in India & UK'
  ],
  lookingFor: [
    'Design partners among CTOs of Series B+ Fintechs',
    'Advice on SOC2 Type II compliance automation'
  ],
  experience: [
    { title: 'Co-Founder & CTO', company: 'Quantis AI', period: '2022 - Present', highlight: 'YC W22. Raised $5M from Sequoia India & Matrix.', isVerifiedRole: true },
    { title: 'Senior Research Scientist', company: 'Google DeepMind', period: '2018 - 2022', isVerifiedRole: true }
  ],
  skills: ['Deep Learning', 'Rust', 'Fintech Infrastructure', 'YC Alumni', 'System Architecture'],
  metrics: {
    arr: { value: '$1.8M', isSelfReported: true, verificationSource: 'Self-Reported by Founder' },
    teamSize: { value: '22 members', isSelfReported: false, verificationSource: 'Verified via Payroll' },
    fundingRaised: { value: '$5.0M', isSelfReported: false, verificationSource: 'Verified via SEC / VC Filings' }
  },
  mutualConnectionsCount: 2,
  relationshipNotes: 'Met at YC W22 cohort dinner in San Francisco.',
  isConnection: true
};

export const SYSTEM_FH_TEAM_PROFILE: UserProfile = {
  id: 'usr_fh_team',
  name: 'Founders Hut Team',
  initials: 'FH',
  avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
  role: 'Official Network Concierge',
  company: 'Founders Hut',
  companyStage: 'Public',
  industry: 'Professional Network',
  location: 'Global / Remote',
  verificationLevel: 'verified_founder',
  verificationPillars: {
    identityVerified: true,
    corporateDomainVerified: true,
    entityVerified: true,
    founderStatusVerified: true
  },
  bio: 'Official Founders Hut platform concierge & community facilitator. We curate weekly founder prompts, facilitate introductions, and maintain network signal.',
  canHelpWith: [
    'Facilitating founder-to-founder warm introductions',
    'Curating community discussions & weekly problem threads',
    'Concierge request matching & network guidance'
  ],
  lookingFor: [
    'Connecting founders with verified operational experts'
  ],
  experience: [
    { title: 'Official Network Facilitator', company: 'Founders Hut', period: '2025 - Present', highlight: 'Curates verified founder connections & community rituals.', isVerifiedRole: true }
  ],
  skills: ['Network Facilitation', 'Founder Concierge', 'Community Rituals'],
  mutualConnectionsCount: 10
};

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'usr_1',
    name: 'Tariq Bhatt',
    initials: 'TB',
    isDevSeed: true,
    yearsBuilding: 8,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    role: 'Founder & Managing Director',
    company: 'Kashmir Valley Organics',
    companyStage: 'Growth',
    industry: 'Consumer Brands / D2C',
    location: 'Srinagar / Jammu',
    verificationLevel: 'verified_founder',
    verificationPillars: {
      identityVerified: true,
      corporateDomainVerified: true,
      entityVerified: true,
      founderStatusVerified: true
    },
    bio: 'Pioneered cold-chain D2C logistics for Himalayan botanicals & high-value agricultural exports. Scaled revenue past ₹28Cr with sustainable offline-online distribution across North India.',
    canHelpWith: [
      'Expanding consumer products from Kashmir into Jammu & Tier-1 retail',
      'Perishable cold-chain logistics across rugged geographies',
      'Scaling D2C brand from ₹1Cr to ₹30Cr without venture dilution',
      'Export compliance & US FDA certifications'
    ],
    lookingFor: [
      'Introductions to modern trade retail category managers in Mumbai & NCR',
      'Founders experienced in quick-commerce dark store partnerships'
    ],
    experience: [
      { title: 'Founder & MD', company: 'Kashmir Valley Organics', period: '2018 - Present', highlight: 'Bootstrapped to ₹28Cr revenue with 24% EBITDA margin.', isVerifiedRole: true },
      { title: 'Supply Chain Director', company: 'ITC Consumer Goods', period: '2014 - 2018', isVerifiedRole: true }
    ],
    skills: ['D2C Operations', 'Supply Chain', 'Tier-2/3 Retail Distribution', 'Bootstrapping', 'Export Compliance'],
    metrics: {
      arr: { value: '₹28Cr', isSelfReported: true, verificationSource: 'Self-Reported by Founder' },
      teamSize: { value: '85 members', isSelfReported: false, verificationSource: 'Verified via Corporate Audit' },
      fundingRaised: { value: 'Bootstrapped', isSelfReported: true, verificationSource: 'Self-Reported' }
    },
    mutualConnectionsCount: 1,
    relationshipNotes: 'Connected via Ananya Sharma introduction regarding D2C cold-chain logistics.',
    pathway: {
      facilitator: ANANYA_SHARMA_PROFILE,
      reason: 'Ananya is connected to both of you.'
    },
    introducedBy: {
      name: 'Ananya Sharma',
      role: 'Managing Partner @ Vanguard Capital',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      context: 'Facilitated warm intro regarding Tier-2 retail distribution.'
    },
    isConnection: false
  },
  DEVIKA_SINGHANIA_PROFILE,
  {
    id: 'usr_3',
    name: 'Marcus Vance',
    initials: 'MV',
    isDevSeed: true,
    yearsBuilding: 12,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    role: 'Chief Financial Officer',
    company: 'HyperPay Global',
    companyStage: 'Growth',
    industry: 'Fintech / Payments',
    location: 'Singapore / Mumbai',
    verificationLevel: 'verified_executive',
    verificationPillars: {
      identityVerified: true,
      corporateDomainVerified: true,
      entityVerified: true,
      founderStatusVerified: false
    },
    bio: 'Managed international treasury & cross-border regulatory compliance across SE Asia & India. Executed $140M debt facility and secondary stock sales for early employees.',
    canHelpWith: [
      'Structuring venture debt vs equity in Series B/C rounds',
      'Cross-border RBI & MAS payment license applications',
      'Executive compensation structures and pool options'
    ],
    lookingFor: [
      'Connect with CFOs of scaleup tech companies navigating US IPO readiness'
    ],
    experience: [
      { title: 'CFO', company: 'HyperPay Global', period: '2021 - Present', highlight: 'Managed $140M venture debt & treasury.', isVerifiedRole: true },
      { title: 'VP Finance', company: 'Grab', period: '2016 - 2021', isVerifiedRole: true }
    ],
    skills: ['Venture Debt', 'Cross-Border Treasury', 'Regulatory Compliance', 'M&A', 'Fintech'],
    metrics: {
      teamSize: { value: '450 members', isSelfReported: false, verificationSource: 'Verified via Corporate Directory' },
      fundingRaised: { value: '$120M', isSelfReported: false, verificationSource: 'Verified via SEC Filings' }
    },
    mutualConnectionsCount: 1,
    pathway: {
      facilitator: DEVIKA_SINGHANIA_PROFILE,
      reason: 'Devika is connected to both of you.'
    },
    isConnection: false,
    isPendingIntro: true
  },
  {
    id: 'usr_4',
    name: 'Rohan Mehta',
    initials: 'RM',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    role: 'Founder & CEO',
    company: 'OmniHealth SaaS',
    companyStage: 'Bootstrapped',
    industry: 'HealthTech / B2B SaaS',
    location: 'Hyderabad / Dubai',
    verificationLevel: 'verified_founder',
    verificationPillars: {
      identityVerified: true,
      corporateDomainVerified: true,
      entityVerified: true,
      founderStatusVerified: true
    },
    bio: 'Built electronic medical records platform operating in 400+ hospitals across MEA and South Asia. Zero external capital, highly cash-flow positive.',
    canHelpWith: [
      'Selling B2B software into GCC & Middle East hospital networks',
      'Bootstrapping to $5M+ ARR with high customer retention',
      'HIPAA & GDPR health record privacy architecture'
    ],
    lookingFor: [
      'Introductions to US health insurance integration partners',
      'Advisors for M&A exit positioning'
    ],
    experience: [
      { title: 'Founder & CEO', company: 'OmniHealth SaaS', period: '2017 - Present', highlight: 'Bootstrapped past $6.2M ARR.', isVerifiedRole: true }
    ],
    skills: ['HealthTech', 'Middle East Sales', 'Bootstrapping', 'Enterprise Contracts'],
    metrics: {
      arr: { value: '$6.2M', isSelfReported: true, verificationSource: 'Self-Reported by Founder' },
      teamSize: { value: '64 members', isSelfReported: false, verificationSource: 'Verified via Payroll' },
      fundingRaised: { value: 'Bootstrapped', isSelfReported: true, verificationSource: 'Self-Reported' }
    },
    mutualConnectionsCount: 0,
    pathway: null, // No mutual connection exists
    isConnection: false
  },
  ANANYA_SHARMA_PROFILE,
  SYSTEM_FH_TEAM_PROFILE
];

export const MOCK_COMMUNITY_DISCUSSIONS: CommunityDiscussion[] = [
  {
    id: 'disc_ritual_1',
    communityId: 'comm_1',
    author: SYSTEM_FH_TEAM_PROFILE,
    title: 'Monday Solution Thread: What are you trying to solve this week?',
    body: 'Welcome to the weekly Founder Solution Thread. Share the 1 operational hurdle, hire, or deal you are navigating this week so peer founders can offer direct help.',
    topicCategory: 'QUESTION',
    createdAt: '1 day ago'
  },
  {
    id: 'disc_ritual_2',
    communityId: 'comm_4',
    author: SYSTEM_FH_TEAM_PROFILE,
    title: 'Wednesday Founder Lessons: What GTM lesson did you learn this week?',
    body: 'What positioning, pricing, or sales lesson surprised you recently? Share your tactical takeaway with the network.',
    topicCategory: 'DISCUSSION',
    createdAt: '2 days ago'
  },
  {
    id: 'disc_ritual_3',
    communityId: 'comm_1',
    author: SYSTEM_FH_TEAM_PROFILE,
    title: 'Friday Spotlight: Founder introduction of the week',
    body: 'Highlighting recent successful founder connections and peer advice shared across the SaaS Founders Circle.',
    topicCategory: 'RESOURCE',
    createdAt: '3 days ago'
  },
  {
    id: 'disc_1',
    communityId: 'comm_1',
    author: MOCK_USERS[0],
    title: 'How are you structuring annual upfront contracts vs usage-based billing in 2026?',
    body: 'We are transitioning from seat-based pricing to hybrid consumption. Would love tactical notes on minimum commitment floors from founders who navigated this shift past $3M ARR.',
    topicCategory: 'QUESTION',
    createdAt: '2 hours ago'
  },
  {
    id: 'disc_2',
    communityId: 'comm_2',
    author: CURRENT_USER,
    title: 'Benchmarking LLM latency in high-compliance fintech environments',
    body: 'Shared our benchmark findings evaluating local vLLM deployments vs enterprise API endpoints for SOC2 Type II compliance.',
    topicCategory: 'RESOURCE',
    createdAt: '5 hours ago'
  },
  {
    id: 'disc_3',
    communityId: 'comm_4',
    author: MOCK_USERS[1],
    title: 'Standard term sheet clause red flags for Series A lead investors',
    body: 'Compiled a checklist of 5 subtle liquidation preference and board control traps we encountered during our recent round.',
    topicCategory: 'DISCUSSION',
    createdAt: '1 day ago'
  }
];

export const MOCK_INVESTORS: InvestorProfile[] = [
  {
    id: 'inv_1',
    userId: 'usr_inv_1',
    user: {
      id: 'usr_inv_1',
      name: 'Ananya Singhania',
      initials: 'AS',
      isDevSeed: true,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      role: 'General Partner',
      company: 'Apex Horizon Ventures',
      companyStage: 'Series A',
      industry: 'Venture Capital',
      location: 'Bengaluru / Singapore',
      verificationLevel: 'verified_executive',
      verificationPillars: { identityVerified: true, corporateDomainVerified: true, entityVerified: true, founderStatusVerified: false },
      bio: 'Leading early-stage investments in B2B SaaS, FinTech, and AI infrastructure. Backed 22 founders.',
      canHelpWith: ['Series A term sheet negotiation', 'US West Coast VC connections', 'Board governance'],
      lookingFor: ['Pre-seed and Seed founders in Fintech and Enterprise AI'],
      experience: [{ title: 'General Partner', company: 'Apex Horizon Ventures', period: '2020 - Present', isVerifiedRole: true }],
      skills: ['Venture Capital', 'B2B SaaS', 'FinTech', 'Board Advisory'],
      mutualConnectionsCount: 1
    },
    investorType: 'VC',
    firmName: 'Apex Horizon Ventures',
    stageFocus: ['PRE_SEED', 'SEED', 'SERIES_A'],
    chequeRangeMin: '₹50L',
    chequeRangeMax: '₹3Cr',
    sectors: ['FinTech', 'Enterprise SaaS', 'AI Infrastructure'],
    geographies: ['India', 'Southeast Asia', 'US'],
    portfolioHighlights: 'Razorpay, Postman, Aether Metrics',
    currentFocus: 'Looking for India-based founders building global SaaS and AI agent observability.',
    introPreferences: 'WARM_INTRO_ONLY',
    isVerifiedInvestor: true
  },
  {
    id: 'inv_2',
    userId: 'usr_inv_2',
    user: {
      id: 'usr_inv_2',
      name: 'Kabir Merchant',
      initials: 'KM',
      isDevSeed: true,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
      role: 'Angel Investor & Former Founder',
      company: 'Merchant Family Office',
      companyStage: 'Growth',
      industry: 'Angel Investment',
      location: 'Dubai / Mumbai',
      verificationLevel: 'verified_founder',
      verificationPillars: { identityVerified: true, corporateDomainVerified: true, entityVerified: true, founderStatusVerified: true },
      bio: 'Exited D2C founder (sold logistics brand in 2022). Active angel investor in D2C, Hardware, and GCC expansion.',
      canHelpWith: ['Middle East GCC entity setup', 'Supply chain & manufacturing sourcing', 'First ₹10Cr D2C scaling'],
      lookingFor: ['Hardware, D2C, and cross-border GCC founders'],
      experience: [{ title: 'Founder & CEO', company: 'LogiExpress (Exited)', period: '2014 - 2022', isVerifiedRole: true }],
      skills: ['Angel Investing', 'D2C Brand Scaling', 'GCC Expansion', 'Logistics'],
      mutualConnectionsCount: 0
    },
    investorType: 'ANGEL',
    firmName: 'Merchant Family Office',
    stageFocus: ['PRE_SEED', 'SEED'],
    chequeRangeMin: '₹25L',
    chequeRangeMax: '₹1Cr',
    sectors: ['D2C / Consumer Brands', 'Manufacturing & Hardware', 'Logistics'],
    geographies: ['India', 'UAE / GCC'],
    portfolioHighlights: 'Kashmir Valley Organics, BlueDart Tech, Box8',
    currentFocus: 'Investing in high-margin physical products and GCC corridor brands.',
    introPreferences: 'FOUNDER_MATCH',
    isVerifiedInvestor: true
  }
];

export const MOCK_REQUESTS: BusinessRequest[] = [
  {
    id: 'req_101',
    authorId: 'usr_1',
    author: MOCK_USERS[0], // Tariq Bhatt
    needCategory: 'Market Expansion',
    title: 'Seeking a founder who has expanded consumer retail from Kashmir into Jammu & NCR networks',
    needDescription: 'We are expanding our Himalayan botanical D2C brand into physical retail chains in Jammu and NCR. Need direct operational tactical advice on regional distributor margin structures, cold-chain preservation during transit, and slotting fee negotiations.',
    context: 'We have scaled to ₹28Cr ARR online, but regional offline distribution is our next major milestone. Seeking real experience over consultant advice.',
    industry: 'Consumer Goods / D2C',
    location: 'Kashmir / Jammu / NCR',
    desiredConnection: 'Founder or VP of Sales who has built physical retail footprint across North India.',
    status: 'open',
    createdAt: '2 hours ago',
    responsesCount: 4,
    urgent: true
  },
  {
    id: 'req_102',
    authorId: 'usr_2',
    author: MOCK_USERS[1], // Devika Singhania
    needCategory: 'Vendor & Tech Stack',
    title: 'Seeking introductions to CFOs or Head of Compliance at Series B+ Fintechs deploying LLMs',
    needDescription: 'We are conducting early access validation for our financial LLM evaluation protocol. Looking for 3 enterprise design partners to run non-production benchmarking.',
    context: 'Our platform tests for hallucination rate, regulatory compliance drift, and transaction accuracy in AI automated customer service workflows.',
    industry: 'DeepTech / AI & Fintech',
    location: 'Bengaluru / Remote',
    desiredConnection: 'CFOs, CTOs, or Chief Risk Officers at fintech platforms with > $100M transaction volume.',
    status: 'open',
    createdAt: '5 hours ago',
    responsesCount: 7
  },
  {
    id: 'req_103',
    authorId: 'usr_4',
    author: MOCK_USERS[3], // Rohan Mehta
    needCategory: 'Hiring & Talent',
    title: 'Hiring a VP of Global Enterprise Sales with GCC / Middle East B2B Healthcare background',
    needDescription: 'Need a proven sales leader to run our Dubai regional office and drive multi-year hospital network contracts across Saudi Arabia & UAE.',
    context: 'We are cash-flow positive ($6M ARR) and offering a competitive base + aggressive equity package for a candidate with existing hospital board relationships.',
    industry: 'HealthTech / Enterprise SaaS',
    location: 'Dubai / Riyadh',
    desiredConnection: 'Founders who have previously managed high-performing Middle East sales leaders or recruiters specialized in GCC tech sales.',
    status: 'open',
    createdAt: '1 day ago',
    responsesCount: 2
  },
  {
    id: 'req_104',
    authorId: 'usr_3',
    author: MOCK_USERS[2], // Marcus Vance
    needCategory: 'Fundraising & Advisory',
    title: 'Advice on venture debt providers operating in SE Asia & India cross-border setups',
    needDescription: 'Comparing term sheets from 3 global venture debt funds for a $20M facility. Seeking peer reference calls on covenant flexibility and drawdown terms.',
    context: 'Evaluating trade-offs between Singapore dollar denominated vs USD facilities for our regional expansion.',
    industry: 'Fintech / Payments',
    location: 'Singapore',
    desiredConnection: 'CFOs or CEOs who have raised > $10M venture debt in the last 12 months.',
    status: 'introduction',
    createdAt: '2 days ago',
    responsesCount: 9
  }
];

export const MOCK_EVENTS: PrivateEvent[] = [
  {
    id: 'evt_1',
    title: 'Scaling AI Infrastructure to $10M ARR',
    topic: 'Private Chatham House roundtable on unit economics, GPU cluster contracts, and enterprise POC conversion rates.',
    host: CURRENT_USER,
    date: 'Sep 24, 2026',
    time: '6:30 PM IST',
    attendeesCount: 11,
    maxSeats: 15,
    isAttending: true,
    tag: 'Founder Roundtable'
  },
  {
    id: 'evt_2',
    title: 'D2C Offline Expansion & Retail Slotting',
    topic: 'Closed-door discussion for consumer brand founders navigating physical retail margins, trade promo spend, and distributor terms.',
    host: MOCK_USERS[0],
    date: 'Oct 02, 2026',
    time: '7:00 PM IST',
    attendeesCount: 9,
    maxSeats: 12,
    isAttending: false,
    tag: 'Executive Dinner'
  }
];

export const MOCK_ACTIVITIES: NetworkActivity[] = [
  {
    id: 'act_1',
    user: MOCK_USERS[1],
    type: 'funding',
    title: 'Quantis AI closed $5M Series A',
    detail: 'Led by Sequoia Capital India with participation from YC & key angel investors.',
    timestamp: '4 hours ago'
  },
  {
    id: 'act_2',
    user: MOCK_USERS[0],
    type: 'expansion',
    title: 'Kashmir Valley Organics opened Jammu regional hub',
    detail: 'Completed setup of 15,000 sq ft temperature-controlled logistics center in Bari Brahmana.',
    timestamp: '1 day ago'
  },
  {
    id: 'act_3',
    user: MOCK_USERS[2],
    type: 'hiring',
    title: 'HyperPay Global appointed ex-Visa Director as VP Risk',
    detail: 'Strengthening regional compliance ahead of UK payment license filing.',
    timestamp: '2 days ago'
  }
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    participant: MOCK_USERS[0], // Tariq Bhatt
    lastMessage: 'Appreciate the intro to the Jammu distributor network! Let us schedule a quick call this Thursday.',
    lastMessageTime: '10:42 AM',
    unreadCount: 1,
    introContext: {
      facilitatedBy: 'Ananya Sharma',
      topic: 'Request #101: Consumer Expansion in Kashmir & Jammu'
    },
    messages: [
      {
        id: 'm1',
        senderId: 'usr_1',
        text: 'Hi Vikramaditya, Ananya mentioned you recently helped another D2C founder structure their North India offline supply chain.',
        timestamp: 'Yesterday 4:15 PM'
      },
      {
        id: 'm2',
        senderId: 'usr_me',
        text: 'Glad to connect Tariq! Yes, we worked closely with a beverage brand setting up regional fulfillment across Jammu and Punjab. Happy to share our operational playbook.',
        timestamp: 'Yesterday 5:30 PM'
      },
      {
        id: 'm3',
        senderId: 'usr_1',
        text: 'Appreciate the intro to the Jammu distributor network! Let us schedule a quick call this Thursday.',
        timestamp: '10:42 AM'
      }
    ]
  },
  {
    id: 'conv_2',
    participant: MOCK_USERS[1], // Devika Singhania
    lastMessage: 'Sent over our benchmark report draft. Let me know if your team can review the latency numbers.',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    introContext: {
      facilitatedBy: 'YC Alumni Network',
      topic: 'LLM Latency & Evaluation Design Partner'
    },
    messages: [
      {
        id: 'm4',
        senderId: 'usr_2',
        text: 'Hey Vikram! Saw Aether Metrics recently published telemetry benchmarks for agentic pipelines.',
        timestamp: '2 days ago'
      },
      {
        id: 'm5',
        senderId: 'usr_me',
        text: 'Hey Devika, absolutely. We are tracking p99 latencies for Rust-based proxy layers.',
        timestamp: '2 days ago'
      },
      {
        id: 'm6',
        senderId: 'usr_2',
        text: 'Sent over our benchmark report draft. Let me know if your team can review the latency numbers.',
        timestamp: 'Yesterday'
      }
    ]
  }
];

export const MOCK_POSTS: import('../types').Post[] = [
  {
    id: 'post_1',
    authorId: 'usr_2',
    author: DEVIKA_SINGHANIA_PROFILE,
    type: 'SHORT_POST',
    body: 'After six months of trying paid acquisition for our B2B SaaS, we realized our real bottleneck wasn’t CAC or lead gen. It was cohort retention past month 3.',
    visibility: 'PUBLIC_TO_VERIFIED_NETWORK',
    createdAt: '2 hours ago',
    usefulCount: 14,
    isUsefulByMe: true,
    isSavedByMe: false,
    commentsCount: 1,
    comments: [
      {
        id: 'c1',
        postId: 'post_1',
        authorId: 'usr_me',
        author: CURRENT_USER,
        body: 'We hit the exact same wall at $1M ARR. Adding milestone-based onboarding calls boosted month 3 retention by 28%.',
        createdAt: '1 hour ago'
      }
    ]
  },
  {
    id: 'post_2',
    authorId: 'usr_1',
    author: MOCK_USERS[0],
    type: 'ARTICLE',
    title: 'Lessons from Bootstrapping a Consumer Logistics Brand to ₹28Cr Revenue',
    body: 'When we started Kashmir Valley Organics, cold-chain logistics across rugged geographies was considered economically impossible for a young startup. Here are core operational principles we used to build a sustainable distribution engine across North India.',
    visibility: 'PUBLIC_TO_VERIFIED_NETWORK',
    createdAt: '5 hours ago',
    usefulCount: 22,
    isUsefulByMe: false,
    isSavedByMe: true,
    commentsCount: 0,
    comments: []
  },
  {
    id: 'post_3',
    authorId: 'usr_me',
    author: CURRENT_USER,
    type: 'LINK',
    title: 'Benchmarking LLM Inference Latency for High-Compliance Fintech',
    body: 'Interesting breakdown comparing local vLLM deployments vs enterprise API endpoints for SOC2 Type II compliance.',
    linkUrl: 'https://aethermetrics.dev/blog/llm-latency-fintech',
    visibility: 'COMMUNITY_ONLY',
    communityId: 'comm_2',
    community: { id: 'comm_2', name: 'AI & Autonomous Systems', slug: 'ai-founders' },
    createdAt: '1 day ago',
    usefulCount: 8,
    isUsefulByMe: false,
    isSavedByMe: false,
    commentsCount: 0,
    comments: []
  }
];

export const MOCK_RESOLUTIONS: ResolutionRecord[] = [
  {
    id: 'res_101',
    requestId: 'req_3',
    askerId: 'usr_me',
    asker: CURRENT_USER,
    helperId: 'usr_3',
    helper: MOCK_USERS[2], // Marcus Vance
    introductionId: 'intro_101',
    outcomeType: 'SOLVED',
    outcomeCategory: 'ACTIONABLE_ADVICE',
    helpType: 'OPERATIONAL_EXPERIENCE',
    askerAssessment: 'Marcus provided step-by-step guidance on structuring UAE freezone entities and banking setup in Dubai.',
    helperConfirmation: true,
    summary: 'Helped founders with UAE market entry, freezone entity registration, and local distribution agreements.',
    visibility: 'VERIFIED_NETWORK',
    status: 'VERIFIED',
    createdAt: '2 days ago',
    updatedAt: '1 day ago'
  },
  {
    id: 'res_102',
    requestId: 'req_102',
    askerId: 'usr_1',
    asker: MOCK_USERS[0],
    helperId: 'usr_3',
    helper: MOCK_USERS[2], // Marcus Vance
    outcomeType: 'SOLVED',
    outcomeCategory: 'DEAL',
    helpType: 'STRATEGIC_ADVICE',
    askerAssessment: 'Structured venture debt facility for expanding distribution infrastructure.',
    helperConfirmation: true,
    summary: 'Advised on $15M venture debt term sheet evaluation and covenant negotiation.',
    visibility: 'VERIFIED_NETWORK',
    status: 'VERIFIED',
    createdAt: '1 week ago',
    updatedAt: '6 days ago'
  },
  {
    id: 'res_103',
    requestId: 'req_103',
    askerId: 'usr_2',
    asker: DEVIKA_SINGHANIA_PROFILE,
    helperId: 'usr_3',
    helper: MOCK_USERS[2], // Marcus Vance
    outcomeType: 'SOLVED',
    outcomeCategory: 'FOUND_RIGHT_PERSON',
    helpType: 'WARM_INTRODUCTION',
    askerAssessment: 'Connected us directly to MAS licensed payment custodian in Singapore.',
    helperConfirmation: true,
    summary: 'Facilitated Singapore MAS regulatory compliance pathway and license advisor intro.',
    visibility: 'VERIFIED_NETWORK',
    status: 'VERIFIED',
    createdAt: '2 weeks ago',
    updatedAt: '2 weeks ago'
  },
  {
    id: 'res_104',
    requestId: 'req_1',
    askerId: 'usr_me',
    asker: CURRENT_USER,
    helperId: 'usr_2',
    helper: DEVIKA_SINGHANIA_PROFILE,
    outcomeType: 'SOLVED',
    outcomeCategory: 'ACTIONABLE_ADVICE',
    helpType: 'STRATEGIC_ADVICE',
    askerAssessment: 'Devika shared her benchmarking suite for evaluating LLM agent inference latency.',
    helperConfirmation: true,
    summary: 'Helped design deterministic evaluation pipelines for enterprise LLM agent deployment.',
    visibility: 'VERIFIED_NETWORK',
    status: 'VERIFIED',
    createdAt: '3 days ago',
    updatedAt: '3 days ago'
  },
  {
    id: 'res_105',
    requestId: 'req_2',
    askerId: 'usr_2',
    asker: DEVIKA_SINGHANIA_PROFILE,
    helperId: 'usr_me',
    helper: CURRENT_USER,
    outcomeType: 'SOLVED',
    outcomeCategory: 'BUSINESS_DECISION',
    helpType: 'OPERATIONAL_EXPERIENCE',
    askerAssessment: 'Vikram shared detailed breakdown of US Delaware C-Corp setup and 83(b) tax filing timeline.',
    helperConfirmation: true,
    summary: 'Guided US market expansion and Delaware C-Corp flip execution.',
    visibility: 'VERIFIED_NETWORK',
    status: 'VERIFIED',
    createdAt: '4 days ago',
    updatedAt: '4 days ago'
  }
];
