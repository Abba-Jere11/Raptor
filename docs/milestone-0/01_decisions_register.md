# Raptors Auto Group: Decisions Register

Milestone 0 · Version 1 · Source: Master Plan v5, Section 22.1, and Master Prompt v2, Part 2.

**How this register works**
- Every decision starts as **Open**. It becomes **Decided** when the client gives an answer, or **Deferred** when the owner agrees to settle it later (the milestone it blocks is the latest point it can be deferred to).
- Decisions are asked **one at a time**, in the order of the milestone they block.
- Record the answer exactly as given, with the date and the person who decided. A changed answer is a new entry in the change log at the bottom; earlier answers are not overwritten.
- Owner "Raptors" means the business as a whole (CEO or whoever the CEO names). Owner "Raptors (CEO)" means the CEO personally.

---

## 1. M0-critical decisions (needed before Milestone 1)

These four are marked as needed by M0 in the Master Plan. They are asked first, in this order.

| Order | # | Decision | Why it is needed now |
|---|---|---|---|
| 1 | 2 | Legal entity, state, dealer licence details to publish | Trust content, legal pages, document headers, email sender identity |
| 2 | 3 | Bank for USD wires; incoming wire fees and limits | Invoice layout and payment flow; the bank questions (`03_bank_questions.md`) depend on it |
| 3 | 8 | Final logo file; photography and video capacity; domain; brand assets | Design system (M1) and account set-up (domain, email sending) |
| 4 | 9 | WhatsApp click-to-chat only, or automation later; languages | Header, concierge panel, and whether the design must allow for translation |

**Also gathered early.** The Master Plan's Milestone 0 deliverables also ask for the **fee schedule** (Decision 5) and the **invoice and receipt details agreed with Raptors' accountant** (Decision 13). They block M6 and M8 formally, but the client should start on them now because they involve outside parties.

---

## 2. Full register

| # | Decision | Owner | Blocks | Status | Answer | Date decided | Decided by |
|---|---|---|---|---|---|---|---|
| 1 | The 3 to 5 countries and ports to launch with | Raptors | M7 | Open | | | |
| 2 | Legal entity, state and dealer licence details to publish | Raptors | M0, M5 | Deferred to M5 | Placeholders in use (`[Licence no.]`, `[Address]`) | 1 Nov 2026 | Developer |
| 3 | Bank for USD wires; incoming wire fees and limits | Raptors | M0, M8 | Deferred to M8 | Placeholders in use (`[bank]`) | 1 Nov 2026 | Developer |
| 4 | Freight forwarder(s) and shipping lines | Raptors | M7 | Open | | | |
| 5 | Fee schedule for own stock and vehicle requests | Raptors | M6 | Open | | | |
| 6 | Raptors' own sourcing procedure (deposits, deadlines, what a quotation includes) | Raptors (CEO) | M9 | Open | | | |
| 7 | Deposit policy: usual deposit amount or percentage, and which steps wait for the deposit or for full payment | Raptors (CEO) | M8 | Open | | | |
| 8 | The final logo file; photography and video capacity; domain; brand assets | Raptors | M0, M1 | Deferred (high-res file still needed) | Interim lockup from Master Plan page 15 is in use | 2 Nov 2026 | Developer |
| 9 | WhatsApp click-to-chat only, or automation later; languages | Raptors | M0 | Deferred to M5 | Click-to-chat with `[WhatsApp number]`; English only | 1 Nov 2026 | Developer |
| 10 | The full list of platforms to name on the website, and whether official logos may be shown | Raptors | M5, M9 | Open | | | |
| 11 | What the customer sees when a vehicle is found (photos and specifications, never source or price), and whether platform photos may be used | Raptors (CEO) | M9 | Open | | | |
| 12 | Pricing model for vehicle requests: fee in the quotation, refundable search deposit, or both | Raptors (CEO) | M9 | Open | | | |
| 13 | Invoice and receipt details with Raptors' accountant: numbering, tax lines, bank details, terms | Raptors (CEO) | M6, M8 | Open | | | |
| 14 | Wording of every customer email and document | Raptors (CEO) | M6 | Open | | | |
| 15 | Approval limits (discounts, price changes, refunds, write-offs) and which staff, if any, the CEO authorises | Raptors (CEO) | M2, M6, M8 | Deferred (roles done; limits still open) | CEO, Administrator, Sales and Finance exist in the database. Sales and Finance accounts are created only on a CEO authorisation. Discount, refund and write-off limits remain TO CONFIGURE WITH RAPTORS. | 2 Nov 2026 | Developer |
| 16 | Buyer ID timing (at full payment or at deposit); optional phone code at first sign-in | Raptors | M7B | Open | | | |
| 17 | Whether Recently sold and customer-delivery entries need permission, and what they show | Raptors (CEO) | M5 | Open | | | |

---

## 3. Decisions grouped by the milestone they block

Use this to see what must be settled before each milestone starts. A decision appears under the earliest milestone it blocks.

| Milestone | Decisions that must be decided (or explicitly deferred) first |
|---|---|
| M0 Foundations | 2, 3, 8, 9 |
| M1 Design system | 8 |
| M2 Foundation, sign-in, vehicle record | 15 (which staff roles exist; limits can follow at M6) |
| M5 Homepage and content | 10, 17 |
| M6 Enquiries and quotations | 5, 13, 14 |
| M7 Destinations and export tracking | 1, 4 |
| M8 Orders and payments | 7 (plus 3 and 13 confirmed) |
| M7B Journey Tracker | 16 |
| M9 Vehicle requests | 6, 11, 12 |

---

## 4. Fixed positions (already settled in the Master Plan; not open)

These are recorded so that nobody reopens them by accident. Changing any of them needs the client's written approval.

- **No card payments and no card gateway at launch.** Payment is by international bank transfer (USD wire) only.
- **No accept button on the website.** The customer accepts by email or direct communication; the CEO records it.
- **No auction credentials stored anywhere.** Raptors' Manheim and OPENLANE accounts are used by people, on those sites. No scraping or automation of auction platforms.
- **Copart and IAA are not part of the website or the main flow.**
- **The platform never calculates import duty** and never states a country's rules as fact.
- **Light mode only at launch; no AI chat.**

---

## 5. Notes on the source documents

- Part 4 of the Master Prompt v2 refers to "Decision 13" for which platform photos may be shown; the correct reference is **Decision 11**. It refers to "Decision 15" for the accountant's invoice and receipt details; the correct reference is **Decision 13**. This register uses the correct numbers.
- The Master Prompt refers to interim logo vectors in `logo_clean/`. That folder is not in the project yet and must be supplied before Milestone 1 (see Decision 8).

---

## 6. Change log

| Date | # | Change | By |
|---|---|---|---|
| 1 Nov 2026 | All | Register created; all decisions Open | Developer |
| 1 Nov 2026 | 2, 3, 8, 9 | Deferred with placeholders so Milestone 1 can proceed; see `docs/PLACEHOLDERS_TO_REPLACE.md` | Developer |
| 2 Nov 2026 | 8 | Page-15 lockups extracted into `public/brand/`; high-resolution file still needed | Developer |
| 2 Nov 2026 | 15 | Four roles built; Sales/Finance only on CEO authorisation; numeric limits still open | Developer |
| 10 Nov 2026 | 5, 13, 14, 15 | Milestone 6 shipped with quotation lines, draft email templates, nullable `quote_discount_limit_cents`, and Resend/Mailpit. Fee schedule, accountant invoice wording, customer wording and numeric limits remain Open / Deferred with the client | Developer |
