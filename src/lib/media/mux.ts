import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export function muxConfigured(): boolean {
  return Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}

export function allowedUploadOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const site = new URL(env.siteUrl);
    if (url.origin === site.origin) return true;
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

type MuxEvent = {
  type?: string;
  data?: {
    id?: string;
    upload_id?: string;
    passthrough?: string;
    playback_ids?: { id?: string; policy?: string }[];
    errors?: { messages?: string[] };
  };
};

/** Create a direct upload. The browser sends the video to Mux, not to our server. */
export async function createMuxUpload(mediaId: string, origin: string): Promise<{ uploadId: string; url: string } | { error: string }> {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) return { error: "Video upload is not connected yet. Paste an https link, or add the Mux keys." };
  const res = await fetch("https://api.mux.com/video/v1/uploads", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${tokenId}:${tokenSecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cors_origin: origin,
      new_asset_settings: { playback_policy: ["signed"], passthrough: mediaId },
    }),
  });
  if (!res.ok) return { error: "Mux did not accept the upload. Try again, or paste an https link." };
  const body = (await res.json()) as { data?: { id?: string; url?: string } };
  if (!body.data?.id || !body.data.url) return { error: "Mux did not return an upload address." };
  return { uploadId: body.data.id, url: body.data.url };
}

export async function applyMuxEvent(event: MuxEvent): Promise<void> {
  const admin = createAdminClient();
  const type = event.type ?? "";
  const data = event.data ?? {};
  const playback = data.playback_ids?.find((item) => item.policy === "signed")?.id ?? data.playback_ids?.[0]?.id ?? null;

  if (type === "video.asset.ready" || type === "video.asset.errored") {
    const patch =
      type === "video.asset.ready"
        ? { status: "ready" as const, error: null, mux_asset_id: data.id ?? null, mux_playback_id: playback }
        : {
            status: "failed" as const,
            error: data.errors?.messages?.filter(Boolean).join(" ") || "Mux could not process this video.",
            mux_asset_id: data.id ?? null,
          };
    if (data.passthrough) await admin.from("vehicle_media").update(patch).eq("id", data.passthrough);
    else if (data.upload_id) await admin.from("vehicle_media").update(patch).eq("mux_upload_id", data.upload_id);
    else if (data.id) await admin.from("vehicle_media").update(patch).eq("mux_asset_id", data.id);
    return;
  }

  if ((type === "video.upload.errored" || type === "video.upload.cancelled") && data.id) {
    await admin
      .from("vehicle_media")
      .update({
        status: "failed",
        error: type === "video.upload.cancelled" ? "The video upload was cancelled." : "The video upload failed.",
      })
      .eq("mux_upload_id", data.id);
  }
}
