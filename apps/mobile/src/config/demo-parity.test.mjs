import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (path) => readFileSync(join(root, path), "utf8");

test("restores the original onboarding sequence and reset entry point", () => {
  const onboarding = read("app/onboarding.tsx");
  const profile = read("app/(tabs)/profile.tsx");

  assert.match(onboarding, /Trova il tuo\\ncampione/);
  assert.match(onboarding, /Videochiamate\\n1:1 esclusive/);
  assert.match(onboarding, /Un ricordo\\nche resta/);
  assert.match(onboarding, /testID="onb-skip"/);
  assert.match(onboarding, /testID="onb-next"/);
  assert.match(profile, /Rivedi introduzione/);
});

test("uses the user background with a darker settings treatment", () => {
  const profile = read("app/(tabs)/profile.tsx");
  const appearance = read("app/settings/appearance.tsx");

  assert.match(profile, /user-settings-bg\.jpg/);
  assert.match(profile, /USER_SETTINGS_BACKGROUND/);
  assert.match(appearance, /user-settings-bg\.jpg/);
  assert.match(appearance, /#01040ACC/);
});

test("persists selectable profile badges and frames with MTC unlocks", () => {
  const profile = read("app/(tabs)/profile.tsx");
  const wallet = read("src/config/mtcWallet.ts");

  assert.match(profile, /PROFILE_CUSTOMIZATION_KEY/);
  assert.match(profile, /profile-customization-modal/);
  assert.match(profile, /Personalizza il profilo/);
  assert.match(profile, /Stella MTC/);
  assert.match(profile, /Campione evento/);
  assert.match(profile, /Notte Elite/);
  assert.match(profile, /spendMtcBalance/);
  assert.match(profile, /unlockedItemIds/);
  assert.match(wallet, /export async function spendMtcBalance/);
  assert.match(wallet, /\{\s*\.\.\.parsed,\s*balance: nextBalance\s*\}/);
});

test("starts demo sessions at login and exposes role-aware sign out controls", () => {
  const auth = read("src/context/auth.tsx");
  const profile = read("app/(tabs)/profile.tsx");
  const appearance = read("app/settings/appearance.tsx");

  assert.match(auth, /hasClearedStartupSession/);
  assert.match(auth, /await auth\.signOut\(\)/);
  assert.match(profile, /Esci dall'account Champion/);
  assert.match(profile, /Esci dall'account utente/);
  assert.match(appearance, /testID="settings-sign-out"/);
  assert.match(appearance, /Esci dall'account Champion/);
  assert.match(appearance, /Esci dall'account utente/);
});

test("provides a visible back action on every secondary screen", () => {
  const layout = read("app/_layout.tsx");
  const call = read("app/call/[id].tsx");
  const backButton = read("src/components/ScreenBackButton.tsx");

  for (const route of ["champion/[id]", "booking/[id]", "vip-verify", "settings/appearance", "settings/performance"]) {
    assert.match(layout, new RegExp(`name="${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[\\s\\S]*?ScreenBackButton`));
  }
  assert.match(call, /ScreenBackButton/);
  assert.match(backButton, /Torna indietro/);
  assert.match(backButton, /router\.canGoBack\(\)/);
});

test("keeps desktop web rendering inside a faithful mobile viewport", () => {
  const layout = read("app/_layout.tsx");
  const viewport = read("src/components/WebMobileViewport.tsx");

  assert.match(layout, /<WebMobileViewport>/);
  assert.match(viewport, /Platform\.OS === "web"/);
  assert.match(viewport, /const PHONE_VIEWPORT_WIDTH = 430/);
  assert.match(viewport, /const DESKTOP_BREAKPOINT = 600/);
  assert.match(viewport, /testID="mobile-web-viewport"/);
  assert.match(viewport, /maxWidth: PHONE_VIEWPORT_WIDTH/);
});

test("uses the supplied Meet the Champion artwork as the app icon", () => {
  const appConfig = JSON.parse(read("app.json"));

  assert.equal(appConfig.expo.icon, "./assets/icon.png");
  assert.equal(appConfig.expo.ios.icon, "./assets/icon.png");
  assert.equal(appConfig.expo.android.icon, "./assets/icon.png");
  assert.equal(appConfig.expo.web.favicon, "./assets/icon.png");
});

test("uses the supplied startup artwork with an animated football loader", () => {
  const appConfig = JSON.parse(read("app.json"));
  const boot = read("src/components/BootScreen.tsx");

  assert.equal(appConfig.expo.splash.image, "./assets/images/startup-bg.png");
  assert.match(boot, /duration: 2600/);
  assert.equal(appConfig.expo.splash.resizeMode, "contain");
  assert.ok(appConfig.expo.plugins.includes("expo-splash-screen"));
  assert.match(boot, /startup-bg\.png/);
  assert.match(boot, /source=\{STARTUP_BACKGROUND\}[\s\S]*?resizeMode="contain"/);
  assert.match(boot, /loading-football\.png/);
  assert.match(boot, /function LoadingFootball/);
  assert.doesNotMatch(boot, /name="football"/);
  assert.match(boot, /name="sparkles"/);
  assert.match(boot, /testID="loading-football"/);
  assert.match(boot, /testID="loading-sparkle-orbit"/);
  assert.match(boot, /withRepeat/);
  assert.match(boot, /accessibilityRole="progressbar"/);
  const auth = read("src/context/auth.tsx");
  assert.match(auth, /const DEMO_BRANDED_BOOT_MS = 1200/);
  assert.match(auth, /hasCompletedStartup/);
});

test("adds four top-20 rankings with period filters and visible percentages", () => {
  const tabs = read("app/(tabs)/_layout.tsx");
  const ranking = read("app/(tabs)/ranking.tsx");
  const data = read("src/config/rankingData.ts");

  assert.match(tabs, /name="ranking"/);
  assert.match(tabs, /name="predictions"/);
  assert.match(ranking, /ranking-bg\.png/);
  assert.match(ranking, /RANKING_BACKGROUND/);
  for (const label of ["CHAMPION", "FAN", "EVENTI", "MINUTI", "Giorno", "Settimana", "Mese", "Anno", "Da sempre"]) {
    assert.match(ranking, new RegExp(label));
  }
  assert.match(ranking, /EVENTI A PREMI/);
  assert.match(ranking, /numColumns=\{2\}/);
  assert.match(ranking, /TOP 20/);
  assert.match(ranking, /height: `\$\{barPercent\}%`/);
  assert.match(ranking, /bottom: `\$\{barPercent\}%`/);
  assert.match(ranking, /\{barPercent\}%/);
  assert.match(ranking, /ranking-percent-\$\{position\}/);
  assert.match(ranking, /colors=\{\["#FFF7C7", "#FFD34E", "#C88700"\]\}/);
  assert.match(ranking, /person-circle-outline/);
  assert.match(ranking, /style=\{styles\.participantName\}/);
  assert.doesNotMatch(ranking, /\{item\.score\}/);
  assert.doesNotMatch(ranking, /participantMeta/);
  assert.match(data, /\.slice\(0, 20\)/);
  const fanNames = data.match(/const FAN_NAMES = \[([\s\S]*?)\];/)?.[1];
  assert.equal((fanNames?.match(/"/g) ?? []).length / 2, 20);
  assert.match(data, /`rank-fan-\$\{index \+ 1\}`/);
  assert.match(data, /FAN_NAMES\.map/);
});

test("adds persistent match predictions, MTC balance, and discount rewards", () => {
  const predictions = read("app/(tabs)/predictions.tsx");
  const home = read("app/(tabs)/index.tsx");
  const wallet = read("src/config/mtcWallet.ts");

  assert.match(wallet, /@mc\/predictions@1/);
  assert.match(predictions, /MTC_STORAGE_KEY/);
  assert.match(predictions, /predictions-bg\.png/);
  assert.match(predictions, /match-card-bg\.png/);
  assert.match(predictions, /PREDICTIONS_BACKGROUND/);
  assert.match(predictions, /MATCH_CARD_BACKGROUND/);
  assert.doesNotMatch(predictions, /IL TUO SALDO DEMO/);
  assert.match(predictions, /1 pronostico e 1 scommessa/);
  assert.match(predictions, /prossimi 7 giorni/);
  assert.match(predictions, /partite gia iniziate/);
  assert.match(predictions, /Pronostico registrato/);
  assert.match(predictions, /PUNTATE MTC · IN ARRIVO/);
  assert.match(predictions, /Riscatta uno sconto/);
  assert.match(predictions, /AsyncStorage\.setItem/);
  assert.match(predictions, /Partite, risultati e ricompense sono simulati nella demo/);
  assert.match(predictions, /testID="daily-prediction-notice"/);
  assert.match(predictions, /massimo 1 pronostico al giorno/);
  assert.match(predictions, /anche 1 scommessa al giorno/);
  assert.match(predictions, /lastPredictionDate/);
  assert.match(predictions, /dailyPredictionMatchId/);
  assert.match(predictions, /Limite giornaliero raggiunto/);
  for (const discount of [5, 10, 15]) {
    assert.match(predictions, new RegExp(`discount: ${discount}`));
  }
  assert.match(home, /testID="mtc-wallet-button"/);
  assert.match(home, /testID="mtc-wallet-sheet"/);
  assert.match(home, /readMtcBalance/);
  assert.match(home, /Verificando email e numero di telefono/);
  assert.match(home, /Invitando amici con il tuo link personale/);
  assert.match(home, /moltiplicatore assegnato a ogni squadra/);
  assert.match(home, /Gadget esclusivi Meet the Champion/);
  assert.match(home, /Premi unici disponibili solo per un periodo limitato/);
});

test("adds temporary live match chats with team filters and messaging", () => {
  const tabs = read("app/(tabs)/_layout.tsx");
  const chat = read("app/(tabs)/live-chat.tsx");

  assert.match(tabs, /name="live-chat"/);
  assert.match(tabs, /chatbubbles-outline/);
  assert.match(chat, /predictions-bg\.png/);
  assert.match(chat, /Questa chat e temporanea/);
  assert.match(chat, /type ChatFilter = "all" \| "home" \| "away"/);
  assert.match(chat, /label="Tutti"/);
  assert.match(chat, /label=\{match\.home\}/);
  assert.match(chat, /label=\{match\.away\}/);
  assert.match(chat, /testID="live-chat-messages"/);
  assert.match(chat, /testID="live-chat-input"/);
  assert.match(chat, /testID="live-chat-send"/);
  assert.match(chat, /setMessages/);
  assert.match(chat, /Scrivi come tifoso/);
  assert.match(chat, /chat-verification-notice/);
  assert.match(chat, /Per scrivere devi aver verificato email e numero di telefono/);
  assert.match(chat, /chat-conduct-notice/);
  assert.match(chat, /Comportati in maniera consona e rispettosa/);
  assert.match(chat, /sospeso o bannato da questa e\/o da altre chat/);
  assert.match(chat, /useFocusEffect/);
});

test("restores separate user and champion auth portal copy", () => {
  const auth = read("app/(auth)/sign-in.tsx");
  const authBackground = read("src/components/JerseyBackground.tsx");

  assert.match(auth, /Prenota video call 1:1 con i tuoi eroi del calcio/);
  assert.match(auth, /PORTALE CHAMPION/);
  assert.match(auth, /Il tuo palcoscenico premium/);
  assert.match(auth, /SEI UN CHAMPION/);
  assert.match(auth, /SEI UN UTENTE/);
  assert.match(auth, /DEMO PRE-COMPILATO/);
  assert.match(authBackground, /source=\{AUTH_BG\}[\s\S]*?resizeMode="contain"/);
  assert.doesNotMatch(authBackground, /useWindowDimensions|withRepeat|translateX|translateY/);
});

test("renders the ordered champion hub rails, infinite roulette, and FIFA card cues", () => {
  const home = read("app/(tabs)/index.tsx");
  const rail = read("src/components/CoverflowRail.tsx");
  const card = read("src/components/FifaCard.tsx");
  const seed = read("src/store/seed.ts");

  for (const label of ["TUTTI", "ALLENATORI", "SERIE A", "SERIE B", "SERIE C", "SERIE D", "LEGEND"]) {
    assert.match(home, new RegExp(label));
  }
  assert.match(home, /champions-hub-bg\.jpg/);
  assert.match(home, /resizeMode="contain"/);
  assert.match(home, /primary=\{rail\.key === "all"\}/);
  assert.match(seed, /id: "champ-maicon"/);
  assert.match(seed, /italianLeagues: \["serie-a", "serie-d"\]/);
  assert.match(rail, /const LOOP = 20/);
  assert.match(rail, /initialScrollIndex/);
  assert.match(rail, /translateX/);
  assert.match(rail, /useScrollOffset/);
  assert.match(rail, /decelerationRate=\{0\.995\}/);
  assert.doesNotMatch(rail, /disableIntervalMomentum/);
  assert.match(rail, /onMomentumScrollEnd=\{recenterLoop\}/);
  assert.match(rail, /scrollToOffset\(\{ offset: middleOffset, animated: false \}\)/);
  assert.match(card, /VERIFIED/);
  assert.match(card, /photoUrl/);
});

test("persists favorites and renders an accessible reduced-motion sparkle state", () => {
  const home = read("app/(tabs)/index.tsx");
  const store = read("src/store/index.ts");
  const card = read("src/components/FifaCard.tsx");
  const sparkles = read("src/components/FavoriteSparkles.tsx");
  const photos = read("src/utils/championPhotos.ts");

  assert.match(home, /favoriteIds/);
  assert.match(home, /favoriteStore\.set/);
  assert.match(home, /Image\.prefetch/);
  assert.match(home, /warmChampionPhotos/);
  assert.match(card, /championCardPhotoUri/);
  assert.match(photos, /400/);
  assert.match(photos, /Special:Redirect\/file/);
  assert.match(store, /@mc\/favorites@1/);
  assert.match(store, /export const favorites/);
  assert.match(card, /star-outline/);
  assert.match(card, /accessibilityState=\{\{ selected: favorite \}\}/);
  assert.match(sparkles, /useReducedMotion/);
  assert.match(sparkles, /withRepeat/);
  assert.match(sparkles, /OUTSIDE_PARTICLES/);
  assert.match(sparkles, /outsideLayer/);
});

test("restores booking request, payment, ticket, call, and review states", () => {
  const store = read("src/store/index.ts");
  const bookings = read("app/(tabs)/bookings.tsx");
  const detail = read("app/booking/[id].tsx");
  const call = read("app/call/[id].tsx");

  assert.match(bookings, /bookings-bg\.png/);
  assert.match(bookings, /BOOKINGS_BACKGROUND/);
  for (const status of [
    "awaiting_champion",
    "declined",
    "pending_payment",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
    "refunded",
  ]) {
    assert.match(store, new RegExp(status));
  }
  assert.match(detail, /In attesa di/);
  assert.match(detail, /resta in attesa finché il Champion non risponde dal suo calendario/);
  assert.doesNotMatch(detail, /risposta simulata entro pochi secondi|acceptNotes/);
  assert.match(detail, /METODO DI PAGAMENTO/);
  assert.match(detail, /Carta/);
  assert.match(detail, /Apple Pay/);
  assert.match(detail, /G Pay/);
  assert.match(detail, /nessun addebito reale/);
  assert.match(detail, /QrTicket/);
  assert.match(detail, /LASCIA UNA RECENSIONE/);
  assert.match(call, /CHIAMATA IN CORSO/);
  assert.match(call, /LIVE/);
  assert.match(call, /Camera off/);
});

test("restores champion profile services and verification copy", () => {
  const champion = read("app/champion/[id].tsx");
  const store = read("src/store/index.ts");
  const verify = read("app/vip-verify.tsx");

  assert.match(champion, /champion-menu-bg\.jpg/);
  assert.match(champion, /CHAMPION_MENU_BACKGROUND/);
  for (const label of ["Videochiamata", "Chiamata", "Allenamento", "Consiglio", "Messaggio", "Supporta"]) {
    assert.match(champion, new RegExp(label));
  }
  assert.match(champion, /Faccia a faccia/);
  assert.match(champion, /Solo audio/);
  assert.match(champion, /Sessione dedicata/);
  assert.match(champion, /Scheda personalizzata/);
  assert.match(champion, /1 messaggio \+ 1 risposta/i);
  assert.match(champion, /una sola risposta entro 7 giorni/i);
  assert.match(champion, /non è prevista una risposta/i);
  assert.match(champion, /Pagamento demo simulato/);
  assert.match(champion, /interactions\.create/);
  assert.match(store, /ChampionInteractionType = "message" \| "support"/);
  assert.match(store, /status: input\.type === "message" \? "awaiting_reply" : "delivered"/);
  assert.match(verify, /Diventa un Champion/);
  assert.match(verify, /Ultima squadra/);
  assert.match(verify, /Giocatore/);
  assert.match(verify, /Allenatore/);
  assert.match(verify, /Ex Pro/);
});

test("adds the Champion calendar and performance management flow", () => {
  const tabs = read("app/(tabs)/_layout.tsx");
  const calendar = read("app/(tabs)/bookings.tsx");
  const profile = read("app/(tabs)/profile.tsx");
  const performance = read("app/settings/performance.tsx");
  const champion = read("app/champion/[id].tsx");
  const store = read("src/store/index.ts");
  const layout = read("app/_layout.tsx");

  assert.match(tabs, /isChampion \? "Calendario" : "Prenota"/);
  assert.match(tabs, /isChampion \? "Calendario eventi" : "Prenotazioni"/);
  assert.match(calendar, /AREA CHAMPION/);
  assert.match(calendar, /Calendario eventi/);
  assert.match(calendar, /Appuntamenti confermati/);
  assert.match(calendar, /Richieste/);
  assert.match(calendar, /Messaggi/);
  assert.match(calendar, /acceptAndCharge/);
  assert.match(calendar, /PAGAMENTO DEMO SIMULATO/);
  assert.match(calendar, /AVVIA/);
  assert.match(calendar, /una sola risposta entro 7 giorni/i);
  assert.match(calendar, /Supporta non richiede risposta/);
  assert.match(calendar, /iStore\.reply/);

  assert.match(profile, /profile-manage-performance/);
  assert.match(profile, /Gestisci performance/);
  assert.match(layout, /settings\/performance/);
  assert.match(performance, /SERVIZI E PREZZI/);
  assert.match(performance, /DISPONIBILITÀ LIVE/);
  assert.match(performance, /\[30, 45, 60\]/);
  assert.match(performance, /10 secondi tra le chiamate/);
  assert.match(performance, /performanceProfiles\.save/);
  assert.match(performance, /7 giorni/);

  assert.match(store, /turnaroundSeconds: 10/);
  assert.match(store, /window\.slotDurationSeconds \+ profile\.turnaroundSeconds/);
  assert.match(store, /Questo orario non rispetta i 10 secondi/);
  assert.match(store, /status = "refunded"/);
  assert.match(champion, /performanceProfiles\.get/);
  assert.match(champion, /champions\.availableSlots\(id, service\.key\)/);
  assert.match(champion, /selectedSlotData\?\.priceCents/);
});
