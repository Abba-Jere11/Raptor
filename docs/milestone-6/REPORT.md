# Milestone 6 report: Enquiries, quotations and emails

Local stack: Docker Desktop running, then `pnpm db:start`. App: `pnpm build` then `pnpm exec next start -p 3100` for Playwright, or `pnpm dev` at http://localhost:3000. Mailpit is at http://127.0.0.1:54324.

The prototype at `/prototype` is unchanged and still uses mock data. Saving a quotation never sends it. There is no accept button on the public site.

## 1. Completed (against the scope list)

| Scope item | Where | Status |
|---|---|---|
| Destinations, customers, enquiries, quotations, email templates, notification log, issued-documents bucket, RLS and RPCs | `supabase/migrations/20261110120000_quote_approval_type.sql`, `20261110120100_enquiries_quotations.sql`, `20261110120200`–`20261110120600_*` | Done |
| Public Get a quote / Send me the details drawers, Contact enquiry form, ship-to picker | `src/components/enquiry/*`, vehicle and contact pages | Done |
| CEO enquiry inbox and detail (status, owner, notes, response timer, prepare quotation) | `src/app/ceo/enquiries` | Done |
| Quotation builder: Save, Preview, Send (confirm), PDF, email, acceptance, decline, new version, discount approval | `src/app/ceo/quotes`, `src/lib/pdf/QuotationPdf.tsx`, `src/lib/email/*` | Done |
| Destinations (CEO status, Administrator list) and email templates (edit, preview, test, approve) | `src/app/ceo/destinations`, `src/app/admin/destinations`, `src/app/ceo/templates` | Done |
| Homepage featured / sold / acquisitions / deliveries polish; vehicle overview and features; admin wording fields | `src/app/(public)/page.tsx`, vehicle page, `VehicleForm` | Done |
| Running list and decisions register updated | `docs/DEVELOPER_STILL_TO_DO.md`, `docs/milestone-0/01_decisions_register.md` | Done |

Email provider is Resend when `RESEND_API_KEY` is set; otherwise local Mailpit. Customer emails without CEO-approved wording are held and logged, never sent.

`submit_enquiry` is granted to `service_role` only (the Next.js server calls it). Anonymous visitors cannot call it directly.

## 2. Tested

| Test | How | Result |
|---|---|---|
| Totals, money parsing, response timer, merge/escape, bot and enquiry parsing, PDF smoke | `pnpm exec vitest run tests/unit/quotes.test.ts` | Pass (9) |
| Administrator blocked; anon blocked from tables and `submit_enquiry`; save creates no notification; send needs matching preview; sent immutable; discount approval; template guard; destination status | `pnpm exec vitest run tests/db/quotes.test.ts` | Pass (6) |
| Quote request on a vehicle → enquiry → preview → send → Mailpit message | `pnpm exec playwright test --project=quotes --no-deps` (with `MAILPIT_URL`) | Pass |
| Public vehicle shows Get a quote; homepage featured quote link and sold chip | Updates in `tests/e2e/public.spec.ts`, `homepage.spec.ts` | Included in public project |
| Build | `pnpm build` | Pass |

## 3. Acceptance criteria

| Criterion | Result |
|---|---|
| Saving a quotation never sends it | **Pass** |
| Send is explicit and needs a matching preview | **Pass** |
| No accept button on the website; CEO records acceptance | **Pass** |
| Administrator has no access to customers or money (enquiries, quotes, discounts) | **Pass** |
| Customer email uses CEO-approved wording only; otherwise held | **Pass** |
| Destination list with Open / Confirm each time / Not served; public honest states | **Pass** |

## 4. Outstanding issues

- Docker Desktop must be running before `pnpm db:start`.
- Resend account, DNS (SPF/DKIM/DMARC), `RESEND_API_KEY`, `EMAIL_FROM` and `RATE_LIMIT_SALT` are still to configure for production.
- Decisions 5, 13, 14 and 15 remain open with the client; templates ship as drafts until the CEO approves wording.
- Dated freight rates and full destination pricing are Milestone 7.

## 5. What the developer must do

The full list is in `docs/DEVELOPER_STILL_TO_DO.md`. For this milestone specifically:

- Create the Resend account and DNS records; set `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`.
- Set a dedicated `RATE_LIMIT_SALT` (do not rely on the service-role key slice in production).
- Approve the starter email templates in `/ceo/templates` before live customer mail.
- Settle fee schedule, invoice wording, customer email/document wording and discount limits with Raptors (Decisions 5, 13, 14, 15).

## 6. Out-of-scope items noticed (not built)

- Dated freight rates and destination pricing (Milestone 7)
- Journey tracker (Milestone 7B)
- Orders, invoices and payments (Milestone 8)
- Vehicle request flow (Milestone 9)
