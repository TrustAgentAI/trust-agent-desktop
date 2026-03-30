# CREDENTIAL STATUS REPORT
# Trust Agent Desktop - Steps 1-5
# Generated: 2026-03-30

---

## STEP 1 - ENVIRONMENT READ

| Category | Variable | Status |
|----------|----------|--------|
| DATABASE | DATABASE_URL | LIVE (Neon Postgres, eu-west-2) |
| DATABASE | DATABASE_URL_UNPOOLED | LIVE (Neon direct) |
| AUTH | JWT_SECRET | PLACEHOLDER - needs production value |
| APP | NODE_ENV | development |
| APP | APP_URL | http://localhost:1420 |
| APP | API_URL | http://localhost:4000 |
| VITE | VITE_API_URL | http://localhost:4000 |
| REDIS | REDIS_URL | redis://localhost:6379 (local only) |

**Build system:** Vite + TypeScript (not Next.js). Frontend uses `VITE_` prefix for env vars, not `NEXT_PUBLIC_`.

---

## STEP 2 - STRIPE

### 2A - Key Check

| Variable | Status |
|----------|--------|
| STRIPE_SECRET_KEY | PLACEHOLDER (`REPLACE_WITH_REAL_STRIPE_SECRET_KEY`) |
| STRIPE_PUBLISHABLE_KEY | PLACEHOLDER (`REPLACE_WITH_REAL_STRIPE_PUBLISHABLE_KEY`) |
| STRIPE_WEBHOOK_SECRET | PLACEHOLDER (`REPLACE_WITH_REAL_STRIPE_WEBHOOK_SECRET`) |

### 2B - Connection Test: SKIPPED (keys are placeholders)

### 2C - Product/Price Creation: SKIPPED (keys are placeholders)

Plans to create when Stripe keys are live:

| Plan | Price (GBP) | Max Roles |
|------|-------------|-----------|
| Starter | 9.99/mo | 1 |
| Essential | 19.99/mo | 5 |
| Family | 24.99/mo | 5 |
| Professional | 39.99/mo | 10 |

Prisma model `PricingTier` exists with `stripePriceId` and `stripeTestPriceId` fields - ready for wiring.

### 2D - Webhook Verification: SKIPPED (keys are placeholders)

Server-side webhook handler EXISTS at `server/src/index.ts` (Express raw body route at `/webhooks/stripe`).
Payments tRPC router at `server/src/routers/payments.ts` has full Stripe checkout + webhook logic.

### ACTION_REQUIRED - STRIPE

```
1. Create Stripe account at https://dashboard.stripe.com
2. Get API keys from https://dashboard.stripe.com/apikeys
3. Set in .env and Render:
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
4. Create webhook at https://dashboard.stripe.com/webhooks
   - URL: https://app.trust-agent.ai/webhooks/stripe
   - Events: checkout.session.completed, customer.subscription.updated,
     customer.subscription.deleted, invoice.payment_failed, invoice.payment_succeeded
5. Set STRIPE_WEBHOOK_SECRET=whsec_... from webhook creation
6. Re-run Step 2C to create products/prices in Stripe and sync to DB
```

---

## STEP 3 - SMTP (Resend)

### 3A - Key Check

| Variable | Value | Status |
|----------|-------|--------|
| SMTP_HOST | smtp.resend.com | CONFIGURED |
| SMTP_USER | resend | CONFIGURED |
| SMTP_PASS | REPLACE_WITH_REAL_RESEND_API_KEY | PLACEHOLDER |
| SMTP_PORT | 587 | CONFIGURED |

SMTP config structure is correct (Resend SMTP relay), but the API key is a placeholder.

### 3B - Test Email: SKIPPED (SMTP_PASS is placeholder)

`nodemailer` is installed (v8.0.4) and the server uses it. Ready to send once key is real.

### ACTION_REQUIRED - SMTP

```
1. Create Resend account at https://resend.com
2. Verify domain trust-agent.ai at https://resend.com/domains
3. Create API key at https://resend.com/api-keys
4. Set in .env and Render:
   SMTP_PASS=re_...  (your Resend API key)
5. Re-run Step 3B to send test email
```

---

## STEP 4 - VAPID (Push Notifications)

### 4A - VAPID Key Verification

| Variable | Status |
|----------|--------|
| VAPID_PUBLIC_KEY | LIVE (87 chars, valid Base64 URL) |
| VAPID_PRIVATE_KEY | LIVE (valid, tested with web-push) |

Tested: `webpush.setVapidDetails('mailto:info@trust-agent.ai', pub, priv)` - PASSED

Server uses VAPID in:
- `server/src/queues/intelligent-notification-scheduler.ts`
- `server/src/queues/micro-moment-scheduler.ts`

### 4B - Frontend VAPID Exposure

Frontend reads `import.meta.env.VITE_VAPID_PUBLIC_KEY` (in `src/pages/SettingsNotificationsPage.tsx`).

**FIX APPLIED:** Added `VITE_VAPID_PUBLIC_KEY` to `.env` mirroring `VAPID_PUBLIC_KEY`.

| Variable | Status |
|----------|--------|
| VITE_VAPID_PUBLIC_KEY | ADDED to .env (mirrors VAPID_PUBLIC_KEY) |

STEP 4: PASS - VAPID is fully wired.

---

## STEP 5 - GOOGLE OAUTH

### 5A - Credential Check

| Variable | Status |
|----------|--------|
| GOOGLE_CLIENT_ID | PLACEHOLDER (`REPLACE_WITH_REAL_GOOGLE_CLIENT_ID`) |
| GOOGLE_CLIENT_SECRET | PLACEHOLDER (`REPLACE_WITH_REAL_GOOGLE_CLIENT_SECRET`) |
| VITE_GOOGLE_CLIENT_ID | ADDED to .env (placeholder, mirrors GOOGLE_CLIENT_ID) |

### 5B - NextAuth/GSI Configuration

This project does NOT use NextAuth. It uses Google Identity Services (GSI) directly:
- Frontend: `src/pages/LoginPage.tsx` loads `accounts.google.com/gsi/client` and uses `initCodeClient` popup flow
- Frontend calls `handleGoogleCallback(code)` which POSTs to `${API_URL}/api/v1/auth/google/callback`

**WARNING:** The server-side Google callback route (`/api/v1/auth/google/callback`) does NOT exist yet.
No file in `server/src/routers/auth.ts` or `server/src/index.ts` handles this endpoint.
This must be created before Google OAuth will work end-to-end.

**FIX APPLIED:** Added `VITE_GOOGLE_CLIENT_ID` to `.env` so the frontend can read the client ID.

### ACTION_REQUIRED - GOOGLE OAUTH

```
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorised redirect URIs:
   - https://app.trust-agent.ai/api/v1/auth/google/callback
   - http://localhost:4000/api/v1/auth/google/callback
4. Set in .env and Render:
   GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-...
   VITE_GOOGLE_CLIENT_ID=<same-client-id>.apps.googleusercontent.com
5. IMPORTANT: Server-side route /api/v1/auth/google/callback must be
   implemented in server/src/index.ts or server/src/routers/auth.ts
   to exchange the auth code for tokens and create/login the user.
```

---

## SUMMARY

| Step | Service | Status | Blocking? |
|------|---------|--------|-----------|
| 1 | Environment | READ | No |
| 2 | Stripe | PLACEHOLDER - needs real keys | Yes for payments |
| 3 | SMTP/Resend | PLACEHOLDER - needs API key | Yes for email |
| 4 | VAPID | PASS - keys valid, frontend wired | No |
| 5 | Google OAuth | PLACEHOLDER - needs credentials + server route | Yes for Google login |

### .env Changes Made

1. Added `VITE_VAPID_PUBLIC_KEY` mirroring `VAPID_PUBLIC_KEY` (Step 4B)
2. Added `VITE_GOOGLE_CLIENT_ID` mirroring `GOOGLE_CLIENT_ID` placeholder (Step 5A)

### Critical Gaps (not credential-related)

1. **Google OAuth server route missing:** `POST /api/v1/auth/google/callback` does not exist.
   The frontend sends the auth code there but no handler receives it.
   Must implement: exchange code for Google tokens, extract email/name, upsert user, return JWT.

2. **NEXTAUTH_SECRET is a placeholder** but this project does not actually use NextAuth -
   it uses custom JWT auth. This variable can be removed or ignored.

3. **JWT_SECRET** is a dev placeholder (`ta_dev_jwt_secret_replace_in_production_openssl_rand_hex_32`).
   Must be replaced with a cryptographically random 32-byte hex string for production.
