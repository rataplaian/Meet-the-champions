# Mobile app — Meet Champion

Expo + React Native + TypeScript. Reads shared code from
`../../packages/shared`.

## Run locally

```bash
cp .env.example .env       # then fill in Supabase / Stripe keys
npm install                # from the repo root, or use workspaces
npm run mobile             # or `expo start` from this directory
```

Scan the QR code with **Expo Go** (Android / iOS) or press `i` / `a` for
the simulator.

## Build

Standard Expo builds. Emergent-independent.

```bash
npx eas build --profile production --platform android
npx eas build --profile production --platform ios
```

## Key screens

| Route                    | Description                                    |
|--------------------------|------------------------------------------------|
| `/(auth)/sign-in`        | Email + password                               |
| `/(auth)/sign-up`        | Registration with role picker                  |
| `/(tabs)/index`          | Explore champions (chips filter)               |
| `/(tabs)/bookings`       | Fan / champion bookings list                   |
| `/(tabs)/profile`        | Current user profile + sign out                |
| `/champion/[id]`         | Champion detail + slot booking                 |
| `/booking/[id]`          | Booking detail + Stripe payment                |
| `/call/[id]`             | Video call (Daily WebView)                     |
| `/vip-verify`            | Submit VIP verification (document + selfie)    |
