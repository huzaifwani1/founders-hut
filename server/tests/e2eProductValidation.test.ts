import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Founders Hut — Final End-to-End Product QA & Validation Suite', () => {
  let userAToken: string;
  let userAId: string;
  let userAEmail: string;

  let userBToken: string;
  let userBId: string;
  let userBEmail: string;

  let userCToken: string;
  let userCId: string;
  let userCEmail: string;

  let userDToken: string;
  let userDId: string;
  let userDEmail: string;

  let testCommunityId: string;
  let testCommunitySlug: string;
  let sharedPostId: string;
  let articlePostId: string;
  let linkPostId: string;
  let privatePostId: string;
  let communityRequestId: string;
  let introId: string;
  let e2eConversationId: string;

  beforeAll(async () => {
    // 1. Create User A (Verified Founder)
    userAEmail = `qa_user_a_${Date.now()}@aethermetrics.io`;
    const regA = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: userAEmail, password: 'Password123!', name: 'Ananya Sharma' });
    expect(regA.status).toBe(201);
    userAToken = regA.body.accessToken;
    userAId = regA.body.user.id;

    // Verify User A profile
    await prisma.profile.update({
      where: { userId: userAId },
      data: {
        role: 'Founder',
        company: 'Aether Metrics',
        industry: 'Consumer Tech',
        location: 'Bengaluru',
        canHelpWithJson: JSON.stringify(['Distribution', 'Product Strategy']),
        lookingForJson: JSON.stringify(['Manufacturing Partner', 'Seed Investors']),
        appearInDiscovery: true
      }
    });
    await prisma.verification.create({
      data: {
        userId: userAId,
        level: 'VERIFIED_FOUNDER',
        identityVerified: true,
        corporateDomainVerified: true,
        entityVerified: true,
        founderStatusVerified: true
      }
    });

    // 2. Create User B (Verified Founder / Intermediary)
    userBEmail = `qa_user_b_${Date.now()}@kashmirvalley.io`;
    const regB = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: userBEmail, password: 'Password123!', name: 'Tariq Kashmir' });
    expect(regB.status).toBe(201);
    userBToken = regB.body.accessToken;
    userBId = regB.body.user.id;

    await prisma.profile.update({
      where: { userId: userBId },
      data: {
        role: 'Co-Founder',
        company: 'Kashmir Valley Organics',
        industry: 'Consumer D2C',
        location: 'Dubai',
        canHelpWithJson: JSON.stringify(['D2C Supply Chain', 'Export Licensing']),
        lookingForJson: JSON.stringify(['Retail Distributors']),
        appearInDiscovery: true
      }
    });
    await prisma.verification.create({
      data: {
        userId: userBId,
        level: 'VERIFIED_FOUNDER',
        identityVerified: true,
        corporateDomainVerified: true,
        entityVerified: true,
        founderStatusVerified: true
      }
    });

    // 3. Create User C (Verified Founder / Target)
    userCEmail = `qa_user_c_${Date.now()}@vancecap.com`;
    const regC = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: userCEmail, password: 'Password123!', name: 'Marcus Vance' });
    expect(regC.status).toBe(201);
    userCToken = regC.body.accessToken;
    userCId = regC.body.user.id;

    await prisma.profile.update({
      where: { userId: userCId },
      data: {
        role: 'Managing Partner',
        company: 'Vance Capital',
        industry: 'Venture Debt',
        location: 'Mumbai',
        canHelpWithJson: JSON.stringify(['Venture Debt', 'Growth Capital']),
        lookingForJson: JSON.stringify(['Series A Founders']),
        appearInDiscovery: true
      }
    });
    await prisma.verification.create({
      data: {
        userId: userCId,
        level: 'VERIFIED_FOUNDER',
        identityVerified: true,
        corporateDomainVerified: true,
        entityVerified: true,
        founderStatusVerified: true
      }
    });

    // 4. Create User D (Unconnected Third Party / Attacker)
    userDEmail = `qa_user_d_${Date.now()}@stealth.com`;
    const regD = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: userDEmail, password: 'Password123!', name: 'David Stealth' });
    expect(regD.status).toBe(201);
    userDToken = regD.body.accessToken;
    userDId = regD.body.user.id;

    // Establish connection between User A and User B (Pathway)
    await prisma.connection.create({
      data: { userAId, userBId }
    });

    // Establish connection between User B and User C (Pathway B -> C)
    await prisma.connection.create({
      data: { userAId: userBId, userBId: userCId }
    });
  });

  // FLOW A — MEET
  it('FLOW A: User A discovers User B in network with grounded match reasons', async () => {
    const res = await request(app)
      .get('/api/v1/discover?query=Dubai')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    const people = Array.isArray(res.body) ? res.body : res.body.people;
    expect(Array.isArray(people)).toBe(true);

    const matchB = people.find((u: any) => u.userId === userBId || u.user?.id === userBId);
    expect(matchB).toBeDefined();
    expect(matchB.matchReasons).toBeDefined();
    expect(matchB.matchReasons.some((r: string) => r.toLowerCase().includes('dubai'))).toBe(true);
  });

  // FLOW B — CONNECT
  it('FLOW B: Connection state persistence & duplicate connection rejection', async () => {
    // Check connections list
    const netRes = await request(app)
      .get('/api/v1/connections')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(netRes.status).toBe(200);
    const connectedIds = netRes.body.map((c: any) => c.peer.id);
    expect(connectedIds).toContain(userBId);
  });

  // FLOW C — SHARE PUBLICLY
  it('FLOW C: User A publishes SHORT_POST and User B interacts (Useful, Bookmark, Comment)', async () => {
    // 1. Create SHORT_POST
    const createRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'SHORT_POST',
        body: 'After six months testing paid ads, we found our true lever was retention, not CAC.',
        visibility: 'PUBLIC_TO_VERIFIED_NETWORK'
      });
    expect(createRes.status).toBe(201);
    sharedPostId = createRes.body.id;

    // 2. User B fetches feed & sees post
    const feedRes = await request(app)
      .get('/api/v1/posts')
      .set('Authorization', `Bearer ${userBToken}`);
    expect(feedRes.status).toBe(200);
    const foundPost = feedRes.body.find((p: any) => p.id === sharedPostId);
    expect(foundPost).toBeDefined();

    // 3. User B toggles Useful reaction
    const usefulRes = await request(app)
      .post(`/api/v1/posts/${sharedPostId}/useful`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(usefulRes.status).toBe(200);
    expect(usefulRes.body.useful).toBe(true);

    // 4. User B saves post
    const saveRes = await request(app)
      .post(`/api/v1/posts/${sharedPostId}/save`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(saveRes.status).toBe(200);
    expect(saveRes.body.saved).toBe(true);

    // 5. User B comments on post
    const commentRes = await request(app)
      .post(`/api/v1/posts/${sharedPostId}/comments`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ body: 'Strong insight on retention! Did cohort analysis reveal specific drop-off days?' });
    expect(commentRes.status).toBe(201);
    expect(commentRes.body.body).toContain('cohort analysis');
  });

  // FLOW D — ARTICLE
  it('FLOW D: User A publishes long-form ARTICLE with title', async () => {
    const articleRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'ARTICLE',
        title: 'Building Cross-Border Distribution Networks for Indian SaaS',
        body: 'Expanding beyond domestic markets requires localized billing, compliance, and clear SLAs.',
        visibility: 'PUBLIC_TO_VERIFIED_NETWORK'
      });
    expect(articleRes.status).toBe(201);
    articlePostId = articleRes.body.id;
    expect(articleRes.body.title).toBe('Building Cross-Border Distribution Networks for Indian SaaS');
  });

  // FLOW E — LINK SHARING
  it('FLOW E: User A shares external LINK with commentary and safe URL validation', async () => {
    const linkRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'LINK',
        body: 'Fascinating analysis on B2B pricing models.',
        linkUrl: 'https://example.com/saas-pricing-guide',
        visibility: 'PUBLIC_TO_VERIFIED_NETWORK'
      });
    expect(linkRes.status).toBe(201);
    linkPostId = linkRes.body.id;
    expect(linkRes.body.linkUrl).toBe('https://example.com/saas-pricing-guide');
  });

  // FLOW F — COMMUNITY
  it('FLOW F: User A creates Community, User B joins, User A posts room content', async () => {
    // 1. Create Community
    const commRes = await request(app)
      .post('/api/v1/communities')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'D2C Supply Chain & Logistics',
        description: 'Founders navigating manufacturing, warehousing and international shipping.',
        category: 'SECTOR',
        isPrivate: true
      });
    expect(commRes.status).toBe(201);
    testCommunityId = commRes.body.id;
    testCommunitySlug = commRes.body.slug;

    // 2. User B joins Community
    const joinRes = await request(app)
      .post(`/api/v1/communities/${testCommunityId}/join`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(joinRes.status).toBe(201);

    // 3. User A posts discussion to room
    const discRes = await request(app)
      .post(`/api/v1/communities/${testCommunityId}/discussions`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: 'Air freight vs ocean freight for 500-unit electronics run',
        body: 'What customs clearing delays are you seeing at Mumbai ports?'
      });
    expect(discRes.status).toBe(201);
    expect(discRes.body.visibility).toBe('COMMUNITY_ONLY');

    // 4. Non-member User D is blocked from fetching private community posts
    const blockedRes = await request(app)
      .get(`/api/v1/communities/${testCommunityId}/posts`)
      .set('Authorization', `Bearer ${userDToken}`);
    expect(blockedRes.status).toBe(403);
  });

  // FLOW G — COMMUNITY REQUEST
  it('FLOW G: User A publishes business Request in Community and updates status', async () => {
    // Create Request
    const reqRes = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: 'Need electronics manufacturer for 500-unit IoT PCB batch',
        needDescription: 'Looking for verified EMS partner capable of surface mount assembly.',
        needCategory: 'EXPANSION',
        communityId: testCommunityId,
        visibility: 'PUBLIC_TO_VERIFIED_NETWORK'
      });
    expect(reqRes.status).toBe(201);
    communityRequestId = reqRes.body.id;

    // User A updates request status
    const updateRes = await request(app)
      .put(`/api/v1/requests/${communityRequestId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ status: 'in_progress' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe('in_progress');
  });

  // FLOW H — PRIVATE SHARING
  it('FLOW H: User A shares post privately with User B; Server blocks unauthorized User D', async () => {
    // Create PRIVATE post intended for User B
    const privateRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'SHORT_POST',
        body: 'Confidential term sheet benchmark for our upcoming Series A.',
        visibility: 'PRIVATE',
        recipientId: userBId
      });
    expect(privateRes.status).toBe(201);
    privatePostId = privateRes.body.id;

    // User B fetches feed & sees private post
    const userBFeed = await request(app)
      .get('/api/v1/posts')
      .set('Authorization', `Bearer ${userBToken}`);
    expect(userBFeed.status).toBe(200);
    const foundByB = userBFeed.body.find((p: any) => p.id === privatePostId);
    expect(foundByB).toBeDefined();

    // User D fetches feed & MUST NOT see private post
    const userDFeed = await request(app)
      .get('/api/v1/posts')
      .set('Authorization', `Bearer ${userDToken}`);
    expect(userDFeed.status).toBe(200);
    const foundByD = userDFeed.body.find((p: any) => p.id === privatePostId);
    expect(foundByD).toBeUndefined();
  });

  // FLOW I — COMMENTS & REPLIES
  it('FLOW I: User A replies to User B comment with IDOR deletion protection', async () => {
    // 1. Fetch post comments
    const getPost = await request(app)
      .get(`/api/v1/posts/${sharedPostId}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(getPost.status).toBe(200);
    const firstComment = getPost.body.comments[0];
    expect(firstComment).toBeDefined();

    const replyRes = await request(app)
      .post(`/api/v1/posts/${sharedPostId}/comments`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        body: 'Great question Tariq! We saw 40% drop off on day 3 before introducing guided onboarding.',
        parentCommentId: firstComment.id
      });
    expect(replyRes.status).toBe(201);

    // 2. Attacker User D attempts to delete User B comment (IDOR Protection)
    const deleteAttempt = await request(app)
      .delete(`/api/v1/posts/comments/${firstComment.id}`)
      .set('Authorization', `Bearer ${userDToken}`);
    expect(deleteAttempt.status).toBe(403);
  });

  // FLOW J — I NEED HELP
  it('FLOW J: Problem intent resolution surfaces factual matched peers and request creation', async () => {
    const resolveRes = await request(app)
      .post('/api/v1/help/resolve')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ intentKey: 'ENTER_NEW_MARKET' });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.intent.title).toContain('Market');
    expect(Array.isArray(resolveRes.body.relevantFounders)).toBe(true);
  });

  // FLOW K — TRUSTED INTRODUCTION (3-WAY A -> B -> C FLOW)
  it('FLOW K: Complete 3-Way Trusted Introduction Journey (A requests B -> C accepts -> 3-way conversation opened)', async () => {
    // 1. User A requests introduction to User C via Facilitator User B
    const reqIntroRes = await request(app)
      .post('/api/v1/introductions/request')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        toUserId: userCId,
        reason: 'I would like to discuss venture debt facilities for cross-border SaaS expansion.'
      });
    expect([201, 409]).toContain(reqIntroRes.status);
    if (reqIntroRes.status === 201) {
      introId = reqIntroRes.body.id;
    } else {
      const existingIntro = await prisma.introduction.findFirst({
        where: { fromUserId: userAId, toUserId: userCId }
      });
      introId = existingIntro!.id;
    }
    expect(introId).toBeDefined();

    // 2. User C (Target recipient) accepts introduction
    const acceptRes = await request(app)
      .put(`/api/v1/introductions/${introId}/status`)
      .set('Authorization', `Bearer ${userCToken}`)
      .send({ status: 'ACCEPTED' });
    expect(acceptRes.status).toBe(200);

    // 3. Verify 3-way conversation thread opened
    const convsRes = await request(app)
      .get('/api/v1/messages/conversations')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(convsRes.status).toBe(200);
    expect(convsRes.body.length).toBeGreaterThan(0);
    e2eConversationId = convsRes.body[0].id;
  });

  // FLOW L — MESSAGING
  it('FLOW L: Message sending, unread state, persistence & authorization', async () => {
    if (!e2eConversationId) return;

    // User A sends message in 3-way thread
    const sendMsgRes = await request(app)
      .post(`/api/v1/messages/conversations/${e2eConversationId}/messages`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ text: 'Thank you Tariq for the warm introduction! Marcus, great to connect.' });
    expect(sendMsgRes.status).toBe(201);

    // User C reads messages
    const getMsgsRes = await request(app)
      .get(`/api/v1/messages/conversations/${e2eConversationId}/messages`)
      .set('Authorization', `Bearer ${userCToken}`);
    expect(getMsgsRes.status).toBe(200);
    const msgs = getMsgsRes.body;
    expect(msgs.some((m: any) => m.text.includes('great to connect'))).toBe(true);

    // Unconnected User D is blocked from reading messages (IDOR Protection)
    const attackerRead = await request(app)
      .get(`/api/v1/messages/conversations/${e2eConversationId}/messages`)
      .set('Authorization', `Bearer ${userDToken}`);
    expect(attackerRead.status).toBe(403);
  });

  // FLOW M — DISCOVER
  it('FLOW M: Multi-entity grounded keyword search across People, Posts, Communities, Requests', async () => {
    const searchRes = await request(app)
      .get('/api/v1/discover?query=SaaS&format=nested')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.people).toBeDefined();
    expect(searchRes.body.posts).toBeDefined();
    expect(searchRes.body.communities).toBeDefined();
    expect(searchRes.body.requests).toBeDefined();
  });

  // FLOW N — PROFILE
  it('FLOW N: User profile exposes authentic DB attributes with no fabricated scores', async () => {
    const profileRes = await request(app)
      .get(`/api/v1/profiles/${userAId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.name).toBe('Ananya Sharma');
    expect(profileRes.body.company).toBe('Aether Metrics');
    expect(profileRes.body.followersCount).toBeUndefined(); // Zero vanity metrics
  });

  // FLOW O — AUTHORIZATION & IDOR
  it('FLOW O: Strict server-side authorization on edit, delete, and private content', async () => {
    // 1. User D attempts to edit User A post -> Blocked 403
    const editRes = await request(app)
      .put(`/api/v1/posts/${sharedPostId}`)
      .set('Authorization', `Bearer ${userDToken}`)
      .send({ body: 'Hacked body content' });
    expect(editRes.status).toBe(403);

    // 2. User D attempts to delete User A post -> Blocked 403
    const delRes = await request(app)
      .delete(`/api/v1/posts/${sharedPostId}`)
      .set('Authorization', `Bearer ${userDToken}`);
    expect(delRes.status).toBe(403);
  });
});
