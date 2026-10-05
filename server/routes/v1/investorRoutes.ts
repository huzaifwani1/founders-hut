import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// List investor profiles with structured filtering
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { investorType, stage, sector } = req.query;
    const userId = req.user!.id;

    // Filter out blocked users
    const blocks = await prisma.userBlock.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] }
    });
    const blockedUserIds = new Set(blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId)));

    const investors = await prisma.investorProfile.findMany({
      where: {
        ...(investorType && investorType !== 'ALL' ? { investorType: String(investorType) } : {})
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
            verifications: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const filtered = investors.filter((inv) => {
      if (blockedUserIds.has(inv.userId)) return false;
      
      if (stage && stage !== 'ALL') {
        const stages: string[] = JSON.parse(inv.stageFocusJson || '[]');
        if (!stages.includes(String(stage))) return false;
      }

      if (sector && sector !== 'ALL') {
        const sectors: string[] = JSON.parse(inv.sectorsJson || '[]');
        const matchesSector = sectors.some((s) => s.toLowerCase().includes(String(sector).toLowerCase()));
        if (!matchesSector) return false;
      }

      return true;
    });

    return res.json(filtered);
  } catch (error) {
    console.error('List investors error:', error);
    return res.status(500).json({ error: 'Failed to fetch investors' });
  }
});

// Natural language and structured investor discovery
router.post('/search', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.body;
    const userId = req.user!.id;

    const blocks = await prisma.userBlock.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] }
    });
    const blockedUserIds = new Set(blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId)));

    const allInvestors = await prisma.investorProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
            verifications: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        }
      }
    });

    const sanitized = allInvestors.filter((inv) => !blockedUserIds.has(inv.userId));

    if (!query || typeof query !== 'string' || !query.trim()) {
      const formatted = sanitized.map((inv) => ({
        investor: inv,
        matchReasons: ['Verified Investor Profile', `Type: ${inv.investorType}`]
      }));
      return res.json(formatted);
    }

    const q = query.toLowerCase();
    const results = sanitized.map((inv) => {
      const matchReasons: string[] = [];
      const sectors: string[] = JSON.parse(inv.sectorsJson || '[]');
      const stages: string[] = JSON.parse(inv.stageFocusJson || '[]');
      const geographies: string[] = JSON.parse(inv.geographiesJson || '[]');

      if (inv.firmName && inv.firmName.toLowerCase().includes(q)) {
        matchReasons.push(`Firm Name: ${inv.firmName}`);
      }

      sectors.forEach((s) => {
        if (q.includes(s.toLowerCase()) || s.toLowerCase().includes(q)) {
          matchReasons.push(`Sector Alignment: ${s}`);
        }
      });

      stages.forEach((st) => {
        if (q.includes(st.toLowerCase()) || st.toLowerCase().includes(q)) {
          matchReasons.push(`Stage Focus: ${st}`);
        }
      });

      geographies.forEach((g) => {
        if (q.includes(g.toLowerCase()) || g.toLowerCase().includes(q)) {
          matchReasons.push(`Geography: ${g}`);
        }
      });

      if (inv.chequeRangeMin || inv.chequeRangeMax) {
        matchReasons.push(`Cheque Range: ${inv.chequeRangeMin || 'Min'} – ${inv.chequeRangeMax || 'Max'}`);
      }

      if (matchReasons.length === 0) {
        matchReasons.push(`Matched query "${query}"`);
      }

      return {
        investor: inv,
        matchReasons
      };
    });

    return res.json(results);
  } catch (error) {
    console.error('Search investors error:', error);
    return res.status(500).json({ error: 'Failed to search investors' });
  }
});

// Update or create current user's investor profile
router.put('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      investorType,
      firmName,
      stageFocus,
      chequeRangeMin,
      chequeRangeMax,
      sectors,
      geographies,
      portfolioHighlights,
      currentFocus,
      introPreferences
    } = req.body;

    const investor = await prisma.investorProfile.upsert({
      where: { userId },
      update: {
        ...(investorType && { investorType }),
        ...(firmName !== undefined && { firmName }),
        ...(stageFocus && { stageFocusJson: JSON.stringify(stageFocus) }),
        ...(chequeRangeMin !== undefined && { chequeRangeMin }),
        ...(chequeRangeMax !== undefined && { chequeRangeMax }),
        ...(sectors && { sectorsJson: JSON.stringify(sectors) }),
        ...(geographies && { geographiesJson: JSON.stringify(geographies) }),
        ...(portfolioHighlights !== undefined && { portfolioHighlights }),
        ...(currentFocus !== undefined && { currentFocus }),
        ...(introPreferences && { introPreferences })
      },
      create: {
        userId,
        investorType: investorType || 'VC',
        firmName: firmName || null,
        stageFocusJson: JSON.stringify(stageFocus || ['PRE_SEED', 'SEED', 'SERIES_A']),
        chequeRangeMin: chequeRangeMin || '₹50L',
        chequeRangeMax: chequeRangeMax || '₹2Cr',
        sectorsJson: JSON.stringify(sectors || ['FinTech', 'AI', 'SaaS']),
        geographiesJson: JSON.stringify(geographies || ['India', 'Global']),
        portfolioHighlights: portfolioHighlights || null,
        currentFocus: currentFocus || null,
        introPreferences: introPreferences || 'WARM_INTRO_ONLY',
        isVerifiedInvestor: false
      },
      include: {
        user: { select: { id: true, email: true, profile: true } }
      }
    });

    return res.json(investor);
  } catch (error) {
    console.error('Update investor profile error:', error);
    return res.status(500).json({ error: 'Failed to update investor profile' });
  }
});

// Get investor profile by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const investorId = req.params.id;

    const investor = await prisma.investorProfile.findUnique({
      where: { id: investorId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
            verifications: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        }
      }
    });

    if (!investor) {
      return res.status(404).json({ error: 'Investor profile not found' });
    }

    const block = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: investor.userId },
          { blockerId: investor.userId, blockedId: userId }
        ]
      }
    });

    if (block) {
      return res.status(403).json({ error: 'Access blocked' });
    }

    return res.json(investor);
  } catch (error) {
    console.error('Get investor error:', error);
    return res.status(500).json({ error: 'Failed to fetch investor profile' });
  }
});

export default router;
