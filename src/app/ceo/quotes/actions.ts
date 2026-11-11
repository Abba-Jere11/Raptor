"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/app/ceo/actions";
import { requireStaff } from "@/lib/auth";
import type { AcceptanceMethod, QuoteLineKind } from "@/lib/db/types";
import { currentTemplate, sendTemplateEmail } from "@/lib/email/send";
import { formatDate, formatMoney } from "@/lib/format";
import { renderQuotationPdf } from "@/lib/pdf/QuotationPdf";
import { ISSUED_BUCKET, issuedPdfPath, loadQuoteDocument } from "@/lib/quote-document";
import { ACCEPTANCE_METHOD_LABEL, EDITABLE_LINE_KINDS, LINE_KIND_LABEL, destinationLabel, parseDollars, vehicleTitle } from "@/lib/quotes";
import { routes } from "@/lib/routes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function text(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

function done(id: string) {
  revalidatePath(routes.ceo.quote(id));
  revalidatePath(routes.ceo.quotes);
}

export async function saveQuote(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff(["ceo", "sales"]);
  const destination = text(form, "destination_id");
  const method = text(form, "shipping_method");
  const validUntil = text(form, "valid_until");
  const notIncluded = text(form, "not_included");
  const note = text(form, "customer_note");
  if (destination && !UUID.test(destination)) return { error: "Choose a destination." };
  if (method && method !== "container" && method !== "roro") return { error: "Choose a shipping method." };
  if (!DATE.test(validUntil)) return { error: "Enter a valid-until date." };
  if (!notIncluded) return { error: "Say what the quotation does not include." };
  if (notIncluded.length > 1000 || note.length > 1000) return { error: "Keep each text under 1,000 characters." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({
      destination_id: destination || null,
      shipping_method: (method || null) as "container" | "roro" | null,
      destination_confirmed_at: form.get("destination_confirmed") ? new Date().toISOString() : null,
      valid_until: validUntil,
      not_included: notIncluded,
      customer_note: note || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  done(id);
  return { ok: "Saved. Nothing has been sent." };
}

function parseLine(form: FormData): { kind: QuoteLineKind; label: string; amount_cents: number } | string {
  const kind = text(form, "kind") as QuoteLineKind;
  if (!EDITABLE_LINE_KINDS.includes(kind)) return "Choose a line type.";
  const label = text(form, "label") || LINE_KIND_LABEL[kind];
  if (label.length > 120) return "Keep the description under 120 characters.";
  const cents = parseDollars(text(form, "amount"));
  if (cents === null) return "Enter an amount in dollars, for example 1,250.";
  return { kind, label, amount_cents: cents };
}

export async function addLine(quoteId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff(["ceo", "sales"]);
  const line = parseLine(form);
  if (typeof line === "string") return { error: line };
  const supabase = await createClient();
  const { error } = await supabase.from("quote_lines").insert({ ...line, quote_id: quoteId, position: Number(form.get("position") ?? 0) || 0 });
  if (error) return { error: error.message };
  done(quoteId);
  return { ok: "Line added." };
}

export async function updateLine(quoteId: string, lineId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff(["ceo", "sales"]);
  const line = parseLine(form);
  if (typeof line === "string") return { error: line };
  const supabase = await createClient();
  const { error } = await supabase.from("quote_lines").update(line).eq("id", lineId).eq("quote_id", quoteId);
  if (error) return { error: error.message };
  done(quoteId);
  return { ok: "Saved." };
}

export async function removeLine(quoteId: string, lineId: string): Promise<ActionState> {
  await requireStaff(["ceo", "sales"]);
  const supabase = await createClient();
  const { error } = await supabase.from("quote_lines").delete().eq("id", lineId).eq("quote_id", quoteId);
  if (error) return { error: error.message };
  done(quoteId);
  return { ok: "Removed." };
}

function parseLocal(form: FormData): { label: string; estimate_cents: number | null; note: string | null } | string {
  const label = text(form, "label");
  if (!label || label.length > 120) return "Describe the charge in under 120 characters.";
  const raw = text(form, "estimate");
  const cents = raw ? parseDollars(raw) : null;
  if (raw && cents === null) return "Enter the estimate in dollars, or leave it empty.";
  const note = text(form, "note");
  if (note.length > 300) return "Keep the note under 300 characters.";
  return { label, estimate_cents: cents, note: note || null };
}

export async function addLocalCharge(quoteId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff(["ceo", "sales"]);
  const charge = parseLocal(form);
  if (typeof charge === "string") return { error: charge };
  const supabase = await createClient();
  const { error } = await supabase
    .from("quote_local_charges")
    .insert({ ...charge, quote_id: quoteId, position: Number(form.get("position") ?? 0) || 0 });
  if (error) return { error: error.message };
  done(quoteId);
  return { ok: "Charge added." };
}

export async function updateLocalCharge(quoteId: string, chargeId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff(["ceo", "sales"]);
  const charge = parseLocal(form);
  if (typeof charge === "string") return { error: charge };
  const supabase = await createClient();
  const { error } = await supabase.from("quote_local_charges").update(charge).eq("id", chargeId).eq("quote_id", quoteId);
  if (error) return { error: error.message };
  done(quoteId);
  return { ok: "Saved." };
}

export async function removeLocalCharge(quoteId: string, chargeId: string): Promise<ActionState> {
  await requireStaff(["ceo", "sales"]);
  const supabase = await createClient();
  const { error } = await supabase.from("quote_local_charges").delete().eq("id", chargeId).eq("quote_id", quoteId);
  if (error) return { error: error.message };
  done(quoteId);
  return { ok: "Removed." };
}

export async function previewQuote(id: string): Promise<ActionState> {
  await requireStaff(["ceo", "sales"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("preview_quote", { p_id: id });
  if (error) return { error: error.message };
  done(id);
  return { ok: "Preview ready. Check the PDF and the email below before you send." };
}

/** Stores the issued PDF (once) and emails it. Safe to run again after a failure. */
async function deliverQuote(id: string, staffId: string): Promise<ActionState> {
  const supabase = await createClient();
  const doc = await loadQuoteDocument(supabase, id);
  if (!doc || !doc.quote.number) return { error: "The quotation could not be loaded." };
  const admin = createAdminClient();
  let pdf: Buffer;
  if (doc.quote.pdf_path) {
    const { data, error } = await admin.storage.from(ISSUED_BUCKET).download(doc.quote.pdf_path);
    if (error || !data) return { error: `The stored PDF could not be read: ${error?.message ?? "missing"}` };
    pdf = Buffer.from(await data.arrayBuffer());
  } else {
    pdf = await renderQuotationPdf(doc);
    const path = issuedPdfPath(id, doc.quote.number);
    const upload = await admin.storage.from(ISSUED_BUCKET).upload(path, pdf, { contentType: "application/pdf", upsert: false });
    if (upload.error && !/exists/i.test(upload.error.message)) return { error: `The PDF could not be stored: ${upload.error.message}` };
    const { error } = await supabase.rpc("attach_quote_pdf", { p_id: id, p_path: path });
    if (error) return { error: error.message };
  }
  const result = await sendTemplateEmail({
    key: "quotation_sent",
    audience: "customer",
    to: doc.quote.sent_to ?? doc.customer.email,
    values: {
      customer_name: doc.customer.name,
      quote_number: doc.quote.number,
      vehicle_title: vehicleTitle(doc.vehicle),
      destination: destinationLabel(doc.destination),
      quote_total: `${formatMoney({ cents: doc.totals.totalCents, currency: "USD" })} USD`,
      valid_until: formatDate(doc.quote.valid_until),
    },
    attachments: [{ filename: `${doc.quote.number}.pdf`, content: pdf, contentType: "application/pdf" }],
    enquiryId: doc.quote.enquiry_id,
    quoteId: id,
    sentBy: staffId,
  });
  if (result.status !== "sent") return { error: `Quotation ${doc.quote.number} is issued, but the email did not go: ${result.error}. Use Retry email.` };
  return { ok: `Quotation ${doc.quote.number} sent to ${doc.quote.sent_to ?? doc.customer.email}.` };
}

export async function sendQuote(id: string): Promise<ActionState> {
  const { staff } = await requireStaff(["ceo", "sales"]);
  if (!(await currentTemplate("quotation_sent", "customer"))) {
    return { error: "The quotation email wording is not approved yet. The CEO approves it in Email templates before any quotation is sent." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("send_quote", { p_id: id });
  if (error) return { error: error.message };
  const result = await deliverQuote(id, staff.id);
  done(id);
  return result;
}

export async function retryQuoteEmail(id: string): Promise<ActionState> {
  const { staff } = await requireStaff(["ceo", "sales"]);
  const result = await deliverQuote(id, staff.id);
  done(id);
  return result;
}

export async function recordAcceptance(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff(["ceo"]);
  const method = text(form, "method") as AcceptanceMethod;
  const on = text(form, "accepted_on");
  if (!(method in ACCEPTANCE_METHOD_LABEL)) return { error: "Choose how the customer accepted." };
  if (!DATE.test(on)) return { error: "Enter the date the customer accepted." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_quote_acceptance", { p_id: id, p_method: method, p_accepted_on: on, p_note: text(form, "note") || null });
  if (error) return { error: error.message };
  done(id);
  return { ok: "Acceptance recorded. The invoice is marked to prepare." };
}

export async function recordDeclined(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff(["ceo", "sales"]);
  const reason = text(form, "reason");
  if (!reason) return { error: "Record the reason the customer gave." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_quote_declined", { p_id: id, p_reason: reason });
  if (error) return { error: error.message };
  done(id);
  return { ok: "Recorded as declined." };
}

export async function newQuoteVersion(id: string): Promise<ActionState> {
  await requireStaff(["ceo", "sales"]);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("new_quote_version", { p_id: id });
  if (error || !data) return { error: error?.message ?? "A new version could not be started." };
  done(id);
  redirect(routes.ceo.quote(data.id));
}

export async function requestDiscount(id: string): Promise<ActionState> {
  await requireStaff(["ceo", "sales"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_quote_discount", { p_quote_id: id });
  if (error) return { error: error.message };
  done(id);
  revalidatePath(routes.ceo.approvals);
  return { ok: "Discount sent to the CEO for approval." };
}

export async function approveQuoteDiscount(approvalId: string): Promise<ActionState> {
  await requireStaff(["ceo"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_quote_discount", { p_id: approvalId });
  if (error) return { error: error.message };
  revalidatePath(routes.ceo.approvals);
  revalidatePath(routes.ceo.quotes);
  return { ok: "Discount approved." };
}
