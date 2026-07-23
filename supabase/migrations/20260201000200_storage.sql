-- =============================================================================
-- Meet Champion — Storage buckets and policies
-- Migration: 20260201000200_storage.sql
-- =============================================================================
-- Creates three buckets:
--   - avatars           (public)         profile pictures
--   - vip-verifications (private)        VIP verification documents
--   - public-assets     (public)         marketing images, category icons
--
-- File-path convention (enforced via policies):
--   avatars/<user_id>/<filename>
--   vip-verifications/<user_id>/<filename>
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('vip-verifications', 'vip-verifications', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- avatars — anyone can read; authenticated users write only their own folder
-- -----------------------------------------------------------------------------
create policy "avatars_read_public"
    on storage.objects for select
    using (bucket_id = 'avatars');

create policy "avatars_insert_own_folder"
    on storage.objects for insert
    with check (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "avatars_update_own_folder"
    on storage.objects for update
    using (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "avatars_delete_own_folder"
    on storage.objects for delete
    using (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- -----------------------------------------------------------------------------
-- vip-verifications — private. Only the owner and admins can read.
-- -----------------------------------------------------------------------------
create policy "vip_verifications_read_own_or_admin"
    on storage.objects for select
    using (
        bucket_id = 'vip-verifications'
        and (
            auth.uid()::text = (storage.foldername(name))[1]
            or public.is_admin()
        )
    );

create policy "vip_verifications_insert_own"
    on storage.objects for insert
    with check (
        bucket_id = 'vip-verifications'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "vip_verifications_update_own_or_admin"
    on storage.objects for update
    using (
        bucket_id = 'vip-verifications'
        and (
            auth.uid()::text = (storage.foldername(name))[1]
            or public.is_admin()
        )
    );

create policy "vip_verifications_delete_own_or_admin"
    on storage.objects for delete
    using (
        bucket_id = 'vip-verifications'
        and (
            auth.uid()::text = (storage.foldername(name))[1]
            or public.is_admin()
        )
    );

-- -----------------------------------------------------------------------------
-- public-assets — public read, admin write
-- -----------------------------------------------------------------------------
create policy "public_assets_read"
    on storage.objects for select
    using (bucket_id = 'public-assets');

create policy "public_assets_admin_write"
    on storage.objects for all
    using (bucket_id = 'public-assets' and public.is_admin())
    with check (bucket_id = 'public-assets' and public.is_admin());
