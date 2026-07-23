# Meet Champion — Architecture

## Overview

Meet Champion is a portable, open-source platform where **Fans** book paid 1:1
video calls with **Champions** (athletes, coaches, celebrities, experts) that
have been verified by **Admins**.

The system is deliberately built from replaceable, standard components:

```
             ┌─────────────────┐         ┌──────────────────┐
             │   Mobile app    │         │    Admin app     │
             │  Expo / RN / TS │         │ Next.js 14 / TS  │
             └────────┬────────┘         └────────┬─────────┘
                      │      HTTPS + JWT (Supabase Auth)      │
                      ▼                                       ▼
             ┌───────────────────────────────────────────────────┐
             │                    Supabase                       │
             │  PostgreSQL + RLS + Auth + Storage + Edge Fns     │
             └────────┬──────────────┬──────────────┬────────────┘
                      │              │              │
                      ▼              ▼              ▼
              ┌──────────────┐  ┌─────────┐   ┌─────────────┐
              │   Stripe     │  │  Daily  │   │   Resend    │
              │ (Connect)    │  │  Video  │   │   Email     │
              └──────────────┘  └─────────┘   └─────────────┘
```

Every external service (Stripe, Daily, Resend) is called from
**Supabase Edge Functions**, never directly from the client. This means:

- Secrets stay server-side.
- Providers can be swapped by editing one adapter file.
- The mobile & admin apps talk to a single, stable HTTPS surface: Supabase.

## Boundaries

### 1. Mobile frontend (`apps/mobile`)

- Renders UI and calls Supabase via `@supabase/supabase-js`.
- Uses the shared **service adapters** in `packages/shared/src/services/*`.
- Persists auth session in `expo-secure-store` (native) / `AsyncStorage` (web).
- Never talks to Stripe / Daily / Resend directly — always via the edge fns.

### 2. Admin frontend (`apps/admin`)

- Next.js App Router, cookie-based auth (`@supabase/ssr`).
- Server components query Postgres directly with the user's JWT (RLS enforced).
- Sensitive mutations (VIP approval) call the `admin-verify-vip` edge fn.

### 3. Database (Postgres via Supabase)

- Schema: `supabase/migrations/*.sql`.
- Row-level security **on every table**.
- Business rules implemented as SQL functions (`list_champions`,
  `create_booking`, `cancel_booking`, `complete_booking`) so they cannot be
  bypassed by client code.
- Portable: no PG-only extensions beyond `pgcrypto` / `uuid-ossp`. Migrations
  work on any recent PostgreSQL.

### 4. Storage (Supabase Storage / any S3-compatible)

Three buckets:
- `avatars` — public, per-user folder policy.
- `vip-verifications` — private, owner + admins only.
- `public-assets` — public, admin-write.

Bucket policies live in `supabase/migrations/20260201000200_storage.sql`.

### 5. Payment provider

Stripe. Client only sees `client_secret` and confirms via
`@stripe/stripe-react-native`. Server-side integration is entirely inside
`supabase/functions/stripe-create-intent` and `supabase/functions/stripe-webhook`.

To replace Stripe with another PSP, implement the same edge-function pair
returning a `client_secret`-shaped response.

### 6. Video provider

`supabase/functions/video-token` selects the adapter based on the
`VIDEO_PROVIDER` env var. Current implementations:

- `daily` — Daily.co REST API (fully implemented).
- `agora` — stub (extend when needed).
- `twilio` — stub (extend when needed).

The client never depends on which provider is chosen — it just receives
`{ room_url, token }`. The mobile app opens the room in a WebView, so any
provider that ships a browser-based room UI works out of the box.

### 7. Email provider

`supabase/functions/send-email` selects a `resend` or `sendgrid` adapter via
`EMAIL_PROVIDER`. Templates are inline HTML in the function itself, so no
build-time template engine is required.

### 8. Push notifications

Expo Push Notifications. The mobile app registers its token via
`NotificationsService.registerPushToken`. A background job (server-side, e.g.
a cron edge function — not part of this MVP) would send messages using
Expo's `/send` endpoint. No proprietary push service required.

## Data flow — booking a call

1. Fan opens `/champion/[id]` and taps a slot.
2. Client calls `bookings.create({ championId, slotId })`.
   - Runs the `create_booking` SQL RPC: atomically reserves the slot,
     creates a `pending_payment` booking, applies platform fee.
3. Fan opens `/booking/[id]` and taps **Pay now**.
   - Client calls `payments.createIntent(bookingId)`.
   - Edge fn `stripe-create-intent` creates a Stripe PaymentIntent bound to
     the booking; returns `client_secret`.
   - Client confirms the payment via Stripe SDK (mobile PaymentSheet).
4. Stripe webhook → `stripe-webhook` edge fn:
   - Marks payment as `succeeded`, booking as `confirmed`.
   - Creates in-app notifications for both fan and champion.
5. When call time comes, either party opens `/call/[id]`.
   - Client calls `video.getRoomForBooking(id)`.
   - Edge fn `video-token` creates (or fetches) a Daily room and issues a
     short-lived meeting token; marks booking as `in_progress`.
6. After the call, `complete_booking` RPC (called by a webhook or a cron)
   marks the booking `completed` and updates the champion's counters.
7. Fan can leave a review; the `refresh_champion_rating` trigger updates
   the champion's aggregate rating.

## Portability guarantees

- **No lock-in**: Every provider is behind an adapter. Migrate by writing
  a new adapter, no changes to booking logic.
- **DB portability**: standard PostgreSQL; the entire schema lives in
  `supabase/migrations/`.
- **Deploy anywhere**: Mobile via Expo EAS; Admin via Vercel/Netlify/Docker;
  Database via any Postgres host (Supabase Cloud, self-hosted, RDS, Neon…).
- **All secrets in `.env`**: nothing hardcoded, nothing hidden in a vendor UI.
