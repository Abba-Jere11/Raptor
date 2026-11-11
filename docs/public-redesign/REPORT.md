# Public website redesign — report

The homepage, the collection page and the vehicle page use the editorial redesign: white space, large photographs, confident type and one crimson action per screen. Every section and detail that existed before the redesign is still on the page, restyled rather than removed. Photographs fill their space edge to edge, with no grey stage, padding or card behind them.

The final screenshots are in [screenshots/final](screenshots/final), at 1440 and 390 pixels. The earlier [before](screenshots/before) and [after](screenshots/after) sets are from the first redesign attempt, which removed sections, and are kept for comparison only.

The database, admin and CEO tools, sign-in, media pipeline and prototype are unchanged. No request, quote or tracker page was added or linked.

## Design system

- **Layout.** A 12-column grid, 1280 pixels wide, with side margins of 20, 32 and 48 pixels (`shell` in [globals.css](../../src/app/globals.css)). Sections are 72, 96 and 128 pixels apart (`section-y`).
- **Type.** Plus Jakarta Sans for display (`display-xl`, `display-lg`, `display-md`), Inter for body (`lede`, `body-copy`), JetBrains Mono for VINs and stock numbers only.
- **Colour.** The six colours are unchanged; `tests/unit/contrast.test.ts` still checks them. There are no gradients.
- **Photos.**
  - Every vehicle photo fills its frame from the centre (`object-cover`), on listing cards, the homepage, the gallery, the thumbnails and the 360° viewer ([VehiclePhoto.tsx](../../src/components/inventory/VehiclePhoto.tsx), [VehicleGallery.tsx](../../src/components/inventory/VehicleGallery.tsx)).
  - There is no platinum background or padding behind a photo. The browser test checks this on the collection page.
  - Only the full-screen lightbox shows the whole photo uncropped, so a visitor can see the full image.
  - A vehicle with no photo shows a thin outline with the make, model and "No photos yet.", hidden from screen readers.
- **Motion.** Sections fade and rise 8 pixels over 240 milliseconds when they enter the screen ([Reveal.tsx](../../src/components/site/Reveal.tsx)). Photos scale to 1.02 on hover. Nothing moves when the visitor asks for reduced motion.
- **Buttons.** A crimson primary pill, a charcoal outline secondary pill, a white outline for the dark band, and a text link with an arrow ([Button.tsx](../../src/components/ui/Button.tsx)).
- **Listing card.** No border or panel. Chips sit over the photo, with a "View vehicle" cue on hover, then the title, the price with "USD" (or Sold, with no price), mileage and location ([VehicleCard.tsx](../../src/components/inventory/VehicleCard.tsx)).
- **Header and footer.**
  - "Inventory" is now "Collection" in the navigation.
  - WhatsApp, saved vehicles, the footer links and staff sign-in are kept.
  - The interim logo's baked-in frame is cropped in CSS (`Wordmark bare`). The file itself is unchanged.

## Homepage

[src/app/(public)/page.tsx](../../src/app/(public)/page.tsx) and `loadHome` in [public-content.ts](../../src/lib/public-content.ts). All eleven sections are kept, in this order:

1. **Hero.** "A different standard of driving.", the "Registered US dealer · Worldwide export" line, Explore Collection, and Discover Raptors when About is published. It shows the cover of the CEO-featured vehicle, with a caption link. With no featured photo, it shows a labelled stand-in.
2. **"Exceptional vehicles. Carefully selected."** One lead vehicle shown large, with the others as cards. Featured vehicles come first, then the newest available vehicles with a photo.
3. **"New arrivals."** The newest public vehicles, with a View inventory link.
4. **Dealer platforms.** A charcoal band: "We buy on dealer platforms that are closed to the public.", Manheim, OpenLane and any published platform, and the export countries when set.
5. **"Find your next vehicle."** Browse Inventory, and the makes in current stock with their vehicle counts.
6. **"More than finding a car."** A labelled stand-in photograph and the brand text.
7. **"How it works."** 01 Explore (linked), 02 Request and 03 Follow your journey (text only, because those workflows are not built).
8. **Recent activity.** Recently sold (no price), recent acquisitions and deliveries, each shown only when there are records.
9. **Guides.** Published guides with their topic and "Last confirmed" date.
10. **Trust figures.** Shown only when the figures are set.
11. **"The road is yours."** Explore Inventory, and Contact Raptors when Contact is published, with a labelled stand-in photograph on white.

Each stand-in image carries its own STAND-IN label, so there are three labels rather than one. The browser test checks that the number of labels matches the number of stand-in images.

## Collection page

[src/app/(public)/inventory/page.tsx](../../src/app/(public)/inventory/page.tsx) and [InventoryControls.tsx](../../src/components/inventory/InventoryControls.tsx).

- **Introduction.** "Explore the collection."
- **Search.** One field that matches make, model or trim, held in the address as `q` (`searchTerms` in [inventory.ts](../../src/lib/inventory.ts)). There is no database change.
- **Sort.** Newest, Price low to high, Price high to low, Lowest mileage, and the new Year newest.
- **Filters.** All the earlier filters are kept, grouped in a panel, with Clear all. Each active filter shows as a chip that can be removed, and a shared link restores the same list.
- **Kept details.** "Showing X of Y vehicles", Load more with the count still to see, the empty state with Clear all filters, and the saved vehicles list.

## Vehicle page

[src/app/(public)/inventory/[slug]/page.tsx](../../src/app/(public)/inventory/[slug]/page.tsx).

- **Gallery.** A 3:2 gallery with thumbnails, previous and next buttons, arrow keys, swipe and a full-screen view. 360° and video work as before.
- **Summary.** The status chip and the title-status chip, the title, the subtitle line (drivetrain, title status, location), the price with "USD", key facts and "We will confirm" for shipping.
- **Sold vehicles.** "This vehicle has been sold." with "Last listed price" in small type.
- **"Vehicle specifications."** General, Performance and Vehicle information. Every earlier key fact is in one of these groups: stock number, VIN, mileage, trim, body, drivetrain, engine, power, transmission, fuel, colours, location, title and export.
- **Documents.** The Inspection and History links, labelled as before.
- **"You may also be interested in."** All similar vehicles are shown, four across on desktop.
- **Phones.** When Contact is published, a slim bar fixed to the bottom shows the price and Contact.

## Visual review

[scripts/review-shots.cjs](../../scripts/review-shots.cjs) takes full-page screenshots of the homepage, the collection, a vehicle with a photo and a sold vehicle, at 1440 and 390 pixels:

```
node scripts/review-shots.cjs docs/public-redesign/screenshots/final <vehicle-slug> [sold-slug]
```

It also reports the page width, the headings, and how many photos sit on a background or padding. In the final round:

- No page was wider than its window.
- No photo sat on a background or padding.
- Every homepage section with data appeared. Deliveries, guides and trust figures were absent because none are published locally.

The screens show leftover rows from local tests (Loadmore, Home…, Photo…, Public…). Their photos are one-pixel test images, which show as flat colour when they fill a frame. The sold test vehicle's photo returns 404 because the database test records a file path without uploading a file. All of this is local test data.

## Tests

| Check | Result |
| --- | --- |
| Unit tests (`pnpm exec vitest run tests/unit`), including search, the year sort, chips and Clear all | 39 passed |
| Database tests `tests/db/public.test.ts` and `tests/db/content.test.ts` | 3 passed |
| `pnpm build`, including the type check | Passed |
| Browser tests, `public` project: [public.spec.ts](../../tests/e2e/public.spec.ts) and [homepage.spec.ts](../../tests/e2e/homepage.spec.ts) against the production build | 3 passed |

The browser tests cover:

- Explore Collection, the Collection nav label and no sideways scrolling on a 390-pixel phone;
- dealer platforms, stand-in labels and a published guide on the homepage;
- recently sold with no price, and approved deliveries;
- search, removing a chip, the shared filter link, Load more and Clear all filters;
- saved vehicles, Sold on the card with no price, and Sold on the vehicle page;
- photos filling their frame with no background or padding.

## Still missing

- **Photography.** There is no real photography. The hero (when nothing featured has a photo), the brand story and the closing section use the labelled stand-in renders in [public/stand-in](../../public/stand-in).
- **Logo.** The logo is still the interim file. A high-resolution light and dark logo is needed.
- **Unbuilt workflows.** Request, quotation and tracker are not built. "Request" and "Follow your journey" are text on the homepage, not links.
