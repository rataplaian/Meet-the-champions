-- =============================================================================
-- Meet Champion — User theme preferences
-- Migration: 20260201000500_theme_preferences.sql
-- =============================================================================
-- Stores the user's chosen decorative theme. Never contains security-relevant
-- data. Null / invalid values must fall back to the "default" preset at the
-- application layer — the app must NEVER refuse to start because of a theme.
-- =============================================================================

alter table public.profiles
    add column if not exists theme_preferences jsonb;

-- Optional sanity check: theme_preferences must be a JSON object when present.
alter table public.profiles
    add constraint profiles_theme_preferences_is_object
    check (theme_preferences is null or jsonb_typeof(theme_preferences) = 'object')
    not valid;

-- Existing rows are fine (null), so we validate the constraint for new writes only.
