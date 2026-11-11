# Milestone 1 report: Design system and key designs

Open `/prototype` (run `pnpm dev`, then go to http://localhost:3000/prototype) for the index of every screen, labelled with its Master Plan figure number. Every page carries the banner "PROTOTYPE · MOCK DATA FOR DESIGN ONLY · STAND-IN IMAGERY · PLACEHOLDERS IN [BRACKETS]".

## 1. Completed (against the scope list)

| Scope item | Where | Status |
|---|---|---|
| Next.js app (TypeScript, Tailwind, pnpm) that Milestone 2 extends; tokens in `src/app/globals.css`; fonts self-hosted via `next/font` | repo root | Done |
| Design system page and contrast table (Figure 1) | `/prototype/design-system` | Done |
| Reusable components: pill button, soft card, step "(01)", chips and status chips, inputs/selects/search, tabs, tables, chart card with "View as table", stage tracker, delay notice, email and document layouts, portal shell, drawer, mock banner, interim wordmark | `src/components/ui/` | Done |
| Labelled mock data | `src/mock/MOCK_DATA_*.ts` | Done |
| Stand-in imagery extracted from the Master Plan PDF, with the CC BY credit on public pages | `public/stand-in/`, `scripts/extract-standins.mjs` | Done |
| Homepage (Figures 2–4), Inventory (5), Vehicle page incl. sold state (6–7), Request a Vehicle (8–9), request tracker and "We found your vehicle" (10), concierge, favourites drawer, guides hub, one guide, trust list, WhatsApp (15) | `/prototype/site/...` | Done |
| Journey Tracker sign-in and journey (12–13) | `/prototype/track`, `/prototype/track/journey` | Done |
| Six emails (14); quotation, invoice with deposit schedule, receipt (11) | `/prototype/emails`, `/prototype/documents/*` | Done |
| Administrator: Today, vehicle records (19), shipment board (new), tracking update with delay and live preview (20), staff accounts and permissions (new) | `/prototype/admin/...` | Done |
| CEO: requests board with find-and-quote and "CEO only" private panel (16), record a payment with the bank-confirmation tick (17), dashboard overview (18) and the eight further pages with the twelve charts, enquiry inbox, quotation builder (save → preview → send), approvals queue (all new) | `/prototype/ceo/...` | Done |
| Prototype index | `/prototype` | Done |

## 2. Tested

| Test | How | Result |
|---|---|---|
| Contrast | `pnpm test` (vitest): every text/background pair in `src/design/tokens.ts`; also checks the tokens match `globals.css` | 12/12 pass. Slate on Platinum (4.1:1) is allowed only for large or non-essential text, and the test enforces that rule. |
| Price-privacy guard | `pnpm test`: every customer-facing prototype file is checked for CEO-only sourcing data (source, purchase price, fees, margin, lot) | 21/21 pass |
| Accessibility | `pnpm test:e2e`: Playwright + axe (WCAG 2.0/2.1/2.2 A and AA) on all 37 screens at 1440 px and at 390 px | 74/74 pass on the final build. Earlier violations were fixed: logo link name, three contrast cases, gallery button label, and a scroll region not reachable by keyboard. |
| Keyboard | Playwright keyboard project: phone menu (open, Escape, focus returns), filter pill (Enter/Escape, focus returns), all four request steps by keyboard, payment form (tick, then button enables), quotation builder (send only after preview); each checks a visible focus ring | 5/5 pass |
| Screenshots | `pnpm screenshots` | 74 images (37 screens × desktop and phone) in `docs/milestone-1/screenshots/` |
| Build, lint, type-check | `pnpm build`, `pnpm lint`, `pnpm typecheck` | All pass (54 pages generated) |

## 3. Acceptance criteria

| Criterion | Result |
|---|---|
| Contrast passes | **Pass** |
| Every screen exists for desktop and phone where relevant | **Pass**. Portal screens are desktop-first and remain usable at 390 px. |
| The client approves the look on real photography | **Pending**. This cannot pass until Raptors supplies photographs; all vehicle images are labelled stand-ins. |

## 4. Outstanding issues

- The dotted world map on the tracker uses simplified continent outlines. It is fine for review; a proper map asset can replace it in Milestone 10.
- The 360° viewer is simulated from the few stand-in angles available; a real 36-frame sequence is needed to judge it.
- Export buttons on charts and "Download" buttons are inert in the prototype, as planned.
- The stand-in model is a Ferrari 458; the Master Plan notes the badge may need hiding in final design.
- A Git repository exists but nothing is committed yet.

## 5. What the developer must do

- **Supply real photography** (and ideally one 360° sequence) so the client can approve the look. This is the only failing acceptance item.
- **Supply the final logo file** (light and dark).
- **Replace the placeholders** listed in `docs/PLACEHOLDERS_TO_REPLACE.md`. That file is the reminder you asked for and is now up to date.
- Have the client review the screenshots in `docs/milestone-1/screenshots/` or click through `/prototype`.

## 6. Out-of-scope items noticed (not built)

- The real email templates (table-based HTML with plain-text versions) and PDF generation for documents: Milestones 6 and 8.
- Live filtering and search on the database, real favourites email: Milestones 4–5.
- Real chart exports (CSV/PDF): dashboard milestone.
- A self-hosted map asset for the tracker.
