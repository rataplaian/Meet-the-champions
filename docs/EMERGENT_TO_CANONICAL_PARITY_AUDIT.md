# Emergent To Canonical Parity Audit

Branch: `fix/mobile-preview-restoration`

Scope: restore the observable demo experience from `frontend` into the canonical `apps/mobile` app without moving the app root back to `frontend`, without redesign, and without removing the stable Expo/demo architecture already present in `apps/mobile`.

Parity labels:

- Exact
- Very close
- Partial
- Missing
- Intentionally different for technical safety

## Route Inventory

| Original route / item | Original file | Purpose | Original visible text | Original interaction / transition | Current equivalent in `apps/mobile` | Visual status | Functional status | Required restoration | Assets involved | Test required |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Boot placeholder | `frontend/app/index.tsx` | Dark loading placeholder while routing gate resolves | Activity spinner only | Redirect is controlled by root `AuthGate` | `apps/mobile/app/index.tsx`, `apps/mobile/src/components/BootScreen.tsx` | Intentionally different for technical safety | Very close | Keep canonical BootScreen and timeout/retry before onboarding/auth | None | Boot timeout/retry, no indefinite stuck state |
| First-launch onboarding slide 1 | `frontend/app/onboarding.tsx` | Intro slide 1 | `MEET CHAMPION`, `Salta`, `Trova il tuo campione`, `AVANTI` | Horizontal swipe, next button, dot indicator | Missing | Missing | Missing | Add onboarding route and provider in canonical root | `frontend/assets/images/legend-bg.jpg` via `JerseyBackground` | First launch shows slide 1 |
| First-launch onboarding slide 2 | `frontend/app/onboarding.tsx` | Intro slide 2 | `Videochiamate 1:1 esclusive`, `AVANTI` | Swipe/next advances to slide 3 | Missing | Missing | Missing | Restore second slide, accent and icon | `legend-bg.jpg` | Swipe/next progresses |
| First-launch onboarding slide 3 | `frontend/app/onboarding.tsx` | Intro slide 3 | `Un ricordo che resta`, `INIZIA` | CTA persists onboarding and routes to auth | Missing | Missing | Missing | Restore final CTA and persistence | `legend-bg.jpg` | Final CTA works and persists |
| Onboarding skip | `frontend/app/onboarding.tsx` | Skip intro | `Salta` | Persists onboarding and routes to `/(auth)/sign-in` | Missing | Missing | Missing | Add skip action | `legend-bg.jpg` | Skip works |
| User auth landing | `frontend/app/(auth)/sign-in.tsx` | Branded user landing | `Prenota video call 1:1 con i tuoi eroi del calcio.`, `Accedi`, `Registrati`, `OPPURE`, `SEI UN CHAMPION?`, `Accedi al portale professionisti ->` | Landing actions switch to login/signup forms; champion gateway changes query param | Simplified email form | Missing | Partial | Restore landing mode and gateway while using canonical auth service | `legend-bg.jpg` | User portal opens |
| Champion auth landing | `frontend/app/(auth)/sign-in.tsx?type=champion` | Branded champion portal | `PORTALE CHAMPION`, `Il tuo palcoscenico premium. Ricevi prenotazioni video call dai tuoi tifosi.`, `SEI UN UTENTE?`, `Torna al portale utenti ->` | Gateway back to user portal; login/signup route role-specific | Missing | Missing | Missing | Restore champion auth variant; no role chip | `legend-bg.jpg` | Champion portal opens |
| User login form | `frontend/app/(auth)/sign-in.tsx` | Login credentials | `Accedi - Utente`, `Email`, `Password`, `DEMO PRE-COMPILATO`, `fan@meetchampion.local - demo1234` | Submit signs in fan and routes to tabs | Simplified English form | Partial | Partial | Restore Italian form and test IDs compatible with existing tests | `legend-bg.jpg` | User login works |
| User registration form | `frontend/app/(auth)/sign-in.tsx` | Fan signup | `Registrati - Utente`, `Nome`, `Email`, `Password`, `Crea account` | Creates fan and routes to tabs | Separate simplified sign-up route | Partial | Partial | Embed fan registration in landing flow | `legend-bg.jpg` | User registration works |
| Champion login form | `frontend/app/(auth)/sign-in.tsx?type=champion` | Champion signin | `Accedi - Champion` | Signs in champion; approved champion goes to tabs | Missing local champion credentials | Missing | Missing | Add demo approved and pending champion users | `legend-bg.jpg` | Champion login and role routing |
| Champion registration form | `frontend/app/(auth)/sign-in.tsx?type=champion` | Champion signup | `Registrati - Champion`, `Crea account` | Creates champion user and routes to `/vip-verify` | Role chip in separate sign-up | Missing | Missing | Restore separate form and verification transition | `legend-bg.jpg` | Champion registration opens verification |
| Legacy sign-up redirect | `frontend/app/(auth)/sign-up.tsx` | Redirect old route to sign-in landing | None beyond redirect | Redirects to `/(auth)/sign-in` | Separate active form | Missing | Partial | Match redirect or make it compatible with landing | None | Route does not dead-end |
| Home explore | `frontend/app/(tabs)/index.tsx` | Main champion discovery | `Cerca per nome, squadra o eta...`, `Tutti`, `Giocatori`, `Allenatori`, `Stars`, `Ex Pro`, `MEET THE CHAMPIONS`, `Scorri <- ->`, `Nessun risultato`, `Prova un altro nome o squadra`, `CHAMPIONS DISPONIBILI - SCORRI PER SCEGLIERE` | Search, category chips, rail card press to champion | Simplified English labels and simplified error/loading | Partial | Very close | Restore Italian copy, empty state, category labels, gold hinting | None | Categories/search/empty/rail/card press |
| Infinite champion rail | `frontend/src/components/CoverflowRail.tsx` | Infinite horizontal coverflow | Test ids `rail-list`, `card-{id}` | Duplicates data 20x, starts midway, snap interval, center scaling, both directions | Similar canonical component | Very close | Very close | Align test IDs, source data shape, card visuals | Champion photo URLs | Rail renders/loops both directions |
| Champion card | `frontend/src/components/FifaCard.tsx` | FIFA-style portrait card | `VERIFIED`, uppercase name, `age - TEAM` | Press opens champion profile | Similar but no verified badge, placeholders for missing photos | Partial | Very close | Restore verified badge, accent border/shadow, real demo portraits | Champion photo URLs | Card visual + press |
| Champion profile hero | `frontend/app/champion/[id].tsx` | Detailed champion profile | `VERIFIED`, flag, name, team, age, languages | Loads champion, slots and reviews | Simplified icon/header | Missing | Partial | Restore hero image, info card, stats | Champion photo URLs | Profile opens and data loads |
| Champion bio/career/reviews | `frontend/app/champion/[id].tsx` | Detail sections | `SU DI ME`, `CARRIERA`, `RECENSIONI` | Static read sections with review preview | Mostly missing | Missing | Missing | Restore sections from legacy using canonical theme tokens | Champion data, reviews | Bio/career/review preview |
| Service selector | `frontend/app/champion/[id].tsx` | Four service choices | `COME VUOI INTERAGIRE?`, `Videochiamata`, `Faccia a faccia`, `Chiamata`, `Solo audio`, `Allenamento`, `Sessione dedicata`, `Consiglio`, `Scheda personalizzata` | Selecting service changes active style and displayed price | Missing | Missing | Missing | Add four service options with multipliers and duration display | Ionicons | Service price/style tests |
| Slot selector | `frontend/app/champion/[id].tsx` | Group slots by day | `SLOT DISPONIBILI`, `Nessuno slot disponibile` | Select slot pill; sticky CTA enables | Simplified pills | Partial | Partial | Restore grouped-by-day presentation and sticky CTA | None | Slot selection |
| Booking note modal | `frontend/app/champion/[id].tsx` | Optional request message | `RICHIESTA A ...`, `Aggiungi un messaggio`, `Facoltativo - massimo 300 caratteri`, `Nessun addebito ora - pagherai solo se il champion accetta`, `INVIA RICHIESTA` | Modal opens after slot selection; submit creates booking | Missing | Missing | Missing | Restore modal and create `awaiting_champion` booking | None | Note persists into booking |
| Booking awaiting state | `frontend/app/booking/[id].tsx` | Waiting for champion | `In attesa di ...`, `Abbiamo inviato la tua richiesta. Ti avviseremo appena risponde.`, `Nessun addebito finche il champion non accetta`, `Annulla richiesta`, `Demo - risposta simulata entro pochi secondi` | Auto simulated champion response after about 6s; cancel | Missing | Missing | Missing | Add state and simulated accept/decline | None | Awaiting renders and transitions |
| Booking declined state | `frontend/app/booking/[id].tsx` | Rejected request | `Richiesta non accettata`, `Nessun addebito e stato effettuato.`, `SCEGLI UN ALTRO SLOT`, `Torna alla home` | Return to champion or home | Missing | Missing | Missing | Add declined UI and slot freed behavior | None | Rejection renders |
| Booking pending payment | `frontend/app/booking/[id].tsx` | Accepted request checkout | `ha accettato`, `Completa il pagamento per confermare la sessione`, `METODO DI PAGAMENTO`, `Carta`, `Apple Pay`, `G Pay`, `4242`, `PAGA ...`, `Pagamento sicuro - Modalita demo - nessun addebito reale` | Payment button confirms booking | Simplified `Pay now` with error message | Missing | Partial | Restore selector and actual simulated confirmation in demo | None | Payment confirms; simulation clearly marked |
| Booking confirmed ticket | `frontend/app/booking/[id].tsx` | Confirmed QR ticket | `MEET CHAMPION - TICKET`, `DATA`, `ORA`, `DURATA`, `Presenta questo ticket all'ingresso della call`, `ENTRA NELLA CALL` | Join opens fake call | Missing | Missing | Missing | Restore `QrTicket`, `TicketFrame`, countdown, join action | `QrTicket` component | QR renders and join works |
| Booking completed/review | `frontend/app/booking/[id].tsx` | Review after completed call | `LASCIA UNA RECENSIONE`, stars, `Com'e andata? (opzionale)`, `Invia recensione`, `Recensione inviata - grazie!` | Submit once, updates reviews | Missing | Missing | Missing | Restore review UI and duplicate prevention | None | Review tests |
| Bookings tab | `frontend/app/(tabs)/bookings.tsx` | Upcoming/past bookings | `Prossime`, `Passate`, `In attesa`, `Rifiutata`, `Da pagare`, `Confermata`, `In corso`, `Completata`, `Annullata`, `Rimborsata`, `SCOPRI I CAMPIONI` | Tabs, refresh, reminders, status row opens detail | Simplified one-list English | Missing | Partial | Restore tab split, labels, reminder banners, empty states | Champion photo URLs | Upcoming/past grouping |
| Call demo | `frontend/app/call/[id].tsx` | Fake video call | `Preparo la stanza...`, `CHIAMATA IN CORSO...`, `LIVE`, `Tu`, `Camera off`, `Mic`, `Camera`, `Chat`, `Altro` | Ringing to live after 2.4s, timer, mute/cam/chat/end, end completes booking | WebView provider screen | Missing | Missing in demo | Restore fake call only in demo; keep real provider path available for non-demo | Champion photo URLs | Ringing/live/end |
| User profile | `frontend/app/(tabs)/profile.tsx` | Profile dashboard | `UTENTE`, `Prossime`, `Passate`, `Totale`, `Aspetto - Tema della tua squadra`, `Rivedi introduzione`, `Esci`, `Meet Champion - Demo v1.0` | Stats load, appearance, onboarding reset, logout | Simplified profile, no onboarding reset/stat counts | Partial | Partial | Restore stats and onboarding reset; keep champion CTA where useful | None | Stats/reset/logout |
| Appearance settings | `frontend/app/settings/appearance.tsx` | Team-inspired themes | `Tema della tua squadra`, `Nessun logo o stemma ufficiale - solo palette cromatiche.`, `Anteprima tema`, `PRESET`, `Il tema e decorativo...` | Select preset persists and applies immediately | Canonical expanded settings | Very close | Very close | Keep canonical provider; adjust copy/layout to original where possible | None | Preset persists/applies |
| Champion verification | `frontend/app/vip-verify.tsx` | Become Champion demo | `Diventa un Champion`, `Racconta la tua esperienza...`, `Nome`, `Ultima squadra`, `Eta`, `Durata (min)`, `Prezzo $`, `Categoria`, `Giocatore`, `Allenatore`, `Ex Pro`, `Biografia`, `Invia richiesta` | Upserts local champion, changes user role, pending review alert, returns profile | Production-oriented upload form | Missing | Partial | Restore demo-friendly fields and Italian labels, keep production admin approval path | None | Verification submit and pending/approved states |

## Component Inventory

| Original component | File | Purpose | Current equivalent | Visual status | Functional status | Required restoration |
| --- | --- | --- | --- | --- | --- | --- |
| `ChampionsHero` | `frontend/src/components/ChampionsHero.tsx` | Golden text/stars hero for auth/splash contexts | Missing | Missing | Missing | Add only if required by original auth/splash composition; keep jersey limited to auth/onboarding |
| `CountdownPill` | `frontend/src/components/CountdownPill.tsx` | Live countdown/ended pill | Missing | Missing | Missing | Migrate for bookings/ticket reminders |
| `CoverflowRail` | `frontend/src/components/CoverflowRail.tsx` | Infinite bidirectional coverflow rail | `apps/mobile/src/components/CoverflowRail.tsx` | Very close | Very close | Align data and visible card parity |
| `FifaCard` | `frontend/src/components/FifaCard.tsx` | Portrait FIFA card with verified badge | `apps/mobile/src/components/FifaCard.tsx` | Partial | Very close | Restore verified/premium cue and colors from frontend |
| `JerseyBackground` | `frontend/src/components/JerseyBackground.tsx` | Royal-blue jersey artwork background | Missing | Missing | Missing | Migrate and use only onboarding/auth |
| `QrTicket` / `TicketFrame` | `frontend/src/components/QrTicket.tsx` | Deterministic fake QR ticket | Missing | Missing | Missing | Migrate for confirmed booking |
| `Skeleton` / `SkeletonCard` | `frontend/src/components/Skeleton.tsx` | Shimmer placeholders | Missing | Missing | Missing | Migrate for home/bookings loading |

## Store And Demo Behavior Inventory

| Original item | File | Purpose | Current equivalent | Status | Required restoration |
| --- | --- | --- | --- | --- | --- |
| `ensureSeeded` | `frontend/src/store/index.ts` | Seeds users/champions/slots/bookings/reviews once | `apps/mobile/src/services/demo.ts` in-memory seed | Partial | Preserve canonical service exports but back demo with persistent local seed |
| Users | `frontend/src/store/index.ts`, `seed.ts` | Fan/admin demo users and signup/signin | `demoAuth` fixed fan session | Partial | Add fan, approved champion, pending champion and signup persistence |
| Champions | `frontend/src/store/index.ts`, `seed.ts` | Rich real-data demo champion catalog | Simplified four champions | Partial | Restore full observable fields/data in canonical demo service |
| Slots | `frontend/src/store/index.ts` | Generated seven-day availability | Simplified two slots per champion | Partial | Restore generated slot behavior |
| Bookings | `frontend/src/store/index.ts` | Full state machine and slot hold/free | Immediate `pending_payment` | Missing | Restore request-first state machine |
| Reviews | `frontend/src/store/index.ts` | Per-booking review and champion aggregate updates | Stub `review()` | Missing | Restore review create/list/byBooking behavior |
| Theme preferences | `frontend/src/theme.tsx` | Simple preset persistence | Canonical ThemeProvider | Very close | Keep canonical provider, map original presets/copy |
| Onboarding persistence | `frontend/src/context/onboarding.tsx` | `@mc/onboarded@1` ready/mark/reset with timeout | Missing | Missing | Add provider/gate compatible with BootScreen |

## Intentional Technical Differences

- `apps/mobile` remains the deployed and canonical Expo Router app.
- The canonical `BootScreen`, runtime mode validation, demo/development/production configuration, public web deploy scripts, and Metro React singleton configuration must remain.
- Supabase/Stripe services remain available for non-demo modes; restored demo behavior must not call real Stripe in demo mode.
- The canonical ThemeProvider remains the provider of record; restored appearance UI must adapt to it rather than reintroducing a second theme root.
- Any old `frontend` implementation is a reference only. It must not become the active app root.

## Current Highest-Risk Gaps

1. Onboarding route/provider/gate is missing from `apps/mobile`.
2. Auth is simplified and lacks separate user/champion portals.
3. Demo auth and data are in-memory and too small compared with the original persistent local store.
4. Booking starts at `pending_payment`, skipping `awaiting_champion` and simulated champion response.
5. Booking detail lacks declined, ticket, QR, completed and review states.
6. Demo call is a WebView room instead of the original fake call experience.
7. Public demo can compile and run, but it does not yet reproduce original visible parity.
