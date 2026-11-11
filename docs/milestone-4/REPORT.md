# Milestone 4 report: Public inventory and vehicle pages

Local stack: Docker Desktop running, then `pnpm db:start`. App: `pnpm dev` at http://localhost:3000. The public list is `/inventory`. A vehicle is `/inventory/[slug]`. The page at `/` is still a holding page; it links to the inventory and does not become the homepage.

Mock Ferraris stay in the staff portals. They are labelled MOCK DATA and are excluded from the public list.

## 1. Completed (against the scope list)

| Scope item | Where | Status |
|---|---|---|
| Stable slug from year, make, model and stock number | `supabase/migrations/20261109130000_public_inventory.sql` | Done |
| Anonymous read of public columns only. Drafts, mock rows, costs, notes, title files, original paths and Mux ids stay hidden | `public_vehicles` and `public_vehicle_media` | Done |
| `/inventory` with shareable filters, sort, 24 then Load more, on-device favourites, and an empty state | `src/app/inventory/page.tsx` | Done |
| `/inventory/[slug]` with gallery, flaws, facts only when present, similar vehicles and structured data | `src/app/inventory/[slug]/page.tsx` | Done |
| 360° only when 24 or more ready frames exist. Video only when an https link is stored | `src/components/inventory/VehicleGallery.tsx` | Done |
| History or inspection only when marked for the public page. Title images never | Public media view and `/media/[id]` | Done |
| Shipping panel says "We will confirm". No countries, rates, duty or documents stated as fact | Vehicle page | Done |
| No quote form and no WhatsApp button | Vehicle page | Done |
| Holding page links to the inventory | `src/app/page.tsx` | Done |
| Running list updated | `docs/DEVELOPER_STILL_TO_DO.md` | Done |

Colour filtering uses the existing exterior field. The Plausible script is not added. There is no account yet.

## 2. Tested

| Test | How | Result |
|---|---|---|
| Filter address keeps make, price, colour, sort and the larger page size | `pnpm test` unit file | Pass |
| Anonymous visitors cannot read vehicles, costs, notes, original paths or Mux ids. A published row is returned by make, colour and price. A draft, a mock car, a title file, an internal file and a Mux-only video stay out. A sold row stays public and keeps its slug | vitest against local Supabase | Pass |
| Existing permission, media, audit and unit tests | `pnpm test` | Pass (59 tests) |
| A shared filter address restores the same vehicle. Load more keeps `limit=48` in the address. A vehicle with no photo and no 360° still reads cleanly. A saved vehicle is still saved after refresh. An empty filter says nothing matches. A sold vehicle shows Sold and structured data. Inventory and the sold page have no WCAG A/AA violations | Playwright public project | Pass |
| A published photo returns WebP to a visitor with no session. The same address returns 404 before the vehicle is available. A title-file address returns 404 | Playwright public project | Pass |
| Build and type-check | `pnpm build`, `tsc --noEmit` | Pass |

On this computer, against the production server, the vehicle page responded in about 0.2–0.8 seconds (measured reloads of 169 ms to 776 ms). A physical mid-range phone was not available, so the 2.5 second target is not yet measured on a device.

The list asks for 24 thumbnails. The vehicle page is server-rendered and asks for the WebP renditions, not the original files.

## 3. Acceptance criteria

| Criterion | Result |
|---|---|
| Filters match the database | **Pass** |
| A shared link restores the same list, including Load more | **Pass** |
| Empty results and a vehicle with no photo or 360° stay readable | **Pass** |
| Vehicle page meaningful in under 2.5 seconds on a mid-range phone | **Not measured on a phone.** Local production responses were 0.2–0.8 seconds |
| A sold vehicle still opens, with a clear Sold label | **Pass** |

## 4. Outstanding issues

- Docker Desktop must be running before `pnpm db:start`.
- The app still cannot mark a vehicle reserved or sold. That remains Milestone 8. The sold page was checked by placing one sold record with the same database setting the local seed uses.
- A 24-frame 360° set was not dragged in the browser in this milestone. The control stays off when fewer than 24 frames exist, which was checked. Frames are already stored by Milestone 3.
- The phone timing above is not a measurement on a physical device.

## 5. What the developer must do

The full list is in `docs/DEVELOPER_STILL_TO_DO.md`. It includes everything still open from earlier milestones. For this milestone specifically:

- Create the Plausible account, then the script can be added to the public pages. It is intentionally not on the site yet.
- Keep Docker running for local work.

## 6. Out-of-scope items noticed (not built)

- The homepage, beyond the inventory link on the holding page (Milestone 5)
- Quote submission and WhatsApp (Milestones 6 and 5)
- Destination countries, ports and rates (Milestone 7). The panel does not invent them
- Comparison, enquiries, shipments, orders and payments
