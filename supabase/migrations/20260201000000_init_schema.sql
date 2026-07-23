-- =============================================================================
-- Meet Champion — Initial Schema
-- Migration: 20260201000000_init_schema.sql
-- =============================================================================
-- Creates the core domain tables: profiles, champion_profiles, availability,
-- bookings, payments, reviews, notifications, and audit logs.
--
-- Design principles:
--  - All primary keys are UUIDs (portable, no auto-increment).
--  - `profiles.id` references auth.users.id (Supabase Auth).
--  - Timestamps use `timestamptz` (portable, no PG-specific behaviour beyond
--    standard SQL + UUID generation).
--  - All state uses `text` + CHECK constraints (portable, no PG-only enums
--    that complicate future migrations).
--  - Row-level security enabled on every table; policies added in a separate
--    migration file for clarity.
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- profiles — one row per authenticated user (fan / champion / admin)
-- -----------------------------------------------------------------------------
create table public.profiles (
    id             uuid primary key references auth.users(id) on delete cascade,
    email          text not null unique,
    full_name      text,
    display_name   text,
    avatar_url     text,
    bio            text,
    role           text not null default 'fan'
                     check (role in ('fan', 'champion', 'admin')),
    is_active      boolean not null default true,
    push_token     text,
    stripe_customer_id text,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_email_idx on public.profiles (email);

-- -----------------------------------------------------------------------------
-- champion_profiles — extended profile for verified Champions
-- One-to-one with profiles (only rows where profiles.role = 'champion')
-- -----------------------------------------------------------------------------
create table public.champion_profiles (
    profile_id            uuid primary key references public.profiles(id) on delete cascade,
    headline              text not null,
    category              text not null,           -- e.g. 'athlete', 'coach', 'celebrity'
    hourly_rate_cents     integer not null check (hourly_rate_cents >= 0),
    currency              text not null default 'USD',
    call_duration_minutes integer not null default 15
                            check (call_duration_minutes between 5 and 120),
    languages             text[] not null default '{en}',
    verification_status   text not null default 'pending'
                            check (verification_status in ('pending', 'in_review', 'approved', 'rejected')),
    verification_notes    text,
    verified_at           timestamptz,
    verified_by           uuid references public.profiles(id),
    stripe_account_id     text,          -- Stripe Connect account
    stripe_onboarded      boolean not null default false,
    total_calls           integer not null default 0,
    rating_average        numeric(3,2),
    rating_count          integer not null default 0,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now()
);

create index champion_profiles_status_idx on public.champion_profiles (verification_status);
create index champion_profiles_category_idx on public.champion_profiles (category);

-- -----------------------------------------------------------------------------
-- vip_verifications — documents & selfies submitted by Champions for approval
-- -----------------------------------------------------------------------------
create table public.vip_verifications (
    id                uuid primary key default gen_random_uuid(),
    profile_id        uuid not null references public.profiles(id) on delete cascade,
    document_url      text not null,      -- private storage path
    selfie_url        text not null,      -- private storage path
    social_links      jsonb,
    notes             text,
    status            text not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected')),
    reviewed_by       uuid references public.profiles(id),
    review_notes      text,
    reviewed_at       timestamptz,
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);

create index vip_verifications_profile_idx on public.vip_verifications (profile_id);
create index vip_verifications_status_idx on public.vip_verifications (status);

-- -----------------------------------------------------------------------------
-- availability_slots — recurring or one-off booking windows for a champion
-- -----------------------------------------------------------------------------
create table public.availability_slots (
    id             uuid primary key default gen_random_uuid(),
    champion_id    uuid not null references public.profiles(id) on delete cascade,
    starts_at      timestamptz not null,
    ends_at        timestamptz not null,
    is_booked      boolean not null default false,
    created_at     timestamptz not null default now(),
    check (ends_at > starts_at)
);

create index availability_slots_champion_idx on public.availability_slots (champion_id, starts_at);
create index availability_slots_open_idx on public.availability_slots (champion_id, starts_at)
    where is_booked = false;

-- -----------------------------------------------------------------------------
-- bookings — a fan books a slot with a champion
-- -----------------------------------------------------------------------------
create table public.bookings (
    id                     uuid primary key default gen_random_uuid(),
    fan_id                 uuid not null references public.profiles(id) on delete restrict,
    champion_id            uuid not null references public.profiles(id) on delete restrict,
    slot_id                uuid references public.availability_slots(id) on delete set null,
    scheduled_start        timestamptz not null,
    scheduled_end          timestamptz not null,
    duration_minutes       integer not null,
    price_cents            integer not null check (price_cents >= 0),
    platform_fee_cents     integer not null default 0,
    currency               text not null default 'USD',
    status                 text not null default 'pending_payment'
                             check (status in (
                               'pending_payment', 'confirmed', 'in_progress',
                               'completed', 'cancelled', 'refunded', 'disputed'
                             )),
    video_provider         text,
    video_room_id          text,
    video_room_url         text,
    fan_notes              text,
    cancellation_reason    text,
    created_at             timestamptz not null default now(),
    updated_at             timestamptz not null default now(),
    check (scheduled_end > scheduled_start),
    check (fan_id <> champion_id)
);

create index bookings_fan_idx on public.bookings (fan_id, scheduled_start desc);
create index bookings_champion_idx on public.bookings (champion_id, scheduled_start desc);
create index bookings_status_idx on public.bookings (status);

-- -----------------------------------------------------------------------------
-- payments — one row per Stripe payment intent tied to a booking
-- -----------------------------------------------------------------------------
create table public.payments (
    id                        uuid primary key default gen_random_uuid(),
    booking_id                uuid not null references public.bookings(id) on delete cascade,
    fan_id                    uuid not null references public.profiles(id) on delete restrict,
    stripe_payment_intent_id  text unique,
    stripe_charge_id          text,
    stripe_transfer_id        text,        -- Stripe Connect transfer to champion
    amount_cents              integer not null,
    platform_fee_cents        integer not null default 0,
    currency                  text not null default 'USD',
    status                    text not null default 'requires_payment_method'
                                check (status in (
                                  'requires_payment_method', 'requires_confirmation',
                                  'requires_action', 'processing', 'succeeded',
                                  'canceled', 'refunded', 'failed'
                                )),
    raw_stripe_event          jsonb,
    created_at                timestamptz not null default now(),
    updated_at                timestamptz not null default now()
);

create index payments_booking_idx on public.payments (booking_id);
create index payments_status_idx on public.payments (status);

-- -----------------------------------------------------------------------------
-- reviews — fan reviews a champion after a completed call
-- -----------------------------------------------------------------------------
create table public.reviews (
    id           uuid primary key default gen_random_uuid(),
    booking_id   uuid not null unique references public.bookings(id) on delete cascade,
    fan_id       uuid not null references public.profiles(id) on delete cascade,
    champion_id  uuid not null references public.profiles(id) on delete cascade,
    rating       integer not null check (rating between 1 and 5),
    comment      text,
    is_public    boolean not null default true,
    created_at   timestamptz not null default now()
);

create index reviews_champion_idx on public.reviews (champion_id, created_at desc);

-- -----------------------------------------------------------------------------
-- notifications — in-app / push notifications
-- -----------------------------------------------------------------------------
create table public.notifications (
    id           uuid primary key default gen_random_uuid(),
    profile_id   uuid not null references public.profiles(id) on delete cascade,
    type         text not null,       -- e.g. 'booking_confirmed', 'vip_approved'
    title        text not null,
    body         text not null,
    data         jsonb,
    read_at      timestamptz,
    created_at   timestamptz not null default now()
);

create index notifications_profile_idx on public.notifications (profile_id, created_at desc);
create index notifications_unread_idx on public.notifications (profile_id) where read_at is null;

-- -----------------------------------------------------------------------------
-- audit_log — admin-visible history of sensitive actions
-- -----------------------------------------------------------------------------
create table public.audit_log (
    id           uuid primary key default gen_random_uuid(),
    actor_id     uuid references public.profiles(id) on delete set null,
    action       text not null,
    entity_type  text not null,
    entity_id    uuid,
    metadata     jsonb,
    created_at   timestamptz not null default now()
);

create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);
create index audit_log_actor_idx on public.audit_log (actor_id, created_at desc);

-- -----------------------------------------------------------------------------
-- updated_at trigger helper
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger trg_profiles_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();

create trigger trg_champion_profiles_updated_at
    before update on public.champion_profiles
    for each row execute function public.set_updated_at();

create trigger trg_vip_verifications_updated_at
    before update on public.vip_verifications
    for each row execute function public.set_updated_at();

create trigger trg_bookings_updated_at
    before update on public.bookings
    for each row execute function public.set_updated_at();

create trigger trg_payments_updated_at
    before update on public.payments
    for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Auto-create profile row when a new user signs up via Supabase Auth
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    insert into public.profiles (id, email, full_name, display_name, role)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'role', 'fan')
    );
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Refresh champion rating aggregates when a review is inserted
-- -----------------------------------------------------------------------------
create or replace function public.refresh_champion_rating()
returns trigger language plpgsql as $$
begin
    update public.champion_profiles cp
    set rating_average = sub.avg_rating,
        rating_count   = sub.total
    from (
        select champion_id,
               round(avg(rating)::numeric, 2) as avg_rating,
               count(*) as total
        from public.reviews
        where champion_id = new.champion_id
        group by champion_id
    ) sub
    where cp.profile_id = sub.champion_id;
    return new;
end;
$$;

create trigger trg_reviews_refresh_rating
    after insert on public.reviews
    for each row execute function public.refresh_champion_rating();
