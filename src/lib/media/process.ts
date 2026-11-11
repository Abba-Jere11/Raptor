import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { friendlyMediaError } from "./errors";
import { BUCKETS, bucketForOriginal, IMAGE_READ_ERROR, IMAGE_TYPES } from "./files";
import { renderStill } from "./render";

type Client = SupabaseClient<Database>;

async function fail(supabase: Client, id: string, message: string, byteSize?: number) {
  const friendly = friendlyMediaError(message);
  await supabase
    .from("vehicle_media")
    .update({ status: "failed", error: friendly, ...(byteSize === undefined ? {} : { byte_size: byteSize }) })
    .eq("id", id);
  return { error: friendly };
}

/** Download the private original and write WebP renditions, or accept a PDF document. */
export async function processMediaItem(supabase: Client, id: string): Promise<{ ok?: string; error?: string }> {
  const { data: row, error } = await supabase.from("vehicle_media").select("*").eq("id", id).maybeSingle();
  if (error || !row) return { error: "That file could not be found." };
  if (row.kind === "video") return { error: "Video is stored with the video host, not as an image." };
  if (!row.original_path) return fail(supabase, id, "The file was not stored. Choose it again.");

  await supabase.from("vehicle_media").update({ status: "processing", error: null }).eq("id", id);

  const admin = createAdminClient();
  const downloaded = await admin.storage.from(bucketForOriginal(row.kind)).download(row.original_path);
  if (downloaded.error || !downloaded.data) return fail(supabase, id, "The file was not stored. Choose it again.");

  const buffer = Buffer.from(await downloaded.data.arrayBuffer());
  if (buffer.length === 0) return fail(supabase, id, "The file was empty. Choose it again.", 0);

  const header = buffer.subarray(0, 5).toString();
  if (row.kind === "document" && (row.mime_type === "application/pdf" || header === "%PDF-")) {
    if (header !== "%PDF-") return fail(supabase, id, "This file could not be read as a PDF.", buffer.length);
    const { error: saved } = await supabase
      .from("vehicle_media")
      .update({ status: "ready", error: null, byte_size: buffer.length, rendition_bytes: 0, rendition_path: null, thumb_path: null })
      .eq("id", id);
    if (saved) return fail(supabase, id, "The document could not be saved.", buffer.length);
    return { ok: "Document stored." };
  }

  if (row.mime_type && !(IMAGE_TYPES as readonly string[]).includes(row.mime_type) && row.kind !== "document") {
    return fail(supabase, id, IMAGE_READ_ERROR, buffer.length);
  }

  try {
    const rendered = await renderStill(buffer);
    const galleryPath = `${row.vehicle_id}/${row.id}/gallery.webp`;
    const thumbPath = `${row.vehicle_id}/${row.id}/thumb.webp`;
    const gallery = await admin.storage.from(BUCKETS.renditions).upload(galleryPath, rendered.gallery, {
      contentType: "image/webp",
      upsert: true,
    });
    if (gallery.error) throw new Error(gallery.error.message);
    const thumb = await admin.storage.from(BUCKETS.renditions).upload(thumbPath, rendered.thumb, {
      contentType: "image/webp",
      upsert: true,
    });
    if (thumb.error) throw new Error(thumb.error.message);
    const { error: saved } = await supabase
      .from("vehicle_media")
      .update({
        status: "ready",
        error: null,
        byte_size: buffer.length,
        rendition_bytes: rendered.gallery.length + rendered.thumb.length,
        rendition_path: galleryPath,
        thumb_path: thumbPath,
        width: rendered.width,
        height: rendered.height,
      })
      .eq("id", id);
    if (saved) return fail(supabase, id, "The image could not be saved.", buffer.length);
    return { ok: "Image ready." };
  } catch (err) {
    if (err instanceof Error && err.message === IMAGE_READ_ERROR) {
      return fail(supabase, id, IMAGE_READ_ERROR, buffer.length);
    }
    const raw = err instanceof Error ? err.message : IMAGE_READ_ERROR;
    return fail(supabase, id, friendlyMediaError(raw, IMAGE_READ_ERROR), buffer.length);
  }
}
