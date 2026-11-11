/**
 * Creates the first real CEO account on a running Supabase project.
 * Usage: node scripts/bootstrap-ceo.mjs ceo@example.com "CEO name"
 * The new user must set up two-step verification at first sign-in.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];
const name = process.argv[3] ?? "CEO";

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!email) {
  console.error("Usage: node scripts/bootstrap-ceo.mjs ceo@example.com \"CEO name\"");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const password = `SetMe-${Math.random().toString(36).slice(2, 8)}-2026!`;

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name },
});
if (error || !data.user) {
  console.error(error?.message ?? "Could not create the user.");
  process.exit(1);
}

const { error: staffError } = await admin.from("staff_users").insert({
  id: data.user.id,
  email,
  name,
  role: "ceo",
  status: "active",
});
if (staffError) {
  console.error(staffError.message);
  process.exit(1);
}

console.log(`CEO account created for ${email}.`);
console.log(`Temporary password: ${password}`);
console.log("They must change it and enrol two-step verification at /sign-in.");
