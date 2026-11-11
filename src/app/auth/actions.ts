"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NEUTRAL_AUTH_ERROR } from "@/lib/auth";
import { env } from "@/lib/env";
import { homeForRole, routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { StaffRole } from "@/lib/db/types";

export type AuthState = { error?: string; qr?: string; factorId?: string; enrolled?: boolean };

function safeNext(raw: FormDataEntryValue | null) {
  const n = typeof raw === "string" ? raw : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "";
}

export async function signInAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = safeNext(form.get("next"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (/fetch failed|network|timeout|ECONNREFUSED|Failed to fetch/i.test(error.message)) {
      return { error: "Could not reach the sign-in service. Check that local Supabase is running, then try again." };
    }
    return { error: NEUTRAL_AUTH_ERROR };
  }
  redirect(`${routes.twoStep}${next ? `?next=${encodeURIComponent(next)}` : ""}`);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(routes.signIn);
}

export async function requestResetAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "");
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? env.siteUrl;
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=${routes.reset}` });
  return { error: undefined, enrolled: true };
}

export async function updatePasswordAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const password = String(form.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "The password could not be updated. Try a longer one with mixed characters." };
  redirect(routes.twoStep);
}

export async function beginTwoStep(): Promise<AuthState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(routes.signIn);

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") {
    const { data: staff } = await supabase.from("staff_users").select("role").eq("id", user.id).maybeSingle();
    redirect(staff ? homeForRole(staff.role as StaffRole) : routes.forbidden);
  }

  const factors = await supabase.auth.mfa.listFactors();
  const existing = factors.data?.totp[0];
  if (existing) return { factorId: existing.id, enrolled: true };

  const enrolled = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator" });
  if (enrolled.error || !enrolled.data) return { error: NEUTRAL_AUTH_ERROR };
  return { factorId: enrolled.data.id, qr: enrolled.data.totp.qr_code, enrolled: false };
}

export async function verifyTwoStep(_prev: AuthState, form: FormData): Promise<AuthState> {
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  const factorId = String(form.get("factorId") ?? "");
  const next = safeNext(form.get("next"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(routes.signIn);

  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error || !challenge.data) return { error: NEUTRAL_AUTH_ERROR, factorId };

  const verified = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code });
  if (verified.error) return { error: NEUTRAL_AUTH_ERROR, factorId };

  const { data: staff } = await supabase.from("staff_users").select("role,status").eq("id", user.id).maybeSingle();
  if (!staff || staff.status !== "active") {
    await supabase.auth.signOut();
    redirect(routes.forbidden);
  }
  redirect(next || homeForRole(staff.role));
}
