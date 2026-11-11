"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { sendTemplateEmail } from "@/lib/email/send";
import { botReason, parseEnquiry, rateKey } from "@/lib/enquiries";
import { env, serviceRoleKey } from "@/lib/env";
import { ENQUIRY_KIND_LABEL, vehicleTitle } from "@/lib/quotes";
import { routes } from "@/lib/routes";
import { createAdminClient } from "@/lib/supabase/admin";

export type EnquiryState = { error?: string; field?: string; reference?: string | null; done?: boolean };

const PREFERRED_WORDS = { email: "email", whatsapp: "WhatsApp", phone: "phone" } as const;

export async function submitEnquiry(_prev: EnquiryState, form: FormData): Promise<EnquiryState> {
  if (botReason(form, Date.now())) {
    return { done: true, reference: null };
  }
  const parsed = parseEnquiry(form);
  if ("error" in parsed) return { error: parsed.error, field: parsed.field };
  const input = parsed.data;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const key = await rateKey(ip, process.env.RATE_LIMIT_SALT ?? serviceRoleKey().slice(-24));

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("submit_enquiry", {
    p_kind: input.kind,
    p_name: input.name,
    p_email: input.email,
    p_whatsapp: input.whatsapp,
    p_preferred: input.preferred,
    p_vehicle_id: input.vehicleId,
    p_destination_id: input.destinationId,
    p_destination_other: input.destinationOther,
    p_message: input.message,
    p_rate_key: key,
    p_source_path: input.sourcePath,
  });
  if (error) {
    if (error.code === "P0429") return { error: "We have received several messages from you in the last hour. Please try again later." };
    return { error: "We could not send this. Please try again, or contact us on WhatsApp." };
  }
  const row = data?.[0];
  if (!row) return { error: "We could not send this. Please try again." };

  after(async () => {
    const [{ data: vehicle }, { data: enquiry }] = await Promise.all([
      input.vehicleId
        ? admin.from("public_vehicles").select("year, make, model, trim, slug").eq("id", input.vehicleId).maybeSingle()
        : Promise.resolve({ data: null }),
      admin.from("enquiries").select("assigned_to").eq("id", row.enquiry_id).maybeSingle(),
    ]);
    const title = vehicle ? vehicleTitle(vehicle) : "your enquiry";
    const values = {
      customer_name: input.name,
      reference: row.reference,
      vehicle_title: title,
      preferred_contact: PREFERRED_WORDS[input.preferred],
      enquiry_kind: ENQUIRY_KIND_LABEL[input.kind].toLowerCase(),
    };
    await sendTemplateEmail({
      key: input.kind === "information" ? "information_request" : "enquiry_received",
      audience: "customer",
      to: input.email,
      values,
      buttonUrl: vehicle ? `${env.siteUrl}${routes.vehicle(vehicle.slug)}` : null,
      enquiryId: row.enquiry_id,
    });
    if (enquiry?.assigned_to) {
      const { data: owner } = await admin.from("staff_users").select("email").eq("id", enquiry.assigned_to).maybeSingle();
      if (owner?.email) {
        await sendTemplateEmail({
          key: "staff_new_enquiry",
          audience: "staff",
          to: owner.email,
          values,
          buttonUrl: `${env.siteUrl}${routes.ceo.enquiry(row.enquiry_id)}`,
          enquiryId: row.enquiry_id,
        });
      }
    }
  });

  return { done: true, reference: row.reference };
}
