# Meet Champion

A **portable, open-source** monorepo where fans book paid 1:1 video calls with verified Champions (athletes, coaches, celebrities, experts).

> This project is 100% platform-independent. It uses only standard open technologies (Expo, Next.js, Supabase, Stripe, Daily, Resend) and can be cloned, built, deployed and maintained without any proprietary vendor lock-in.

---

## Stack

| Layer            | Technology                                                    |
|------------------|---------------------------------------------------------------|
| Mobile app       | Expo (React Native) + TypeScript + Expo Router                |
| Admin panel      | Next.js 14 (App Router) + TypeScript + Tailwind CSS           |
| Database & Auth  | Supabase (PostgreSQL + RLS + Auth + Storage)                  |
| Payments         | Stripe (Stripe Connect-ready)                                 |
| Video calls      | Daily.co (replaceable via `VideoCallProvider` adapter)        |
| Email            | Resend (replaceable via `EmailProvider` adapter)              |
| Push             | Expo Push Notifications                                       |

Every external service is behind a documented adapter interface in `packages/shared/services/*` — you can swap providers without touching business logic.

---

## Repository structure

```
meet-champion/
├── apps/
│   ├── mobile/          # Expo + React Native mobile app
│   └── admin/           # Next.js 14 admin panel
├── packages/
│   └── shared/          # Types, service adapters, business logic
├── supabase/
│   ├── migrations/      # SQL migrations (schema, RLS, storage, triggers)
│   ├── functions/       # Supabase Edge Functions (Deno)
│   └── seed.sql         # Demo seed data
├── docs/
│   ├── ARCHITECTURE.md  # System architecture
│   └── CODEX_HANDOFF.md # Handoff guide for Codex / new developers
├── .env.example         # Environment variable template
├── package.json         # npm workspaces root
└── README.md
```

---

## Local setup

### Prerequisites

- **Node.js ≥ 20** — https://nodejs.org
- **npm** (or `yarn`, `pnpm`)
- **Supabase CLI** — https://supabase.com/docs/guides/cli
- **Expo Go** app (iOS / Android) or Xcode / Android Studio for native builds
- **Docker** (optional, for running Supabase locally)

### 1. Clone and install

```bash
git clone <your-fork-url> meet-champion
cd meet-champion
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in Supabase, Stripe, Daily, Resend keys
```

Then create the app-specific env files (each app reads its own `.env`):

```bash
cp .env apps/mobile/.env
cp .env apps/admin/.env.local
```

### 3. Provision Supabase

Two options:

**Option A — Cloud (recommended for first run):**
1. Create a project at https://supabase.com
2. Copy URL + keys into `.env`
3. Run migrations from the repo:
   ```bash
   supabase link --project-ref <YOUR-PROJECT-REF>
   supabase db push
   psql "$SUPABASE_DB_URL" -f supabase/seed.sql   # optional demo data
   ```

**Option B — Local Supabase (fully offline):**
```bash
supabase start
supabase db reset          # applies migrations + seed
```
This starts Postgres, Auth, Storage, Studio at http://localhost:54323.

### 4. Run the apps

Open two terminals:

```bash
# Terminal 1 — mobile
npm run mobile
# → scan the QR code with Expo Go, or press 'i' / 'a' for simulator

# Terminal 2 — admin
npm run admin
# → http://localhost:3000
```

### 5. Run tests

```bash
npm test
```

---

## Deployment

- **Mobile app**: `eas build` (Expo Application Services) or any standard Expo build pipeline. See `apps/mobile/README.md`.
- **Admin panel**: Deploy to **Vercel**, **Netlify**, **Cloudflare Pages** or any Node.js host. See `apps/admin/README.md`.
- **Database & Edge Functions**: Deployed with Supabase. `supabase db push` for migrations, `supabase functions deploy <name>` for edge functions.
- **Stripe webhooks**: Point Stripe to `https://<project>.supabase.co/functions/v1/stripe-webhook`.

Full instructions: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/CODEX_HANDOFF.md`](docs/CODEX_HANDOFF.md).

---

## Roles

- **Fan** — browses champions, books slots, pays, joins video call, leaves review
- **Champion** — verifies identity (VIP), configures rate + availability, receives bookings, gets paid via Stripe Connect
- **Admin** — approves VIP verifications, moderates content, resolves disputes, monitors platform

---

## Portability guarantees

- ✅ No proprietary SDKs, packages, or hosted-only APIs
- ✅ Every service accessed via replaceable adapter interfaces
- ✅ Complete DB schema in `supabase/migrations/` (version-controlled)
- ✅ RLS policies + storage policies in migrations
- ✅ `.env.example` documents every required credential
- ✅ Can be exported to GitHub, cloned, built, deployed anywhere
- ✅ Can be continued through Codex or any AI assistant

See `docs/CODEX_HANDOFF.md` for the full portability checklist.

---

## License

MIT
