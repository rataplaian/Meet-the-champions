-- =============================================================================
-- Meet Champion — Demo seed data
-- Idempotent: safe to re-run. Uses fixed UUIDs so migrations don't drift.
-- =============================================================================
-- NOTE: this seed inserts profile rows directly (bypassing Supabase Auth).
-- To create real auth users bound to these profiles, run
-- `supabase/scripts/create_demo_users.ts` — it creates auth.users via the
-- admin API with the passwords documented in docs/CODEX_HANDOFF.md.
-- =============================================================================

-- Wipe demo data (idempotency)
delete from public.reviews            where booking_id in (select id from public.bookings where fan_notes like '%[demo]%');
delete from public.payments           where booking_id in (select id from public.bookings where fan_notes like '%[demo]%');
delete from public.bookings           where fan_notes like '%[demo]%';
delete from public.availability_slots where champion_id in (
    '00000000-0000-0000-0000-00000000c001',
    '00000000-0000-0000-0000-00000000c002',
    '00000000-0000-0000-0000-00000000c003'
);
delete from public.vip_verifications  where profile_id in (
    '00000000-0000-0000-0000-00000000c001',
    '00000000-0000-0000-0000-00000000c002',
    '00000000-0000-0000-0000-00000000c003'
);
delete from public.champion_profiles  where profile_id in (
    '00000000-0000-0000-0000-00000000c001',
    '00000000-0000-0000-0000-00000000c002',
    '00000000-0000-0000-0000-00000000c003'
);

-- -----------------------------------------------------------------------------
-- Profiles (seed rows only; auth.users are created by the accompanying script)
-- -----------------------------------------------------------------------------
insert into public.profiles (id, email, full_name, display_name, role, bio, avatar_url)
values
    ('00000000-0000-0000-0000-0000000000ad', 'admin@meetchampion.local',   'Root Admin',       'admin',       'admin',    'Platform administrator.', null),
    ('00000000-0000-0000-0000-0000000000f1', 'fan1@meetchampion.local',    'Alex Fan',         'alex.fan',    'fan',      'Sports enthusiast.', null),
    ('00000000-0000-0000-0000-0000000000f2', 'fan2@meetchampion.local',    'Sam Supporter',    'sam.support', 'fan',      'Loves 1:1 mentoring.', null),
    ('00000000-0000-0000-0000-00000000c001', 'champ1@meetchampion.local',  'Marta Rossi',      'marta.rossi', 'champion', 'Olympic runner, coach.', null),
    ('00000000-0000-0000-0000-00000000c002', 'champ2@meetchampion.local',  'Jordan Steel',     'jordan',      'champion', 'Startup founder & mentor.', null),
    ('00000000-0000-0000-0000-00000000c003', 'champ3@meetchampion.local',  'Nina Voice',       'nina.voice',  'champion', 'Award-winning musician.', null)
on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        display_name = excluded.display_name,
        role = excluded.role,
        bio = excluded.bio;

-- -----------------------------------------------------------------------------
-- Champion profiles
-- -----------------------------------------------------------------------------
insert into public.champion_profiles
    (profile_id, headline, category, hourly_rate_cents, currency, call_duration_minutes,
     languages, verification_status, verified_at)
values
    ('00000000-0000-0000-0000-00000000c001',
     'Train like an Olympian — one-on-one coaching', 'athlete', 4900, 'USD', 15,
     '{en,it}', 'approved', now() - interval '10 days'),
    ('00000000-0000-0000-0000-00000000c002',
     'Startup mentorship, product & fundraising',    'coach',   9900, 'USD', 30,
     '{en}',    'approved', now() - interval '30 days'),
    ('00000000-0000-0000-0000-00000000c003',
     'Voice lessons & artist career advice',         'celebrity', 12900, 'USD', 20,
     '{en,fr}', 'pending', null)
on conflict (profile_id) do update
    set headline = excluded.headline,
        category = excluded.category,
        hourly_rate_cents = excluded.hourly_rate_cents,
        currency = excluded.currency,
        call_duration_minutes = excluded.call_duration_minutes,
        languages = excluded.languages,
        verification_status = excluded.verification_status,
        verified_at = excluded.verified_at;

-- -----------------------------------------------------------------------------
-- Availability slots (next 7 days, morning/afternoon)
-- -----------------------------------------------------------------------------
insert into public.availability_slots (champion_id, starts_at, ends_at)
select
    c.profile_id,
    d + t,
    d + t + make_interval(mins => c.call_duration_minutes)
from public.champion_profiles c
cross join generate_series(
    date_trunc('day', now() + interval '1 day'),
    date_trunc('day', now() + interval '8 days'),
    interval '1 day'
) d
cross join (values
    (interval '10 hours'),
    (interval '15 hours'),
    (interval '18 hours')
) as slots(t)
where c.verification_status = 'approved'
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- VIP verification example (pending, waiting for admin)
-- -----------------------------------------------------------------------------
insert into public.vip_verifications
    (profile_id, document_url, selfie_url, social_links, notes, status)
values
    ('00000000-0000-0000-0000-00000000c003',
     'vip-verifications/00000000-0000-0000-0000-00000000c003/passport.jpg',
     'vip-verifications/00000000-0000-0000-0000-00000000c003/selfie.jpg',
     '{"instagram":"@nina.voice","website":"https://ninavoice.example"}'::jsonb,
     'Please verify me. [demo]',
     'pending')
on conflict do nothing;
