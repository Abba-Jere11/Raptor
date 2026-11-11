"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import type { CostKind, TitleStatus, VehicleStatus } from "@/lib/db/types";
import { routes } from "@/lib/routes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: string };

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

/** Description paragraphs and one feature per line, as shown on the public vehicle page. */
function wording(form: FormData): { description: string | null; features: string[] } | string {
  const description = String(form.get("description") ?? "").replace(/\r\n/g, "\n").trim();
  const features = String(form.get("features") ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
  if (description.length > 4000) return "Keep the description under 4,000 characters.";
  if (features.length > 40) return "List at most 40 features.";
  if (features.some((f) => f.length > 120)) return "Keep each feature under 120 characters.";
  return { description: description || null, features };
}

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((item, i) => item === b[i]);

export async function createVehicle(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { staff } = await requireStaff(["administrator"]);
  const words = wording(form);
  if (typeof words === "string") return { error: words };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      ...words,
      created_by: staff.id,
      vin: text(form, "vin").toUpperCase(),
      year: Number(form.get("year")),
      make: text(form, "make"),
      model: text(form, "model"),
      trim: text(form, "trim") || null,
      body: text(form, "body") || null,
      fuel: text(form, "fuel") || null,
      transmission: text(form, "transmission") || null,
      drivetrain: text(form, "drivetrain") || null,
      engine: text(form, "engine") || null,
      power: text(form, "power") || null,
      exterior: text(form, "exterior") || null,
      interior: text(form, "interior") || null,
      mileage: Number(form.get("mileage") || 0),
      title_status: text(form, "title_status") as TitleStatus,
      location: text(form, "location") || null,
      price_cents: Math.round(Number(form.get("price") || 0) * 100),
      export_ready: form.get("export_ready") === "on",
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "The vehicle could not be created." };
  revalidatePath(routes.admin.vehicles);
  redirect(routes.admin.vehicle(data.id));
}

export async function updateVehicle(id: string, currentStatus: VehicleStatus, _prev: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff(["administrator"]);
  if (currentStatus === "submitted") {
    return { error: "This vehicle is with the CEO. Withdraw the submission before editing." };
  }
  if (currentStatus === "withdrawn" || currentStatus === "sold") {
    return { error: "This vehicle can no longer be edited." };
  }
  const words = wording(form);
  if (typeof words === "string") return { error: words };
  const supabase = await createClient();
  const next = {
    ...words,
    vin: text(form, "vin").toUpperCase(),
    year: Number(form.get("year")),
    make: text(form, "make"),
    model: text(form, "model"),
    trim: text(form, "trim") || null,
    body: text(form, "body") || null,
    fuel: text(form, "fuel") || null,
    transmission: text(form, "transmission") || null,
    drivetrain: text(form, "drivetrain") || null,
    engine: text(form, "engine") || null,
    power: text(form, "power") || null,
    exterior: text(form, "exterior") || null,
    interior: text(form, "interior") || null,
    mileage: Number(form.get("mileage") || 0),
    title_status: text(form, "title_status") as TitleStatus,
    location: text(form, "location") || null,
    price_cents: Math.round(Number(form.get("price") || 0) * 100),
    export_ready: form.get("export_ready") === "on",
  };

  if (currentStatus === "approved" || currentStatus === "available") {
    const { data: current } = await supabase.from("vehicles").select("vin,year,make,model,price_cents,description,features").eq("id", id).single();
    if (current) {
      const payload: Record<string, string | number | string[] | null> = {};
      if (next.description !== current.description) payload.description = next.description;
      if (!sameList(next.features, current.features ?? [])) payload.features = next.features;
      if (next.vin !== current.vin) payload.vin = next.vin;
      if (next.year !== current.year) payload.year = next.year;
      if (next.make !== current.make) payload.make = next.make;
      if (next.model !== current.model) payload.model = next.model;
      if (next.price_cents !== current.price_cents) payload.price_cents = next.price_cents;
      if (Object.keys(payload).length) {
        const { error } = await supabase.rpc("propose_vehicle_change", {
          p_vehicle_id: id,
          p_payload: payload,
          p_reason: text(form, "change_reason") || "Consequential field change",
        });
        if (error) return { error: error.message };
      }
    }
    const { error } = await supabase
      .from("vehicles")
      .update({
        trim: next.trim,
        body: next.body,
        fuel: next.fuel,
        transmission: next.transmission,
        drivetrain: next.drivetrain,
        engine: next.engine,
        power: next.power,
        exterior: next.exterior,
        interior: next.interior,
        mileage: next.mileage,
        title_status: next.title_status,
        location: next.location,
        export_ready: next.export_ready,
      })
      .eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(routes.admin.vehicle(id));
    return { ok: "Saved. Price, identity and wording changes, if any, went to the CEO as an approval." };
  }

  const { error } = await supabase.from("vehicles").update(next).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(routes.admin.vehicle(id));
  return { ok: "Saved." };
}

export async function setVehicleStatus(id: string, status: VehicleStatus, reason?: string): Promise<ActionState> {
  await requireStaff(["administrator"]);
  const supabase = await createClient();
  const patch: { status: VehicleStatus; withdrawn_reason?: string } = { status };
  if (status === "withdrawn") patch.withdrawn_reason = reason ?? "";
  const { error } = await supabase.from("vehicles").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(routes.admin.vehicles);
  revalidatePath(routes.admin.vehicle(id));
  revalidatePath(routes.admin.today);
  revalidatePath(routes.ceo.vehicles);
  revalidatePath(routes.ceo.vehicle(id));
  revalidatePath(routes.ceo.approvals);
  if (status === "available" || status === "withdrawn") {
    revalidatePath(routes.home);
    revalidatePath(routes.inventory);
  }
  if (status === "available") return { ok: "Listed on the website." };
  if (status === "submitted") return { ok: "Sent to the CEO for approval." };
  return { ok: `Status is now ${status}.` };
}

export async function withdrawVehicle(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return setVehicleStatus(id, "withdrawn", String(form.get("reason") ?? ""));
}

export async function submitVehicle(id: string, _prev: ActionState, _form: FormData): Promise<ActionState> {
  return setVehicleStatus(id, "submitted");
}

export async function unsubmitVehicle(id: string, _prev: ActionState, _form: FormData): Promise<ActionState> {
  return setVehicleStatus(id, "draft");
}

export async function markAvailable(id: string, _prev: ActionState, _form: FormData): Promise<ActionState> {
  return setVehicleStatus(id, "available");
}

export async function addCost(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { staff } = await requireStaff(["administrator"]);
  const supabase = await createClient();
  const { error } = await supabase.from("vehicle_costs").insert({
    vehicle_id: id,
    kind: text(form, "kind") as CostKind,
    amount_cents: Math.round(Number(form.get("amount") || 0) * 100),
    note: text(form, "note") || null,
    recorded_by: staff.id,
  });
  if (error) return { error: error.message };
  revalidatePath(routes.admin.vehicle(id));
  return { ok: "Cost recorded. You cannot see cost totals — the CEO can." };
}

export async function createStaffFromAuthorisation(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { staff } = await requireStaff(["administrator"]);
  const authorisationId = text(form, "authorisation_id");
  const name = text(form, "name");
  const supabase = await createClient();
  const { data: authz, error: authzError } = await supabase
    .from("staff_authorisations")
    .select("*")
    .eq("id", authorisationId)
    .eq("status", "pending")
    .single();
  if (authzError || !authz) return { error: "That authorisation is not open." };

  const admin = createAdminClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const invited = await admin.auth.admin.inviteUserByEmail(authz.email, {
    redirectTo: `${origin}/auth/callback?next=${routes.reset}`,
    data: { name, invited_by: staff.id },
  });
  if (invited.error || !invited.data.user) return { error: invited.error?.message ?? "The invite could not be sent." };

  const { error } = await supabase.rpc("consume_authorisation", {
    p_authorisation_id: authorisationId,
    p_user_id: invited.data.user.id,
    p_name: name,
  });
  if (error) return { error: error.message };
  revalidatePath(routes.admin.staff);
  return { ok: `Invite sent to ${authz.email}. Locally the email is in the mail viewer.` };
}

export async function deactivateStaffForm(id: string): Promise<void> {
  await deactivateStaff(id);
}

export async function resetTwoStepForm(id: string): Promise<void> {
  await resetTwoStep(id);
}

export async function deactivateStaff(id: string): Promise<ActionState> {
  await requireStaff(["administrator"]);
  const supabase = await createClient();
  const { error } = await supabase.from("staff_users").update({ status: "deactivated" }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(routes.admin.staff);
  return { ok: "Account deactivated." };
}

export async function resetTwoStep(id: string): Promise<ActionState> {
  await requireStaff(["administrator"]);
  const supabase = await createClient();
  const { data: target } = await supabase.from("staff_users").select("role,email").eq("id", id).single();
  if (!target || target.role === "ceo") return { error: "The CEO's two-step cannot be reset here." };
  const admin = createAdminClient();
  const factors = await admin.auth.admin.mfa.listFactors({ userId: id });
  for (const f of factors.data?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId: id });
  }
  await supabase.rpc("log_event", { p_action: "reset_two_step", p_table: "staff_users", p_row: id, p_after: { email: target.email } });
  revalidatePath(routes.admin.staff);
  return { ok: "Two-step reset. They will enrol again at next sign-in." };
}
