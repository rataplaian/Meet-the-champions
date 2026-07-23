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

export interface Champion {
  id: string;
  userId?: string;                // if the champion is a registered user
  name: string;
  age: number;
  team: string;
  category: ChampionCategory;
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
  isBooked: boolean;
}

export type BookingStatus =
  | "pending_payment" | "confirmed" | "in_progress"
  | "completed" | "cancelled" | "refunded";

export interface Booking {
  id: string;
  fanId: string;
  championId: string;
  slotId: string;
  scheduledStart: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  status: BookingStatus;
  fanNotes?: string;
  createdAt: string;
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
  REVIEWS: "@mc/reviews@1",
  SEEDED: "@mc/seeded@2",
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
  if (seeded === "1") return;
  await writeJson(K.USERS, SEED_USERS);
  await writeJson(K.CHAMPIONS, SEED_CHAMPIONS);
  const allSlots = SEED_CHAMPIONS.flatMap((c) =>
    generateSlots(c.id, c.callDurationMinutes),
  );
  await writeJson(K.SLOTS, allSlots);
  await writeJson(K.BOOKINGS, []);
  await writeJson(K.REVIEWS, []);
  await AsyncStorage.setItem(K.SEEDED, "1");
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
    all[i] = { ...all[i], ...patch, id };
    await writeJson(K.USERS, all);
    return all[i];
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
  async availableSlots(championId: string): Promise<AvailabilitySlot[]> {
    const slots = await readJson<AvailabilitySlot[]>(K.SLOTS, []);
    const now = Date.now();
    return slots
      .filter((s) => s.championId === championId && !s.isBooked && new Date(s.startsAt).getTime() > now)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  },
  async upsertMe(userId: string, patch: Partial<Champion>) {
    const all = await readJson<Champion[]>(K.CHAMPIONS, []);
    const i = all.findIndex((c) => c.userId === userId);
    if (i >= 0) {
      all[i] = { ...all[i], ...patch };
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
  async create(input: { fanId: string; championId: string; slotId: string; fanNotes?: string }): Promise<Booking> {
    const slots = await readJson<AvailabilitySlot[]>(K.SLOTS, []);
    const slot = slots.find((s) => s.id === input.slotId);
    if (!slot) throw new Error("Slot non trovato");
    if (slot.isBooked) throw new Error("Slot già prenotato");
    const champ = await champions.getById(input.championId);
    if (!champ) throw new Error("Champion non trovato");

    slot.isBooked = true;
    await writeJson(K.SLOTS, slots);

    const booking: Booking = {
      id: uuid(),
      fanId: input.fanId,
      championId: input.championId,
      slotId: input.slotId,
      scheduledStart: slot.startsAt,
      durationMinutes: slot.durationMinutes,
      priceCents: champ.ratePerCallCents,
      currency: "USD",
      status: "pending_payment",
      fanNotes: input.fanNotes,
      createdAt: new Date().toISOString(),
    };
    const all = await readJson<Booking[]>(K.BOOKINGS, []);
    all.push(booking);
    await writeJson(K.BOOKINGS, all);
    return booking;
  },
  async pay(id: string): Promise<Booking> {
    const all = await readJson<Booking[]>(K.BOOKINGS, []);
    const b = all.find((x) => x.id === id);
    if (!b) throw new Error("Booking non trovato");
    if (b.status !== "pending_payment") throw new Error("Stato non valido");
    b.status = "confirmed";
    await writeJson(K.BOOKINGS, all);
    return b;
  },
  async cancel(id: string): Promise<Booking> {
    const all = await readJson<Booking[]>(K.BOOKINGS, []);
    const b = all.find((x) => x.id === id);
    if (!b) throw new Error("Booking non trovato");
    if (!["pending_payment", "confirmed"].includes(b.status))
      throw new Error("Non si può cancellare adesso");
    b.status = "cancelled";
    await writeJson(K.BOOKINGS, all);
    // free the slot
    const slots = await readJson<AvailabilitySlot[]>(K.SLOTS, []);
    const s = slots.find((s) => s.id === b.slotId);
    if (s) {
      s.isBooked = false;
      await writeJson(K.SLOTS, slots);
    }
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
