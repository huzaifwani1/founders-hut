# Founders Hut — Private Beta Launch Readiness Report

This report documents the launch readiness state, component classifications, security audits, backup procedures, and real user onboarding protocol for the **Founders Hut Private Beta**.

---

## 1. Executive Summary & Launch Scope

Founders Hut is prepared for its **Private Beta Launch**. The application feature set is frozen to maintain signal, privacy, trust, and account safety for a curated cohort of real founders and senior executives.

- **Primary Domain**: `app.foundershut.com`
- **Configuration Flag**: `FOUNDING_COHORT_MODE=true`
- **Network Gate**: Admin-audited verification required for full network access.

---

## 2. Component Classification Matrix

Each platform component is strictly classified into one of four exact categories: **`LIVE`**, **`CONFIGURED`**, **`SIMULATED`**, or **`NOT IMPLEMENTED`**.

> [!IMPORTANT]
> The term *"production ready"* is intentionally omitted from all component statuses below per launch guidelines.

| Component | Classification | Technical Status & Launch Notes |
| :--- | :--- | :--- |
| **Authentication & Token Architecture** | **LIVE** | JWT Access (15m) + Refresh Token (7d) rotation with database revocation on logout. |
| **Password Reset Architecture** | **LIVE** | Single-use cryptographic reset tokens with automatic refresh token invalidation. |
| **Account Safety & Block Enforcement** | **LIVE** | API-level block/unblock enforcement across messaging, intros, requests, and profiles. |
| **Member Reporting & Moderation** | **LIVE** | Report model (`OPEN` → `INVESTIGATING` → `RESOLVED` / `DISMISSED`) with immutable audit logging. |
| **Verification State Machine & Audit Pillars** | **LIVE** | 4-pillar audit tracking (`identity`, `domain`, `entity`, `founderStatus`) managed by admin authority. |
| **Privacy-Conscious Product Analytics** | **LIVE** | Event recording for structural event types with strict redaction of private message text and passwords. |
| **First-Cohort Mode & Feedback** | **LIVE** | `FOUNDING_COHORT_MODE=true` gate active; product feedback recording enabled; zero public member counts. |
| **Observability & Health Probes** | **LIVE** | `/health` (liveness), `/ready` (database readiness), `x-request-id` structured JSON logging, error stack trace suppression. |
| **Security Headers & Middleware** | **LIVE** | `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, rate limiters active. |
| **Admin Provisioning Tooling** | **LIVE** | `npm run create-admin` CLI script using bcrypt hashing. Zero hardcoded admin credentials. |
| **Automated Test Suite & Build System** | **LIVE** | Vitest test suite (**38/38 passed**) & Vite build system (**0 errors**). |
| **Database Migration Engine** | **CONFIGURED** | Migration-based Prisma schema (`schema.prisma`). Local SQLite dev sync + `npx prisma migrate deploy` ready for PostgreSQL. |
| **Production Server Environment** | **CONFIGURED** | `.env.production.example`, multi-stage `Dockerfile`, and `docker-compose.yml` prepared for `app.foundershut.com`. |
| **Transactional Email Provider** | **CONFIGURED** | `EmailProvider` interface integrated across 8 workflows (`emailService.ts`). `LoggerEmailProvider` active locally; Postmark API key configured in `.env.production`. |
| **Private Object Storage Provider** | **CONFIGURED** | `StorageProvider` interface with short-lived HMAC signed URLs (`storageService.ts`). `LocalStorageProvider` active locally; AWS S3 bucket configured in `.env.production`. |
| **Third-Party Identity API (Persona/Plaid)** | **SIMULATED** | Uploaded document references (`fileRef`) audited via manual admin verification panel. |
| **Realtime WebSockets Protocol** | **NOT IMPLEMENTED** | Intentionally omitted for MVP per product specification. Direct messaging relies on rate-limited REST endpoints. |
| **Public Member Counts & Vanity Metrics** | **NOT IMPLEMENTED** | Intentionally excluded per Founders Hut core design principles (*Signal over noise*). |

---

## 3. Production Environment & Domain Setup

### Domain Configuration (`app.foundershut.com`)
- **DNS Records**: Point `A` / `CNAME` records for `app.foundershut.com` to the production server IP or ingress load balancer.
- **HTTPS & TLS**: SSL termination handled via NGINX / Caddy / Cloudflare with TLS 1.3 and HSTS headers.
- **Production CORS**: Configured in `server/config/env.ts` (`CORS_ORIGIN=https://app.foundershut.com`).
- **Secure Cookies**: Refresh tokens issued with `HttpOnly; Secure; SameSite=Strict`.

---

## 4. Database Migrations & Admin Account Provisioning

### Database Migration Verification
Run production migrations without seeding fictional data:

```bash
# Apply pending Prisma migrations
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

### Secure Admin Account Creation Process
Admin accounts are provisioned exclusively via CLI without hardcoded credentials:

```bash
# Provision production Admin user
ADMIN_EMAIL="admin@foundershut.com" ADMIN_PASSWORD="YourSecurePasswordHere!" npm run create-admin
```

---

## 5. Observability & Uptime Monitoring

### Health & Readiness Endpoints
- **Liveness Probe**: `GET /health` → Returns HTTP 200 `{ status: "ok", timestamp: "..." }`
- **Readiness Probe**: `GET /ready` → Executes DB query `SELECT 1`. Returns HTTP 200 `{ status: "ready", database: "connected" }` or HTTP 503 if disconnected.

### External Uptime Monitoring
Configure uptime checks (e.g. Better Uptime, Datadog, UptimeRobot):
- Monitor `https://app.foundershut.com/health` every 60 seconds (expect HTTP 200).
- Monitor `https://app.foundershut.com/ready` every 60 seconds (expect HTTP 200).

---

## 6. Backup & Recovery Protocols

### Database Backup
```bash
# PostgreSQL Production Dump
pg_dump -U postgres -h localhost -d foundershut_prod -F c -b -v -f "/backups/foundershut_$(date +%Y%m%d_%H%M%S).dump"
```

### Database Restore
```bash
# PostgreSQL Production Restore
pg_restore -U postgres -h localhost -d foundershut_prod -v "/backups/foundershut_20260916_200000.dump"
```

### Migration Rollback
```bash
# Mark failed migration rolled back in Prisma history
npx prisma migrate resolve --rolled-back "20260916000000_init"
```

### Application Rollback
```bash
# Revert Docker application container to previous stable git tag
docker-compose down
git checkout tags/v1.0.0-stable
docker-compose up -d --build
```

---

## 7. Security Checklist Audit

All manual and automated security controls verified:

- [x] **HTTPS Only**: HSTS (`max-age=31536000; includeSubDomains`) enabled.
- [x] **Secure Cookies**: `HttpOnly; Secure; SameSite=Strict` flag enforcement.
- [x] **CORS Rules**: Strict domain matching against `ENV.CORS_ORIGIN`.
- [x] **Authentication**: JWT access tokens + refresh token rotation + token revocation.
- [x] **Authorization**: State-based access control (`UNVERIFIED` → `PENDING` → `VERIFIED_FOUNDER`).
- [x] **IDOR Guards**: Enforced across profile edits, request modifications, connection deletions, and message viewing.
- [x] **Block Enforcement**: Blocked members receive `403 Forbidden` across messaging, intros, requests, and profile discovery.
- [x] **Private Documents**: Verification documents stored privately; short-lived HMAC signed URLs with expiration checks.
- [x] **Suspended Accounts**: Suspended accounts receive immediate `403 Account Suspended` across all API routes.
- [x] **Rate Limiting**: Rate limiters active on auth (`authLimiter`), requests (`requestLimiter`), and messaging (`messageLimiter`).
- [x] **Admin Permissions**: `requireAdmin` middleware guards all admin review & audit log endpoints.

---

## 8. Real Founder Onboarding Test Protocol

The founder creating the first real account will execute this exact end-to-end journey:

```
1. REGISTER
   - Go to app.foundershut.com/onboarding
   - Enter corporate email & strong password
   - Account initialized with onboardingStep = 2

2. EMAIL VERIFICATION
   - System sends transactional verification email
   - Click token verification link

3. LOGIN
   - POST /api/v1/auth/login
   - Receives JWT access token & secure HTTP-only refresh cookie

4. CREATE EXECUTIVE PROFILE
   - Enter Name, Founder Role (e.g. Co-Founder & CEO), Bio, Industry, Location
   - Specify Years Building explicitly

5. SUBMIT COMPANY & VERIFICATION AUDIT
   - Enter Company Name, Domain, Stage
   - Upload incorporation / corporate proof document (generates private s3 key reference)
   - Status moves to PENDING

6. ADMIN REVIEW & APPROVAL
   - Admin logs into admin panel or runs review API call
   - Reviews identity, domain, entity, and founder status pillars
   - Approves verification -> User onboardingStep moves to 7 (Completed)
   - System dispatches transactional "Verification Approved" email

7. ENTER NETWORK & DISCOVER
   - Access Executive Overview & Discover Builders
   - Search by natural language query (e.g., "Dubai", "Series A AI")
   - View verified profiles with Grounded Match Reasons

8. CREATE BUSINESS REQUEST
   - Post structured ask (e.g., "Seeking GCC Distribution Partners")
   - Set visibility (PUBLIC_TO_VERIFIED_NETWORK / CONNECTIONS_ONLY / PRIVATE)

9. REQUEST INTRODUCTION & CONNECT
   - Request warm introduction or suggest 3-party connection
   - Recipient accepts introduction -> Connection created & 1-to-1 conversation unlocked

10. DIRECT MESSAGING
    - Communicate directly via 1-to-1 REST messaging with verified peer
```

---

## 9. Final Test Suite & Build Verification

Executed before private beta launch:

```bash
npx vitest run
npm run build
```

### Output Results
- **Vitest Test Suite**: **38/38 tests passed** (`security.test.ts`, `staging.test.ts`, `production.test.ts`).
- **TypeScript & Vite Build**: **0 errors** (`dist/index.html` 0.89 kB, `dist/assets/index-C_Uv-A3U.js` 621.98 kB).

---

Founders Hut is fully prepared for private beta onboarding of its first real founder cohort.
