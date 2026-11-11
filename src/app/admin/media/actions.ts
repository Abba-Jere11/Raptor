"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import type { DocumentKind, MediaKind, MediaVisibility } from "@/lib/db/types";
import {
  bucketForOriginal,
  isDocumentKind,
  isHttpsUrl,
  mimeAllowed,
  mimeRejectedMessage,
  normaliseMime,
  safeAlt,
} from "@/lib/media/files";
import { allowedUploadOrigin, createMuxUpload, muxConfigured } from "@/lib/media/mux";
import { friendlyMediaError } from "@/lib/media/errors";
import { processMediaItem } from "@/lib/media/process";
import { routes } from "@/lib/routes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type UploadTicket =
  | { id: string; bucket: string; path: string; token: string }
  | { id: string; failed: true; error: string }
  | { error: string };

async function staffClient() {
  const { staff } = await requireStaff(["administrator", "ceo"]);
  return { staff, supabase: await createClient() };
}

async function assertVehicleEditable(supabase: Awaited<ReturnType<typeof createClient>>, vehicleId: string) {
  const { data } = await supabase.from("vehicles").select("status").eq("id", vehicleId).maybeSingle();
  if (!data) return "That vehicle could not be found.";
  if (data.status === "submitted") return "This vehicle is with the CEO. Withdraw the submission before changing media.";
  if (data.status === "withdrawn" || data.status === "sold") return "This vehicle can no longer be changed.";
  return null;
}

function refresh(vehicleId?: string) {
  revalidatePath(routes.admin.media);
  revalidatePath(routes.admin.vehicles);
  revalidatePath(routes.ceo.vehicles);
  if (vehicleId) {
    revalidatePath(routes.admin.vehicle(vehicleId));
    revalidatePath(routes.ceo.vehicle(vehicleId));
  }
}

async function signUpload(bucket: string, path: string): Promise<{ path: string; token: string } | { error: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path, { upsert: true });
  if (error || !data?.token) return { error: error?.message ?? "The upload could not be prepared." };
  return { path: data.path ?? path, token: data.token };
}

export async function prepareUpload(input: {
  vehicleId: string;
  kind: Extract<MediaKind, "photo" | "spin" | "document">;
  mime: string;
  fileName: string;
  documentKind?: string;
  visibility?: MediaVisibility;
}): Promise<UploadTicket> {
  const { staff, supabase } = await staffClient();
  const locked = await assertVehicleEditable(supabase, input.vehicleId);
  if (locked) return { error: locked };
  const mime = normaliseMime(input.mime, input.fileName);
  const alt = safeAlt(input.fileName);
  const documentKind: DocumentKind | null =
    input.kind === "document" && input.documentKind && isDocumentKind(input.documentKind) ? input.documentKind : null;
  if (input.kind === "document" && !documentKind) return { error: "Choose a document type." };
  const visibility: MediaVisibility = input.kind === "document" && documentKind !== "title" && input.visibility === "public" ? "public" : "internal";

  if (!mimeAllowed(input.kind, mime)) {
    const message = mimeRejectedMessage(input.kind);
    const { data, error } = await supabase
      .from("vehicle_media")
      .insert({
        vehicle_id: input.vehicleId,
        kind: input.kind,
        status: "failed",
        error: message,
        alt_text: alt,
        mime_type: mime || null,
        visibility,
        document_kind: documentKind,
        created_by: staff.id,
      })
      .select("id")
      .single();
    if (error || !data) return { error: message };
    refresh(input.vehicleId);
    return { id: data.id, failed: true, error: message };
  }

  const { data, error } = await supabase.rpc("begin_media_upload", {
    p_vehicle_id: input.vehicleId,
    p_kind: input.kind,
    p_mime: mime,
    p_alt: alt,
    p_document_kind: documentKind ?? undefined,
    p_visibility: visibility,
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row?.id || !row.original_path) {
    return { error: friendlyMediaError(error?.message, "The upload could not be prepared.") };
  }

  const signed = await signUpload(bucketForOriginal(input.kind), row.original_path);
  if ("error" in signed) {
    await supabase.from("vehicle_media").update({ status: "failed", error: signed.error }).eq("id", row.id);
    refresh(input.vehicleId);
    return { id: row.id, failed: true, error: signed.error };
  }
  return { id: row.id, bucket: bucketForOriginal(input.kind), path: signed.path, token: signed.token };
}

export async function finishUpload(
  id: string,
  options?: { refresh?: boolean },
): Promise<{ ok?: string; error?: string; vehicleId?: string }> {
  const { supabase } = await staffClient();
  const result = await processMediaItem(supabase, id);
  const { data } = await supabase.from("vehicle_media").select("vehicle_id").eq("id", id).maybeSingle();
  if (options?.refresh !== false) refresh(data?.vehicle_id);
  return { ...result, vehicleId: data?.vehicle_id ?? undefined };
}

/** One path refresh after a batch upload so pages are not revalidated per photo. */
export async function refreshVehicleMedia(vehicleId: string): Promise<void> {
  await requireStaff(["administrator", "ceo"]);
  refresh(vehicleId);
}

export async function replaceUpload(id: string, mime: string, fileName: string): Promise<UploadTicket> {
  const { supabase } = await staffClient();
  const { data: row, error } = await supabase.from("vehicle_media").select("*").eq("id", id).maybeSingle();
  if (error || !row) return { error: "That file could not be found." };
  if (row.kind === "video") return { error: "Replace a video with a new link or a new upload." };
  const nextMime = normaliseMime(mime, fileName);
  if (!mimeAllowed(row.kind, nextMime)) return { error: mimeRejectedMessage(row.kind) };
  const path = row.original_path ?? `${row.vehicle_id}/${row.id}/original`;
  const { error: updated } = await supabase
    .from("vehicle_media")
    .update({ original_path: path, mime_type: nextMime, status: "pending", error: null, alt_text: safeAlt(fileName) })
    .eq("id", id);
  if (updated) return { error: updated.message };
  const signed = await signUpload(bucketForOriginal(row.kind), path);
  if ("error" in signed) return { error: signed.error };
  return { id, bucket: bucketForOriginal(row.kind), path: signed.path, token: signed.token };
}

export async function reprocessMedia(id: string): Promise<{ ok?: string; error?: string }> {
  return finishUpload(id);
}

export async function saveFlaw(id: string, label: string): Promise<{ ok?: string; error?: string }> {
  const { supabase } = await staffClient();
  const trimmed = label.trim().slice(0, 120);
  const { data, error } = await supabase
    .from("vehicle_media")
    .update({ flaw_label: trimmed || null })
    .eq("id", id)
    .eq("kind", "photo")
    .select("vehicle_id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Only a photo can have a flaw label." };
  refresh(data.vehicle_id);
  return { ok: "Flaw label saved." };
}

export async function saveVisibility(id: string, visibility: MediaVisibility): Promise<{ ok?: string; error?: string }> {
  const { supabase } = await staffClient();
  const { data: row } = await supabase.from("vehicle_media").select("id, kind, document_kind, vehicle_id").eq("id", id).maybeSingle();
  if (!row || row.kind !== "document") return { error: "Only a document has this marking." };
  if (row.document_kind === "title" && visibility === "public") return { error: "Title images are private." };
  const { error } = await supabase.from("vehicle_media").update({ visibility }).eq("id", id);
  if (error) return { error: "Title images are private." };
  refresh(row.vehicle_id);
  return { ok: visibility === "public" ? "Marked for the future vehicle page." : "Marked internal." };
}

export async function reorderMedia(vehicleId: string, kind: "photo" | "spin", ids: string[]): Promise<{ ok?: string; error?: string }> {
  const { supabase } = await staffClient();
  const locked = await assertVehicleEditable(supabase, vehicleId);
  if (locked) return { error: locked };
  const { error } = await supabase.rpc("reorder_vehicle_media", { p_vehicle_id: vehicleId, p_kind: kind, p_ids: ids });
  if (error) return { error: friendlyMediaError(error.message, "The order could not be saved.") };
  refresh(vehicleId);
  return { ok: "Order saved." };
}

/** Make a ready photo the cover (moves it first and sets is_cover). */
export async function setCoverPhoto(vehicleId: string, photoId: string): Promise<{ ok?: string; error?: string }> {
  const { supabase } = await staffClient();
  const locked = await assertVehicleEditable(supabase, vehicleId);
  if (locked) return { error: locked };
  const { data: photos, error: listed } = await supabase
    .from("vehicle_media")
    .select("id, status, is_cover")
    .eq("vehicle_id", vehicleId)
    .eq("kind", "photo")
    .order("sort_order", { ascending: true });
  if (listed) return { error: friendlyMediaError(listed.message, "Photos could not be loaded.") };
  const rows = photos ?? [];
  const target = rows.find((photo) => photo.id === photoId);
  if (!target) return { error: "That photo could not be found." };
  if (target.status !== "ready") return { error: "Only a ready photo can be the cover." };
  if (target.is_cover) return { ok: "Already the cover." };
  const ids = [photoId, ...rows.filter((photo) => photo.id !== photoId).map((photo) => photo.id)];
  const { error } = await supabase.rpc("reorder_vehicle_media", {
    p_vehicle_id: vehicleId,
    p_kind: "photo",
    p_ids: ids,
  });
  if (error) return { error: friendlyMediaError(error.message, "The cover could not be changed.") };
  refresh(vehicleId);
  return { ok: "Cover photo updated." };
}

export async function removeMedia(id: string): Promise<{ ok?: string; error?: string }> {
  const { supabase } = await staffClient();
  const { data: row } = await supabase.from("vehicle_media").select("*").eq("id", id).maybeSingle();
  if (!row) return { error: "That file could not be found." };
  const locked = await assertVehicleEditable(supabase, row.vehicle_id);
  if (locked) return { error: locked };
  const admin = createAdminClient();
  if (row.original_path && row.kind !== "video") {
    await admin.storage.from(bucketForOriginal(row.kind)).remove([row.original_path]);
  }
  const renditions = [row.rendition_path, row.thumb_path].filter((path): path is string => Boolean(path));
  if (renditions.length) await admin.storage.from("media-renditions").remove(renditions);
  const { error } = await supabase.from("vehicle_media").delete().eq("id", id);
  if (error) return { error: friendlyMediaError(error.message, "That file could not be removed.") };

  // Prefer a ready photo as the next cover when the deleted one was cover.
  if (row.kind === "photo" && row.is_cover) {
    const { data: next } = await supabase
      .from("vehicle_media")
      .select("id")
      .eq("vehicle_id", row.vehicle_id)
      .eq("kind", "photo")
      .eq("status", "ready")
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next?.id) {
      await supabase.from("vehicle_media").update({ is_cover: false }).eq("vehicle_id", row.vehicle_id).eq("kind", "photo");
      await supabase.from("vehicle_media").update({ is_cover: true }).eq("id", next.id);
    }
  }

  refresh(row.vehicle_id);
  return { ok: row.kind === "photo" ? "Photo removed." : "Removed." };
}

export async function addVideoLink(vehicleId: string, url: string): Promise<{ ok?: string; error?: string }> {
  const { staff, supabase } = await staffClient();
  const trimmed = url.trim();
  if (!isHttpsUrl(trimmed)) return { error: "Paste a full https link." };
  const { error } = await supabase.from("vehicle_media").insert({
    vehicle_id: vehicleId,
    kind: "video",
    status: "ready",
    video_provider: "link",
    video_url: trimmed,
    visibility: "internal",
    alt_text: "Video link",
    created_by: staff.id,
  });
  if (error) return { error: error.message };
  refresh(vehicleId);
  return { ok: "Video link saved. It is not on the website." };
}

export async function beginVideoUpload(vehicleId: string, origin: string): Promise<{ id: string; url: string } | { error: string }> {
  const { staff, supabase } = await staffClient();
  if (!muxConfigured()) return { error: "Video upload is not connected yet. Paste an https link, or add the Mux keys." };
  if (!allowedUploadOrigin(origin)) return { error: "This address cannot upload video." };
  const { data, error } = await supabase
    .from("vehicle_media")
    .insert({
      vehicle_id: vehicleId,
      kind: "video",
      status: "pending",
      video_provider: "mux",
      visibility: "internal",
      alt_text: "Video upload",
      created_by: staff.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "The video record could not be created." };
  const upload = await createMuxUpload(data.id, origin);
  if ("error" in upload) {
    await supabase.from("vehicle_media").update({ status: "failed", error: upload.error }).eq("id", data.id);
    refresh(vehicleId);
    return { error: upload.error };
  }
  await supabase.from("vehicle_media").update({ mux_upload_id: upload.uploadId, status: "pending" }).eq("id", data.id);
  refresh(vehicleId);
  return { id: data.id, url: upload.url };
}

export async function markVideoUploaded(id: string): Promise<{ ok?: string; error?: string }> {
  const { supabase } = await staffClient();
  const { data, error } = await supabase
    .from("vehicle_media")
    .update({ status: "processing", error: null })
    .eq("id", id)
    .eq("kind", "video")
    .select("vehicle_id")
    .maybeSingle();
  if (error || !data) return { error: "That video could not be updated." };
  refresh(data.vehicle_id);
  return { ok: "Mux is processing the video. It will show here when it is ready or if it fails." };
}
