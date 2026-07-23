// =============================================================================
// Meet Champion — Domain types
// The single source of truth mirroring the Supabase schema in
// /supabase/migrations. Keep in sync manually or regenerate with
// `supabase gen types typescript` if you prefer generated types.
// =============================================================================

export type UUID = string;
export type Timestamp = string; // ISO 8601 (timestamptz)

export type UserRole = "fan" | "champion" | "admin";

export interface Profile {
  id: UUID;
  email: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  is_active: boolean;
  push_token: string | null;
  stripe_customer_id: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type VerificationStatus = "pending" | "in_review" | "approved" | "rejected";

export interface ChampionProfile {
  profile_id: UUID;
  headline: string;
  category: string;
  hourly_rate_cents: number;
  currency: string;
  call_duration_minutes: number;
  languages: string[];
  verification_status: VerificationStatus;
  verification_notes: string | null;
  verified_at: Timestamp | null;
  verified_by: UUID | null;
  stripe_account_id: string | null;
  stripe_onboarded: boolean;
  total_calls: number;
  rating_average: number | null;
  rating_count: number;
  birth_year: number | null;
  last_team: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ChampionListItem extends Pick<ChampionProfile,
  "profile_id" | "headline" | "category" | "hourly_rate_cents" | "currency"
  | "call_duration_minutes" | "rating_average" | "rating_count" | "total_calls" | "languages"
  | "birth_year" | "last_team"
> {
  display_name: string | null;
  avatar_url: string | null;
}

export interface VipVerification {
  id: UUID;
  profile_id: UUID;
  document_url: string;
  selfie_url: string;
  social_links: Record<string, string> | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: UUID | null;
  review_notes: string | null;
  reviewed_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface AvailabilitySlot {
  id: UUID;
  champion_id: UUID;
  starts_at: Timestamp;
  ends_at: Timestamp;
  is_booked: boolean;
  created_at: Timestamp;
}

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "refunded"
  | "disputed";

export interface Booking {
  id: UUID;
  fan_id: UUID;
  champion_id: UUID;
  slot_id: UUID | null;
  scheduled_start: Timestamp;
  scheduled_end: Timestamp;
  duration_minutes: number;
  price_cents: number;
  platform_fee_cents: number;
  currency: string;
  status: BookingStatus;
  video_provider: string | null;
  video_room_id: string | null;
  video_room_url: string | null;
  fan_notes: string | null;
  cancellation_reason: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type PaymentStatus =
  | "requires_payment_method"
  | "requires_confirmation"
  | "requires_action"
  | "processing"
  | "succeeded"
  | "canceled"
  | "refunded"
  | "failed";

export interface Payment {
  id: UUID;
  booking_id: UUID;
  fan_id: UUID;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  stripe_transfer_id: string | null;
  amount_cents: number;
  platform_fee_cents: number;
  currency: string;
  status: PaymentStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Review {
  id: UUID;
  booking_id: UUID;
  fan_id: UUID;
  champion_id: UUID;
  rating: number;
  comment: string | null;
  is_public: boolean;
  created_at: Timestamp;
}

export interface Notification {
  id: UUID;
  profile_id: UUID;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read_at: Timestamp | null;
  created_at: Timestamp;
}
