/** MOCK DATA test accounts. Passwords and TOTP secrets are for local tests only. */
export const TEST = {
  ceo: { email: "ceo@raptors.test", password: "Test-CEO-2026!", totp: "JBSWY3DPEHPK3PXP", id: "11111111-1111-1111-1111-111111111111" },
  admin: { email: "admin@raptors.test", password: "Test-Admin-2026!", totp: "JBSWY3DPEHPK3PXQ", id: "22222222-2222-2222-2222-222222222222" },
  sales: { email: "sales@raptors.test", password: "Test-Sales-2026!", totp: "JBSWY3DPEHPK3PXR", id: "33333333-3333-3333-3333-333333333333" },
  finance: { email: "finance@raptors.test", password: "Test-Finance-2026!", totp: "JBSWY3DPEHPK3PXS", id: "44444444-4444-4444-4444-444444444444" },
  deactivated: { email: "old@raptors.test", password: "Test-Old-2026!!", totp: "JBSWY3DPEHPK3PXT", id: "55555555-5555-5555-5555-555555555555" },
  no2fa: { email: "no2fa@raptors.test", password: "Test-No2fa-2026!", id: "66666666-6666-6666-6666-666666666666" },
  vehicles: {
    draft: "b0000000-0000-0000-0000-000000000001",
    submitted: "b0000000-0000-0000-0000-000000000002",
    approved: "b0000000-0000-0000-0000-000000000003",
    available: "b0000000-0000-0000-0000-000000000004",
    withdrawn: "b0000000-0000-0000-0000-000000000005",
    draft2: "b0000000-0000-0000-0000-000000000006",
  },
  authorisation: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
};

export const ENV = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
  anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
  /** Local Supabase demo service-role key. Used only by database tests that call submit_enquiry. */
  service:
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
};
