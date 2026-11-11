"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/app/ceo/actions";
import { requireStaff } from "@/lib/auth";
import type { DestinationStatus } from "@/lib/db/types";
import { DESTINATION_STATUS_LABEL } from "@/lib/quotes";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

function fields(form: FormData): { error: string } | { country: string; port: string; notes: string | null } {
  const country = String(form.get("country") ?? "").trim();
  const port = String(form.get("port") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  if (!country || country.length > 80) return { error: "Enter the country." };
  if (!port || port.length > 80) return { error: "Enter the port." };
  if (notes.length > 500) return { error: "Keep notes under 500 characters." };
  return { country, port, notes: notes || null };
}

function refresh() {
  revalidatePath(routes.ceo.destinations);
  revalidatePath(routes.admin.destinations);
}

function friendly(message: string) {
  return /duplicate|unique/i.test(message) ? "That port is already on the list." : message;
}

export async function addDestination(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { staff } = await requireStaff(["ceo", "administrator"]);
  const parsed = fields(form);
  if ("error" in parsed) return { error: parsed.error };
  const requested = String(form.get("status") ?? "confirm_each_time") as DestinationStatus;
  const status: DestinationStatus = staff.role === "ceo" && requested in DESTINATION_STATUS_LABEL ? requested : "confirm_each_time";
  const supabase = await createClient();
  const { error } = await supabase.from("destinations").insert({ ...parsed, status });
  if (error) return { error: friendly(error.message) };
  refresh();
  return { ok: `${parsed.port}, ${parsed.country} added.` };
}

export async function updateDestination(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { staff } = await requireStaff(["ceo", "administrator"]);
  const parsed = fields(form);
  if ("error" in parsed) return { error: parsed.error };
  const update: { country: string; port: string; notes: string | null; status?: DestinationStatus } = parsed;
  if (staff.role === "ceo") {
    const status = String(form.get("status") ?? "") as DestinationStatus;
    if (!(status in DESTINATION_STATUS_LABEL)) return { error: "Choose a status." };
    update.status = status;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("destinations").update(update).eq("id", id);
  if (error) return { error: friendly(error.message) };
  refresh();
  return { ok: "Saved." };
}
