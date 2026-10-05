import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../../middleware/auth';
import { discoveryService } from '../../services/discoveryService';

const router = Router();
const prisma = new PrismaClient();

// Grounded multi-entity search: People, Posts, Communities, Requests
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { query, type, role, industry, stage, location } = req.query;
    const rawText = query ? String(query).trim() : '';
    const searchType = type ? String(type) : 'ALL';
    const userId = req.user!.id;

    const parsedFilters = discoveryService.parseQuery({
      rawText,
      role: role ? String(role) : undefined,
      industry: industry ? String(industry) : undefined,
      stage: stage ? String(stage) : undefined,
      location: location ? String(location) : undefined
    });

    const results: {
      people: any[];
      posts: any[];
      communities: any[];
      requests: any[];
    } = {
      people: [],
      posts: [],
      communities: [],
      requests: []
    };

    const searchLower = rawText.toLowerCase();

    // 1. Search People
    if (searchType === 'ALL' || searchType === 'PEOPLE') {
      const profiles = await prisma.profile.findMany({
        where: {
          appearInDiscovery: true,
          user: {
            isSuspended: false,
            ...(process.env.NODE_ENV === 'production'
              ? {
                  isTestUser: false,
                  NOT: {
                    OR: [
                      { email: { contains: 'p0_' } },
                      { email: { contains: 'health_' } },
                      { profile: { name: { contains: '[DEV SEED]' } } },
                      { profile: { name: { contains: 'Attacker User' } } }
                    ]
                  }
                }
              : {})
          },
          ...(role ? { role: { contains: String(role) } } : {}),
          ...(industry ? { industry: { contains: String(industry) } } : {}),
          ...(location ? { location: { contains: String(location) } } : {})
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              verifications: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      results.people = profiles
        .map((p) => {
          const { reasons, sources } = discoveryService.generateMatchReasons(p, parsedFilters, rawText);
          let isMatch = !searchLower;

          if (searchLower) {
            isMatch =
              p.location.toLowerCase().includes(searchLower) ||
              p.industry.toLowerCase().includes(searchLower) ||
              p.canHelpWithJson.toLowerCase().includes(searchLower) ||
              p.company.toLowerCase().includes(searchLower) ||
              p.role.toLowerCase().includes(searchLower) ||
              (p.bio?.toLowerCase() || '').includes(searchLower) ||
              p.skillsJson.toLowerCase().includes(searchLower) ||
              reasons.length > 0;
          }

          return {
            ...p,
            isMatch,
            matchReasons: reasons,
            groundedSources: sources
          };
        })
        .filter((item) => item.isMatch);
    }

    // 2. Search Posts
    if (searchType === 'ALL' || searchType === 'POSTS') {
      const posts = await prisma.post.findMany({
        where: {
          deletedAt: null,
          visibility: 'PUBLIC_TO_VERIFIED_NETWORK',
          ...(searchLower
            ? {
                OR: [
                  { body: { contains: searchLower } },
                  { title: { contains: searchLower } }
                ]
              }
            : {})
        },
        include: {
          author: { select: { id: true, email: true, profile: true } },
          community: { select: { id: true, name: true, slug: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      results.posts = posts.map((post) => ({
        ...post,
        matchReason: `Post matching search keyword "${rawText}"`
      }));
    }

    // 3. Search Communities
    if (searchType === 'ALL' || searchType === 'COMMUNITIES') {
      const communities = await prisma.community.findMany({
        where: {
          status: 'ACTIVE',
          ...(searchLower
            ? {
                OR: [
                  { name: { contains: searchLower } },
                  { description: { contains: searchLower } },
                  { category: { contains: searchLower } }
                ]
              }
            : {})
        },
        include: {
          memberships: {
            where: { userId, status: 'ACTIVE' },
            select: { role: true }
          }
        },
        orderBy: { membersCount: 'desc' },
        take: 20
      });

      results.communities = communities.map((c) => ({
        ...c,
        isJoined: c.memberships.length > 0,
        matchReason: `Community category: ${c.category}`
      }));
    }

    // 4. Search Requests
    if (searchType === 'ALL' || searchType === 'REQUESTS') {
      const reqs = await prisma.request.findMany({
        where: {
          status: 'OPEN',
          visibility: 'PUBLIC_TO_VERIFIED_NETWORK',
          ...(searchLower
            ? {
                OR: [
                  { title: { contains: searchLower } },
                  { needDescription: { contains: searchLower } },
                  { needCategory: { contains: searchLower } },
                  { industry: { contains: searchLower } }
                ]
              }
            : {})
        },
        include: {
          author: { select: { id: true, email: true, profile: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      results.requests = reqs.map((r) => ({
        ...r,
        matchReason: `Open business problem in ${r.needCategory}`
      }));
    }

    if (req.query.format === 'nested') {
      return res.json(results);
    }

    return res.json(results.people);
  } catch (error) {
    console.error('Discover error:', error);
    return res.status(500).json({ error: 'Failed to search network directory' });
  }
});

export default router;
