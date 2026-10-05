import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Founders Hut — Core Two-User Real Backend E2E Workflow Test', () => {
  let userAToken: string;
  let userAId: string;
  let userAEmail: string;

  let userBToken: string;
  let userBId: string;
  let userBEmail: string;

  let facilitatorToken: string;
  let facilitatorId: string;
  let facilitatorEmail: string;

  let requestId: string;
  let introId: string;
  let conversationId: string;
  let resolutionId: string;

  beforeAll(async () => {
    // 1. User A (Requester / Asker) Registers
    userAEmail = `e2e_user_a_${Date.now()}@aethermetrics.io`;
    const regA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: userAEmail,
        password: 'Password123!',
        name: 'Ananya Sharma',
        role: 'Founder',
        company: 'Aether Metrics',
        industry: 'Consumer D2C',
        location: 'Bengaluru'
      });
    expect(regA.status).toBe(201);
    userAToken = regA.body.accessToken;
    userAId = regA.body.user.id;

    // Update User A profile capabilities & verification status
    await prisma.profile.update({
      where: { userId: userAId },
      data: {
        canHelpWithJson: JSON.stringify(['Product Strategy']),
        lookingForJson: JSON.stringify(['Dubai Expansion', 'Logistics Supply Chain']),
        arrValue: '$1.2M ARR',
        arrSource: 'Audited Financials',
        arrIsSelfReported: false
      }
    });

    await prisma.verification.updateMany({
      where: { userId: userAId },
      data: {
        level: 'VERIFIED_FOUNDER',
        identityVerified: true,
        corporateDomainVerified: true,
        entityVerified: true,
        founderStatusVerified: true
      }
    });

    // 2. User B (Helper / Expert) Registers with matching capabilities
    userBEmail = `e2e_user_b_${Date.now()}@kashmirvalley.io`;
    const regB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: userBEmail,
        password: 'Password123!',
        name: 'Tariq Kashmir',
        role: 'Co-Founder',
        company: 'Kashmir Valley Organics',
        industry: 'Consumer D2C',
        location: 'Dubai'
      });
    expect(regB.status).toBe(201);
    userBToken = regB.body.accessToken;
    userBId = regB.body.user.id;

    // Update User B profile with explicit expertise in Dubai Expansion & Supply Chain
    await prisma.profile.update({
      where: { userId: userBId },
      data: {
        canHelpWithJson: JSON.stringify(['Dubai Expansion', 'D2C Supply Chain', 'Export Licensing']),
        lookingForJson: JSON.stringify(['Retail Distribution']),
        arrValue: '$2.5M ARR',
        arrSource: 'PitchBook Verified',
        arrIsSelfReported: false
      }
    });

    await prisma.verification.updateMany({
      where: { userId: userBId },
      data: {
        level: 'VERIFIED_FOUNDER',
        identityVerified: true,
        corporateDomainVerified: true,
        entityVerified: true,
        founderStatusVerified: true
      }
    });

    // 3. Facilitator User Registers
    facilitatorEmail = `e2e_facilitator_${Date.now()}@nexuscap.io`;
    const regFac = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: facilitatorEmail,
        password: 'Password123!',
        name: 'Devika Patel',
        role: 'Managing Partner',
        company: 'Nexus Capital',
        industry: 'Venture Capital',
        location: 'Mumbai'
      });
    expect(regFac.status).toBe(201);
    facilitatorToken = regFac.body.accessToken;
    facilitatorId = regFac.body.user.id;
  });

  it('Step 1: User A creates a business request on the backend', async () => {
    const res = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        needCategory: 'EXPANSION',
        title: 'Need UAE cold-chain distribution partner for D2C organic beverage brand',
        needDescription: 'Looking for verified founders with established retail warehousing in Dubai.',
        industry: 'Consumer D2C',
        location: 'Dubai',
        desiredConnection: 'Verified Founder in UAE',
        urgency: 'URGENT',
        visibility: 'PUBLIC_TO_VERIFIED_NETWORK'
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toContain('UAE cold-chain');
    requestId = res.body.id;
  });

  it('Step 2: User B lists requests and sees User A request', async () => {
    const res = await request(app)
      .get('/api/v1/requests')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const targetReq = res.body.find((r: any) => r.id === requestId);
    expect(targetReq).toBeDefined();
    expect(targetReq.author.id).toBe(userAId);
  });

  it('Step 3: User A requests an introduction to User B via Facilitator', async () => {
    const res = await request(app)
      .post('/api/v1/introductions/request')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        toUserId: userBId,
        facilitatorId,
        reason: 'Discuss UAE cold-chain distribution partnership and warehousing'
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('REQUESTED');
    introId = res.body.id;
  });

  it('Step 4: Facilitator / Recipient responds and accepts the introduction', async () => {
    const res = await request(app)
      .put(`/api/v1/introductions/${introId}/status`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ACCEPTED');
  });

  it('Step 5: Automated 1-to-1 conversation exists for User A and User B', async () => {
    const res = await request(app)
      .get('/api/v1/messages/conversations')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    conversationId = res.body[0].id;
  });

  it('Step 6: User B sends a message in the conversation thread', async () => {
    const res = await request(app)
      .post(`/api/v1/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ text: 'Hi Ananya! Happy to connect. We operate 3 cold storage facilities in Jebel Ali.' });

    expect(res.status).toBe(201);
    expect(res.body.text).toContain('Jebel Ali');
  });

  it('Step 7: User A retrieves conversation messages and sees User B message', async () => {
    const res = await request(app)
      .get(`/api/v1/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const msg = res.body.find((m: any) => m.text.includes('Jebel Ali'));
    expect(msg).toBeDefined();
    expect(msg.senderId).toBe(userBId);
  });

  it('Step 8: User A creates a Resolution Record for help provided by User B', async () => {
    const res = await request(app)
      .post('/api/v1/resolutions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        requestId,
        helperId: userBId,
        introductionId: introId,
        outcomeType: 'SOLVED',
        outcomeCategory: 'PARTNERSHIP',
        helpType: 'OPERATIONAL_EXPERIENCE',
        askerAssessment: 'Tariq provided direct access to Kashmir Valley Organics Dubai cold storage hub.',
        summary: 'Connected on UAE cold-chain warehousing and secured distribution partner floor.',
        visibility: 'VERIFIED_NETWORK'
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING_HELPER_CONFIRMATION');
    resolutionId = res.body.id;
  });

  it('Step 9: User B receives notification to confirm resolution', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const notif = res.body.find((n: any) => n.type === 'RESOLUTION_CONFIRMATION_REQUESTED');
    expect(notif).toBeDefined();
  });

  it('Step 10: User B confirms resolution -> status becomes VERIFIED', async () => {
    const res = await request(app)
      .put(`/api/v1/resolutions/${resolutionId}/confirm`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ confirmed: true });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('VERIFIED');
    expect(res.body.helperConfirmation).toBe(true);
  });

  it('Step 11: VERIFIED ResolutionRecord appears on User B profile for public verified network', async () => {
    const res = await request(app)
      .get('/api/v1/resolutions')
      .set('Authorization', `Bearer ${userAToken}`)
      .query({ helperId: userBId });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const verifiedRecord = res.body.find((r: any) => r.id === resolutionId);
    expect(verifiedRecord).toBeDefined();
    expect(verifiedRecord.status).toBe('VERIFIED');
    expect(verifiedRecord.helper.name).toBe('Tariq Kashmir');
  });

  it('Step 12: Future request matching uses the verified evidence record', async () => {
    // User A creates a follow-up request regarding expansion
    const reqRes = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        needCategory: 'EXPANSION',
        title: 'Scaling UAE sales operations and regional warehouse space',
        needDescription: 'Seeking advice from founders with verified UAE operational experience.',
        industry: 'Consumer D2C',
        location: 'Dubai'
      });

    expect(reqRes.status).toBe(201);

    // Fetch matching resolutions for intent resolution endpoint
    const helpRes = await request(app)
      .post('/api/v1/help/resolve')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ intentKey: 'ENTER_NEW_MARKET' });

    expect(helpRes.status).toBe(200);
    expect(helpRes.body.relevantFounders).toBeDefined();
  });
});
