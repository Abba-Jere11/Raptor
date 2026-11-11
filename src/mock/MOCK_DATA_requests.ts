/** MOCK DATA FOR DESIGN ONLY. Vehicle requests (Figures 8-10, 16). */
import { usd } from "@/lib/format";

export const REQUEST_STAGES = [
  "Received",
  "Searching",
  "Vehicle found",
  "Quotation",
  "Accepted",
  "Payment",
  "Purchased",
  "Shipping",
] as const;

export const MAKES = [
  "Mercedes-Benz",
  "Rolls-Royce",
  "Ferrari",
  "Porsche",
  "Bentley",
  "Lamborghini",
  "BMW",
  "Land Rover",
  "Toyota",
  "Lexus",
  "Ford",
  "Other",
];

export type BoardColumn = "New" | "Searching" | "Found" | "Quotation sent" | "Accepted" | "Paid" | "Purchased";

export const BOARD_COLUMNS: BoardColumn[] = ["New", "Searching", "Found", "Quotation sent", "Accepted", "Paid", "Purchased"];

export const MOCK_REQUESTS: Array<{
  id: string;
  vehicle: string;
  country: string;
  budget: string;
  buyer: string;
  column: BoardColumn;
}> = [
  { id: "RQ-V-0120", vehicle: "Rolls-Royce Ghost", country: "Ghana", budget: "$250k", buyer: "Buyer 120", column: "New" },
  { id: "RQ-V-0119", vehicle: "Mercedes-Benz G 63", country: "Nigeria", budget: "$210k", buyer: "Buyer 119", column: "New" },
  { id: "RQ-V-0116", vehicle: "Porsche 911 Turbo S", country: "UAE", budget: "$230k", buyer: "Buyer 116", column: "Searching" },
  { id: "RQ-V-0112", vehicle: "Rolls-Royce Ghost", country: "Ghana", budget: "$250k", buyer: "Buyer 112", column: "Found" },
  { id: "RQ-V-0108", vehicle: "Lexus LX 600", country: "Nigeria", budget: "$120k", buyer: "Buyer 108", column: "Quotation sent" },
  { id: "RQ-V-0106", vehicle: "Bentley Continental GT", country: "Ghana", budget: "Q-0181", buyer: "Buyer 106", column: "Accepted" },
  { id: "RQ-V-0104", vehicle: "Toyota Land Cruiser 300", country: "Kenya", budget: "$85k", buyer: "Buyer 104", column: "Paid" },
  { id: "RQ-V-0099", vehicle: "Range Rover SV", country: "UAE", budget: "$175k", buyer: "Buyer 099", column: "Purchased" },
];

/** The request shown on the customer's request page (Figure 10). */
export const MOCK_REQUEST_PAGE = {
  id: "RQ-V-0112",
  summary: "Rolls-Royce Ghost · 2020 – 2024",
  details: "Left-hand drive · pre-owned · to Tema, Ghana",
  extra: "Up to $250,000 · within 3 months · reach you on WhatsApp",
  found: {
    title: "2022 Rolls-Royce Ghost · Arctic White",
    facts: "14,000 mi · clean title · black interior · Starlight headliner",
    images: ["/stand-in/car-34-white.png", "/stand-in/car-side-silver.png", "/stand-in/car-34-silver.png"],
  },
};

/**
 * CEO-ONLY private figures for the find-and-quote builder (Figure 16).
 * Price-privacy rule: these must never reach any customer-facing surface.
 */
export const MOCK_PRIVATE_SOURCING = {
  foundOn: "Manheim",
  purchasePrice: usd(198000),
  platformFees: usd(1150),
  transportToPort: usd(650),
};
