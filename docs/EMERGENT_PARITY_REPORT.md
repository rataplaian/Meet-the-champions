# Emergent Parity Report

Branch: `fix/mobile-preview-restoration`

Canonical app: `apps/mobile`

Reference app kept untouched: `frontend`

Public demo URL: https://meet-the-champions-demo--demo.expo.app

Latest deployment URL verified in this pass: https://meet-the-champions-demo--onf1ic0z8l.expo.app

## Summary

The original Emergent demo experience was restored inside `apps/mobile` while keeping the canonical Expo app root, runtime mode handling, boot safety, Metro React singleton configuration, public web deployment script, and service abstraction in place.

This was a parity restoration, not a redesign. The restored implementation migrates the original observable screens, copy, assets, local demo store, booking state machine, simulated payment, QR ticket, fake call demo, reviews, onboarding persistence, and team-theme UI into the canonical app.

## Route Map

| Frontend reference | Canonical route | Visual parity | Functional parity | Notes |
| --- | --- | --- | --- | --- |
| `frontend/app/index.tsx` | `apps/mobile/app/index.tsx` + `BootScreen` | Intentionally different for technical safety | Very close | Canonical boot timeout/retry remains before onboarding/auth routing. |
| `frontend/app/onboarding.tsx` | `apps/mobile/app/onboarding.tsx` | Exact | Very close | Three original slides, skip/next/final CTA, persistence and profile reset restored. |
| `frontend/app/(auth)/sign-in.tsx` | `apps/mobile/app/(auth)/sign-in.tsx` | Exact | Very close | User and Champion landing variants restored; backed by canonical auth bridge and persistent demo users. |
| `frontend/app/(auth)/sign-up.tsx` | `apps/mobile/app/(auth)/sign-up.tsx` | Exact | Exact | Legacy route redirects to sign-in landing. |
| `frontend/app/(tabs)/index.tsx` | `apps/mobile/app/(tabs)/index.tsx` | Exact | Very close | Italian search/categories/empty state/rail restored. |
| `frontend/app/(tabs)/bookings.tsx` | `apps/mobile/app/(tabs)/bookings.tsx` | Exact | Very close | Upcoming/past tabs, reminders and status labels restored. |
| `frontend/app/(tabs)/profile.tsx` | `apps/mobile/app/(tabs)/profile.tsx` | Exact | Very close | Stats, appearance, onboarding reset, logout restored. |
| `frontend/app/champion/[id].tsx` | `apps/mobile/app/champion/[id].tsx` | Exact | Very close | Hero, services, slots, note modal, career/reviews restored. |
| `frontend/app/booking/[id].tsx` | `apps/mobile/app/booking/[id].tsx` | Exact | Very close | Awaiting/declined/payment/confirmed/completed states restored. |
| `frontend/app/call/[id].tsx` | `apps/mobile/app/call/[id].tsx` | Exact in demo | Very close | Fake call restored for demo; real provider abstraction remains in services. |
| `frontend/app/settings/appearance.tsx` | `apps/mobile/app/settings/appearance.tsx` | Very close | Very close | Original UI restored on top of canonical ThemeProvider. |
| `frontend/app/vip-verify.tsx` | `apps/mobile/app/vip-verify.tsx` | Exact | Very close | Demo verification fields and Italian category labels restored. |

## Components Migrated

- `CoverflowRail`
- `FifaCard`
- `JerseyBackground`
- `CountdownPill`
- `QrTicket` / `TicketFrame`
- `Skeleton` / `SkeletonCard`
- `haptics` helper
- local demo store and seed data from `frontend/src/store`
- onboarding context from `frontend/src/context/onboarding`

## Assets Migrated

- `apps/mobile/assets/images/legend-bg.jpg`

The jersey artwork is used only by onboarding/auth related screens, matching the original constraint.

## Restored Demo Functions And States

- First-launch onboarding, persistence, skip, final CTA and profile reset.
- Separate User and Champion portals.
- Demo credentials for fan, approved Champion and pending Champion.
- Original Italian home copy and categories.
- Infinite bidirectional Champion rail and FIFA-style cards with portraits and verified cues.
- Champion profile sections, services, grouped slots and optional request note.
- Booking request state machine:
  - `awaiting_champion`
  - `declined`
  - `pending_payment`
  - `confirmed`
  - `in_progress`
  - `completed`
  - `cancelled`
  - `refunded`
- Simulated Champion response.
- Simulated payment selector: Carta, Apple Pay, G Pay, `•••• 4242`.
- Confirmed QR ticket and join-call action.
- Fake call ringing/live/timer/controls/end flow.
- Completed-call review form and duplicate review prevention.
- Team-theme appearance presets on canonical ThemeProvider.
- Demo Champion verification submission flow.

## Screenshots

Captured from the public HTTPS demo with a clean mobile browser context:

- `docs/parity-screenshots/01-onboarding-slide-1.png`
- `docs/parity-screenshots/02-onboarding-slide-3.png`
- `docs/parity-screenshots/03-user-auth-landing.png`
- `docs/parity-screenshots/04-champion-auth-landing.png`
- `docs/parity-screenshots/05-user-login-form.png`
- `docs/parity-screenshots/06-home-rail.png`
- `docs/parity-screenshots/07-champion-profile.png`
- `docs/parity-screenshots/08-service-slot-selection.png`
- `docs/parity-screenshots/09-request-note-modal.png`
- `docs/parity-screenshots/10-awaiting-champion.png`
- `docs/parity-screenshots/11-champion-response.png`
- `docs/parity-screenshots/12-confirmed-qr-ticket.png`
- `docs/parity-screenshots/13-call-live.png`
- `docs/parity-screenshots/14-completed-review.png`

## Validation Results

Commands executed:

- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run mobile:doctor`
- `npm run export:web:demo`
- `npm run deploy:web:demo`
- Playwright mobile public-demo flow verification
- Playwright desktop public-demo Champion portal verification
- Playwright mobile public-demo screenshot capture

Results:

- `npm install`: passed; added `expo-blur` and `expo-haptics`; npm audit still reports 23 vulnerabilities from existing dependency tree.
- `npm run mobile:doctor`: wrapper exited 0; Expo Doctor reports 16/18 checks passed with known monorepo warnings for `.expo` ignore state and duplicate React/ReactDOM caused by Next admin React 18 + Expo mobile React 19.
- `npm run typecheck`: passed for mobile and shared.
- `npm run lint`: passed for mobile and admin with no warnings.
- `npm test`: passed; mobile now runs 10 Node tests, shared Vitest suite passed, admin placeholder test passed.
- `npm run export:web:demo`: passed; Metro bundled 1341 modules and exported `dist`.
- `npm run deploy:web:demo`: passed; alias updated to the public demo URL.

## Public Demo Verification

Mobile viewport verification passed for:

- first-launch onboarding;
- User auth landing;
- demo login;
- local demo data;
- Italian home categories;
- infinite Champion rail presence;
- Champion card press;
- Champion profile;
- service and slot selection;
- booking request note modal;
- awaiting Champion state;
- simulated Champion acceptance;
- simulated payment UI clearly marked as demo/no real charge;
- confirmed QR ticket;
- join call;
- live fake call.

Desktop viewport verification passed for:

- User landing;
- Champion portal;
- Champion-specific copy;
- return gateway to User portal.

No browser page errors, invalid hook call, `useRef` null, or duplicate React runtime errors were observed in the public web verification.

## Intentional Technical Differences

- The canonical boot screen remains before onboarding to prevent blank or indefinitely stuck startup.
- The canonical runtime configuration remains the source of truth for demo/development/production.
- Metro React singleton configuration remains in `apps/mobile/metro.config.js`.
- The canonical ThemeProvider remains active; legacy appearance copy/UI is adapted onto it.
- The demo call is visual/fake in demo mode only; service abstraction for real video providers remains available for future non-demo integration.
- Physical Expo Go testing was not performed in this pass from this environment; web export and public HTTPS browser verification were performed instead.

## Remaining Warnings

- Expo Doctor still reports duplicate React/ReactDOM in the monorepo because admin uses Next.js 14 with React 18 while mobile uses Expo SDK 54 with React 19. This is intentionally isolated by the mobile Metro singleton resolver.
- Expo Doctor still reports `.expo` ignore state; repository ignore configuration covers `apps/mobile/.expo`.
- npm audit still reports 23 vulnerabilities. No `npm audit fix --force` was run because that would be a broader dependency upgrade outside this restoration.
