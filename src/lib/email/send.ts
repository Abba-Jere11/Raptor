import type { EmailTemplate, NotificationStatus } from "@/lib/db/types";
import { env } from "@/lib/env";
import { renderEmail, type MergeValues } from "@/lib/email/render";
import { createAdminClient } from "@/lib/supabase/admin";

export type Attachment = { filename: string; content: Buffer; contentType: string };

export type SendResult = { status: NotificationStatus; error?: string; providerId?: string };

type Provider = "resend" | "mailpit" | "none";

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

function provider(): Provider {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.NODE_ENV !== "production" || process.env.MAILPIT_URL) return "mailpit";
  return "none";
}

function fromAddress() {
  return { email: process.env.EMAIL_FROM ?? "no-reply@raptors.local", name: process.env.EMAIL_FROM_NAME ?? "Raptors Auto Group" };
}

async function deliver(
  to: string,
  subject: string,
  html: string,
  text: string,
  attachments: Attachment[],
): Promise<{ provider: Provider; providerId?: string; error?: string }> {
  const via = provider();
  const from = fromAddress();
  try {
    if (via === "resend") {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `${from.name} <${from.email}>`,
          to: [to],
          subject,
          html,
          text,
          attachments: attachments.map((a) => ({ filename: a.filename, content: a.content.toString("base64") })),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok) return { provider: via, error: body.message ?? `Resend answered ${res.status}` };
      return { provider: via, providerId: body.id };
    }
    if (via === "mailpit") {
      const res = await fetch(`${MAILPIT_URL}/api/v1/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          From: { Email: from.email, Name: from.name },
          To: [{ Email: to }],
          Subject: subject,
          HTML: html,
          Text: text,
          Attachments: attachments.map((a) => ({ Filename: a.filename, Content: a.content.toString("base64"), ContentType: a.contentType })),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { ID?: string };
      if (!res.ok) return { provider: via, error: `Mailpit answered ${res.status}` };
      return { provider: via, providerId: body.ID };
    }
    return { provider: "none", error: "No email service is configured. Add RESEND_API_KEY." };
  } catch (e) {
    return { provider: via, error: e instanceof Error ? e.message : "Email could not be sent" };
  }
}

async function footerLine() {
  const admin = createAdminClient();
  const { data } = await admin.from("public_site_settings").select("legal_name, licence").maybeSingle();
  const name = data?.legal_name?.trim() || "Raptors Auto Group";
  const licence = data?.licence?.trim();
  return `${name}${licence ? ` · Dealer licence ${licence}` : ""} · Your Raptors contact: reply to this email.`;
}

/** The latest approved version, or for staff alerts the latest version of any status. */
export async function currentTemplate(key: string, audience: "customer" | "staff"): Promise<EmailTemplate | null> {
  const admin = createAdminClient();
  const approved = await admin
    .from("email_templates")
    .select("*")
    .eq("key", key)
    .eq("status", "approved")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (approved.data) return approved.data;
  if (audience === "customer") return null;
  const latest = await admin.from("email_templates").select("*").eq("key", key).order("version", { ascending: false }).limit(1).maybeSingle();
  return latest.data ?? null;
}

/**
 * Sends one email from a template and records the attempt. Customer email only ever uses
 * CEO-approved wording; without it the attempt is logged as held and nothing is sent.
 */
export async function sendTemplateEmail(args: {
  key: string;
  audience: "customer" | "staff";
  to: string;
  values: MergeValues;
  buttonUrl?: string | null;
  attachments?: Attachment[];
  enquiryId?: string | null;
  quoteId?: string | null;
  sentBy?: string | null;
  testTemplate?: EmailTemplate;
}): Promise<SendResult> {
  const admin = createAdminClient();
  const template = args.testTemplate ?? (await currentTemplate(args.key, args.audience));
  const log = async (status: NotificationStatus, subject: string, via: Provider, error?: string, providerId?: string) => {
    await admin.from("notification_log").insert({
      template_key: args.key,
      template_version: template?.version ?? null,
      audience: args.audience,
      to_email: args.to,
      subject,
      status,
      provider: via,
      provider_id: providerId ?? null,
      error: error ?? null,
      is_test: Boolean(args.testTemplate),
      enquiry_id: args.enquiryId ?? null,
      quote_id: args.quoteId ?? null,
      sent_by: args.sentBy ?? null,
    });
  };

  if (!template) {
    const error = "The wording for this email is not approved yet. Approve it in Email templates.";
    await log("held", args.key, "none", error);
    return { status: "held", error };
  }

  const rendered = renderEmail(template, args.values, { siteUrl: env.siteUrl, buttonUrl: args.buttonUrl, footer: await footerLine() });
  const result = await deliver(args.to, rendered.subject, rendered.html, rendered.text, args.attachments ?? []);
  if (result.error) {
    await log("failed", rendered.subject, result.provider, result.error);
    return { status: "failed", error: result.error };
  }
  await log("sent", rendered.subject, result.provider, undefined, result.providerId);
  return { status: "sent", providerId: result.providerId };
}
