-- =============================================================================
-- Meet Champion — Business RPC functions
-- Migration: 20260201000300_rpc.sql
-- =============================================================================
-- Server-side helpers callable from the client via supabase.rpc().
-- Placed here (rather than in edge functions) when pure SQL is sufficient.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- rpc: list_champions
-- Returns approved, active champions with basic profile info.
-- Optional category filter, pagination.
-- -----------------------------------------------------------------------------
create or replace function public.list_champions(
    p_category text default null,
    p_limit    integer default 20,
    p_offset   integer default 0
)
returns table (
    profile_id            uuid,
    display_name          text,
    avatar_url            text,
    headline              text,
    category              text,
    hourly_rate_cents     integer,
    currency              text,
    call_duration_minutes integer,
    rating_average        numeric,
    rating_count          integer,
    total_calls           integer,
    languages             text[]
) language sql stable as $$
    select
        cp.profile_id,
        p.display_name,
        p.avatar_url,
        cp.headline,
        cp.category,
        cp.hourly_rate_cents,
        cp.currency,
        cp.call_duration_minutes,
        cp.rating_average,
        cp.rating_count,
        cp.total_calls,
        cp.languages
    from public.champion_profiles cp
    join public.profiles p on p.id = cp.profile_id
    where cp.verification_status = 'approved'
      and p.is_active
      and (p_category is null or cp.category = p_category)
    order by cp.rating_average desc nulls last, cp.total_calls desc
    limit p_limit offset p_offset;
$$;

-- -----------------------------------------------------------------------------
-- rpc: create_booking
-- Atomically reserves a slot and creates a pending_payment booking.
-- Actual Stripe PaymentIntent is created in the stripe-create-intent edge fn.
-- -----------------------------------------------------------------------------
create or replace function public.create_booking(
    p_champion_id uuid,
    p_slot_id     uuid,
    p_fan_notes   text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
    v_slot     public.availability_slots%rowtype;
    v_champ    public.champion_profiles%rowtype;
    v_booking  public.bookings%rowtype;
    v_fan_id   uuid := auth.uid();
    v_platform_fee_bps constant integer := 1500;   -- 15% platform fee
    v_duration integer;
    v_price    integer;
begin
    if v_fan_id is null then
        raise exception 'unauthenticated';
    end if;

    select * into v_slot from public.availability_slots
        where id = p_slot_id for update;

    if not found then
        raise exception 'slot_not_found';
    end if;
    if v_slot.is_booked then
        raise exception 'slot_already_booked';
    end if;
    if v_slot.champion_id <> p_champion_id then
        raise exception 'slot_champion_mismatch';
    end if;
    if v_slot.starts_at <= now() then
        raise exception 'slot_in_the_past';
    end if;

    select * into v_champ from public.champion_profiles
        where profile_id = p_champion_id;
    if not found then
        raise exception 'champion_not_found';
    end if;
    if v_champ.verification_status <> 'approved' then
        raise exception 'champion_not_verified';
    end if;

    v_duration := v_champ.call_duration_minutes;
    v_price := v_champ.hourly_rate_cents;

    update public.availability_slots
        set is_booked = true
        where id = p_slot_id;

    insert into public.bookings (
        fan_id, champion_id, slot_id,
        scheduled_start, scheduled_end, duration_minutes,
        price_cents, platform_fee_cents, currency, status, fan_notes
    ) values (
        v_fan_id, p_champion_id, p_slot_id,
        v_slot.starts_at, v_slot.ends_at, v_duration,
        v_price, (v_price * v_platform_fee_bps) / 10000,
        v_champ.currency, 'pending_payment', p_fan_notes
    ) returning * into v_booking;

    return v_booking;
end;
$$;

-- -----------------------------------------------------------------------------
-- rpc: cancel_booking (fan or champion, only before start)
-- -----------------------------------------------------------------------------
create or replace function public.cancel_booking(
    p_booking_id uuid,
    p_reason     text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
    v_booking public.bookings%rowtype;
    v_user    uuid := auth.uid();
begin
    select * into v_booking from public.bookings
        where id = p_booking_id for update;

    if not found then
        raise exception 'booking_not_found';
    end if;
    if v_booking.fan_id <> v_user and v_booking.champion_id <> v_user then
        raise exception 'forbidden';
    end if;
    if v_booking.status not in ('pending_payment', 'confirmed') then
        raise exception 'cannot_cancel_in_state_%', v_booking.status;
    end if;
    if v_booking.scheduled_start <= now() then
        raise exception 'cannot_cancel_started_booking';
    end if;

    update public.bookings
        set status = 'cancelled',
            cancellation_reason = p_reason
        where id = p_booking_id
        returning * into v_booking;

    if v_booking.slot_id is not null then
        update public.availability_slots
            set is_booked = false
            where id = v_booking.slot_id;
    end if;

    return v_booking;
end;
$$;

-- -----------------------------------------------------------------------------
-- rpc: complete_booking (called by video provider webhook via edge function)
-- -----------------------------------------------------------------------------
create or replace function public.complete_booking(
    p_booking_id uuid
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
    v_booking public.bookings%rowtype;
begin
    update public.bookings
        set status = 'completed'
        where id = p_booking_id and status in ('confirmed', 'in_progress')
        returning * into v_booking;

    if not found then
        raise exception 'booking_not_found_or_wrong_state';
    end if;

    update public.champion_profiles
        set total_calls = total_calls + 1
        where profile_id = v_booking.champion_id;

    return v_booking;
end;
$$;

grant execute on function public.list_champions to anon, authenticated;
grant execute on function public.create_booking to authenticated;
grant execute on function public.cancel_booking to authenticated;
grant execute on function public.complete_booking to service_role;
