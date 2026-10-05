import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';
import { storageService } from '../services/storageService';

const prisma = new PrismaClient();

describe('Founders Hut Production Readiness & Security Audit Test Suite', () => {
  let user1Token: string;
  let user1Id: string;
  let user1Email: string;

  let user2Token: string;
  let user2Id: string;
  let user2Email: string;

  let adminToken: string;
  let reportId: string;

  beforeAll(async () => {
    // Authenticate Admin User
    const resAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@foundershut.com', password: 'password123' });
    expect(resAdmin.status).toBe(200);
    adminToken = resAdmin.body.accessToken;

    // Register User 1
    user1Email = `prod_tester_1_${Date.now()}@testcohort.io`;
    const reg1 = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: user1Email, password: 'Password123!', name: 'Production User 1' });
    expect(reg1.status).toBe(201);
    user1Token = reg1.body.accessToken;
    user1Id = reg1.body.user.id;

    // Register User 2
    user2Email = `prod_tester_2_${Date.now()}@testcohort.io`;
    const reg2 = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: user2Email, password: 'Password123!', name: 'Production User 2' });
    expect(reg2.status).toBe(201);
    user2Token = reg2.body.accessToken;
    user2Id = reg2.body.user.id;
  });

  describe('1. Production Security Headers & Error Handling', () => {
    it('should include production security headers in HTTP responses', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['x-xss-protection']).toBe('1; mode=block');
      expect(res.headers['strict-transport-security']).toBeDefined();
    });

    it('should sanitize unhandled errors without exposing internal database errors or stack traces', async () => {
      const res = await request(app)
        .get('/api/v1/profiles/non-existent-uuid-123456789')
        .set('Authorization', `Bearer ${user1Token}`);
      
      expect(res.status).toBe(404);
      expect(res.body.stack).toBeUndefined();
      expect(res.body.error).not.toContain('PrismaClient');
    });
  });

  describe('2. Private Object Storage & Signed URLs Authorization', () => {
    it('should generate short-lived signed URLs for verification document access', async () => {
      const fileKey = `verifications/${user1Id}/inc_cert.pdf`;
      const signedUrl = await storageService.getSignedUrl(fileKey, 900);
      
      expect(signedUrl).toBeDefined();
      expect(signedUrl).toContain('signature=');
      expect(signedUrl).toContain('expires=');
    });

    it('should verify signed URL signatures and reject expired signatures', async () => {
      const fileKey = `verifications/${user1Id}/inc_cert.pdf`;
      const signedUrl = await storageService.getSignedUrl(fileKey, 900);
      
      const urlObj = new URL(`http://localhost${signedUrl}`);
      const expires = parseInt(urlObj.searchParams.get('expires') || '0', 10);
      const signature = urlObj.searchParams.get('signature') || '';

      const isValid = storageService.verifySignedUrl(fileKey, expires, signature);
      expect(isValid).toBe(true);

      const isInvalid = storageService.verifySignedUrl(fileKey, expires - 1000, signature);
      expect(isInvalid).toBe(false);
    });
  });

  describe('3. Account Safety & Block Member Enforcement', () => {
    it('User 1 blocks User 2 successfully', async () => {
      const res = await request(app)
        .post('/api/v1/blocks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ blockedId: user2Id });

      expect(res.status).toBe(201);
      expect(res.body.block.blockedId).toBe(user2Id);
    });

    it('Blocked User 2 cannot send direct messages to User 1', async () => {
      const res = await request(app)
        .post('/api/v1/messages/start')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ recipientId: user1Id, initialMessage: 'Hey let us talk' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('blocked');
    });

    it('Blocked User 2 cannot send introduction request to User 1', async () => {
      const res = await request(app)
        .post('/api/v1/introductions/request')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ toUserId: user1Id, reason: 'Business partnership' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('blocked');
    });

    it('Blocked User 2 cannot view User 1 profile by user ID', async () => {
      const res = await request(app)
        .get(`/api/v1/profiles/${user1Id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('blocked');
    });

    it('User 1 unblocks User 2 successfully', async () => {
      const res = await request(app)
        .delete(`/api/v1/blocks/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('unblocked');
    });
  });

  describe('4. Member Reporting & Moderation Audit Workflow', () => {
    it('User 2 submits a report against User 1', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          targetType: 'PROFILE',
          targetId: user1Id,
          reportedUserId: user1Id,
          reason: 'INAPPROPRIATE_CONTENT',
          details: 'Suspicious profile detail claims',
        });

      expect(res.status).toBe(201);
      expect(res.body.report).toBeDefined();
      reportId = res.body.report.id;
    });

    it('Admin reviews reports list and updates status with audit log', async () => {
      const listRes = await request(app)
        .get('/api/v1/reports/admin/list')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.reports.length).toBeGreaterThan(0);

      const statusRes = await request(app)
        .put(`/api/v1/reports/admin/${reportId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RESOLVED', adminNotes: 'Profile audited and verified clean.' });

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.report.status).toBe('RESOLVED');
    });
  });

  describe('5. Founding Cohort Feedback & Privacy Analytics', () => {
    it('Submits product feedback during founding cohort mode', async () => {
      const res = await request(app)
        .post('/api/v1/feedback')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          category: 'UX',
          content: 'The executive onboarding flow is remarkably smooth.',
        });

      expect(res.status).toBe(201);
      expect(res.body.feedback.id).toBeDefined();
    });

    it('Records privacy-conscious analytics event while redacting sensitive content', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/event')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          eventType: 'message_sent',
          metadata: {
            recipientId: user2Id,
            text: 'THIS PRIVATE TEXT MUST NOT BE STORED IN ANALYTICS',
            password: 'secretpassword',
          },
        });

      expect(res.status).toBe(201);
      
      const eventInDb = await prisma.analyticsEvent.findUnique({ where: { id: res.body.eventId } });
      expect(eventInDb).toBeDefined();
      expect(eventInDb?.metadata).not.toContain('THIS PRIVATE TEXT MUST NOT BE STORED IN ANALYTICS');
      expect(eventInDb?.metadata).not.toContain('secretpassword');
    });
  });
});
