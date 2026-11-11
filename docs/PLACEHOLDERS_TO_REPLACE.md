# Placeholders to replace

**Reminder for the developer.** These stand-ins are in use because the client has not supplied the real values yet (you asked to continue with placeholders and be reminded). Each one is shown in the interface in `[square brackets]` or labelled as interim. Replace them before launch, and update the Decisions Register (`docs/milestone-0/01_decisions_register.md`) when each decision is made.

| Placeholder | Where it appears | Real value comes from | Decision | Needed by |
|---|---|---|---|---|
| Interim emblem from Master Plan page 15 + lettering | Every header, emails, documents (`src/components/ui/Wordmark.tsx`, `public/brand/`) | High-resolution final logo file, light and dark | 8 | Before print / PDFs (M6) |
| Stand-in vehicle images (3D renders / silhouettes, labelled STAND-IN) | Every vehicle card and page in the prototype (`public/stand-in/`) | Raptors' own photography | 8 | M1 sign-off (client must approve the look on real photos) |
| `[Licence no.]` | Trust band, footer, documents, emails | Dealer licence details | 2 | M5 |
| `[Address]`, `[City, State]` | Footer, documents, trust band | Business address to publish | 2 | M5 |
| `[Year]` | Trust band ("Operating since") | Year the business started | 2 | M5 |
| `[Countries from records]` | Trust band ("Shipped to") | Real, recorded shipment records | 2 | M5 |
| `[WhatsApp number]` | WhatsApp buttons and links | Raptors' WhatsApp number | 9 | M5 |
| `[domain]` (`raptorsauto.com` used in mock-ups) | Address bars in mock-ups, tracker link, emails | The real domain | 8 | M2 |
| `[bank]`, `[number]`, `[code]` | Invoice payment instructions | Bank's official wire instructions | 3, 13 | M8 |
| `[reference]` | Receipt bank reference | Recorded per payment | 3 | M8 |
| Named representative | Tracker contact card, emails | The CEO names the contact | 14 | M6 |
| Email and document wording | All six email designs, quotation, invoice, receipt | CEO-approved wording | 14 | M6 |
| Fee lines (Raptors fee, export preparation) | Quotation, invoice, find-and-quote builder | Fee schedule | 5 | M6 |
| Destinations shown (Ghana / Tema, Nigeria / Lagos, etc.) | Estimator, request flow, tracker | The 3 to 5 launch countries | 1 | M7 |
| Platforms named (Manheim, OpenLane, "+ other platforms") | Dealer-access band, trust list | Full list and logo permission | 10 | M5 |
| Languages: English only | Whole site | Decision on languages | 9 | M5 |
| `[Vessel name]`, `[Container no.]`, `[B/L no.]` | Tracker shipping details | Recorded per shipment by the Administrator | 4 | M7 |
| `[Forwarder A/B/C]` | Shipment board | Chosen freight forwarders | 4 | M7 |
| `[Lot no.]` | CEO-only private panel (find and quote) | Recorded per sourced vehicle | 6 | M9 |
| `[Approved template text]` | Enquiry inbox reply box | CEO-approved reply templates | 14 | M6 |
| Discount limit `[TO CONFIGURE WITH RAPTORS]` | Approvals queue | CEO decides the limit | 5 | M6 |
| `[Phone]`, contact hours and time zone | Footer, tracker contact card | Raptors | 2 | M5 |

All figures, names, prices and vehicles in `src/mock/MOCK_DATA_*.ts` are **mock data for design only** and are never used outside `/prototype`.
