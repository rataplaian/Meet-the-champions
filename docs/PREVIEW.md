# Mobile Preview

This project currently contains two Expo applications:

- `apps/mobile`: canonical long-term app. Root `npm run mobile` launches this workspace.
- `frontend`: older visual demo from the Emergent prototype. It contains the jersey login artwork, local demo store, and the original infinite `CoverflowRail`.

Do not delete `frontend` until its useful visual components have been reviewed and intentionally migrated.

## Prerequisites

- Node.js 20 or newer
- npm
- Expo Go updated for Expo SDK 54

## Install

```bash
npm install
```

The repository is npm-workspace based. Do not mix npm, yarn and pnpm lock files.

## Demo Preview

```bash
npm run mobile:demo
```

This launches `apps/mobile` with:

```bash
EXPO_PUBLIC_APP_MODE=demo
```

Demo mode does not require Supabase or Stripe credentials. It uses local seeded champions, a local demo login and simulated booking/payment behavior.

Demo credentials are prefilled on the login screen:

```bash
fan@meetchampion.local
demo1234
```

## Development Preview

```bash
npm run mobile:dev
```

Development mode requires:

```bash
EXPO_PUBLIC_APP_MODE=development
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_STRIPE_PUBLIC_KEY=
```

Missing variables are shown on the boot error screen instead of causing a blank app.

## Cache Reset

```bash
npm run mobile:clear
```

This starts demo mode with Metro cache cleared.

## Doctor

```bash
npm run mobile:doctor
```

Runs Expo dependency checks from `apps/mobile`.

## Expo Go

1. Run `npm run mobile:demo`.
2. Wait for Metro to show the QR code.
3. Scan the QR code with Expo Go.

If the phone and computer cannot see each other on the LAN, run the mobile app directly with a tunnel from `apps/mobile`:

```bash
cd apps/mobile
EXPO_PUBLIC_APP_MODE=demo npx expo start --clear --tunnel
```

On Windows PowerShell:

```powershell
cd apps/mobile
$env:EXPO_PUBLIC_APP_MODE="demo"
npx expo start --clear --tunnel
```

## What To Expect

`npm run mobile:demo` should open the canonical app on the Meet Champion login screen without Supabase credentials. After sign-in, the Explore screen uses the preserved infinite bidirectional Champion rail from the visual demo.

The royal-blue jersey asset remains in `frontend/assets/images/legend-bg.jpg` and is not used as the general application background in `apps/mobile`.

The isolated gold logo-like app image is in:

- `frontend/assets/images/app-image.png`
- `frontend/assets/images/splash-image.png`

## Infinite Loading Troubleshooting

The previous startup path could return `null` forever while `auth.getSession()` waited for Supabase or SecureStore. The app now:

- renders a visible boot screen while initializing;
- applies a boot timeout;
- catches startup errors;
- exposes a retry button;
- validates only the environment variables required by the active mode;
- lets demo mode run without backend configuration.

Common remaining causes:

- Expo Go is not updated for SDK 54.
- Development mode is selected without Supabase or Stripe test variables.
- The device cannot reach Metro over LAN. Use `--tunnel`.
- Native payment capabilities such as Apple Pay and Google Pay require a development build.

## Development Build

Use a development build for native capabilities not available in Expo Go:

```bash
cd apps/mobile
npx expo run:ios
npx expo run:android
```

or configure EAS Build if you use Expo Application Services.

## Useful Checks

```bash
npm run typecheck
npm run lint
npm test
npm run mobile:doctor
```
