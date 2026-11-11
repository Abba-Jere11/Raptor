"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/app/ceo/actions";
import { requireStaff } from "@/lib/auth";
import { SAMPLE_VALUES } from "@/lib/email/render";
import { sendTemplateEmail } from "@/lib/email/send";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

function refresh(key: string) {
  revalidatePath(routes.ceo.templates);
  revalidatePath(routes.ceo.template(key));
}

export async function saveTemplateDraft(key: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff(["ceo"]);
  const subject = String(form.get("subject") ?? "").trim();
  const eyebrow = String(form.get("eyebrow") ?? "").trim();
  const heading = String(form.get("heading") ?? "").trim();
  const body = String(form.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  const buttonLabel = String(form.get("button_label") ?? "").trim();
  if (!subject || subject.length > 150) return { error: "Write a subject under 150 characters." };
  if (!heading || heading.length > 150) return { error: "Write a heading under 150 characters." };
  if (!body || body.length > 5000) return { error: "Write the message, under 5,000 characters." };
  if (eyebrow.length > 60 || buttonLabel.length > 40) return { error: "Keep the small label and the button label short." };

  const supabase = await createClient();
  const { data: latest } = await supabase.from("email_templates").select("*").eq("key", key).order("version", { ascending: false }).limit(1).maybeSingle();
  if (!latest) return { error: "Template not found." };
  const wording = { subject, eyebrow: eyebrow || null, heading, body, button_label: buttonLabel || null };
  const { error } =
    latest.status === "draft"
      ? await supabase.from("email_templates").update(wording).eq("id", latest.id)
      : await supabase.from("email_templates").insert({ ...wording, key, audience: latest.audience, name: latest.name });
  if (error) return { error: error.message };
  refresh(key);
  return { ok: latest.status === "draft" ? `Draft version ${latest.version} saved. It is not used until you approve it.` : "New draft version saved. The approved version stays in use until you approve this one." };
}

export async function approveTemplate(key: string, id: string): Promise<ActionState> {
  await requireStaff(["ceo"]);
  const supabase = await createClient();
  const { error } = await supabase.from("email_templates").update({ status: "approved" }).eq("id", id).eq("status", "draft");
  if (error) return { error: error.message };
  refresh(key);
  return { ok: "Approved. Emails now use this wording." };
}

export async function testSendTemplate(key: string, id: string): Promise<ActionState> {
  const { staff } = await requireStaff(["ceo"]);
  const supabase = await createClient();
  const { data: template } = await supabase.from("email_templates").select("*").eq("id", id).maybeSingle();
  if (!template) return { error: "Template not found." };
  const result = await sendTemplateEmail({
    key,
    audience: template.audience,
    to: staff.email,
    values: SAMPLE_VALUES,
    buttonUrl: template.button_label ? env.siteUrl : null,
    testTemplate: template,
    sentBy: staff.id,
  });
  refresh(key);
  if (result.status !== "sent") return { error: `The test did not go: ${result.error}` };
  return { ok: `Test sent to ${staff.email}, with sample values.` };
}
