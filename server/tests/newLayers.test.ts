import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Founders Hut Product Expansion & Authorization Test Suite', () => {
  let user1Token: string;
  let user1Id: string;
  let user1Email: string;

  let user2Token: string;
  let user2Id: string;
  let user2Email: string;

  let communityId: string;
  let communitySlug: string;

  beforeAll(async () => {
    // Register User 1
    user1Email = `exp_user_1_${Date.now()}@alpha-labs.io`;
    const reg1 = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: user1Email, password: 'Password123!', name: 'Expansion Founder 1' });
    expect(reg1.status).toBe(201);
    user1Token = reg1.body.accessToken;
    user1Id = reg1.body.user.id;

    // Register User 2
    user2Email = `exp_user_2_${Date.now()}@beta-labs.io`;
    const reg2 = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: user2Email, password: 'Password123!', name: 'Expansion Founder 2' });
    expect(reg2.status).toBe(201);
    user2Token = reg2.body.accessToken;
    user2Id = reg2.body.user.id;

    // Seed test community
    const comm = await prisma.community.create({
      data: {
        name: 'Test SaaS Founders',
        slug: `test-saas-${Date.now()}`,
        category: 'SECTOR',
        description: 'Test community for B2B founders',
        isPrivate: true
      }
    });
    communityId = comm.id;
    communitySlug = comm.slug;
  });

  describe('1. Founder Communities & Discussion Authorization', () => {
    it('User 1 lists communities successfully', async () => {
      const res = await request(app)
        .get('/api/v1/communities')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('User 1 joins community and posts a discussion', async () => {
      // Join
      const joinRes = await request(app)
        .post(`/api/v1/communities/${communityId}/join`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(joinRes.status).toBe(201);

      // Post discussion
      const discRes = await request(app)
        .post(`/api/v1/communities/${communityId}/discussions`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Pricing contracts past $1M ARR',
          body: 'How are you structuring annual upfront minimum floors?',
          topicCategory: 'QUESTION'
        });

      expect(discRes.status).toBe(201);
      expect(discRes.body.title).toContain('Pricing contracts');
    });

    it('Non-member User 2 is blocked from posting to community without joining', async () => {
      const res = await request(app)
        .post(`/api/v1/communities/${communityId}/discussions`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ title: 'Unauthorized post', body: 'Should be forbidden' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('must join');
    });
  });

  describe('2. Investor Profiles & Intent Search', () => {
    it('User 1 creates investor profile', async () => {
      const res = await request(app)
        .put('/api/v1/investors/me')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          investorType: 'VC',
          firmName: 'Expansion Ventures',
          stageFocus: ['PRE_SEED', 'SEED'],
          chequeRangeMin: '₹50L',
          chequeRangeMax: '₹2Cr',
          sectors: ['FinTech', 'SaaS'],
          geographies: ['India'],
          currentFocus: 'Looking for India B2B SaaS'
        });

      expect(res.status).toBe(200);
      expect(res.body.firmName).toBe('Expansion Ventures');
    });

    it('User 2 performs structured & natural language investor search', async () => {
      const res = await request(app)
        .post('/api/v1/investors/search')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ query: 'FinTech' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].matchReasons).toBeDefined();
    });
  });

  describe('3. Help Desk Intent Resolution Endpoint', () => {
    it('Resolves problem intent and surfaces targeted peers, investors, and communities', async () => {
      const res = await request(app)
        .post('/api/v1/help/resolve')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ intentKey: 'RAISE_FUNDING' });

      expect(res.status).toBe(200);
      expect(res.body.intent).toBeDefined();
      expect(res.body.intent.title).toBe('Raise Funding & Find Investors');
      expect(Array.isArray(res.body.relevantFounders)).toBe(true);
      expect(Array.isArray(res.body.relevantInvestors)).toBe(true);
    });
  });

  describe('4. Block Enforcement Across New Surfaces', () => {
    it('Blocked user discussion posts are hidden in community details', async () => {
      // User 1 blocks User 2
      await request(app)
        .post('/api/v1/blocks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ blockedId: user2Id });

      // Fetch community details as User 1
      const res = await request(app)
        .get(`/api/v1/communities/${communitySlug}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      const postsFromBlockedUser = res.body.discussions.filter((d: any) => d.authorId === user2Id);
      expect(postsFromBlockedUser.length).toBe(0);
    });
  });
});
