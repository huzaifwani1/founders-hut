import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

interface HelpIntentConfig {
  title: string;
  subtitle: string;
  helpCategoryKeyword: string;
  recommendedRole: string;
  recommendedCommunitySlug: string;
  guidanceCards: { title: string; advice: string; action: string }[];
}

const INTENT_MAP: Record<string, HelpIntentConfig> = {
  START_COMPANY: {
    title: 'Start My First Company',
    subtitle: 'Connect with veteran founders who have navigated incorporation, co-founder alignment, and early validation.',
    helpCategoryKeyword: 'Legal',
    recommendedRole: 'Co-Founder & CEO',
    recommendedCommunitySlug: 'first-time-founders',
    guidanceCards: [
      { title: 'Incorporate & Structure', advice: 'Establish cap-table split early before writing code.', action: 'Ask for Legal Help' },
      { title: 'Co-founder Alignment', advice: 'Conduct structured founder prenup discussions.', action: 'Find Co-founder' }
    ]
  },
  VALIDATE_IDEA: {
    title: 'Validate My Idea',
    subtitle: 'Get uncensored, high-signal feedback from experienced builders in your target sector.',
    helpCategoryKeyword: 'Technology',
    recommendedRole: 'CTO & Co-Founder',
    recommendedCommunitySlug: 'saas-founders',
    guidanceCards: [
      { title: 'Customer Discovery', advice: 'Interview 20 potential buyers before building software.', action: 'Find First Customer' },
      { title: 'Smoke Test Demand', advice: 'Build a high-converting landing page with waitlist intent.', action: 'Build MVP' }
    ]
  },
  BUILD_MVP: {
    title: 'Build an MVP',
    subtitle: 'Find CTOs, technical founders, and product architects to launch fast.',
    helpCategoryKeyword: 'Technology',
    recommendedRole: 'CTO & VP Engineering',
    recommendedCommunitySlug: 'ai-founders',
    guidanceCards: [
      { title: 'Scope Aggressively', advice: 'Build only the single core capability that delivers value.', action: 'Ask Tech Advice' },
      { title: 'Modular Foundation', advice: 'Use scalable monolith architecture to enable rapid iteration.', action: 'Find Tech Mentor' }
    ]
  },
  FIND_FIRST_CUSTOMER: {
    title: 'Find My First Customer',
    subtitle: 'Connect with founders and growth executives who offer distribution and corporate introductions.',
    helpCategoryKeyword: 'Distribution',
    recommendedRole: 'Chief Revenue Officer',
    recommendedCommunitySlug: 'd2c-founders',
    guidanceCards: [
      { title: 'Executive Warm Intros', advice: 'Request targeted introductions to enterprise decision-makers.', action: 'Request Warm Intro' },
      { title: 'Design Partners', advice: 'Offer free co-development in exchange for early case studies.', action: 'Post Ask' }
    ]
  },
  HIRE: {
    title: 'Hire Key Talent',
    subtitle: 'Tap into trusted referral networks for senior engineering, product, and sales leaders.',
    helpCategoryKeyword: 'Hiring',
    recommendedRole: 'Head of People / VP Engineering',
    recommendedCommunitySlug: 'saas-founders',
    guidanceCards: [
      { title: 'Exec Referral Circles', advice: 'Hire candidates vetted personally by verified founders.', action: 'Search Talent' }
    ]
  },
  FIND_COFOUNDER: {
    title: 'Find a Co-Founder',
    subtitle: 'Discover complementary builders with aligned values, stage focus, and track record.',
    helpCategoryKeyword: 'Operations',
    recommendedRole: 'Co-Founder',
    recommendedCommunitySlug: 'first-time-founders',
    guidanceCards: [
      { title: 'Complementary Skillsets', advice: 'Pair technical excellence with commercial distribution power.', action: 'Discover Peers' }
    ]
  },
  RAISE_FUNDING: {
    title: 'Raise Funding & Find Investors',
    subtitle: 'Connect with verified VCs, angels, and founders who have recently raised capital.',
    helpCategoryKeyword: 'Fundraising',
    recommendedRole: 'Managing Partner / Angel Investor',
    recommendedCommunitySlug: 'fundraising-circle',
    guidanceCards: [
      { title: 'Targeted Investor Pitching', advice: 'Filter investors by exact cheque size and sector focus.', action: 'Discover Investors' },
      { title: 'Founder Warm Intros', advice: 'Request warm introductions from portfolio founders.', action: 'Request Investor Intro' }
    ]
  },
  FIND_MANUFACTURER: {
    title: 'Find a Manufacturer & Supply Chain',
    subtitle: 'Connect with hardware, D2C, and manufacturing founders with vetted supply chains.',
    helpCategoryKeyword: 'Manufacturing',
    recommendedRole: 'Head of Supply Chain',
    recommendedCommunitySlug: 'manufacturing-hardware',
    guidanceCards: [
      { title: 'Vetted Suppliers', advice: 'Access verified factory connections across India and East Asia.', action: 'Find Supplier' }
    ]
  },
  ENTER_NEW_MARKET: {
    title: 'Enter a New Market / International Expansion',
    subtitle: 'Connect with regional founders in UAE, US, SG, and Europe to navigate expansion.',
    helpCategoryKeyword: 'International expansion',
    recommendedRole: 'Managing Director / Regional Head',
    recommendedCommunitySlug: 'international-expansion',
    guidanceCards: [
      { title: 'Entity & Regulatory Setup', advice: 'Consult local founders on Dubai, Delaware, or Singapore entities.', action: 'Find Regional Peer' }
    ]
  }
};

// Help Desk resolution endpoint
router.post('/resolve', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { intentKey } = req.body;
    const userId = req.user!.id;

    const intent = INTENT_MAP[intentKey] || INTENT_MAP['START_COMPANY'];

    // Block enforcement
    const blocks = await prisma.userBlock.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] }
    });
    const blockedUserIds = new Set(blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId)));

    // 1. Surface relevant founders/executives
    const profiles = await prisma.profile.findMany({
      where: {
        userId: { notIn: Array.from(blockedUserIds).concat(userId) },
        canHelpWithJson: { contains: intent.helpCategoryKeyword }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            verifications: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        }
      },
      take: 6
    });

    // 2. Surface relevant investors
    const investors = await prisma.investorProfile.findMany({
      where: {
        userId: { notIn: Array.from(blockedUserIds) }
      },
      include: {
        user: { select: { id: true, email: true, profile: true } }
      },
      take: 4
    });

    // 3. Surface relevant requests
    const requests = await prisma.request.findMany({
      where: {
        authorId: { notIn: Array.from(blockedUserIds) },
        status: 'OPEN'
      },
      include: {
        author: { select: { id: true, email: true, profile: true } }
      },
      take: 4
    });

    // 4. Surface relevant community
    const community = await prisma.community.findUnique({
      where: { slug: intent.recommendedCommunitySlug }
    });

    return res.json({
      intent,
      relevantFounders: profiles,
      relevantInvestors: investors,
      relevantRequests: requests,
      recommendedCommunity: community
    });
  } catch (error) {
    console.error('Help resolution error:', error);
    return res.status(500).json({ error: 'Failed to resolve help request' });
  }
});

export default router;
