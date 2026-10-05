# Founders Hut MVP — Production Deployment Manual

This guide documents production deployment protocols, database migration procedures, environment variable configurations, observability probes, rollback mechanisms, and the **Real Account Step-by-Step Verification Protocol** for **Founders Hut**.

---

## 1. Environment Configuration

Copy `.env.production.example` to `.env.production` on your server:

```bash
cp .env.production.example .env.production
```

### Required Environment Variables

| Variable | Description | Security Requirement |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode (`production`) | Must be `production` |
| `PORT` | Node.js backend port (default: `5001`) | Internal service port |
| `CORS_ORIGIN` | Allowed web domain | e.g. `https://app.foundershut.com` |
| `DATABASE_URL` | PostgreSQL connection URL | Must use SSL (`sslmode=require`) |
| `JWT_SECRET` | Access token signing secret | **Mandatory**: 256-bit random string |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | **Mandatory**: 256-bit random string |
| `STORAGE_SIGNING_SECRET` | Pre-signed document access key | **Mandatory**: 256-bit random string |

---

## 2. PostgreSQL Database Migration Protocol

Founders Hut uses migration-based schema changes in production. **Never** run `prisma db push` in production environments.

### Deployment Step

```bash
# 1. Apply database migrations to production PostgreSQL
npx prisma migrate deploy

# 2. Verify migration status
npx prisma migrate status
```

---

## 3. Containerized Production Deployment (Docker Compose)

Launch the complete stack (Application, PostgreSQL, Redis) via Docker:

```bash
# Build and launch production containers
docker-compose up -d --build

# Inspect container status
docker-compose ps
```

---

## 4. Observability & Health Probes

Founders Hut exposes two dedicated observability probes for Kubernetes / Load Balancers:

- **Liveness Probe (`GET /health`)**:
  - URL: `http://localhost:5001/health`
  - Returns HTTP 200 `{ status: "ok", timestamp: "..." }`
- **Readiness Probe (`GET /ready`)**:
  - URL: `http://localhost:5001/ready`
  - Executes database ping (`SELECT 1`). Returns HTTP 200 `{ status: "ready", database: "connected" }` if ready, or HTTP 503 if disconnected.

---

## 5. Rollback Procedure

If a deployment fails:

1. **Revert Application Binary**:
   ```bash
   docker-compose down
   git checkout tags/v1.0.0-stable
   docker-compose up -d --build
   ```
2. **Revert Database Migration (if required)**:
   ```bash
   npx prisma migrate resolve --rolled-back "20260916_migration_name"
   ```

---

## 6. Real Account Manual Test Flow (Step-by-Step Protocol)

Execute this exact manual test flow to verify real account lifecycle without mock shortcuts:

```
[1. REGISTER]
    │  POST /api/v1/auth/register
    │  Email: founder.test@company.com
    │  Password: Password123!
    ▼
[2. EMAIL VERIFICATION]
    │  System receives verification token link
    │  Account onboarding step moves to 2
    ▼
[3. LOGIN]
    │  POST /api/v1/auth/login
    │  Returns HTTP 200 with JWT Access Token + Refresh Token
    ▼
[4. COMPLETE PROFILE]
    │  PUT /api/v1/profiles/me
    │  Define Role (Founder), Company, Stage (Series A), Industry, Location, Years Building
    ▼
[5. SUBMIT VERIFICATION]
    │  POST /api/v1/verifications/submit
    │  Document Ref: s3_incorporation_proof_2026.pdf
    │  Status moves to PENDING
    ▼
[6. ADMIN REVIEW]
    │  POST /api/v1/admin/verifications/:userId/review
    │  Action: APPROVE, Level: VERIFIED_FOUNDER
    │  Onboarding step moves to 7 (Completed)
    ▼
[7. ENTER NETWORK & DISCOVER]
    │  GET /api/v1/discover?query=Dubai
    │  Returns verified member profile with Grounded Match Reasons ("Based in Dubai")
    ▼
[8. CREATE REQUEST]
    │  POST /api/v1/requests
    │  Title: "Seeking UAE Expansion Partner"
    │  Visibility: PUBLIC_TO_VERIFIED_NETWORK
    ▼
[9. REQUEST INTRODUCTION]
    │  POST /api/v1/introductions/request
    │  Recipient: target_user_id, Reason: "UAE Expansion Advice"
    │  Status: REQUESTED
    ▼
[10. RECIPIENT ACCEPTS INTRO]
    │  PUT /api/v1/introductions/:id/status
    │  Status: ACCEPTED
    │  Connection established + Conversation thread unlocked
    ▼
[11. REALTIME / REST MESSAGING]
    │  POST /api/v1/messages/conversations/:id/messages
    │  Send 1-to-1 direct message with peer
```
