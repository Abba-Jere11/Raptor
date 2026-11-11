import { forbidden, redirect } from "next/navigation";
import type { StaffRole, StaffUser } from "@/lib/db/types";
import { homeForRole, routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export const NEUTRAL_AUTH_ERROR = "Those details did not match. Try again.";

export async function getStaff(): Promise<StaffUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") return null;
  const { data } = await supabase.from("staff_users").select("*").eq("id", user.id).maybeSingle();
  if (!data || data.status !== "active") return null;
  return data;
}

export async function requireStaff(roles?: StaffRole[]): Promise<{ staff: StaffUser }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`${routes.signIn}?next=${encodeURIComponent(await currentPath())}`);

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") redirect(`${routes.twoStep}?next=${encodeURIComponent(await currentPath())}`);

  const { data: staff } = await supabase.from("staff_users").select("*").eq("id", user.id).maybeSingle();
  if (!staff || staff.status !== "active") forbidden();
  if (roles && !roles.includes(staff.role)) forbidden();
  return { staff };
}

async function currentPath() {
  const { headers } = await import("next/headers");
  const h = await headers();
  return h.get("x-pathname") ?? "/";
}

export async function portalHome() {
  const staff = await getStaff();
  return staff ? homeForRole(staff.role) : routes.signIn;
}
