# Meet Champion — Codex Handoff

This document is written for the **next developer** (human or AI) who will
maintain the project after the initial Emergent-assisted scaffolding.

> Everything in this repo is standard open technology. Emergent was used
> only as a code generator; nothing here depends on it at runtime.

---

## 1. Project purpose

A marketplace where **Fans** book paid 1:1 video calls with verified
**Champions** (athletes, coaches, celebrities, experts). **Admins** verify
Champions and monitor the platform.

## 2. Current implementation status

| Area                                    | Status                        |
|-----------------------------------------|-------------------------------|
| Monorepo layout (`apps/*`, `packages/*`)| ✅ Complete                   |
| Supabase schema (`supabase/migrations`) | ✅ Complete + RLS + storage   |
| Seed data (`supabase/seed.sql`)         | ✅ 3 champions, 2 fans, 1 admin|
| Service adapters (`packages/shared`)    | ✅ Auth/Bookings/Payments/Video/Email/Storage/Notifications |
| Mobile app screens                      | ✅ Auth, Explore, Bookings, Profile, Champion, Booking, Call, VIP verify |
| Admin app pages                         | ✅ Dashboard, Verifications, Champions, Bookings, Payments |
| Edge functions                          | ✅ stripe-create-intent, stripe-webhook, video-token, send-email, admin-verify-vip |
| Docs                                    | ✅ README, ARCHITECTURE, CODEX_HANDOFF |
| Automated tests                         | 🟡 Type-level test in `packages/shared`; add e2e later |
| Native Stripe payment sheet             | 🟡 Client integration stubbed (returns `client_secret`; wire `@stripe/stripe-react-native` `presentPaymentSheet`) |
| Push notifications                      | 🟡 Adapter present; server-side sender to be added |
| Champion availability management UI     | 🟡 Backend ready (`champions.addAvailability`); dedicated screen not built |
| Champion Stripe Connect onboarding      | 🟡 DB fields ready (`stripe_account_id`); UI/edge fn to be added |

## 3. Repository structure

See `README.md`. Key entry points:

- `apps/mobile/app/_layout.tsx` — Expo Router root
- `apps/admin/src/app/layout.tsx` — Next.js root
- `packages/shared/src/index.ts` — everything the apps import
- `supabase/migrations/` — DB truth
- `supabase/functions/` — server-side code

## 4. Application roles

- **fan** — default role at signup
- **champion** — role set after VIP verification is approved
- **admin** — set manually in the database (see §7)

## 5. Authentication flow

1. Sign up → `supabase.auth.signUp` (email + password).
   The `handle_new_user` trigger creates a matching row in `public.profiles`
   with `role = fan` by default.
2. Sign in → `signInWithPassword`.
3. Session is persisted in `expo-secure-store` (mobile) / cookies (admin).
4. The middleware in `apps/admin/src/middleware.ts` refreshes the session.

## 6. VIP verification flow

1. A fan converts to a champion via `/vip-verify` in the mobile app.
2. They upload document + selfie to the **private** `vip-verifications` bucket.
3. A row is inserted into `vip_verifications` with `status = 'pending'` and
   the champion profile is created with `verification_status = 'pending'`.
4. In the admin panel `/dashboard/verifications`, an admin approves or
   rejects. Approval calls the `admin-verify-vip` edge fn which:
   - Updates `vip_verifications.status`.
   - Updates `champion_profiles.verification_status`.
   - Writes an audit log entry.
   - Creates a notification for the champion.

## 7. Bootstrapping an admin account

Because a champion cannot self-approve, the very first admin must be
promoted by hand:

```sql
update public.profiles set role = 'admin'
where email = 'you@example.com';
```

Then sign in to the admin app with that account.

## 8. Booking flow

See `docs/ARCHITECTURE.md` §"Data flow — booking a call".

## 9. Payment flow

- `stripe-create-intent` (edge fn) — creates PaymentIntent, upserts the
  `payments` row.
- The mobile app confirms the intent via `@stripe/stripe-react-native`.
  **TODO**: wire `initPaymentSheet` / `presentPaymentSheet` in
  `apps/mobile/app/booking/[id].tsx`.
- `stripe-webhook` (edge fn) — handles success/failure/refund and updates
  the booking.
- To enable payouts to Champions, add Stripe Connect onboarding: create a
  new edge function `stripe-connect-onboard` that calls
  `stripe.accountLinks.create` and stores `stripe_account_id` on the
  champion profile. Then pass `transfer_data.destination` when creating
  the PaymentIntent.

## 10. Database schema

Single source of truth: `supabase/migrations/`. The tables are:

`profiles`, `champion_profiles`, `vip_verifications`, `availability_slots`,
`bookings`, `payments`, `reviews`, `notifications`, `audit_log`.

Regenerate TypeScript types (optional):

```bash
npx supabase gen types typescript --linked > packages/shared/src/types/database.gen.ts
```

## 11. Environment variables

See `.env.example` at repo root. Every credential is documented there.

## 12. External integrations & how to swap them

| Concern | Default provider | Adapter location |
|---|---|---|
| Payments | Stripe | `supabase/functions/stripe-*` |
| Video | Daily.co | `supabase/functions/video-token` (adapter map) |
| Email | Resend | `supabase/functions/send-email` (adapter map) |
| Storage | Supabase Storage | `packages/shared/src/services/storage` |
| Push | Expo Push | `packages/shared/src/services/notifications` |

To swap: add a new branch to the adapter map + set the env var.

## 13. Security decisions

- **RLS on every table** — no accidental data leakage even if a client is
  compromised.
- **Business rules in SQL functions** (`SECURITY DEFINER`) — impossible to
  bypass by editing client code.
- **Service-role key never in the client bundle** — only used inside edge
  functions.
- **VIP verification** cannot be self-approved (RLS `with check` prevents
  users from changing their own `verification_status`).
- **Users cannot escalate their role** (RLS `with check` on `profiles.update`).
- **Storage buckets** enforce per-user folder isolation for uploads.

## 14. Known limitations / TODOs

1. Wire native Stripe PaymentSheet in `apps/mobile/app/booking/[id].tsx`.
2. Add a screen for Champions to manage their availability slots.
3. Add Stripe Connect onboarding for Champion payouts.
4. Add a cron edge fn to auto-close bookings after `scheduled_end + 24h`.
5. Add push-notification sender (Expo Push) triggered by DB webhooks.
6. Add proper input validation on edge functions with Zod.
7. Add unit tests + e2e tests (Playwright for admin, Detox for mobile).

## 15. Commands

```bash
# Install
npm install                    # from repo root (workspaces)

# Dev
npm run mobile                 # Expo dev server
npm run admin                  # Next.js dev server
supabase start                 # local Supabase

# Migrations
supabase db reset              # apply migrations + seed to local
supabase db push               # push migrations to linked cloud project

# Deploy edge functions
supabase functions deploy stripe-create-intent
supabase functions deploy stripe-webhook
supabase functions deploy video-token
supabase functions deploy send-email
supabase functions deploy admin-verify-vip

# Tests
npm test
```

## 16. Deployment process

1. **Database & functions**: `supabase db push` + `supabase functions deploy`.
2. **Admin panel**: push repo to GitHub → connect to Vercel → set env vars.
3. **Mobile app**: `eas build --profile production --platform ios/android` →
   submit to stores.
4. **Stripe webhooks**: in the Stripe dashboard, add the endpoint
   `https://<project>.supabase.co/functions/v1/stripe-webhook` and put the
   signing secret into `STRIPE_WEBHOOK_SECRET`.

## 17. Demo credentials

The seed inserts profile rows only. To create real auth users bound to
these profiles, run:

```bash
node supabase/scripts/create_demo_users.mjs
```

Passwords: `MeetChampion!123` for every demo user.

| Email                         | Role     |
|-------------------------------|----------|
| admin@meetchampion.local      | admin    |
| fan1@meetchampion.local       | fan      |
| fan2@meetchampion.local       | fan      |
| champ1@meetchampion.local     | champion |
| champ2@meetchampion.local     | champion |
| champ3@meetchampion.local     | champion (pending VIP) |

## 18. Portability verification report

Run this checklist before shipping a release:

- [ ] `grep -r "emergent" --exclude-dir=node_modules .` returns nothing
      significant (only harmless matches in comments referring to the
      original scaffolding, if any).
- [ ] `.env.example` at the repo root documents every credential.
- [ ] `supabase/migrations/` recreates the full schema on a fresh Postgres.
- [ ] `npm install && npm run mobile` works after cloning.
- [ ] `npm install && npm run admin` works after cloning.
- [ ] Building the admin with `next build` succeeds.
- [ ] `eas build` produces standalone iOS/Android bundles.
- [ ] Removing Emergent access does not break anything.

If any check fails, replace the offending piece with a standard
alternative before considering the release complete.
