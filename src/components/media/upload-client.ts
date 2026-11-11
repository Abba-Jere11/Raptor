"use client";

import { friendlyMediaError } from "@/lib/media/errors";
import { createBrowserSupabase } from "@/lib/supabase/client";

export async function uploadSigned(bucket: string, path: string, token: string, file: File): Promise<string | null> {
  try {
    const supabase = createBrowserSupabase();
    const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, {
      contentType: file.type || undefined,
      upsert: true,
    });
    return error ? friendlyMediaError(error.message) : null;
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Upload failed.";
    return friendlyMediaError(raw);
  }
}
