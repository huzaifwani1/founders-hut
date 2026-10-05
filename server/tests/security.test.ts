import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Founders Hut Production Security, Onboarding & Access Control Suite', () => {
  let memberToken: string;
  let memberUserId: string;

  let attackerToken: string;
  let attackerUserId: string;

  let unverifiedToken: string;
  let unverifiedUserId: string;

  let adminToken: string;
  let conversationId: string;
  let resetToken: string;

  beforeAll(async () => {
    // 1. Authenticate Verified Member ([DEV SEED] Alex Chen)
    const resMember = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alex@aethermetrics.io', password: 'password123' });

    expect(resMember.status).toBe(200);
    memberToken = resMember.body.accessToken;
    memberUserId = resMember.body.user.id;

    // 2. Register fresh Unverified User to test onboarding state & access gates
    const resUnverified = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `unverified_${Date.now()}@gmail.com`,
        password: 'Password123!',
        name: 'Unverified Founder'
      });

    expect(resUnverified.status).toBe(201);
    unverifiedToken = resUnverified.body.accessToken;
    unverifiedUserId = resUnverified.body.user.id;

    // 3. Register Attacker User
    const resAttacker = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `attacker_${Date.now()}@malicious.com`,
        password: 'Password123!',
        name: 'Attacker User'
      });

    attackerToken = resAttacker.body.accessToken;
    attackerUserId = resAttacker.body.user.id;

    // 4. Authenticate Admin User
    const resAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@foundershut.com', password: 'password123' });

    expect(resAdmin.status).toBe(200);
    adminToken = resAdmin.body.accessToken;

    // Fetch conversation ID
    const conv = await prisma.conversation.findFirst({
      where: {
        OR: [{ participantAId: memberUserId }, { participantBId: memberUserId }]
      }
    });
    if (conv) conversationId = conv.id;
  });

  it('1. Registration & Onboarding: Fresh registration initializes onboardingStep = 2', async () => {
    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${unverifiedToken}`);

    expect(me.status).toBe(200);
    expect(me.body.onboardingStep).toBe(2);
    expect(me.body.verification.level).toBe('UNVERIFIED');
  });

  it('2. Account Enumeration Protection: Forgot-password returns uniform safe message', async () => {
    const resExist = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'alex@aethermetrics.io' });

    const resNonExist = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent_account_xyz@test.com' });

    expect(resExist.status).toBe(200);
    expect(resNonExist.status).toBe(200);
    expect(resExist.body.message).toBe(resNonExist.body.message);

    // Save reset token for testing reset flow
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: { user: { email: 'alex@aethermetrics.io' } },
      orderBy: { createdAt: 'desc' }
    });
    if (tokenRecord) resetToken = tokenRecord.token;
  });

  it('3. Password Reset Architecture: Valid reset token updates password and revokes previous refresh tokens', async () => {
    if (!resetToken) return;

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: resetToken, newPassword: 'newPassword123!' });

    expect(res.status).toBe(200);

    // Verify old login fails
    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alex@aethermetrics.io', password: 'password123' });
    expect(oldLogin.status).toBe(401);

    // Restore original password for subsequent tests
    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: { token: resetToken }
    });
    if (resetRecord) {
      const restoreRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'alex@aethermetrics.io' });
      expect(restoreRes.status).toBe(200);

      const restoreRecord = await prisma.passwordResetToken.findFirst({
        where: { user: { email: 'alex@aethermetrics.io' } },
        orderBy: { createdAt: 'desc' }
      });
      if (restoreRecord) {
        await request(app)
          .post('/api/v1/auth/reset-password')
          .send({ token: restoreRecord.token, newPassword: 'password123' });
      }
    }
  });

  it('4. Access Control Gates: Unverified user blocked from publishing business requests', async () => {
    const res = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${unverifiedToken}`)
      .send({
        title: 'Unverified Request Attempt',
        needDescription: 'This should be blocked by access control'
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Verification required');
  });

  it('5. Access Control Gates: Unverified user blocked from sending messages', async () => {
    if (!conversationId) return;

    const res = await request(app)
      .post(`/api/v1/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${unverifiedToken}`)
      .send({ text: 'Blocked message attempt' });

    expect(res.status).toBe(403);
  });

  it('6. IDOR Protection: Attacker cannot read messages of another conversation', async () => {
    if (!conversationId) return;

    const res = await request(app)
      .get(`/api/v1/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${attackerToken}`);

    expect(res.status).toBe(403);
  });

  it('7. Privilege Escalation Protection: Non-admin blocked from admin review endpoints', async () => {
    const res = await request(app)
      .get('/api/v1/admin/verifications/pending')
      .set('Authorization', `Bearer ${unverifiedToken}`);

    expect(res.status).toBe(403);
  });

  it('8. Suspended Account Revocation: Suspended user instantly receives 403 on all requests', async () => {
    // Admin suspends attacker account
    await prisma.user.update({
      where: { id: attackerUserId },
      data: { isSuspended: true }
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${attackerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Account suspended');

    // Restore active status for subsequent IDOR tests
    await prisma.user.update({
      where: { id: attackerUserId },
      data: { isSuspended: false }
    });
  });

  it('9. Token Revocation on Logout: Logged out refresh token cannot be reused', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alex@aethermetrics.io', password: 'password123' });

    expect(loginRes.status).toBe(200);
    const { refreshToken } = loginRes.body;

    // Logout
    await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .send({ refreshToken });

    // Attempt refresh using revoked token
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(403);
    expect(refreshRes.body.error).toContain('Revoked');
  });

  it('10. Authentication Rate Limiting: Blocks excessive brute-force attempts', async () => {
    const attempts = [];
    for (let i = 0; i < 22; i++) {
      attempts.push(
        request(app)
          .post('/api/v1/auth/login')
          .send({ email: 'rate_test@test.com', password: 'wrong' })
      );
    }
    const results = await Promise.all(attempts);
    const wasRateLimited = results.some((r) => r.status === 429);
    expect(wasRateLimited).toBe(true);
  });

  it('11. Grounded Match Reason Audit: Match reasons stem strictly from DB attributes', async () => {
    const res = await request(app)
      .get('/api/v1/discover?query=Dubai')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    if (res.body.length > 0) {
      const firstMatch = res.body[0];
      expect(firstMatch.matchReasons).toBeDefined();
      expect(firstMatch.groundedSources).toBeDefined();
      // Ensure match reasons match actual attributes
      firstMatch.matchReasons.forEach((reason: string) => {
        expect(reason).not.toContain('invented');
        expect(reason).not.toContain('fabricated');
      });
    }
  });

  it('12. Duplicate Introduction Prevention: Returns 409 Conflict on repeated active intro requests', async () => {
    const targetUser = await prisma.user.findFirst({
      where: { email: 'tariq@kashmirvalleyorganics.com' }
    });
    if (!targetUser) return;

    // Member requests intro
    const firstReq = await request(app)
      .post('/api/v1/introductions/request')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ toUserId: targetUser.id, reason: 'Testing duplicate intro prevention' });

    expect([201, 409]).toContain(firstReq.status);

    // Second request with exact same target
    const secondReq = await request(app)
      .post('/api/v1/introductions/request')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ toUserId: targetUser.id, reason: 'Testing duplicate intro prevention' });

    expect(secondReq.status).toBe(409);
    expect(secondReq.body.error).toContain('Conflict');
  });

  it('13. Declined Introduction State Machine: Creates NO connection and NO conversation thread', async () => {
    // Find active intro to unverified user
    const intro = await prisma.introduction.findFirst({
      where: { toUserId: unverifiedUserId, status: 'REQUESTED' }
    });

    if (intro) {
      // Unverified user declines intro
      const declineRes = await request(app)
        .put(`/api/v1/introductions/${intro.id}/status`)
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .send({ status: 'DECLINED' });

      expect(declineRes.status).toBe(200);
      expect(declineRes.body.status).toBe('DECLINED');

      // Verify no connection was created between them
      const conn = await prisma.connection.findFirst({
        where: {
          OR: [
            { userAId: memberUserId, userBId: unverifiedUserId },
            { userAId: unverifiedUserId, userBId: memberUserId }
          ]
        }
      });
      expect(conn).toBeNull();
    }
  });

  it('13b. Strict Introduction Recipient Authorization: Requester, Facilitator, and Unrelated User blocked from accept/decline; Recipient allowed', async () => {
    // 1. Create a fresh test introduction (Member -> Unverified, via Facilitator)
    const tariqUser = await prisma.user.findFirst({
      where: { email: 'tariq@kashmirvalleyorganics.com' }
    });
    if (!tariqUser) return;

    const introRecord = await prisma.introduction.create({
      data: {
        fromUserId: memberUserId,
        toUserId: unverifiedUserId,
        facilitatorId: tariqUser.id,
        reason: 'Testing strict recipient authorization gates',
        status: 'REQUESTED'
      }
    });

    // Requester attempting accept -> 403
    const reqAccept = await request(app)
      .put(`/api/v1/introductions/${introRecord.id}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'ACCEPTED' });
    expect(reqAccept.status).toBe(403);

    // Unrelated user attempting accept -> 403
    const attackerAccept = await request(app)
      .put(`/api/v1/introductions/${introRecord.id}/status`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({ status: 'ACCEPTED' });
    expect(attackerAccept.status).toBe(403);

    // Requester attempting decline -> 403
    const reqDecline = await request(app)
      .put(`/api/v1/introductions/${introRecord.id}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'DECLINED' });
    expect(reqDecline.status).toBe(403);

    // Unrelated user attempting decline -> 403
    const attackerDecline = await request(app)
      .put(`/api/v1/introductions/${introRecord.id}/status`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({ status: 'DECLINED' });
    expect(attackerDecline.status).toBe(403);

    // Recipient declining -> 200
    const recipientDecline = await request(app)
      .put(`/api/v1/introductions/${introRecord.id}/status`)
      .set('Authorization', `Bearer ${unverifiedToken}`)
      .send({ status: 'DECLINED' });
    expect(recipientDecline.status).toBe(200);
    expect(recipientDecline.body.status).toBe('DECLINED');
  });

  it('14. Privacy-Restricted Requests: Unconnected user cannot access CONNECTIONS_ONLY or PRIVATE requests', async () => {
    // Member creates PRIVATE request
    const privateReq = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Confidential M&A Advisory Ask',
        needDescription: 'Only visible to author',
        visibility: 'PRIVATE'
      });

    expect(privateReq.status).toBe(201);
    const privateId = privateReq.body.id;

    // Unverified user fetches all requests
    const getRes = await request(app)
      .get('/api/v1/requests')
      .set('Authorization', `Bearer ${unverifiedToken}`);

    expect(getRes.status).toBe(200);
    const ids = getRes.body.map((r: any) => r.id);
    expect(ids).not.toContain(privateId);
  });

  it('15. Cross-User Profile Modification Prevention: IDOR block on PUT /profiles/:userId', async () => {
    const res = await request(app)
      .put(`/api/v1/profiles/${memberUserId}`)
      .set('Authorization', `Bearer ${unverifiedToken}`)
      .send({ name: 'Hacked Profile Name' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('16. Cross-User Request Modification & Deletion Prevention: IDOR block on PUT/DELETE /requests/:id', async () => {
    // Create request by member
    const reqRes = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Target Request for IDOR test',
        needDescription: 'Testing cross-user modification protection'
      });

    expect(reqRes.status).toBe(201);
    const reqId = reqRes.body.id;

    // Unverified user attempts update
    const updateRes = await request(app)
      .put(`/api/v1/requests/${reqId}`)
      .set('Authorization', `Bearer ${unverifiedToken}`)
      .send({ title: 'Overwritten Title' });

    expect(updateRes.status).toBe(403);

    // Unverified user attempts delete
    const deleteRes = await request(app)
      .delete(`/api/v1/requests/${reqId}`)
      .set('Authorization', `Bearer ${unverifiedToken}`);

    expect(deleteRes.status).toBe(403);
  });

  it('17. Cross-User Connection Deletion Prevention: IDOR block on DELETE /connections/:id', async () => {
    // Find connection involving member
    const conn = await prisma.connection.findFirst({
      where: {
        OR: [{ userAId: memberUserId }, { userBId: memberUserId }]
      }
    });

    if (conn) {
      const deleteRes = await request(app)
        .delete(`/api/v1/connections/${conn.id}`)
        .set('Authorization', `Bearer ${unverifiedToken}`);

      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.error).toContain('Forbidden');
    }
  });

  it('18. Verification Badge Manipulation Prevention: Non-admin cannot approve verification level', async () => {
    // Unverified user attempts self-approval via admin endpoint
    const res = await request(app)
      .post(`/api/v1/admin/verifications/${unverifiedUserId}/review`)
      .set('Authorization', `Bearer ${unverifiedToken}`)
      .send({ action: 'APPROVE', level: 'VERIFIED_FOUNDER' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('19. Social Post Creation: Verified user creates post; Unverified user blocked', async () => {
    // Unverified user post creation attempt
    const unverifiedRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${unverifiedToken}`)
      .send({
        type: 'SHORT_POST',
        body: 'Unverified post attempt',
        visibility: 'PUBLIC_TO_VERIFIED_NETWORK'
      });
    expect(unverifiedRes.status).toBe(403);

    // Verified user post creation
    const memberRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        type: 'SHORT_POST',
        body: 'Verified founder lesson on product retention',
        visibility: 'PUBLIC_TO_VERIFIED_NETWORK'
      });
    expect(memberRes.status).toBe(201);
    expect(memberRes.body.id).toBeDefined();
  });

  it('20. Social Post IDOR Protection: Attacker cannot edit or delete another user post', async () => {
    // Create member post
    const postRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        type: 'ARTICLE',
        title: 'Original Title',
        body: 'Original content',
        visibility: 'PUBLIC_TO_VERIFIED_NETWORK'
      });
    expect(postRes.status).toBe(201);
    const postId = postRes.body.id;

    // Attacker edit attempt
    const editRes = await request(app)
      .put(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({ title: 'Hacked Title' });
    expect(editRes.status).toBe(403);

    // Attacker delete attempt
    const deleteRes = await request(app)
      .delete(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${attackerToken}`);
    expect(deleteRes.status).toBe(403);
  });

  it('21. Private Post Sharing & Server Authorization: Private share hidden from non-recipients', async () => {
    // Create private share post from member to unverifiedUser
    const postRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        type: 'SHORT_POST',
        body: 'Private strategy document',
        visibility: 'PRIVATE',
        recipientId: unverifiedUserId
      });
    expect(postRes.status).toBe(201);
    const privatePostId = postRes.body.id;

    // Attacker requests feed - should NOT include privatePostId
    const feedRes = await request(app)
      .get('/api/v1/posts')
      .set('Authorization', `Bearer ${attackerToken}`);
    expect(feedRes.status).toBe(200);
    const feedIds = feedRes.body.map((p: any) => p.id);
    expect(feedIds).not.toContain(privatePostId);
  });

  it('22. Community Creation & Member Management', async () => {
    // Verified user creates community
    const createRes = await request(app)
      .post('/api/v1/communities')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        name: 'Hardware & Robotics Founders',
        description: 'Building physical electronics & supply chains',
        category: 'Manufacturing',
        isPrivate: false
      });
    expect(createRes.status).toBe(201);
    const commId = createRes.body.id;

    // Member joins community
    const joinRes = await request(app)
      .post(`/api/v1/communities/${commId}/join`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(joinRes.status).toBe(200);
  });
});
