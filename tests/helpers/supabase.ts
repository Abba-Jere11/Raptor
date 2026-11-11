import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { TOTP, Secret } from "otpauth";
import { ENV } from "./fixtures";

export function anonClient() {
  return createClient(ENV.url, ENV.anon, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Service-role client. Bypasses RLS — only for tests that must call submit_enquiry. */
export function serviceClient() {
  return createClient(ENV.url, ENV.service, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function signInAal1(email: string, password: string) {
  const supabase = anonClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(error?.message ?? "sign-in failed");
  return supabase;
}

export async function signInAal2(email: string, password: string, totp?: string) {
  const supabase = await signInAal1(email, password);
  if (!totp) return supabase;
  await completeMfa(supabase, totp);
  return supabase;
}

export async function completeMfa(supabase: SupabaseClient, totpSecret: string) {
  const factors = await supabase.auth.mfa.listFactors();
  let factorId = factors.data?.totp[0]?.id;
  let secret = totpSecret;
  if (!factorId) {
    const enrolled = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Test" });
    if (enrolled.error || !enrolled.data) throw new Error(enrolled.error?.message ?? "enroll failed");
    factorId = enrolled.data.id;
    secret = enrolled.data.totp.secret;
  }
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error || !challenge.data) throw new Error(challenge.error?.message ?? "challenge failed");
  const token = new TOTP({ secret: Secret.fromBase32(secret), algorithm: "SHA1", digits: 6, period: 30 }).generate();
  const verified = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code: token });
  if (verified.error) throw new Error(verified.error.message);
}

export function totpNow(secret: string) {
  return new TOTP({ secret: Secret.fromBase32(secret), algorithm: "SHA1", digits: 6, period: 30 }).generate();
}

const lastTotp = new Map<string, string>();

/** GoTrue rejects a TOTP code that was already used in this 30-second window. */
export async function totpFresh(secret: string) {
  let code = totpNow(secret);
  while (code === lastTotp.get(secret)) {
    await new Promise((r) => setTimeout(r, 1000));
    code = totpNow(secret);
  }
  lastTotp.set(secret, code);
  return code;
}
