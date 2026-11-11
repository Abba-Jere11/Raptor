import { NextResponse } from "next/server";
import { getStaff } from "@/lib/auth";
import { bucketForOriginal, BUCKETS } from "@/lib/media/files";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VARIANTS = new Set(["thumb", "gallery", "file"]);

function unavailable() {
  return new NextResponse(null, { status: 404 });
}

/**
 * Administrators and the CEO can read a ready file.
 * Everyone else can read a published rendition, or a public history or inspection file.
 * Title files, originals and unpublished vehicles all get the same not-available response.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const variant = new URL(request.url).searchParams.get("variant") ?? "";
  if (!VARIANTS.has(variant)) return unavailable();

  const staff = await getStaff();
  const privileged = staff?.role === "administrator" || staff?.role === "ceo";
  const admin = createAdminClient();

  if (!privileged) {
    const published = await admin.from("public_vehicle_media").select("id, kind").eq("id", id).maybeSingle();
    if (!published.data) return unavailable();
    const picture = published.data.kind === "photo" || published.data.kind === "spin";
    if ((variant === "thumb" || variant === "gallery") && !picture) return unavailable();
    if (variant === "file" && published.data.kind !== "document") return unavailable();
  }

  const { data: row } = await admin.from("vehicle_media").select("*").eq("id", id).maybeSingle();
  if (!row || row.status !== "ready") return unavailable();
  const publicDocument = row.kind === "document" && row.visibility === "public" && (row.document_kind === "history" || row.document_kind === "inspection");
  if (!privileged && row.kind === "document" && !publicDocument) return unavailable();

  let bucket: string | null = null;
  let path: string | null = null;
  let contentType = "application/octet-stream";

  if ((variant === "thumb" || variant === "gallery") && row.thumb_path && row.rendition_path) {
    bucket = BUCKETS.renditions;
    path = variant === "thumb" ? row.thumb_path : row.rendition_path;
    contentType = "image/webp";
  } else if (variant === "file" && row.kind === "document" && row.original_path) {
    bucket = bucketForOriginal("document");
    path = row.original_path;
    contentType = row.mime_type || "application/octet-stream";
  }

  if (!bucket || !path) return unavailable();
  const downloaded = await admin.storage.from(bucket).download(path);
  if (downloaded.error || !downloaded.data) return unavailable();

  const bytes = new Uint8Array(await downloaded.data.arrayBuffer());
  const filename = (row.alt_text ?? "file").replace(/[^\w.\- ]+/g, "").slice(0, 120) || "file";
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Length": String(bytes.byteLength),
    "Content-Disposition": `inline; filename="${filename}"`,
    "Cache-Control": privileged ? "private, no-store" : "public, max-age=300",
    "X-Content-Type-Options": "nosniff",
  };
  if (privileged) headers["X-Robots-Tag"] = "noindex";
  return new NextResponse(bytes, { status: 200, headers });
}
