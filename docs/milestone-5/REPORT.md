# Milestone 5 report: Homepage, trust pages and content control

Local stack: Docker Desktop running, then `pnpm db:start`. App: `pnpm dev` at http://localhost:3000. The homepage is `/`. Inventory stays at `/inventory`.

The prototype at `/prototype` is unchanged and still uses mock data. The live site does not copy its request form, tracker, WhatsApp placeholder or sample deliveries.

## 1. Completed (against the scope list)

| Scope item | Where | Status |
|---|---|---|
| Site settings, pages, guides, questions, featured vehicles and deliveries. Anonymous visitors read published rows only | `supabase/migrations/20261109140000_content_approval_types.sql`, `20261109140100_public_content.sql`, `20261109140200_content_guard.sql` | Done |
| Homepage with new arrivals, the dealer band, three steps, recently sold, recent acquisitions, approved deliveries, guides and trust figures. A section with no records is left off | `src/app/(public)/page.tsx` | Done |
| One public header and footer for the homepage, inventory and trust pages. Saved vehicles stay on this device | `src/components/site/PublicChrome.tsx` | Done |
| About, guides, a guide, questions, contact and legal, from published wording, with titles, descriptions, sharing cards and structured data | `src/app/(public)/about`, `guides`, `faqs`, `contact`, `legal` | Done |
| Administrator drafts wording and proposes a featured vehicle or a delivery. The CEO publishes wording and approves both from Approvals | `src/app/admin/website`, `src/app/ceo/website`, `src/app/ceo/approvals` | Done |
| Running list updated | `docs/DEVELOPER_STILL_TO_DO.md` | Done |

Manheim and OpenLane are named in text. No logos, accounts, lot numbers or auction prices are shown. Copart and IAA cannot be saved as platform names. A page with no published wording is not linked. A guide shows the date it was last confirmed and does not state a country’s duty or documents as fact. There are no testimonials.

WhatsApp is a click-to-chat link, in English, and only when a number starting with + is saved. Requesting a vehicle and following a delivery are described in the three steps. They are not links.

## 2. Tested

| Test | How | Result |
|---|---|---|
| A featured vehicle is absent until the CEO approves it. A declined one stays off. A sold homepage row has no price and no VIN. A delivery is invisible until approved, and the public row has no price or customer field. An unpublished guide is invisible. WhatsApp is empty until a number is saved. Copart and IAA are rejected. Sales cannot write a page | `pnpm test` | Pass (60 tests) |
| Homepage, a published guide, featured approval, the sold strip, a delivery, and the phone menu. Inventory under the shared header. Homepage, inventory, sign-in and the staff website pages have no WCAG A/AA violations | Playwright `live-a11y` and `public` projects | Pass |
| Build | `pnpm build` | Pass |

On this computer, against the production server, a vehicle page reload was about 0.2–0.6 seconds. A physical phone was not measured. The homepage header was checked at 390 pixels wide: the menu opens and Inventory is in it.

The browser check opened `/`, followed View inventory to `/inventory`, opened the phone menu, opened `/guides` (no guides are published), and opened `/about` (not published, so the page is not found).

## 3. Acceptance criteria

| Criterion | Result |
|---|---|
| A featured vehicle appears only after CEO approval | **Pass** |
| Trust figures are recorded numbers. An empty figure is left off | **Pass** |
| Sold and delivery entries never show a price or a personal detail | **Pass** |
| No fake testimonials | **Pass** |

## 4. Outstanding issues

- Docker Desktop must be running before `pnpm db:start`.
- The licence, city, year started and WhatsApp number are still blank, so those figures and the WhatsApp button stay off the site until they are saved.
- The phone timing above is not a measurement on a physical device.

## 5. What the developer must do

The full list is in `docs/DEVELOPER_STILL_TO_DO.md`. It includes everything still open from earlier milestones. For this milestone specifically:

- Save the legal name, licence, city and year started under Website content when the client provides them.
- Save the WhatsApp number there, starting with +.
- Create the Plausible account before adding the script. It is intentionally not on the site yet.

## 6. Out-of-scope items noticed (not built)

- Quotation forms (Milestone 6)
- Destination countries, ports and rates (Milestone 7)
- The journey tracker (Milestone 7B)
- The vehicle request flow (Milestone 9)
- Enquiries, orders and payments
