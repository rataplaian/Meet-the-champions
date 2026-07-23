-- =============================================================================
-- Meet Champion — Add birth_year + last_team to champion_profiles
-- Migration: 20260201000400_champion_bio_fields.sql
-- =============================================================================
-- The FIFA-style card shows only NAME · AGE · LAST TEAM. Age is computed from
-- birth_year (kept as integer to avoid timezone issues). last_team is a free
-- text field (e.g. "Real Madrid", "Manchester City").
-- =============================================================================

alter table public.champion_profiles
    add column if not exists birth_year integer
        check (birth_year is null or birth_year between 1900 and extract(year from now())::int),
    add column if not exists last_team text;

-- Update list_champions to include the new fields.
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
    languages             text[],
    birth_year            integer,
    last_team             text
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
        cp.languages,
        cp.birth_year,
        cp.last_team
    from public.champion_profiles cp
    join public.profiles p on p.id = cp.profile_id
    where cp.verification_status = 'approved'
      and p.is_active
      and (p_category is null or cp.category = p_category)
    order by cp.rating_average desc nulls last, cp.total_calls desc
    limit p_limit offset p_offset;
$$;

grant execute on function public.list_champions to anon, authenticated;
