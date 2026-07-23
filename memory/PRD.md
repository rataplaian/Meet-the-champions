# Meet Champion — Product Requirements Document

## Product
Portable open-source marketplace where **Fans** book paid 1:1 video calls with verified **Champions** (athletes, coaches, celebrities, experts). **Admins** verify Champions and monitor the platform.

## Non-negotiable constraint
100% platform-independent from Emergent. Any professional developer must be able to clone from GitHub and continue development/deployment without any Emergent tooling.

## Architecture
- **Mobile app**: Expo + React Native + TypeScript (`apps/mobile`)
- **Admin panel**: Next.js 14 App Router + Tailwind + TypeScript (`apps/admin`)
- **DB / Auth / Storage**: Supabase (`supabase/migrations`, `supabase/functions`)
- **Payments**: Stripe (Connect-ready) via edge functions
- **Video calls**: Adapter pattern — default Daily.co, pluggable Agora/Twilio
- **Email**: Adapter pattern — default Resend, pluggable SendGrid/SMTP
- **Push**: Expo Push Notifications (adapter present)

## User roles
- `fan` (default) — browse, book, pay, review
- `champion` — verified user offering paid slots, receives payouts via Stripe Connect
- `admin` — verifies VIPs, moderates, monitors platform

## Core flows delivered
1. **Auth** — email/password sign-in/sign-up (Supabase Auth) with role selection
2. **Browse champions** — filter by category, view detail, see slots
3. **Book slot** — atomic RPC reserves slot, creates pending_payment booking with platform fee
4. **Pay** — Stripe PaymentIntent via edge function; webhook confirms booking
5. **Video call** — Daily.co room created + token issued via edge function; WebView UI
6. **VIP verification** — mobile upload of doc+selfie, admin approves/rejects via edge fn
7. **Admin dashboard** — stats, verifications, champions, bookings, payments tables

## What's built vs pending
See `docs/CODEX_HANDOFF.md` §2 for full status. Highlights of pending work:
- Native Stripe PaymentSheet UI wiring (client_secret already returned)
- Champion availability management screen
- Stripe Connect onboarding for Champion payouts
- Push notification sender (Expo Push endpoint)
- Automated e2e tests (Playwright / Detox)

## Portability deliverables
- `.env.example` with all credentials documented
- Complete SQL migrations (schema + RLS + storage policies + triggers + business RPC)
- Seed script + demo user script
- Service adapter interfaces for every external provider
- `docs/ARCHITECTURE.md` + `docs/CODEX_HANDOFF.md`
- Root `package.json` with npm workspaces
