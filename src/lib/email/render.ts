import type { EmailTemplate } from "@/lib/db/types";

export type MergeValues = Record<string, string | null | undefined>;

export type RenderedEmail = { subject: string; html: string; text: string; missing: string[] };

/** Fields each starter template may use. Shown in the editor; unknown fields render empty and are reported. */
export const MERGE_FIELDS: Record<string, string[]> = {
  enquiry_received: ["customer_name", "reference", "vehicle_title", "preferred_contact"],
  information_request: ["customer_name", "reference", "vehicle_title"],
  staff_new_enquiry: ["reference", "enquiry_kind", "vehicle_title", "customer_name"],
  quotation_sent: ["customer_name", "quote_number", "vehicle_title", "destination", "quote_total", "valid_until"],
};

/** Sample values for previews and test sends. Labelled so nobody mistakes them for a real customer. */
export const SAMPLE_VALUES: MergeValues = {
  customer_name: "Sample Customer",
  reference: "ENQ-0000-0000",
  vehicle_title: "2020 Sample Make Model",
  preferred_contact: "email",
  enquiry_kind: "quote request",
  quote_number: "Q-0000-0000",
  destination: "Sample Port, Sample Country",
  quote_total: "$0",
  valid_until: "1 Jan 2000",
};

const FIELD = /\{\{\s*([a-z_]+)\s*\}\}/g;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Replaces {{field}} with its value. Values are plain text; the caller escapes for HTML. */
export function mergeText(text: string, values: MergeValues, missing?: Set<string>): string {
  return text.replace(FIELD, (_, key: string) => {
    const value = values[key];
    if (value === undefined || value === null || value === "") {
      missing?.add(key);
      return "";
    }
    return value;
  });
}

const BRAND = {
  white: "#FFFFFF",
  platinum: "#E9EAEC",
  crimson: "#C62838",
  slate: "#68717B",
  charcoal: "#24272B",
};

type Layout = Pick<EmailTemplate, "subject" | "eyebrow" | "heading" | "body" | "button_label">;

export function renderEmail(
  template: Layout,
  values: MergeValues,
  options: { siteUrl: string; buttonUrl?: string | null; footer?: string | null },
): RenderedEmail {
  const missing = new Set<string>();
  const subject = mergeText(template.subject, values, missing).replace(/\s+/g, " ").trim();
  const heading = mergeText(template.heading, values, missing);
  const eyebrow = template.eyebrow ? mergeText(template.eyebrow, values, missing) : "";
  const paragraphs = mergeText(template.body, values, missing)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const button = template.button_label && options.buttonUrl ? { label: template.button_label, url: options.buttonUrl } : null;
  const footer = options.footer ?? "Your Raptors contact: reply to this email.";

  const logo = `${options.siteUrl.replace(/\/$/, "")}/brand/lockup-light.png`;
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.platinum};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.platinum};padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BRAND.white};font-family:Inter,Arial,sans-serif;color:${BRAND.charcoal};">
<tr><td style="padding:28px 32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td><img src="${escapeHtml(logo)}" alt="Raptors Auto Group" width="150" style="display:block;border:0;"></td>
<td align="right" style="font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;color:${BRAND.crimson};">${escapeHtml(eyebrow)}</td>
</tr></table>
</td></tr>
<tr><td style="padding:0 32px;"><div style="height:2px;background:${BRAND.crimson};line-height:2px;font-size:0;">&nbsp;</div></td></tr>
<tr><td style="padding:24px 32px 8px;">
<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:600;">${escapeHtml(heading)}</h1>
${paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("\n")}
${
  button
    ? `<p style="margin:20px 0 8px;"><a href="${escapeHtml(button.url)}" style="display:inline-block;background:${BRAND.charcoal};color:${BRAND.white};text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:999px;">${escapeHtml(button.label)} &rarr;</a></p>`
    : ""
}
</td></tr>
<tr><td style="padding:16px 32px 28px;border-top:1px solid ${BRAND.platinum};font-size:12px;line-height:1.5;color:${BRAND.slate};">${escapeHtml(footer)}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    eyebrow ? eyebrow.toUpperCase() : null,
    heading,
    "",
    ...paragraphs.flatMap((p) => [p, ""]),
    button ? `${button.label}: ${button.url}` : null,
    button ? "" : null,
    "--",
    footer,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return { subject, html, text, missing: [...missing] };
}
