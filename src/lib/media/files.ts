import type { DocumentKind, MediaKind } from "@/lib/db/types";

export const BUCKETS = {
  originals: "media-originals",
  renditions: "media-renditions",
  documents: "media-documents",
} as const;

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const DOCUMENT_TYPES = [...IMAGE_TYPES, "application/pdf"] as const;

export const IMAGE_READ_ERROR = "This file could not be read as an image. Replace it with a JPEG, PNG or WebP.";

export function bucketForOriginal(kind: MediaKind): string {
  return kind === "document" ? BUCKETS.documents : BUCKETS.originals;
}

export function normaliseMime(mime: string, fileName: string): string {
  const clean = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  if (clean && clean !== "application/octet-stream") return clean;
  const ext = fileName.toLowerCase().split(".").pop();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "pdf") return "application/pdf";
  return clean;
}

export function mimeAllowed(kind: MediaKind, mime: string): boolean {
  if (kind === "video") return false;
  const list = kind === "document" ? DOCUMENT_TYPES : IMAGE_TYPES;
  return (list as readonly string[]).includes(mime);
}

export function mimeRejectedMessage(kind: MediaKind): string {
  return kind === "document" ? "Use a JPEG, PNG, WebP or PDF file." : "Use a JPEG, PNG or WebP file.";
}

export function safeAlt(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? "file";
  return base.replace(/\s+/g, " ").trim().slice(0, 120);
}

export function mediaFileUrl(id: string, variant: "thumb" | "gallery" | "file"): string {
  return `/media/${id}?variant=${variant}`;
}

export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.length > 0 && value.length <= 2000;
  } catch {
    return false;
  }
}

export function isDocumentKind(value: string): value is DocumentKind {
  return value === "history" || value === "inspection" || value === "title" || value === "other";
}
