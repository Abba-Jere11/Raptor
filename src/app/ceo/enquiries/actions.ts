"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/app/ceo/actions";
import { requireStaff } from "@/lib/auth";
import type { EnquiryStatus } from "@/lib/db/types";
import { ENQUIRY_STATUS_LABEL } from "@/lib/quotes";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateEnquiry(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff(["ceo", "sales"]);
  const status = String(form.get("status") ?? "") as EnquiryStatus;
  const owner = String(form.get("assigned_to") ?? "");
  if (!(status in ENQUIRY_STATUS_LABEL)) return { error: "Choose a status." };
  if (owner && !UUID.test(owner)) return { error: "Choose an owner." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("enquiries")
    .update({ status, assigned_to: owner || null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(routes.ceo.enquiries);
  revalidatePath(routes.ceo.enquiry(id));
  return { ok: "Saved." };
}

export async function addEnquiryNote(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { staff } = await requireStaff(["ceo", "sales"]);
  const note = String(form.get("note") ?? "").trim();
  if (!note) return { error: "Write a note first." };
  if (note.length > 2000) return { error: "Keep the note under 2,000 characters." };
  const supabase = await createClient();
  const { error } = await supabase.from("enquiry_events").insert({ enquiry_id: id, kind: "note", note, actor_id: staff.id });
  if (error) return { error: error.message };
  revalidatePath(routes.ceo.enquiry(id));
  return { ok: "Note added." };
}

export async function prepareQuote(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff(["ceo", "sales"]);
  const destination = String(form.get("destination_id") ?? "");
  if (destination && !UUID.test(destination)) return { error: "Choose a destination." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_quote", { p_enquiry_id: id, p_destination_id: destination || null });
  if (error || !data) return { error: error?.message ?? "The quotation could not be started." };
  revalidatePath(routes.ceo.enquiry(id));
  redirect(routes.ceo.quote(data.id));
}
