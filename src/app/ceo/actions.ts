"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import type { StaffRole } from "@/lib/db/types";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: string };

export async function approveVehicle(id: string): Promise<ActionState> {
  await requireStaff(["ceo"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_vehicle", { p_id: id });
  if (error) return { error: error.message };
  revalidatePath(routes.ceo.approvals);
  revalidatePath(routes.ceo.vehicles);
  revalidatePath(routes.ceo.vehicle(id));
  revalidatePath(routes.admin.vehicles);
  revalidatePath(routes.admin.vehicle(id));
  return { ok: "Approved. The Administrator still needs to mark it available before it appears on the website." };
}

export async function declineApproval(id: string, reason: string): Promise<ActionState> {
  await requireStaff(["ceo"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("decline_approval", { p_id: id, p_reason: reason });
  if (error) return { error: error.message };
  revalidatePath(routes.ceo.approvals);
  revalidatePath(routes.home);
  return { ok: "Declined." };
}

export async function approveChange(id: string): Promise<ActionState> {
  await requireStaff(["ceo"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_vehicle_change", { p_id: id });
  if (error) return { error: error.message };
  revalidatePath(routes.ceo.approvals);
  revalidatePath(routes.ceo.vehicles);
  return { ok: "Change applied." };
}

export async function approveFeatured(id: string): Promise<ActionState> {
  await requireStaff(["ceo"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_featured", { p_id: id });
  if (error) return { error: error.message };
  revalidatePath(routes.ceo.approvals);
  revalidatePath(routes.home);
  return { ok: "Featured vehicle approved." };
}

export async function approveDelivery(id: string): Promise<ActionState> {
  await requireStaff(["ceo"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_delivery", { p_id: id });
  if (error) return { error: error.message };
  revalidatePath(routes.ceo.approvals);
  revalidatePath(routes.home);
  return { ok: "Delivery approved." };
}

export async function authoriseStaff(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { staff } = await requireStaff(["ceo"]);
  const supabase = await createClient();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const role = String(form.get("role") ?? "") as Exclude<StaffRole, "ceo">;
  const notes = String(form.get("notes") ?? "").trim() || null;
  const { error } = await supabase.from("staff_authorisations").insert({
    email,
    role,
    notes,
    created_by: staff.id,
  });
  if (error) return { error: error.message };
  revalidatePath(routes.ceo.staff);
  return { ok: `Authorised ${email} as ${role}. The Administrator can now create the account.` };
}

export async function revokeAuthorisationForm(id: string): Promise<void> {
  await revokeAuthorisation(id);
}

export async function revokeAuthorisation(id: string): Promise<ActionState> {
  await requireStaff(["ceo"]);
  const supabase = await createClient();
  const { error } = await supabase.from("staff_authorisations").update({ status: "revoked" }).eq("id", id).eq("status", "pending");
  if (error) return { error: error.message };
  revalidatePath(routes.ceo.staff);
  return { ok: "Authorisation revoked." };
}
