function missing(name: string): never {
  throw new Error(`Missing ${name}. Copy .env.local.example to .env.local.`);
}

// Direct property access so Next can inline the public values in browser code.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const env = {
  supabaseUrl: supabaseUrl || missing("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: supabaseAnonKey || missing("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export function serviceRoleKey(): string {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) missing("SUPABASE_SERVICE_ROLE_KEY");
  return value;
}
