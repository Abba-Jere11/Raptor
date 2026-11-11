import type { ContactPreference, EnquiryKind } from "@/lib/db/types";

export type EnquiryInput = {
  kind: EnquiryKind;
  name: string;
  email: string;
  whatsapp: string | null;
  preferred: ContactPreference;
  vehicleId: string | null;
  destinationId: string | null;
  destinationOther: string | null;
  message: string | null;
  sourcePath: string | null;
};

/** Hidden field a person never sees. Bots that fill every input fill this one too. */
export const HONEYPOT_FIELD = "company_website";
export const STARTED_FIELD = "form_started";
export const MIN_FILL_MS = 2500;
const MAX_FILL_MS = 24 * 60 * 60 * 1000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Returns a reason when the submission looks automated; null when it looks like a person. */
export function botReason(form: FormData, nowMs: number): string | null {
  if (String(form.get(HONEYPOT_FIELD) ?? "").trim() !== "") return "honeypot";
  const started = Number(form.get(STARTED_FIELD));
  if (!Number.isFinite(started) || started <= 0) return "no-start";
  const elapsed = nowMs - started;
  if (elapsed < MIN_FILL_MS) return "too-fast";
  if (elapsed > MAX_FILL_MS) return "stale";
  return null;
}

function text(form: FormData, key: string, max: number): string | null {
  const value = String(form.get(key) ?? "").trim();
  if (!value) return null;
  return value.slice(0, max);
}

export function parseEnquiry(form: FormData): { data: EnquiryInput } | { error: string; field?: string } {
  const kindRaw = String(form.get("kind") ?? "");
  const kind: EnquiryKind | null = kindRaw === "quote_request" || kindRaw === "enquiry" || kindRaw === "information" ? kindRaw : null;
  if (!kind) return { error: "Something went wrong with this form. Reload the page and try again." };

  const name = text(form, "name", 120);
  if (!name || name.length < 2) return { error: "Enter your name.", field: "name" };
  const email = text(form, "email", 254)?.toLowerCase() ?? null;
  if (!email || !EMAIL.test(email)) return { error: "Enter an email address we can reply to.", field: "email" };
  const whatsapp = text(form, "whatsapp", 40);
  if (whatsapp && !/^\+?[0-9 ()-]{7,20}$/.test(whatsapp)) return { error: "Enter the WhatsApp number with its country code.", field: "whatsapp" };

  const preferredRaw = String(form.get("preferred") ?? "email");
  const preferred: ContactPreference = preferredRaw === "whatsapp" || preferredRaw === "phone" ? preferredRaw : "email";
  if (preferred !== "email" && !whatsapp) return { error: "Add a WhatsApp or phone number, or choose email.", field: "whatsapp" };

  const vehicleId = text(form, "vehicle_id", 36);
  if (vehicleId && !UUID.test(vehicleId)) return { error: "Something went wrong with this form. Reload the page and try again." };
  if (kind === "quote_request" && !vehicleId) return { error: "Something went wrong with this form. Reload the page and try again." };

  const destinationRaw = text(form, "destination_id", 36);
  const destinationId = destinationRaw && UUID.test(destinationRaw) ? destinationRaw : null;
  const destinationOther = destinationId ? null : text(form, "destination_other", 120);
  if (kind === "quote_request" && !destinationId && !destinationOther) {
    return { error: "Tell us the country and port the vehicle is going to.", field: "destination" };
  }

  const message = text(form, "message", 2000);
  if (kind === "enquiry" && !message) return { error: "Tell us how we can help.", field: "message" };

  const sourcePath = text(form, "source_path", 300);
  return {
    data: {
      kind,
      name,
      email,
      whatsapp,
      preferred,
      vehicleId,
      destinationId,
      destinationOther,
      message,
      sourcePath: sourcePath && sourcePath.startsWith("/") ? sourcePath : null,
    },
  };
}

/** Rate-limit key: a salted hash of the client address, so the address itself is never stored. */
export async function rateKey(ip: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `ip:${Buffer.from(digest).toString("hex").slice(0, 40)}`;
}
