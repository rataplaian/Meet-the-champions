import type { Session, User } from "@supabase/supabase-js";
import type {
  AuthService,
  AvailabilitySlot,
  Booking,
  BookingsService,
  ChampionListItem,
  ChampionProfile,
  ChampionsService,
  EmailService,
  NotificationsService,
  PaymentsService,
  Profile,
  StorageService,
  VideoCallProvider,
} from "@meet-champion/shared";
import {
  champions as demoChampionStore,
  ensureSeeded,
  users as demoUsers,
  type User as DemoUser,
} from "../store";

const now = new Date("2026-07-24T10:00:00.000Z");
const iso = (days: number, hour: number) => {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};

const demoFan: Profile = {
  id: "demo-fan",
  email: "fan@meetchampion.local",
  full_name: "Alex Fan",
  display_name: "Alex Fan",
  avatar_url: null,
  bio: null,
  role: "fan",
  is_active: true,
  push_token: null,
  stripe_customer_id: null,
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
};

const championProfiles: Record<string, Profile> = {
  "champ-del-piero": {
    id: "champ-del-piero",
    email: "alex.del-piero@demo.local",
    full_name: "Alessandro Del Piero",
    display_name: "Alessandro Del Piero",
    avatar_url: null,
    bio: "Demo profile",
    role: "champion",
    is_active: true,
    push_token: null,
    stripe_customer_id: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  },
  "champ-zidane": {
    id: "champ-zidane",
    email: "zinedine.zidane@demo.local",
    full_name: "Zinedine Zidane",
    display_name: "Zinedine Zidane",
    avatar_url: null,
    bio: "Demo profile",
    role: "champion",
    is_active: true,
    push_token: null,
    stripe_customer_id: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  },
  "champ-baggio": {
    id: "champ-baggio",
    email: "roberto.baggio@demo.local",
    full_name: "Roberto Baggio",
    display_name: "Roberto Baggio",
    avatar_url: null,
    bio: "Demo profile",
    role: "champion",
    is_active: true,
    push_token: null,
    stripe_customer_id: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  },
  "champ-maldini": {
    id: "champ-maldini",
    email: "paolo.maldini@demo.local",
    full_name: "Paolo Maldini",
    display_name: "Paolo Maldini",
    avatar_url: null,
    bio: "Demo profile",
    role: "champion",
    is_active: true,
    push_token: null,
    stripe_customer_id: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  },
};

const championDetails: Record<string, ChampionProfile> = {
  "champ-del-piero": demoChampion("champ-del-piero", "Iconic number 10 and captain.", "athlete", 29900, 1974, "Juventus", 1284, 4.9),
  "champ-zidane": demoChampion("champ-zidane", "Elite technique and leadership session.", "coach", 39900, 1972, "Real Madrid", 932, 5),
  "champ-baggio": demoChampion("champ-baggio", "Creativity, mindset and finishing.", "athlete", 27900, 1967, "Brescia", 721, 4.8),
  "champ-maldini": demoChampion("champ-maldini", "Defensive mastery and career mentoring.", "expert", 34900, 1968, "AC Milan", 1104, 4.9),
};

const slots: AvailabilitySlot[] = Object.keys(championDetails).flatMap((championId, index) => [
  demoSlot(`${championId}-slot-1`, championId, 1 + index, 15),
  demoSlot(`${championId}-slot-2`, championId, 2 + index, 18),
]);

const bookingsStore: Booking[] = [];
let currentSession: Session | null = null;
const listeners = new Set<(session: Session | null) => void>();

function profileFromDemoUser(user: DemoUser): Profile {
  return {
    id: user.id,
    email: user.email,
    full_name: user.displayName,
    display_name: user.displayName,
    avatar_url: user.avatarUrl ?? null,
    bio: null,
    role: user.role,
    is_active: true,
    push_token: null,
    stripe_customer_id: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

function demoChampion(
  profileId: string,
  headline: string,
  category: string,
  hourlyRate: number,
  birthYear: number,
  lastTeam: string,
  totalCalls: number,
  rating: number,
): ChampionProfile {
  return {
    profile_id: profileId,
    headline,
    category,
    hourly_rate_cents: hourlyRate,
    currency: "EUR",
    call_duration_minutes: 20,
    languages: ["IT", "EN"],
    verification_status: "approved",
    verification_notes: null,
    verified_at: now.toISOString(),
    verified_by: null,
    stripe_account_id: null,
    stripe_onboarded: true,
    total_calls: totalCalls,
    rating_average: rating,
    rating_count: Math.round(totalCalls / 3),
    birth_year: birthYear,
    last_team: lastTeam,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

function demoSlot(id: string, championId: string, days: number, hour: number): AvailabilitySlot {
  return {
    id,
    champion_id: championId,
    starts_at: iso(days, hour),
    ends_at: iso(days, hour + 1),
    is_booked: false,
    created_at: now.toISOString(),
  };
}

function makeDemoSession(profile: Profile): Session {
  const user = {
    id: profile.id,
    aud: "authenticated",
    role: "authenticated",
    email: profile.email,
    app_metadata: {},
    user_metadata: {
      display_name: profile.display_name,
      role: profile.role,
    },
    created_at: profile.created_at,
  } as User;

  return {
    access_token: "demo-access-token",
    refresh_token: "demo-refresh-token",
    expires_in: 3600,
    token_type: "bearer",
    user,
  } as Session;
}

function notify() {
  for (const listener of listeners) listener(currentSession);
}

function listItems(): ChampionListItem[] {
  return Object.values(championDetails).map((champ) => {
    const profile = championProfiles[champ.profile_id];
    return {
      ...champ,
      display_name: profile?.display_name ?? "Champion",
      avatar_url: profile?.avatar_url ?? null,
    };
  });
}

export function getDemoProfileById(id: string): Profile | null {
  return null;
}

export async function getDemoProfileByIdAsync(id: string): Promise<Profile | null> {
  await ensureSeeded();
  const user = await demoUsers.getById(id);
  if (user) return profileFromDemoUser(user);
  if (id === demoFan.id) return demoFan;
  return championProfiles[id] ?? null;
}

export async function updateDemoProfileById(
  id: string,
  patch: { displayName: string; avatarUrl: string | null },
): Promise<Profile> {
  await ensureSeeded();
  const updated = await demoUsers.update(id, patch);

  if (updated.role === "champion") {
    await demoChampionStore.upsertMe(id, {
      name: updated.displayName,
      photoUrl: updated.avatarUrl ?? "",
    });
  }

  if (currentSession?.user?.id === id) {
    currentSession = makeDemoSession(profileFromDemoUser(updated));
  }

  return profileFromDemoUser(updated);
}

export const demoAuth: AuthService = {
  async signUp({ email, password, displayName, role }) {
    await ensureSeeded();
    const created = await demoUsers.create({
      email,
      password,
      displayName,
      role: role ?? "fan",
    });
    await demoUsers.signIn(email, password);
    currentSession = makeDemoSession(profileFromDemoUser(created));
    notify();
    return { user: currentSession.user, session: currentSession };
  },
  async signIn(email, password) {
    await ensureSeeded();
    const user = await demoUsers.signIn(email, password);
    currentSession = makeDemoSession(profileFromDemoUser(user));
    notify();
    return currentSession;
  },
  async signOut() {
    await demoUsers.signOut();
    currentSession = null;
    notify();
  },
  async getSession() {
    await ensureSeeded();
    const user = await demoUsers.current();
    currentSession = user ? makeDemoSession(profileFromDemoUser(user)) : null;
    return currentSession;
  },
  onAuthStateChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};

export const demoChampions: ChampionsService = {
  async list(opts) {
    const items = listItems();
    return opts?.category ? items.filter((item) => item.category === opts.category) : items;
  },
  async getById(profileId) {
    const champion = championDetails[profileId];
    const profile = championProfiles[profileId];
    return champion && profile ? { ...champion, profile } : null;
  },
  async availableSlots(championId) {
    return slots.filter((slot) => slot.champion_id === championId && !slot.is_booked);
  },
  async upsertMyChampionProfile(input) {
    const profileId = currentSession?.user?.id ?? demoFan.id;
    const nextChampion = {
      ...demoChampion(profileId, input.headline ?? "Demo Champion", input.category ?? "expert", input.hourly_rate_cents ?? 19900, input.birth_year ?? 1990, input.last_team ?? "Demo FC", 0, 0),
      ...input,
      profile_id: profileId,
    };
    championDetails[profileId] = nextChampion;
    return nextChampion;
  },
  async addAvailability(startsAt, endsAt) {
    const championId = currentSession?.user?.id ?? demoFan.id;
    const slot: AvailabilitySlot = {
      id: `demo-slot-${slots.length + 1}`,
      champion_id: championId,
      starts_at: startsAt,
      ends_at: endsAt,
      is_booked: false,
      created_at: new Date().toISOString(),
    };
    slots.push(slot);
    return slot;
  },
  async deleteAvailability(slotId) {
    const index = slots.findIndex((slot) => slot.id === slotId);
    if (index >= 0) slots.splice(index, 1);
  },
};

export const demoBookings: BookingsService = {
  async create({ championId, slotId, fanNotes }) {
    const slot = slots.find((item) => item.id === slotId);
    const champion = championDetails[championId];
    if (!slot || !champion) throw new Error("demo_booking_unavailable");
    slot.is_booked = true;
    const booking: Booking = {
      id: `demo-booking-${bookingsStore.length + 1}`,
      fan_id: currentSession?.user?.id ?? demoFan.id,
      champion_id: championId,
      slot_id: slotId,
      scheduled_start: slot.starts_at,
      scheduled_end: slot.ends_at,
      duration_minutes: champion.call_duration_minutes,
      price_cents: champion.hourly_rate_cents,
      platform_fee_cents: Math.round(champion.hourly_rate_cents * 0.15),
      currency: champion.currency,
      status: "pending_payment",
      video_provider: "demo",
      video_room_id: null,
      video_room_url: null,
      fan_notes: fanNotes ?? "Demo booking request",
      cancellation_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    bookingsStore.unshift(booking);
    return booking;
  },
  async cancel(bookingId, reason) {
    const booking = bookingsStore.find((item) => item.id === bookingId);
    if (!booking) throw new Error("booking_not_found");
    booking.status = "cancelled";
    booking.cancellation_reason = reason ?? null;
    return booking;
  },
  async getMy() {
    return bookingsStore;
  },
  async getById(bookingId) {
    return bookingsStore.find((item) => item.id === bookingId) ?? null;
  },
  async review() {},
};

export const demoPayments: PaymentsService = {
  async createIntent(bookingId) {
    return {
      client_secret: `demo_secret_${bookingId}`,
      payment_intent_id: `demo_pi_${bookingId}`,
    };
  },
};

export const demoVideo: VideoCallProvider = {
  async getRoomForBooking(bookingId) {
    return {
      room_id: `demo-room-${bookingId}`,
      room_url: "https://example.com/demo-video-room",
      token: "demo-video-token",
      provider: "demo",
    };
  },
};

export const demoEmail: EmailService = {
  async send() {
    return { id: "demo-email" };
  },
};

export const demoStorage: StorageService = {
  async upload({ bucket, path }) {
    return { path: `${bucket}/${path}`, publicUrl: null };
  },
  async getSignedUrl(bucket, path) {
    return `demo://${bucket}/${path}`;
  },
  getPublicUrl(bucket, path) {
    return `demo://${bucket}/${path}`;
  },
  async remove() {},
};

export const demoNotifications: NotificationsService = {
  async list() {
    return [];
  },
  async markRead() {},
  async markAllRead() {},
  async registerPushToken() {},
};
