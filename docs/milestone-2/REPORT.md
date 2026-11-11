# Milestone 2 report: Project foundation, sign-in and the vehicle record

Local stack: Docker Desktop running, then `pnpm db:start`. App: `pnpm dev` at http://localhost:3000. Staff sign-in is `/sign-in`. The Milestone 1 prototype is unchanged at `/prototype`.

Test accounts (MOCK DATA, local only): `ceo@raptors.test`, `admin@raptors.test`, `sales@raptors.test`, `finance@raptors.test` — passwords and TOTP secrets are in `tests/helpers/fixtures.ts`. First sign-in still asks for the authenticator code.

## 1. Completed (against the scope list)

| Scope item | Where | Status |
|---|---|---|
| Next.js skeleton: `/`, `/admin`, `/ceo`, `/sign-in` | `src/app/` | Done |
| Local Supabase (Postgres, Auth, TOTP, no public sign-up) | `supabase/config.toml`, `pnpm db:start` | Done |
| Roles and permissions in the database (RLS, `aal2` required) | `supabase/migrations/20261102000000_foundation.sql` | Done |
| Append-only audit log; cost amounts stripped | `audit_log` + triggers | Done |
| Staff accounts created by the Administrator only on a CEO authorisation | `/ceo/staff`, `/admin/staff` | Done |
| Vehicle records: create, edit, submit, withdraw submission, mark available, withdraw with reason | `/admin/vehicles` | Done |
| Administrator can add a cost, cannot read costs | Add-cost panel on the vehicle page | Done |
| CEO approvals stub (publication and consequential changes) | `/ceo/approvals` | Done |
| CEO vehicles with costs; audit log | `/ceo/vehicles`, `/ceo/audit` | Done |
| Sign-in, two-step enrol/verify, password reset | `/sign-in`, `/sign-in/two-step`, `/sign-in/reset` | Done |
| Proxy redirects unsigned or aal1 visitors away from the portals | `src/proxy.ts` | Done |
| Public holding page; `/prototype` untouched | `/` | Done |
| Interim logos from Master Plan page 15 | `public/brand/`, `Wordmark` | Done |
| MOCK DATA seed for tests | `supabase/seed/MOCK_DATA_seed.sql` | Done |
| First real CEO script | `pnpm bootstrap:ceo` | Done |

## 2. Tested

| Test | How | Result |
|---|---|---|
| Contrast + price-privacy (unchanged) | `pnpm test` unit files | Pass |
| Database permissions for every role, anonymous, deactivated, and aal1 | vitest against local Supabase | Pass |
| Audit log on create, edit, submit, approve, withdraw, cost, staff authorisation; no `amount_cents` in the log | vitest | Pass |
| Staff E2E: create → submit → withdraw → resubmit → CEO approve → mark available; authorise + invite; Administrator blocked from `/ceo`; Sales blocked from `/admin` | Playwright | 3/3 pass |
| Axe on holding page, sign-in, reset, forbidden, Administrator pages, CEO pages | Playwright live-a11y | Pass |
| Prototype axe at 1440 and 390 px | Playwright a11y-desktop / a11y-phone | Pass (the previous Milestone 1 suite) |
| Build, lint, type-check | `pnpm build`, `pnpm lint`, `pnpm typecheck` | Pass |

## 3. Acceptance criteria

| Criterion | Result |
|---|---|
| A staff member can create, edit, submit and withdraw a vehicle | **Pass** (E2E + database tests) |
| Only an approved vehicle is marked available | **Pass** (status trigger + tests) |
| Unauthorised users are blocked in tests for every role | **Pass** |
| Every change appears in the audit log | **Pass** |
| Two-step verification is enforced | **Pass** (`aal2` on every RLS policy, proxy redirect, aal1 test) |

## 4. Outstanding issues

- Docker Desktop must be running before `pnpm db:start`.
- Email/password is on; public self-signup stays off. Invite emails land in the local mail viewer at http://127.0.0.1:54324.
- The page-15 lockups are raster and still include the design-card frame. A high-resolution vector file is still needed (Decision 8).
- Photos, documents and 360° are Milestone 3. Public inventory is Milestone 4.
- A Git repository exists; nothing in this milestone has been committed unless you ask.

## 5. What the developer must do

- Keep Docker running for local work. After a reboot: `pnpm db:start`, then `pnpm dev`.
- Create a cloud Supabase test project when you are ready; put its URL and keys in `.env.local` (same names as `.env.local.example`). No code changes.
- Run `pnpm bootstrap:ceo -- ceo@your-domain "Name"` for the first real CEO, then they enrol two-step at `/sign-in`.
- Supply the final high-resolution logo (light and dark).
- Confirm hosted accounts from `docs/milestone-0/04_accounts_to_create.md` (GitHub, Vercel, Supabase cloud, Sentry, uptime) when you want previews on the internet.
- Numeric approval limits (discounts, refunds, write-offs) are still TO CONFIGURE WITH RAPTORS (Decision 15, rest of it).

## 6. Out-of-scope items noticed (not built)

- Photo, document and 360° upload (M3)
- Public inventory and vehicle pages (M4)
- Customers, enquiries, quotations, emails (M6)
- Destinations, shipments, tracker (M7 / 7B)
- Orders, invoices, payments, receipts (M8)
- Vehicle-request flow (M9)
- Full dashboard and the rest of the approvals queue (M10)
