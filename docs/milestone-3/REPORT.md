# Milestone 3 report: Media pipeline

Local stack: Docker Desktop running, then `pnpm db:start`. App: `pnpm dev` at http://localhost:3000. Staff sign-in is `/sign-in`. Photos and documents are under a vehicle in `/admin/vehicles`, and the library health page is `/admin/media`.

Video uploads use **Mux**. Until the Mux keys are in `.env.local`, paste an https link. The video file is not stored in Supabase. Playback stays private. Photos, documents and 360° frames do not need Mux.

## 1. Completed (against the scope list)

| Scope item | Where | Status |
|---|---|---|
| Private buckets for originals, renditions and documents | `supabase/migrations/20261109000000_media.sql` | Done |
| Photo upload, WebP renditions (about 1600px and 480px), reorder, flaw label, cover = first photo | Vehicle page, `src/components/media/VehicleMediaPanel.tsx` | Done |
| Documents: history, inspection, title, other. Title is forced internal | Same panel, database check | Done |
| 360° frames stored and ordered | Same panel, `reorder_vehicle_media` | Done |
| Video: https link now, Mux direct upload when the keys exist | Panel and `/api/webhooks/mux` | Done |
| Library health: storage used, failed uploads, retry, re-process | `/admin/media` | Done |
| CEO can open a vehicle and see media, including private documents | `/ceo/vehicles/[id]` | Done |
| Sales, Finance and anonymous users cannot read media or the files | Database policies and `/media/[id]` | Done |
| Audit log entries for media changes, without file bytes | `vehicle_media` trigger | Done |
| Running list of what you still need to do | `docs/DEVELOPER_STILL_TO_DO.md` | Done |

“Future vehicle page” on a document only records that a later milestone may show it. The file address stays private. Nothing from this milestone is on the public website.

## 2. Tested

| Test | How | Result |
|---|---|---|
| Renditions and Mux signature | `pnpm test` unit file | Pass |
| Anonymous, Sales and Finance cannot read media; title cannot be public; 36 frames keep a new order; one cover; private storage; audit row has no file bytes | vitest against local Supabase | Pass |
| Existing permission and audit tests | `pnpm test` | Pass (56 tests). Database files run one at a time so two-step codes do not collide |
| Administrator creates a vehicle, CEO approves it; staff authorisation; portals stay separated | Playwright staff project | Pass |
| WCAG A/AA on the public pages, sign-in, and the Administrator and CEO pages, including the new media pages | Playwright live-a11y | Pass |
| 40 photos upload and render at desktop and at 390px; cover on the first; flaw label; a bad file is listed and succeeds after retry; a title file returns 404 with no session and the image to the Administrator | Playwright media project | Pass |
| Build and type-check | `pnpm build` | Pass |

## 3. Acceptance criteria

| Criterion | Result |
|---|---|
| 40 photos upload and render correctly on phone and desktop | **Pass** |
| Private documents cannot be reached by the public | **Pass** |
| A 36-frame 360° set is stored and ordered | **Pass** |
| Failed uploads are visible and retryable | **Pass** |

## 4. Outstanding issues

- Docker Desktop must be running before `pnpm db:start`.
- Accepted still images are JPEG, PNG and WebP. A file that cannot be read is marked failed and can be replaced.
- Video upload does nothing until the Mux account exists. An https link works today.
- The public site still does not show vehicles, photos or documents. That is Milestone 4.

## 5. What the developer must do

The full list is in `docs/DEVELOPER_STILL_TO_DO.md`. It includes everything still open from Milestones 0, 1 and 2. For this milestone specifically:

- Create the Mux account when you want video upload. Put `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` and `MUX_WEBHOOK_SECRET` in `.env.local`. Point the webhook at `/api/webhooks/mux`.
- Keep Docker running for local work.

## 6. Out-of-scope items noticed (not built)

- Public inventory, vehicle pages, and the customer 360° viewer (Milestone 4)
- A second approval queue for photo edits. Staff see new files immediately. Nothing is published, because the website does not show vehicles yet
- Customers, quotations, shipments, payments and vehicle requests
- Auction feeds, stored auction passwords, or a “found on” source field (Milestone 9)
