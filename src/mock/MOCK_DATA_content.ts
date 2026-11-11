/** MOCK DATA FOR DESIGN ONLY. Homepage proof, guides, trust (Figures 4, 15). */

export const MOCK_RECENTLY_SOLD = [
  { title: "2013 Ferrari 458", place: "Sold · Houston", image: "/stand-in/car-34-red.png" },
  { title: "2012 Ferrari 458", place: "Sold · Atlanta", image: "/stand-in/car-34-silver.png" },
];

export const MOCK_ACQUISITIONS = [
  { title: "2014 Ferrari 458", place: "Acquired this week", image: "/stand-in/car-34-navy.png" },
  { title: "2015 Ferrari 458", place: "Acquired this week", image: "/stand-in/car-34-white.png" },
];

/** Shown only with the customer's permission; no personal details (Decision 17). */
export const MOCK_DELIVERIES = [
  { title: "2022 Rolls-Royce Ghost", place: "Delivered to Tema, Ghana", image: "/stand-in/car-34-black.png" },
  { title: "2020 Mercedes-Benz G 63", place: "Delivered to Lagos, Nigeria", image: "/stand-in/car-34-bronze.png" },
];

export const MOCK_GUIDES = [
  {
    slug: "import-a-vehicle-to-ghana",
    topic: "Customs",
    title: "How to import a vehicle to Ghana: what to expect",
    minutes: 6,
    confirmed: "12 Oct 2026",
    excerpt:
      "Rules change by country and by year, so we show what we last confirmed, with the date, and what to check with your customs authority.",
  },
  { slug: "roro-or-container", topic: "Shipping", title: "RoRo or container: which is right for you?", minutes: 5, confirmed: "3 Oct 2026", excerpt: "How the two shipping methods differ in protection, cost and which ports they reach." },
  { slug: "understanding-your-quotation", topic: "Payments", title: "Understanding your quotation, line by line", minutes: 4, confirmed: "1 Oct 2026", excerpt: "What each line means, what Raptors collects, and what you pay locally." },
  { slug: "documents-to-clear-customs", topic: "Customs", title: "What documents you need to clear customs", minutes: 7, confirmed: "28 Sep 2026", excerpt: "The paperwork we send you, and what your clearing agent will ask for." },
];

export const TRUST_POINTS = [
  "Registered US dealer, licence number shown",
  "Registered dealer at Manheim, OpenLane and other platforms",
  "Itemised quotation before you pay anything",
  "Every payment confirmed and receipted",
  "Follow your vehicle on the Journey Tracker",
];
