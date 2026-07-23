# Admin app — Meet Champion

Next.js 14 (App Router) + TypeScript + Tailwind. Authenticated with Supabase
using the standard `@supabase/ssr` cookie flow — nothing proprietary.

## Run locally

```bash
cp .env.example .env.local     # fill Supabase URL + anon + service role + Stripe secret
npm install
npm run dev                    # http://localhost:3000
```

Sign in with an **admin** user (see `docs/CODEX_HANDOFF.md` for the demo
credentials).

## Deploy

Any Node.js host:

- **Vercel**: `vercel deploy` (recommended).
- **Netlify**: use the Next.js adapter.
- **Docker / self-host**: `npm run build && npm run start`.

No Emergent-specific configuration required.

## Pages

| Route                                | Purpose                                    |
|--------------------------------------|--------------------------------------------|
| `/sign-in`                           | Admin login                                |
| `/dashboard`                         | Platform stats                             |
| `/dashboard/verifications`           | Approve / reject VIP submissions           |
| `/dashboard/champions`               | Champion directory                         |
| `/dashboard/bookings`                | All bookings                               |
| `/dashboard/payments`                | Stripe payment records                     |
