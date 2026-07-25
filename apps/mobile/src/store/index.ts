// =============================================================================
// Meet Champion — Demo store (AsyncStorage-backed).
// Persists auth, champions, bookings, reviews without any external service.
// Seeded once on first launch. All CRUD is synchronous once seed is loaded.
// =============================================================================
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SEED_CHAMPIONS, SEED_USERS } from "./seed";

export type UserRole = "fan" | "champion" | "admin";

export interface User {
  id: string;
  email: string;
  password: string;              // demo only — plaintext in local storage
  displayName: string;
  role: UserRole;
  avatarUrl?: string | null;
  themePresetId?: string;
}

export type ChampionCategory = "athlete" | "coach" | "celebrity" | "expert";
export type ItalianLeague = "serie-a" | "serie-b" | "serie-c" | "serie-d";

export interface Champion {
  id: string;
  userId?: string;                // if the champion is a registered user
  name: string;
  age: number;
  team: string;
  category: ChampionCategory;
  italianLeagues?: ItalianLeague[];
  photoUrl: string;
  bio: string;
  ratePerCallCents: number;
  callDurationMinutes: number;
  languages: string[];
  countryFlag?: string;
  services: string[];             // e.g. "1:1 coaching", "Career advice"
  career: { years: string; team: string; number?: number }[];
  verified: boolean;
  ratingAvg: number;
  ratingCount: number;
  totalCalls: number;
}

export interface AvailabilitySlot {
  id: string;
  championId: string;
  startsAt: string;               // ISO
  durationMinutes: number;
  durationSeconds?: number;
  serviceKey?: PerformanceServiceKey;
  priceCents?: number;
  isBooked: boolean;
}

export type BookingStatus =
  | "awaiting_champion" | "declined"
  | "pending_payment" | "confirmed" | "in_progress"
  | "completed" | "cancelled" | "refunded";

export interface Booking {
  id: string;
  fanId: string;
  championId: string;
  slotId: string;
  serviceKey?: PerformanceServiceKey;
  scheduledStart: string;
  durationMinutes: number;
  durationSeconds?: number;
  priceCents: number;
  currency: string;
  status: BookingStatus;
  // Message from the fan when placing the request (max 300 chars).
  userNote?: string;
  // Champion's reply — accompanies both accepts and declines (max 1000 chars).
  championNote?: string;
  championRespondedAt?: string;
  fanName?: string;
  paidAt?: string;
  paymentSimulated?: boolean;
  // legacy alias kept so previously-persisted data doesn't crash.
  fanNotes?: string;
  createdAt: string;
}

export type ChampionInteractionType = "message" | "support";
export type ChampionInteractionStatus =
  | "awaiting_reply"
  | "delivered"
  | "replied"
  | "refunded";

export interface ChampionInteraction {
  id: string;
  fanId: string;
  championId: string;
  type: ChampionInteractionType;
  userMessage: string;
  championReply?: string;
  fanName?: string;
  priceCents: number;
  currency: string;
  status: ChampionInteractionStatus;
  replyDueAt?: string;
  paidAt: string;
  createdAt: string;
}

export type PerformanceServiceKey =
  | "video"
  | "voice"
  | "training"
  | "tip"
  | "message"
  | "support";

export interface PerformanceServicePreference {
  key: PerformanceServiceKey;
  enabled: boolean;
  pricing: "per_minute" | "fixed";
  priceCents: number;
}

export interface PerformanceAvailabilityWindow {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotDurationSeconds: 30 | 45 | 60;
}

export interface ChampionPerformanceProfile {
  championId: string;
  services: PerformanceServicePreference[];
  availability: PerformanceAvailabilityWindow[];
  turnaroundSeconds: 10;
  updatedAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  fanId: string;
  championId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

const K = {
  USERS: "@mc/users@1",
  CURRENT_USER: "@mc/current-user@1",
  CHAMPIONS: "@mc/champions@1",
  SLOTS: "@mc/slots@1",
  BOOKINGS: "@mc/bookings@1",
  INTERACTIONS: "@mc/interactions@1",
  PERFORMANCE: "@mc/performance@1",
  CHAMPION_OPERATIONS_SEEDED: "@mc/champion-operations@1",
  REVIEWS: "@mc/reviews@1",
  FAVORITES: "@mc/favorites@1",
  SEEDED: "@mc/seeded@8",
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
async function writeJson(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

function uuid() {
  return "id-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function defaultPerformanceProfile(champion: Champion): ChampionPerformanceProfile {
  const perMinute = Math.max(
    100,
    Math.round(champion.ratePerCallCents / Math.max(1, champion.callDurationMinutes)),
  );
  return {
    championId: champion.id,
    services: [
      { key: "video", enabled: true, pricing: "per_minute", priceCents: perMinute },
      { key: "voice", enabled: true, pricing: "per_minute", priceCents: Math.round(perMinute * 0.65) },
      { key: "training", enabled: true, pricing: "fixed", priceCents: Math.round(champion.ratePerCallCents * 0.9) },
      { key: "tip", enabled: true, pricing: "fixed", priceCents: Math.round(champion.ratePerCallCents * 0.4) },
      { key: "message", enabled: true, pricing: "fixed", priceCents: Math.round(champion.ratePerCallCents * 0.3) },
      { key: "support", enabled: true, pricing: "fixed", priceCents: Math.round(champion.ratePerCallCents * 0.2) },
    ],
    availability: [
      {
        id: `${champion.id}-monday-evening`,
        weekday: 1,
        startTime: "18:00",
        endTime: "18:30",
        slotDurationSeconds: 60,
      },
    ],
    turnaroundSeconds: 10,
    updatedAt: new Date().toISOString(),
  };
}

function parseClock(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function generatePerformanceSlots(
  profile: ChampionPerformanceProfile,
  existingSlots: AvailabilitySlot[],
): AvailabilitySlot[] {
  const liveServices = profile.services.filter(
    (service) => service.enabled && (service.key === "video" || service.key === "voice"),
  );
  if (liveServices.length === 0) return [];

  const bookedKeys = new Set(
    existingSlots
      .filter((slot) => slot.championId === profile.championId && slot.isBooked)
      .map((slot) => `${slot.startsAt}:${slot.serviceKey ?? "video"}`),
  );
  const slots: AvailabilitySlot[] = [];
  const now = new Date();

  for (let dayOffset = 1; dayOffset <= 21; dayOffset += 1) {
    const day = new Date(now);
    day.setDate(day.getDate() + dayOffset);
    day.setHours(0, 0, 0, 0);

    for (const window of profile.availability) {
      if (day.getDay() !== window.weekday) continue;
      const startMinute = parseClock(window.startTime);
      const endMinute = parseClock(window.endTime);
      if (startMinute == null || endMinute == null || endMinute <= startMinute) continue;

      const windowStart = new Date(day);
      windowStart.setMinutes(startMinute);
      const windowEnd = new Date(day);
      windowEnd.setMinutes(endMinute);
      const stepSeconds = window.slotDurationSeconds + profile.turnaroundSeconds;

      for (
        let cursor = windowStart.getTime();
        cursor + window.slotDurationSeconds * 1000 <= windowEnd.getTime();
        cursor += stepSeconds * 1000
      ) {
        for (const service of liveServices) {
          const startsAt = new Date(cursor).toISOString();
          const bookedKey = `${startsAt}:${service.key}`;
          slots.push({
            id: `${profile.championId}-${service.key}-${cursor}`,
            championId: profile.championId,
            startsAt,
            durationMinutes: window.slotDurationSeconds / 60,
            durationSeconds: window.slotDurationSeconds,
            serviceKey: service.key,
            priceCents: Math.max(
              1,
              Math.round(service.priceCents * (window.slotDurationSeconds / 60)),
            ),
            isBooked: bookedKeys.has(bookedKey),
          });
        }
      }
    }
  }
  return slots;
}

// ---------- Seeding ----------
function generateSlots(champId: string, durationMin: number): AvailabilitySlot[] {
  const out: AvailabilitySlot[] = [];
  const now = new Date();
  for (let d = 1; d <= 7; d++) {
    for (const hour of [10, 15, 18]) {
      const start = new Date(now);
      start.setDate(start.getDate() + d);
      start.setHours(hour, 0, 0, 0);
      out.push({
        id: `${champId}-slot-${d}-${hour}`,
        championId: champId,
        startsAt: start.toISOString(),
        durationMinutes: durationMin,
        isBooked: false,
      });
    }
  }
  return out;
}

export async function ensureSeeded() {
  const seeded = await AsyncStorage.getItem(K.SEEDED);
  if (seeded !== "1") {
    await writeJson(K.USERS, SEED_USERS);
    await writeJson(K.CHAMPIONS, SEED_CHAMPIONS);
    const allSlots = SEED_CHAMPIONS.flatMap((c) =>
      generateSlots(c.id, c.callDurationMinutes),
    );
    await writeJson(K.SLOTS, allSlots);
    await writeJson(K.BOOKINGS, []);
    await writeJson(K.INTERACTIONS, []);
    await writeJson(K.REVIEWS, []);
    await AsyncStorage.setItem(K.SEEDED, "1");
  }

  await ensureChampionOperationsSeeded();
}

async function ensureChampionOperationsSeeded() {
  if (await AsyncStorage.getItem(K.CHAMPION_OPERATIONS_SEEDED) === "1") return;

  const champion = SEED_CHAMPIONS.find((item) => item.id === "champ-delpiero");
  if (!champion) return;

  const profiles = await readJson<ChampionPerformanceProfile[]>(K.PERFORMANCE, []);
  const profile = profiles.find((item) => item.championId === champion.id)
    ?? defaultPerformanceProfile(champion);
  if (!profiles.some((item) => item.championId === champion.id)) {
    profiles.push(profile);
    await writeJson(K.PERFORMANCE, profiles);
  }

  const existingSlots = await readJson<AvailabilitySlot[]>(K.SLOTS, []);
  const generatedSlots = generatePerformanceSlots(profile, existingSlots);
  const retainedSlots = existingSlots.filter(
    (slot) =>
      slot.championId !== champion.id ||
      slot.isBooked ||
      (slot.serviceKey !== "video" && slot.serviceKey !== "voice"),
  );
  await writeJson(K.SLOTS, [...retainedSlots, ...generatedSlots]);

  const now = new Date();
  const atFutureTime = (days: number, hour: number, minute: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  };
  const demoBookings = await readJson<Booking[]>(K.BOOKINGS, []);
  if (!demoBookings.some((booking) => booking.id.startsWith("demo-champion-calendar-"))) {
    demoBookings.push(
      {
        id: "demo-champion-calendar-confirmed-1",
        fanId: "demo-fan-giulia",
        fanName: "Giulia Rossi",
        championId: champion.id,
        slotId: "demo-calendar-slot-1",
        serviceKey: "video",
        scheduledStart: atFutureTime(1, 18, 0),
        durationMinutes: 1,
        durationSeconds: 60,
        priceCents: profile.services.find((item) => item.key === "video")?.priceCents ?? 1990,
        currency: "USD",
        status: "confirmed",
        userNote: "Vorrei chiederti come preparavi mentalmente le partite importanti.",
        paidAt: now.toISOString(),
        paymentSimulated: true,
        createdAt: now.toISOString(),
      },
      {
        id: "demo-champion-calendar-confirmed-2",
        fanId: "demo-fan-marco",
        fanName: "Marco Bianchi",
        championId: champion.id,
        slotId: "demo-calendar-slot-2",
        serviceKey: "voice",
        scheduledStart: atFutureTime(3, 18, 10),
        durationMinutes: 0.75,
        durationSeconds: 45,
        priceCents: Math.round(
          (profile.services.find((item) => item.key === "voice")?.priceCents ?? 1290) * 0.75,
        ),
        currency: "USD",
        status: "confirmed",
        userNote: "Un saluto per mio padre, tifoso da sempre.",
        paidAt: now.toISOString(),
        paymentSimulated: true,
        createdAt: now.toISOString(),
      },
      {
        id: "demo-champion-calendar-request-1",
        fanId: "demo-fan-sofia",
        fanName: "Sofia Romano",
        championId: champion.id,
        slotId: "demo-calendar-slot-3",
        serviceKey: "video",
        scheduledStart: atFutureTime(2, 18, 20),
        durationMinutes: 0.5,
        durationSeconds: 30,
        priceCents: Math.round(
          (profile.services.find((item) => item.key === "video")?.priceCents ?? 1990) * 0.5,
        ),
        currency: "USD",
        status: "awaiting_champion",
        userNote: "Qual è stato il gol più emozionante della tua carriera?",
        createdAt: now.toISOString(),
      },
    );
    await writeJson(K.BOOKINGS, demoBookings);
  }

  const demoInteractions = await readJson<ChampionInteraction[]>(K.INTERACTIONS, []);
  if (!demoInteractions.some((item) => item.id.startsWith("demo-champion-interaction-"))) {
    const replyDueAt = new Date(now);
    replyDueAt.setDate(replyDueAt.getDate() + 5);
    demoInteractions.push(
      {
        id: "demo-champion-interaction-message-1",
        fanId: "demo-fan-luca",
        fanName: "Luca Conti",
        championId: champion.id,
        type: "message",
        userMessage: "Come si mantiene la calma prima di un rigore decisivo?",
        priceCents: profile.services.find((item) => item.key === "message")?.priceCents ?? 4990,
        currency: "USD",
        status: "awaiting_reply",
        replyDueAt: replyDueAt.toISOString(),
        paidAt: now.toISOString(),
        createdAt: now.toISOString(),
      },
      {
        id: "demo-champion-interaction-support-1",
        fanId: "demo-fan-elena",
        fanName: "Elena Ricci",
        championId: champion.id,
        type: "support",
        userMessage: "Grazie per tutte le emozioni che ci hai regalato.",
        priceCents: profile.services.find((item) => item.key === "support")?.priceCents ?? 2990,
        currency: "USD",
        status: "delivered",
        paidAt: now.toISOString(),
        createdAt: now.toISOString(),
      },
    );
    await writeJson(K.INTERACTIONS, demoInteractions);
  }

  await AsyncStorage.setItem(K.CHAMPION_OPERATIONS_SEEDED, "1");
}

// ---------- Users / Auth ----------
export const users = {
  async list(): Promise<User[]> {
    return readJson<User[]>(K.USERS, []);
  },
  async findByEmail(email: string): Promise<User | null> {
    const all = await this.list();
    return all.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  },
  async getById(id: string): Promise<User | null> {
    const all = await this.list();
    return all.find((u) => u.id === id) ?? null;
  },
  async create(input: Omit<User, "id">): Promise<User> {
    const existing = await this.findByEmail(input.email);
    if (existing) throw new Error("Email already registered.");
    const all = await this.list();
    const u: User = { id: uuid(), ...input };
    all.push(u);
    await writeJson(K.USERS, all);
    return u;
  },
  async update(id: string, patch: Partial<User>): Promise<User> {
    const all = await this.list();
    const i = all.findIndex((u) => u.id === id);
    if (i < 0) throw new Error("User not found");
    const current = all[i];
    if (!current) throw new Error("User not found");
    all[i] = { ...current, ...patch, id };
    await writeJson(K.USERS, all);
    return all[i]!;
  },
  async signIn(email: string, password: string): Promise<User> {
    const u = await this.findByEmail(email);
    if (!u || u.password !== password) throw new Error("Credenziali non valide.");
    await AsyncStorage.setItem(K.CURRENT_USER, u.id);
    return u;
  },
  async signOut() {
    await AsyncStorage.removeItem(K.CURRENT_USER);
  },
  async currentId(): Promise<string | null> {
    return AsyncStorage.getItem(K.CURRENT_USER);
  },
  async current(): Promise<User | null> {
    const id = await this.currentId();
    if (!id) return null;
    return this.getById(id);
  },
};

// ---------- Champions ----------
export const champions = {
  async list(opts?: { category?: string; query?: string }): Promise<Champion[]> {
    let all = await readJson<Champion[]>(K.CHAMPIONS, []);
    if (opts?.category) all = all.filter((c) => c.category === opts.category);
    if (opts?.query) {
      const q = opts.query.trim().toLowerCase();
      if (q) {
        all = all.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.team.toLowerCase().includes(q) ||
            String(c.age) === q ||
            c.category.includes(q),
        );
      }
    }
    return all;
  },
  async getById(id: string): Promise<Champion | null> {
    const all = await readJson<Champion[]>(K.CHAMPIONS, []);
    return all.find((c) => c.id === id) ?? null;
  },
  async getByUserId(userId: string): Promise<Champion | null> {
    const all = await readJson<Champion[]>(K.CHAMPIONS, []);
    return all.find((c) => c.userId === userId || c.id === userId) ?? null;
  },
  async availableSlots(
    championId: string,
    serviceKey?: PerformanceServiceKey,
  ): Promise<AvailabilitySlot[]> {
    const slots = await readJson<AvailabilitySlot[]>(K.SLOTS, []);
    const now = Date.now();
    const hasServiceSpecificSlots = Boolean(
      serviceKey &&
      slots.some((slot) => slot.championId === championId && slot.serviceKey === serviceKey),
    );
    return slots
      .filter(
        (s) =>
          s.championId === championId &&
          !s.isBooked &&
          new Date(s.startsAt).getTime() > now &&
          (
            !serviceKey ||
            s.serviceKey === serviceKey ||
            (!hasServiceSpecificSlots && !s.serviceKey)
          ),
      )
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  },
  async upsertMe(userId: string, patch: Partial<Champion>) {
    const all = await readJson<Champion[]>(K.CHAMPIONS, []);
    const i = all.findIndex((c) => c.userId === userId);
    if (i >= 0) {
      const current = all[i];
      if (!current) throw new Error("Champion not found");
      all[i] = { ...current, ...patch };
    } else {
      const id = uuid();
      all.push({
        id, userId,
        name: patch.name ?? "New Champion",
        age: patch.age ?? 30,
        team: patch.team ?? "Independent",
        category: patch.category ?? "coach",
        photoUrl: patch.photoUrl ?? "",
        bio: patch.bio ?? "",
        ratePerCallCents: patch.ratePerCallCents ?? 4900,
        callDurationMinutes: patch.callDurationMinutes ?? 15,
        languages: patch.languages ?? ["EN"],
        services: patch.services ?? ["1:1 coaching"],
        career: patch.career ?? [],
        verified: false,
        ratingAvg: 0,
        ratingCount: 0,
        totalCalls: 0,
      });
      // seed some slots for the new champion
      const slots = await readJson<AvailabilitySlot[]>(K.SLOTS, []);
      slots.push(...generateSlots(id, patch.callDurationMinutes ?? 15));
      await writeJson(K.SLOTS, slots);
    }
    await writeJson(K.CHAMPIONS, all);
  },
};

// ---------- Champion performance preferences ----------
export const performanceProfiles = {
  async get(championId: string): Promise<ChampionPerformanceProfile | null> {
    const all = await readJson<ChampionPerformanceProfile[]>(K.PERFORMANCE, []);
    return all.find((profile) => profile.championId === championId) ?? null;
  },
  async getOrCreate(championId: string): Promise<ChampionPerformanceProfile> {
    const existing = await this.get(championId);
    if (existing) return existing;
    const champion = await champions.getById(championId);
    if (!champion) throw new Error("Champion non trovato");
    return this.save(defaultPerformanceProfile(champion));
  },
  async save(input: ChampionPerformanceProfile): Promise<ChampionPerformanceProfile> {
    const normalized: ChampionPerformanceProfile = {
      ...input,
      services: input.services.map((service) => ({
        ...service,
        priceCents: Math.max(0, Math.round(service.priceCents)),
      })),
      availability: input.availability.map((window) => ({
        ...window,
        id: window.id || uuid(),
      })),
      turnaroundSeconds: 10,
      updatedAt: new Date().toISOString(),
    };

    for (const window of normalized.availability) {
      const start = parseClock(window.startTime);
      const end = parseClock(window.endTime);
      if (start == null || end == null || end <= start) {
        throw new Error("Controlla gli orari delle fasce disponibili");
      }
      if ((end - start) * 60 < window.slotDurationSeconds) {
        throw new Error("La fascia è troppo breve per la durata scelta");
      }
    }

    const all = await readJson<ChampionPerformanceProfile[]>(K.PERFORMANCE, []);
    const index = all.findIndex((profile) => profile.championId === normalized.championId);
    if (index >= 0) all[index] = normalized;
    else all.push(normalized);
    await writeJson(K.PERFORMANCE, all);

    const existingSlots = await readJson<AvailabilitySlot[]>(K.SLOTS, []);
    const retained = existingSlots.filter(
      (slot) =>
        slot.championId !== normalized.championId ||
        slot.isBooked ||
        (slot.serviceKey !== "video" && slot.serviceKey !== "voice"),
    );
    const generated = generatePerformanceSlots(normalized, existingSlots);
    await writeJson(K.SLOTS, [...retained, ...generated]);
    return normalized;
  },
};

// ---------- Favorites ----------
// Local-first for the demo; the API can later be backed by a user profile.
export const favorites = {
  async list(): Promise<string[]> {
    return readJson<string[]>(K.FAVORITES, []);
  },
  async has(championId: string): Promise<boolean> {
    return (await this.list()).includes(championId);
  },
  async set(championId: string, value: boolean): Promise<string[]> {
    const current = new Set(await this.list());
    if (value) current.add(championId);
    else current.delete(championId);
    const next = [...current];
    await writeJson(K.FAVORITES, next);
    return next;
  },
  async toggle(championId: string): Promise<string[]> {
    return this.set(championId, !(await this.has(championId)));
  },
};

// ---------- Asynchronous Champion interactions ----------
export const interactions = {
  async listForUser(userId: string, role: UserRole): Promise<ChampionInteraction[]> {
    const all = await readJson<ChampionInteraction[]>(K.INTERACTIONS, []);
    let changed = false;
    const now = Date.now();
    for (const item of all) {
      if (
        item.type === "message" &&
        item.status === "awaiting_reply" &&
        item.replyDueAt &&
        new Date(item.replyDueAt).getTime() < now
      ) {
        item.status = "refunded";
        changed = true;
      }
    }
    if (changed) await writeJson(K.INTERACTIONS, all);
    return all
      .filter((item) => (role === "fan" ? item.fanId === userId : item.championId === userId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async create(input: {
    fanId: string;
    championId: string;
    type: ChampionInteractionType;
    userMessage: string;
    priceCents: number;
    fanName?: string;
  }): Promise<ChampionInteraction> {
    const message = input.userMessage.trim().slice(0, 300);
    if (!message) throw new Error("Scrivi un messaggio prima di continuare");

    const now = new Date();
    const replyDueAt = new Date(now);
    replyDueAt.setDate(replyDueAt.getDate() + 7);

    const interaction: ChampionInteraction = {
      id: uuid(),
      fanId: input.fanId,
      championId: input.championId,
      type: input.type,
      userMessage: message,
      fanName: input.fanName,
      priceCents: input.priceCents,
      currency: "USD",
      status: input.type === "message" ? "awaiting_reply" : "delivered",
      replyDueAt: input.type === "message" ? replyDueAt.toISOString() : undefined,
      paidAt: now.toISOString(),
      createdAt: now.toISOString(),
    };

    const all = await readJson<ChampionInteraction[]>(K.INTERACTIONS, []);
    all.push(interaction);
    await writeJson(K.INTERACTIONS, all);
    return interaction;
  },
  async reply(id: string, reply: string): Promise<ChampionInteraction> {
    const message = reply.trim().slice(0, 1000);
    if (!message) throw new Error("Scrivi una risposta prima di inviare");
    const all = await readJson<ChampionInteraction[]>(K.INTERACTIONS, []);
    const interaction = all.find((item) => item.id === id);
    if (!interaction) throw new Error("Messaggio non trovato");
    if (interaction.type !== "message" || interaction.status !== "awaiting_reply") {
      throw new Error("Questo messaggio non richiede più una risposta");
    }
    if (interaction.replyDueAt && new Date(interaction.replyDueAt).getTime() < Date.now()) {
      interaction.status = "refunded";
      await writeJson(K.INTERACTIONS, all);
      throw new Error("Il termine di 7 giorni è scaduto: il fan è stato rimborsato");
    }
    interaction.championReply = message;
    interaction.status = "replied";
    await writeJson(K.INTERACTIONS, all);
    return interaction;
  },
};

// ---------- Bookings ----------
export const bookings = {
  async listForUser(userId: string, role: UserRole): Promise<Booking[]> {
    const all = await readJson<Booking[]>(K.BOOKINGS, []);
    return all
      .filter((b) => (role === "fan" ? b.fanId === userId : b.championId === userId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getById(id: string): Promise<Booking | null> {
    const all = await readJson<Booking[]>(K.BOOKINGS, []);
    return all.find((b) => b.id === id) ?? null;
  },
  async create(input: {
    fanId: string;
    championId: string;
    slotId: string;
    userNote?: string;
    serviceKey?: PerformanceServiceKey;
  }): Promise<Booking> {
    const slots = await readJson<AvailabilitySlot[]>(K.SLOTS, []);
    const slot = slots.find((s) => s.id === input.slotId);
    if (!slot) throw new Error("Slot non trovato");
    if (slot.isBooked) throw new Error("Slot già prenotato");
    const champ = await champions.getById(input.championId);
    if (!champ) throw new Error("Champion non trovato");
    const fan = await users.getById(input.fanId);

    const all = await readJson<Booking[]>(K.BOOKINGS, []);
    const requestedStart = new Date(slot.startsAt).getTime();
    const requestedDurationSeconds = slot.durationSeconds ?? slot.durationMinutes * 60;
    const requestedEnd = requestedStart + requestedDurationSeconds * 1000;
    const hasConflict = all.some((booking) => {
      if (
        booking.championId !== input.championId ||
        ["declined", "cancelled", "refunded", "completed"].includes(booking.status)
      ) {
        return false;
      }
      const existingStart = new Date(booking.scheduledStart).getTime();
      const existingDurationSeconds = booking.durationSeconds ?? booking.durationMinutes * 60;
      const existingEnd = existingStart + existingDurationSeconds * 1000;
      return requestedStart < existingEnd + 10_000 && requestedEnd + 10_000 > existingStart;
    });
    if (hasConflict) {
      throw new Error("Questo orario non rispetta i 10 secondi tra due chiamate");
    }

    // Hold the slot as soon as the request is sent so nobody else can grab it
    // while the champion decides. If they decline, we free it again.
    for (const candidate of slots) {
      if (candidate.championId === input.championId && candidate.startsAt === slot.startsAt) {
        candidate.isBooked = true;
      }
    }
    await writeJson(K.SLOTS, slots);

    const booking: Booking = {
      id: uuid(),
      fanId: input.fanId,
      championId: input.championId,
      slotId: input.slotId,
      serviceKey: input.serviceKey ?? slot.serviceKey,
      scheduledStart: slot.startsAt,
      durationMinutes: slot.durationMinutes,
      durationSeconds: requestedDurationSeconds,
      priceCents: slot.priceCents ?? champ.ratePerCallCents,
      currency: "USD",
      status: "awaiting_champion",
      userNote: input.userNote?.slice(0, 300),
      fanName: fan?.displayName,
      createdAt: new Date().toISOString(),
    };
    all.push(booking);
    await writeJson(K.BOOKINGS, all);
    return booking;
  },
  // Champion accepts the request. No money is charged here — the fan still has
  // to pay via `pay()` after receiving the acceptance.
  async accept(id: string, note?: string): Promise<Booking> {
    const all = await readJson<Booking[]>(K.BOOKINGS, []);
    const b = all.find((x) => x.id === id);
    if (!b) throw new Error("Booking non trovato");
    if (b.status !== "awaiting_champion") throw new Error("Non più modificabile");
    b.status = "pending_payment";
    b.championNote = note?.slice(0, 1000);
    b.championRespondedAt = new Date().toISOString();
    await writeJson(K.BOOKINGS, all);
    return b;
  },
  async acceptAndCharge(id: string, note?: string): Promise<Booking> {
    const all = await readJson<Booking[]>(K.BOOKINGS, []);
    const booking = all.find((item) => item.id === id);
    if (!booking) throw new Error("Booking non trovato");
    if (booking.status !== "awaiting_champion") throw new Error("Non più modificabile");
    booking.status = "confirmed";
    booking.championNote = note?.slice(0, 1000);
    booking.championRespondedAt = new Date().toISOString();
    booking.paidAt = new Date().toISOString();
    booking.paymentSimulated = true;
    await writeJson(K.BOOKINGS, all);
    return booking;
  },
  async decline(id: string, note?: string): Promise<Booking> {
    const all = await readJson<Booking[]>(K.BOOKINGS, []);
    const b = all.find((x) => x.id === id);
    if (!b) throw new Error("Booking non trovato");
    if (b.status !== "awaiting_champion") throw new Error("Non più modificabile");
    b.status = "declined";
    b.championNote = note?.slice(0, 1000);
    b.championRespondedAt = new Date().toISOString();
    await writeJson(K.BOOKINGS, all);
    // Free the slot again so another fan can book it.
    const slots = await readJson<AvailabilitySlot[]>(K.SLOTS, []);
    for (const slot of slots) {
      if (slot.championId === b.championId && slot.startsAt === b.scheduledStart) {
        slot.isBooked = false;
      }
    }
    await writeJson(K.SLOTS, slots);
    return b;
  },
  async pay(id: string): Promise<Booking> {
    const all = await readJson<Booking[]>(K.BOOKINGS, []);
    const b = all.find((x) => x.id === id);
    if (!b) throw new Error("Booking non trovato");
    if (b.status !== "pending_payment") throw new Error("Stato non valido");
    b.status = "confirmed";
    b.paidAt = new Date().toISOString();
    b.paymentSimulated = true;
    await writeJson(K.BOOKINGS, all);
    return b;
  },
  async cancel(id: string): Promise<Booking> {
    const all = await readJson<Booking[]>(K.BOOKINGS, []);
    const b = all.find((x) => x.id === id);
    if (!b) throw new Error("Booking non trovato");
    if (!["awaiting_champion", "pending_payment", "confirmed"].includes(b.status))
      throw new Error("Non si può cancellare adesso");
    b.status = "cancelled";
    await writeJson(K.BOOKINGS, all);
    // free the slot
    const slots = await readJson<AvailabilitySlot[]>(K.SLOTS, []);
    for (const slot of slots) {
      if (slot.championId === b.championId && slot.startsAt === b.scheduledStart) {
        slot.isBooked = false;
      }
    }
    await writeJson(K.SLOTS, slots);
    return b;
  },
  async complete(id: string): Promise<Booking> {
    const all = await readJson<Booking[]>(K.BOOKINGS, []);
    const b = all.find((x) => x.id === id);
    if (!b) throw new Error("Booking non trovato");
    b.status = "completed";
    await writeJson(K.BOOKINGS, all);
    // Increment champion stats
    const list = await readJson<Champion[]>(K.CHAMPIONS, []);
    const c = list.find((c) => c.id === b.championId);
    if (c) {
      c.totalCalls += 1;
      await writeJson(K.CHAMPIONS, list);
    }
    return b;
  },
};

// ---------- Reviews ----------
export const reviews = {
  async listForChampion(championId: string): Promise<Review[]> {
    const all = await readJson<Review[]>(K.REVIEWS, []);
    return all.filter((r) => r.championId === championId);
  },
  async byBooking(bookingId: string): Promise<Review | null> {
    const all = await readJson<Review[]>(K.REVIEWS, []);
    return all.find((r) => r.bookingId === bookingId) ?? null;
  },
  async create(input: Omit<Review, "id" | "createdAt">): Promise<Review> {
    const all = await readJson<Review[]>(K.REVIEWS, []);
    if (all.some((r) => r.bookingId === input.bookingId))
      throw new Error("Recensione già inviata");
    const review: Review = { id: uuid(), createdAt: new Date().toISOString(), ...input };
    all.push(review);
    await writeJson(K.REVIEWS, all);

    // Update champion aggregate rating
    const champs = await readJson<Champion[]>(K.CHAMPIONS, []);
    const c = champs.find((c) => c.id === input.championId);
    if (c) {
      const chRev = all.filter((r) => r.championId === input.championId);
      c.ratingCount = chRev.length;
      c.ratingAvg = chRev.reduce((s, r) => s + r.rating, 0) / chRev.length;
      await writeJson(K.CHAMPIONS, champs);
    }
    return review;
  },
};
