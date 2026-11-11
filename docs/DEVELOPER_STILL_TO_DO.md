# Still to do

Running list for the developer. Later milestones add to it; items stay until done.

**Where we are.** Milestones 0–6 and the public redesign are in the codebase. Local staff flow works: draft vehicle → photos → submit → CEO approve → mark available → public inventory. Enquiries, quotations, destinations and email templates are in the CEO portal. Shipments, orders, payments and vehicle requests are **not** built yet.

Homepage marketing stills (G63 / Porsche / Range Rover) are in `public/stand-in` for hero fallback, story and closing CTA. They are still labelled STAND-IN and are not inventory photos.

---

## Do every time you work locally

- Docker Desktop on → `pnpm db:start` → `pnpm dev` (http://localhost:3000).
- Staff sign-in: `/sign-in`. Test logins: `tests/helpers/fixtures.ts` (password + TOTP).
- Local email: Mailpit http://127.0.0.1:54324 until Resend is configured.
- After submit to CEO, the vehicle record and media stay locked until you withdraw or the CEO decides.

---

## Do next (unblocks real use)

### Content and inventory (no new accounts required)

- [ ] Fill Website content in the CEO / admin portal: legal name, dealer licence, address, phone, year started (Decision 2). Until saved, the public site leaves them off.
- [ ] Save a WhatsApp number starting with `+` so the header / contact button appears (Decision 9).
- [ ] Publish About, Contact, Legal, guides and FAQs when the wording is ready.
- [ ] Add real destination rows (country + port). CEO sets Open / Confirm each time / Not served. Dated freight rates wait for Milestone 7.
- [ ] Approve the four starter email templates under `/ceo/templates` before relying on customer email.
- [ ] Set `quote_discount_limit_cents` in site settings when the CEO agrees a limit (Decision 15).
- [ ] Keep adding real vehicles with real JPEG/PNG/WebP photos (cover chosen in admin). Failed or unwanted shots: delete in the media panel. Optional: one 360° sequence (≥24 frames).
- [ ] Decide what sold / delivery strips may show on the homepage (Decision 17). Current behaviour: year/make/model/location or description/place only — no price or customer name.

### Production accounts and keys

Full notes: `docs/milestone-0/04_accounts_to_create.md`.

- [ ] Password manager (Raptors’ name)
- [ ] Domain access (DNS)
- [ ] GitHub organisation + private repo
- [ ] Vercel team
- [ ] Supabase org, US region, separate **test** and **production** projects → keys in `.env.local` / production (same names as `.env.local.example`)
- [ ] **Resend** + SPF / DKIM / DMARC → `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`
- [ ] Production `RATE_LIMIT_SALT` (long random string; do not rely on the service-role key slice)
- [ ] Sentry (no customer PII or prices)
- [ ] Uptime checks: public site, `/admin`, `/ceo`, tracker (when built)
- [ ] Plausible (public pages only) → then add the script
- [ ] **Mux** only if you need video *upload* (https links work without it) → `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET`, webhook `/api/webhooks/mux`

### First production CEO

- [ ] `pnpm bootstrap:ceo -- ceo@your-domain "Name"` then enrol two-step at `/sign-in`.

---

## Waiting on the client (needed before later milestones)

Placeholders: `docs/PLACEHOLDERS_TO_REPLACE.md`. Decisions: `docs/milestone-0/01_decisions_register.md`.

- [ ] Final high-resolution logo, light and dark (Decision 8). Header/footer still crop the interim file in CSS.
- [ ] Real listing photography for vehicles (marketing stand-ins on the homepage are not a substitute for inventory galleries).
- [ ] Platforms to name beyond Manheim / OpenLane text, and whether logos may be shown (Decision 10).
- [ ] Launch countries and ports (Decision 1 → Milestone 7)
- [ ] Freight forwarders (Decision 4 → Milestone 7)
- [ ] Fee schedule for quotation lines (Decision 5)
- [ ] Bank for USD wires + answers in `docs/milestone-0/03_bank_questions.md` (Decisions 3, 13 → Milestone 8)
- [ ] Invoice / receipt wording with the accountant (Decision 13 → Milestone 8)
- [ ] Customer email and document wording beyond the starter drafts (Decision 14)
- [ ] Deposit rules (Decision 7 → Milestone 8)
- [ ] Buyer ID at full payment or at deposit (Decision 16 → Milestone 7B)
- [ ] Sourcing procedure, customer-facing “found car” experience, request pricing (Decisions 6, 11, 12 → Milestone 9)

---

## Do not build yet

Shipments, journey tracker, orders, invoices, payments and the vehicle-request flow are Milestones 7 / 7B / 8 / 9.
