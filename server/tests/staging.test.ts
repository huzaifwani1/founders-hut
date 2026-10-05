import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Founders Hut Staging MVP Real Account & Network Loop Test Suite', () => {
  // Staging User A (Founder A - Staging Alpha Systems)
  let userAToken: string;
  let userAId: string;
  let userAEmail: string;

  // Staging User B (Founder B - Staging Beta Logistics)
  let userBToken: string;
  let userBId: string;
  let userBEmail: string;

  let adminToken: string;
  let requestId: string;
  let introId: string;
  let conversationId: string;

  beforeAll(async () => {
    // Authenticate Admin User
    const resAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@foundershut.com', password: 'password123' });
    expect(resAdmin.status).toBe(200);
    adminToken = resAdmin.body.accessToken;
  });

  it('1. User A Lifecycle: Register → Verification → Login → Profile → Company → Submit Verification', async () => {
    userAEmail = `staging_user_a_${Date.now()}@alpha-systems.io`;

    // Step 1: Register
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: userAEmail,
        password: 'Password123!',
        name: '[STAGING TEST] User A'
      });
    expect(regRes.status).toBe(201);
    userAToken = regRes.body.accessToken;
    userAId = regRes.body.user.id;
    expect(regRes.body.user.onboardingStep).toBe(2);

    // Step 2: Update Profile Details & Role
    const profileRes = await request(app)
      .put(`/api/v1/profiles/${userAId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: '[STAGING TEST] User A',
        role: 'Co-Founder & CEO',
        company: 'Staging Alpha Systems',
        companyStage: 'SERIES_A',
        industry: 'Enterprise Software / AI',
        location: 'Bengaluru / San Francisco',
        bio: 'Building staging autonomous AI developer infrastructure.',
        yearsBuilding: 6,
        canHelpWith: ['SaaS Pricing Models', 'Series A Term Sheets', 'US Expansion'],
        lookingFor: ['Enterprise Design Partners', 'Logistics Operations Advice']
      });
    expect(profileRes.status).toBe(200);

    // Step 3: Submit Verification Document
    const submitRes = await request(app)
      .post('/api/v1/verifications/submit')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        documentType: 'COMPANY',
        fileRef: `staging_doc_alpha_${Date.now()}.pdf`
      });
    expect(submitRes.status).toBe(201);
    expect(submitRes.body.document.status).toBe('PENDING');
    const verificationIdA = submitRes.body.verificationId;

    // Step 4: Admin Reviews & Approves Verification
    const reviewRes = await request(app)
      .post(`/api/v1/admin/verifications/${verificationIdA}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'APPROVE',
        level: 'VERIFIED_FOUNDER'
      });
    expect(reviewRes.status).toBe(200);

    // Re-login User A to refresh token session
    const loginA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userAEmail, password: 'Password123!' });
    expect(loginA.status).toBe(200);
    userAToken = loginA.body.accessToken;

    // Verify DB state
    const dbUser = await prisma.user.findUnique({
      where: { id: userAId },
      include: { verifications: { orderBy: { createdAt: 'desc' } }, profile: true }
    });
    expect(dbUser?.onboardingStep).toBe(7);
    expect(dbUser?.verifications[0].level).toBe('VERIFIED_FOUNDER');
  });

  it('2. User B Lifecycle: Register → Complete Onboarding & Verification Approval', async () => {
    userBEmail = `staging_user_b_${Date.now()}@beta-logistics.io`;

    // Register User B
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: userBEmail,
        password: 'Password123!',
        name: '[STAGING TEST] User B'
      });
    expect(regRes.status).toBe(201);
    userBToken = regRes.body.accessToken;
    userBId = regRes.body.user.id;

    // Profile Setup
    await request(app)
      .put(`/api/v1/profiles/${userBId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        name: '[STAGING TEST] User B',
        role: 'Founder & Managing Director',
        company: 'Staging Beta Logistics',
        companyStage: 'GROWTH',
        industry: 'Consumer Brands / D2C Logistics',
        location: 'Srinagar / Dubai',
        bio: 'Pioneered cold-chain logistics across rugged geographies.',
        yearsBuilding: 9,
        canHelpWith: ['Cold-Chain Logistics', 'Dubai & GCC Expansion', 'Dark Store Operations'],
        lookingFor: ['Enterprise AI Software', 'US West Coast VC Intros']
      });

    // Verification Submit & Admin Approve
    const submitB = await request(app)
      .post('/api/v1/verifications/submit')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ documentType: 'COMPANY', fileRef: `staging_doc_beta_${Date.now()}.pdf` });
    expect(submitB.status).toBe(201);
    const verificationIdB = submitB.body.verificationId;

    const reviewRes = await request(app)
      .post(`/api/v1/admin/verifications/${verificationIdB}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'APPROVE', level: 'VERIFIED_FOUNDER' });

    expect(reviewRes.status).toBe(200);

    // Re-login User B
    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userBEmail, password: 'Password123!' });
    expect(loginB.status).toBe(200);
    userBToken = loginB.body.accessToken;
  });

  it('3. Discovery & Grounded Match Reasoning: User A discovers User B', async () => {
    const res = await request(app)
      .get('/api/v1/discover?query=Dubai')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const matchB = res.body.find((item: any) => item.userId === userBId);
    expect(matchB).toBeDefined();
    expect(matchB.matchReasons).toBeDefined();
    expect(matchB.matchReasons.some((r: string) => r.includes('Dubai') || r.includes('Srinagar / Dubai'))).toBe(true);
  });

  it('4. Request Creation & Visibility Rules: User A creates requests with visibility levels', async () => {
    // 1. Create Public Request
    const pubRes = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        needCategory: 'EXPANSION',
        title: 'Seeking advice on Dubai & GCC Entity Setup',
        needDescription: 'We are expanding our B2B SaaS platform into the UAE. Seeking founder experience on free zone setup vs mainland entity.',
        industry: 'Enterprise Software / AI',
        location: 'Dubai / Bengaluru',
        urgency: 'URGENT',
        visibility: 'PUBLIC_TO_VERIFIED_NETWORK'
      });

    expect(pubRes.status).toBe(201);
    requestId = pubRes.body.id;

    // 2. Create Connections-Only Request
    const connOnlyRes = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        needCategory: 'FUNDRAISING',
        title: 'Private Ask: Series B Term Sheet Benchmark',
        needDescription: 'Only visible to direct connections',
        visibility: 'CONNECTIONS_ONLY'
      });
    expect(connOnlyRes.status).toBe(201);
    const connOnlyId = connOnlyRes.body.id;

    // User B (not connected yet) fetches requests feed
    const bFeedRes = await request(app)
      .get('/api/v1/requests')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(bFeedRes.status).toBe(200);
    const bFeedIds = bFeedRes.body.map((r: any) => r.id);
    expect(bFeedIds).toContain(requestId); // Public visible
    expect(bFeedIds).not.toContain(connOnlyId); // Connections-only hidden
  });

  it('5. End-to-End Network Loop: Intro Request → Acceptance → Connection → Conversation → Messaging', async () => {
    // Step 1: User A requests introduction to User B
    const introReq = await request(app)
      .post('/api/v1/introductions/request')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        toUserId: userBId,
        reason: 'Discussion regarding Dubai free zone entity setup & logistics'
      });

    expect(introReq.status).toBe(201);
    introId = introReq.body.id;

    // Verify DB state: Introduction status = REQUESTED
    const dbIntro = await prisma.introduction.findUnique({ where: { id: introId } });
    expect(dbIntro?.status).toBe('REQUESTED');

    // Step 2: Recipient User B accepts Introduction
    const acceptRes = await request(app)
      .put(`/api/v1/introductions/${introId}/status`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ status: 'ACCEPTED' });

    expect(acceptRes.status).toBe(200);

    // Verify DB state: Connection created & Conversation unlocked
    const dbConn = await prisma.connection.findFirst({
      where: {
        OR: [
          { userAId: userAId, userBId: userBId },
          { userAId: userBId, userBId: userAId }
        ]
      }
    });
    expect(dbConn).not.toBeNull();

    const dbConv = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participantAId: userAId, participantBId: userBId },
          { participantAId: userBId, participantBId: userAId }
        ]
      }
    });
    expect(dbConv).not.toBeNull();
    conversationId = dbConv!.id;

    // Step 3: User A sends direct REST message
    const msg1Res = await request(app)
      .post(`/api/v1/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ text: 'Hi User B! Thanks for accepting the introduction re: Dubai expansion.' });

    expect(msg1Res.status).toBe(201);

    // Step 4: User B replies to User A
    const msg2Res = await request(app)
      .post(`/api/v1/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ text: 'Glad to connect User A! Happy to share our cold-chain & DIFC entity experience.' });

    expect(msg2Res.status).toBe(201);

    // Verify Conversation message count in DB
    const msgs = await prisma.message.findMany({ where: { conversationId } });
    expect(msgs.length).toBe(2);
  });

  it('6. Verification States Matrix & Access Gates', async () => {
    // Unverified account
    const unverifiedRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `unverified_matrix_${Date.now()}@test.com`,
        password: 'Password123!'
      });
    const unverifiedToken = unverifiedRes.body.accessToken;

    // Unverified blocked from request creation
    const reqAttempt = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${unverifiedToken}`)
      .send({ title: 'Unverified Attempt', needDescription: 'Blocked' });
    expect(reqAttempt.status).toBe(403);

    // Suspended account
    await prisma.user.update({
      where: { id: unverifiedRes.body.user.id },
      data: { isSuspended: true }
    });

    const suspendedAttempt = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${unverifiedToken}`);
    expect(suspendedAttempt.status).toBe(403);
    expect(suspendedAttempt.body.error).toContain('Account suspended');
  });

  it('7. Failure & IDOR Protection Matrix', async () => {
    // IDOR 1: User B tries to update User A's profile
    const profileIdor = await request(app)
      .put(`/api/v1/profiles/${userAId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ name: 'Hacked User A Name' });
    expect(profileIdor.status).toBe(403);

    // IDOR 2: User B tries to delete User A's request
    const reqIdor = await request(app)
      .delete(`/api/v1/requests/${requestId}`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(reqIdor.status).toBe(403);

    // Duplicate Intro: User A tries sending duplicate intro to User B
    const dupIntro = await request(app)
      .post('/api/v1/introductions/request')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ toUserId: userBId, reason: 'Duplicate intro attempt' });
    expect(dupIntro.status).toBe(409);
  });
});
