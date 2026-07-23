// =============================================================================
// Storage service — provider-agnostic file uploads. Default: Supabase Storage.
// To switch to S3 or R2, implement the same interface and inject.
// =============================================================================
import type { SupabaseClient } from "@supabase/supabase-js";

export interface UploadInput {
  bucket: string;
  path: string;                         // e.g. "<uid>/avatar.jpg"
  file: Blob | File | ArrayBuffer | Uint8Array;
  contentType?: string;
  upsert?: boolean;
}

export interface StorageService {
  upload(input: UploadInput): Promise<{ path: string; publicUrl: string | null }>;
  getSignedUrl(bucket: string, path: string, expiresInSec?: number): Promise<string>;
  getPublicUrl(bucket: string, path: string): string;
  remove(bucket: string, paths: string[]): Promise<void>;
}

export function createStorageService(client: SupabaseClient): StorageService {
  return {
    async upload({ bucket, path, file, contentType, upsert }) {
      const { error } = await client.storage.from(bucket).upload(path, file as Blob, {
        contentType,
        upsert: upsert ?? false,
      });
      if (error) throw error;
      const publicUrl = client.storage.from(bucket).getPublicUrl(path).data.publicUrl ?? null;
      return { path, publicUrl };
    },
    async getSignedUrl(bucket, path, expiresInSec = 3600) {
      const { data, error } = await client.storage.from(bucket).createSignedUrl(path, expiresInSec);
      if (error) throw error;
      return data.signedUrl;
    },
    getPublicUrl(bucket, path) {
      return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    },
    async remove(bucket, paths) {
      const { error } = await client.storage.from(bucket).remove(paths);
      if (error) throw error;
    },
  };
}
