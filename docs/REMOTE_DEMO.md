# Remote Web Demo

## Current Status

The public web demo is intended to be deployed from `apps/mobile` with Expo Router web output in demo mode.

Public demo URL: https://meet-the-champions-demo--demo.expo.app
Deployment URL: https://meet-the-champions-demo--onf1ic0z8l.expo.app
Expo account: `p.rata` (`rataplaian@gmail.com`).
EAS project name: `@p.rata/meet-champion-mobile`.
EAS project ID: `2f328fe5-cfc5-45be-b61a-31baca92bd77`.
Active deployment mode: demo (`EXPO_PUBLIC_APP_MODE=demo`).

## Deployment Command

From the repository root:

```bash
npm run deploy:web:demo
```

This command first runs a demo web export, then deploys the exported `apps/mobile/dist` directory to EAS Hosting.

Current command:

```bash
npm run deploy:web:demo
```

The script runs:

```bash
npx expo export --platform web
npx eas-cli@latest deploy --non-interactive --export-dir dist --dev-domain meet-the-champions-demo --alias demo
```

## Export Only

From the repository root:

```bash
npm run export:web:demo
```

The script runs `npx expo export --platform web` from `apps/mobile`.

## Demo Environment

The demo web scripts explicitly set:

```bash
EXPO_NO_DOTENV=1
EXPO_PUBLIC_APP_MODE=demo
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_STRIPE_PUBLIC_KEY=
```

Supabase and Stripe credentials are not required in demo mode. Demo login, Champion data, booking and payment are all local or simulated.

Do not deploy production credentials for this remote demo.

## Routing

`apps/mobile/app.json` uses:

```json
{
  "expo": {
    "web": {
      "bundler": "metro",
      "output": "single"
    }
  }
}
```

The `single` output exports a single-page app so direct route refreshes can be served back to `index.html` by EAS Hosting.

## Manual Verification

After deployment, open the public HTTPS URL and verify:

1. First-launch onboarding loads.
2. The branded User authentication landing loads.
3. The Champion portal gateway opens and returns to the User portal.
4. Demo credentials are prefilled for User login.
5. Demo login reaches the app.
6. Local Champion data loads.
7. The infinite bidirectional Champion rail renders and scrolls both ways.
8. A Champion profile opens from the rail.
9. A service and slot can be selected.
10. Simulated booking creates an `awaiting_champion` request.
11. The simulated Champion response moves the booking to payment or declined state.
12. The payment step clearly says the payment is simulated and no real charge occurs.
13. Simulated payment confirms the booking and shows the QR ticket.
14. The fake call demo opens and reaches live state.
15. Browser refresh does not produce a 404.
16. Mobile and desktop viewports are usable.
17. No blank loading screen or console-blocking runtime error appears.

Last verified public URL:

```bash
https://meet-the-champions-demo--demo.expo.app
```

Verification status from the latest deployment:

- First-launch onboarding: passed.
- User auth landing: passed.
- Champion auth landing: passed.
- Demo login: passed.
- Local Champion data: passed.
- Infinite bidirectional Champion rail: passed.
- Champion profile: passed.
- Simulated booking request: passed.
- Simulated Champion acceptance: passed in the latest run.
- Simulated payment: passed; it clearly states no real charge is created.
- QR ticket: passed.
- Fake call live state: passed.
- Direct route refresh: passed with HTTP 200 and no 404.
- Mobile viewport: passed at 390 x 844.
- Desktop viewport: passed at 1280 x 900.
- Console-blocking runtime errors: none observed.

## Redeploy Future Updates

1. Commit the update on the deployment branch.
2. Run:

   ```bash
   npm install
   npm run mobile:doctor
   npm run typecheck
   npm run lint
   npm test
   npm run export:web:demo
   npm run deploy:web:demo
   ```

3. Re-run the manual verification checklist.

## Rollback

EAS Hosting deployments are immutable. To roll back, use the Expo/EAS dashboard or EAS CLI to reassign the demo alias to the last known good deployment.

## Known Web-Only Limitations

- Native Expo Go behavior is not part of this web demo.
- Stripe is intentionally simulated in demo mode.
- Supabase authentication and persistence are intentionally bypassed in demo mode.
- Camera, microphone and native payment capabilities require native builds and are not part of this public web demo.
