# Raptors Auto Group: Accounts to Create

Milestone 0 · Version 1 · For the developer. Follows Master Plan v5, Section 19 (Technology, security and performance).

**Purpose.** These are the service accounts the platform needs. The developer creates them. Nothing is built in Milestone 0; the accounts only need to exist and be secured before Milestone 2 (Milestone 1 needs only the repository and, optionally, hosting for the clickable prototype).

**Recommended defaults.** Each line names a recommended service. These are technical choices; the developer confirms or swaps each one. The aim is the fewest services that meet the plan.

---

## Rules for every account

1. **Owned by Raptors.** Create each account in Raptors' name, using a Raptors-controlled email address (for example `tech@<domain>`), with the developer added as an administrator or member. If Raptors and the developer part ways, Raptors keeps everything.
2. **Two-step verification on** for every person on every account, using an authenticator app, not SMS where avoidable.
3. **No shared passwords.** Each person has their own login. Passwords live in a password manager, never in documents, chat or the code repository.
4. **Secrets stay out of the code.** API keys go into the hosting provider's environment settings only.
5. **Billing** goes to Raptors' business card, with invoices sent to Raptors.
6. **No auction platform credentials anywhere.** Manheim, OpenLane and other platform logins are never stored in any of these services, in the code, or in the database.

---

## Accounts

| # | Need | Recommended service | Plan tier | Needed by | Notes |
|---|---|---|---|---|---|
| 1 | Code repository | **GitHub** (organisation in Raptors' name) | Free organisation | M1 | Private repository. Branch protection on the main branch. |
| 2 | Managed hosting with automatic deployments | **Vercel** (team in Raptors' name) | Pro (commercial use is not allowed on the free tier) | M1 (prototype preview), M2 | Built for Next.js. Each change gets a preview address; the main branch deploys to production. |
| 3 | Database, sign-in with two-step verification, file storage | **Supabase** (organisation in Raptors' name) | Pro (daily backups and no project pausing) | M2 | One account covers three needs: managed PostgreSQL with row-level security, authentication with authenticator-app two-step verification, and storage with private buckets and short-lived links. Choose a US region. Keep separate projects for testing and production. |
| 4 | Transactional email | **Postmark** (or Resend) | Lowest paid tier | M6 (set up DNS earlier) | Sends quotations, invoices, receipts and notifications. Needs SPF, DKIM and DMARC records on the domain so emails do not land in spam. |
| 5 | Error tracking | **Sentry** | Free or Team | M2 | Records application errors with alerts to the developer. Must be configured so that no customer personal data or prices are sent to it. |
| 6 | Uptime alerts | **Better Stack** (or UptimeRobot) | Free tier | M2 | Checks the public site, `/admin`, `/ceo` and the tracker every few minutes; alerts the developer. |
| 7 | Privacy-friendly analytics | **Plausible** | Lowest paid tier | M4 | No cookies, so no cookie banner is needed for analytics. Public pages only; never on `/admin`, `/ceo` or the tracker. |
| 8 | Domain registrar and DNS | The client's current registrar, or **Cloudflare** for DNS | Free DNS | Before M1 (domain), M2 (DNS records) | The developer needs access to add records for hosting, email and the tracker address. |
| 9 | Password manager | **1Password** or **Bitwarden** (business account in Raptors' name) | Teams | M0 | Holds every login and recovery code above. Shared vault for the developer and the CEO. |
| 10 | Video host | **Mux** (uploads) plus an https link | Pay as you go | M3 | Chosen in Milestone 3. Create the account when video upload is needed. Photos, documents and 360° do not need it. |

**Not needed at launch:** a card payment gateway (Stripe or similar), a separate search service, a separate analytics database, or any auction platform integration.

---

## Set-up order

1. Password manager (so every following login and recovery code is stored safely from the start).
2. Domain access confirmed.
3. GitHub organisation and private repository.
4. Vercel team, connected to the repository.
5. Supabase organisation with a test project (a production project is created closer to launch).
6. Email service, with its DNS records added to the domain.
7. Sentry, uptime monitoring and Plausible.

---

## Developer confirmation

| # | Account | Confirmed service | Created (date) | Owner email | Two-step on |
|---|---|---|---|---|---|
| 1 | Code repository | | | | |
| 2 | Hosting | | | | |
| 3 | Database, auth, storage | | | | |
| 4 | Transactional email | | | | |
| 5 | Error tracking | | | | |
| 6 | Uptime alerts | | | | |
| 7 | Analytics | | | | |
| 8 | Domain and DNS | | | | |
| 9 | Password manager | | | | |
| 10 | Video host | Mux | | | |
