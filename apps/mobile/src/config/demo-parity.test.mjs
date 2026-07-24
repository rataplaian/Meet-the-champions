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

test("restores separate user and champion auth portal copy", () => {
  const auth = read("app/(auth)/sign-in.tsx");

  assert.match(auth, /Prenota video call 1:1 con i tuoi eroi del calcio/);
  assert.match(auth, /PORTALE CHAMPION/);
  assert.match(auth, /Il tuo palcoscenico premium/);
  assert.match(auth, /SEI UN CHAMPION/);
  assert.match(auth, /SEI UN UTENTE/);
  assert.match(auth, /DEMO PRE-COMPILATO/);
});

test("restores home categories, infinite rail, and FIFA card cues", () => {
  const home = read("app/(tabs)/index.tsx");
  const rail = read("src/components/CoverflowRail.tsx");
  const card = read("src/components/FifaCard.tsx");

  for (const label of ["Tutti", "Giocatori", "Allenatori", "Stars", "Ex Pro"]) {
    assert.match(home, new RegExp(label));
  }
  assert.match(rail, /const LOOP = 20/);
  assert.match(rail, /initialScrollIndex/);
  assert.match(rail, /translateX/);
  assert.match(card, /VERIFIED/);
  assert.match(card, /photoUrl/);
});

test("persists favorites and renders an accessible reduced-motion sparkle state", () => {
  const home = read("app/(tabs)/index.tsx");
  const store = read("src/store/index.ts");
  const card = read("src/components/FifaCard.tsx");
  const sparkles = read("src/components/FavoriteSparkles.tsx");

  assert.match(home, /Preferiti/);
  assert.match(home, /favoriteStore\.set/);
  assert.match(store, /@mc\/favorites@1/);
  assert.match(store, /export const favorites/);
  assert.match(card, /star-outline/);
  assert.match(card, /accessibilityState=\{\{ selected: favorite \}\}/);
  assert.match(sparkles, /useReducedMotion/);
  assert.match(sparkles, /withRepeat/);
});

test("restores booking request, payment, ticket, call, and review states", () => {
  const store = read("src/store/index.ts");
  const detail = read("app/booking/[id].tsx");
  const call = read("app/call/[id].tsx");

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
  const verify = read("app/vip-verify.tsx");

  for (const label of ["Videochiamata", "Chiamata", "Allenamento", "Consiglio"]) {
    assert.match(champion, new RegExp(label));
  }
  assert.match(champion, /Faccia a faccia/);
  assert.match(champion, /Solo audio/);
  assert.match(champion, /Sessione dedicata/);
  assert.match(champion, /Scheda personalizzata/);
  assert.match(verify, /Diventa un Champion/);
  assert.match(verify, /Ultima squadra/);
  assert.match(verify, /Giocatore/);
  assert.match(verify, /Allenatore/);
  assert.match(verify, /Ex Pro/);
});
