-- =============================================================================
-- Meet Champion — Row Level Security policies
-- Migration: 20260201000100_rls_policies.sql
-- =============================================================================
-- Enables RLS on every table and defines policies for the three roles:
--   - fan       : default role, browses champions, books, reviews
--   - champion  : receives bookings, manages availability
--   - admin     : full access, verifies VIPs, resolves disputes
--
-- Admin check uses profiles.role = 'admin'. A helper function `is_admin()`
-- keeps policies readable.
-- =============================================================================

-- Helper: current user's role
create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public as $$
    select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
    select coalesce((select role from public.profiles where id = auth.uid()) = 'admin', false)
$$;

-- Enable RLS
alter table public.profiles           enable row level security;
alter table public.champion_profiles  enable row level security;
alter table public.vip_verifications  enable row level security;
alter table public.availability_slots enable row level security;
alter table public.bookings           enable row level security;
alter table public.payments           enable row level security;
alter table public.reviews            enable row level security;
alter table public.notifications      enable row level security;
alter table public.audit_log          enable row level security;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy "profiles_select_public"
    on public.profiles for select
    using (true);   -- profiles are publicly viewable (usernames, avatars)

create policy "profiles_update_self"
    on public.profiles for update
    using (id = auth.uid())
    with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
    -- users can update their own profile but cannot escalate their role

create policy "profiles_admin_all"
    on public.profiles for all
    using (public.is_admin())
    with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- champion_profiles
-- -----------------------------------------------------------------------------
create policy "champion_profiles_select_public"
    on public.champion_profiles for select
    using (verification_status = 'approved' or profile_id = auth.uid() or public.is_admin());

create policy "champion_profiles_insert_self"
    on public.champion_profiles for insert
    with check (profile_id = auth.uid());

create policy "champion_profiles_update_self"
    on public.champion_profiles for update
    using (profile_id = auth.uid())
    with check (
        profile_id = auth.uid()
        -- champions cannot self-approve their verification
        and verification_status = (
            select verification_status from public.champion_profiles where profile_id = auth.uid()
        )
    );

create policy "champion_profiles_admin_all"
    on public.champion_profiles for all
    using (public.is_admin())
    with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- vip_verifications
-- -----------------------------------------------------------------------------
create policy "vip_verifications_select_own_or_admin"
    on public.vip_verifications for select
    using (profile_id = auth.uid() or public.is_admin());

create policy "vip_verifications_insert_self"
    on public.vip_verifications for insert
    with check (profile_id = auth.uid());

create policy "vip_verifications_update_self_pending"
    on public.vip_verifications for update
    using (profile_id = auth.uid() and status = 'pending')
    with check (profile_id = auth.uid() and status = 'pending');

create policy "vip_verifications_admin_all"
    on public.vip_verifications for all
    using (public.is_admin())
    with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- availability_slots
-- -----------------------------------------------------------------------------
create policy "availability_select_public"
    on public.availability_slots for select
    using (true);

create policy "availability_mutate_champion"
    on public.availability_slots for all
    using (champion_id = auth.uid())
    with check (champion_id = auth.uid());

create policy "availability_admin_all"
    on public.availability_slots for all
    using (public.is_admin())
    with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- bookings — fans see their own, champions see theirs
-- -----------------------------------------------------------------------------
create policy "bookings_select_participants"
    on public.bookings for select
    using (fan_id = auth.uid() or champion_id = auth.uid() or public.is_admin());

create policy "bookings_insert_fan"
    on public.bookings for insert
    with check (fan_id = auth.uid());

create policy "bookings_update_participants"
    on public.bookings for update
    using (fan_id = auth.uid() or champion_id = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- payments — only the fan who paid and admins can see; edge functions use
-- service-role which bypasses RLS.
-- -----------------------------------------------------------------------------
create policy "payments_select_own_or_admin"
    on public.payments for select
    using (fan_id = auth.uid() or public.is_admin());

-- Mutation is done exclusively by service-role from the Stripe webhook edge
-- function. No client-side insert/update policy on purpose.

-- -----------------------------------------------------------------------------
-- reviews
-- -----------------------------------------------------------------------------
create policy "reviews_select_public"
    on public.reviews for select
    using (is_public = true or fan_id = auth.uid() or champion_id = auth.uid() or public.is_admin());

create policy "reviews_insert_fan"
    on public.reviews for insert
    with check (
        fan_id = auth.uid()
        and exists (
            select 1 from public.bookings b
            where b.id = booking_id
              and b.fan_id = auth.uid()
              and b.status = 'completed'
        )
    );

create policy "reviews_admin_moderate"
    on public.reviews for all
    using (public.is_admin())
    with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
create policy "notifications_select_own"
    on public.notifications for select
    using (profile_id = auth.uid() or public.is_admin());

create policy "notifications_update_own"
    on public.notifications for update
    using (profile_id = auth.uid());

-- Insert is done by triggers / service-role.

-- -----------------------------------------------------------------------------
-- audit_log — admins only
-- -----------------------------------------------------------------------------
create policy "audit_log_admin_only"
    on public.audit_log for all
    using (public.is_admin())
    with check (public.is_admin());
