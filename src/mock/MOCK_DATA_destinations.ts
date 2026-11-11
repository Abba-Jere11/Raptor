/**
 * MOCK DATA FOR DESIGN ONLY. Real destinations come from Decision 1 and are
 * maintained by staff "as last confirmed" (Part 1 §4.5). Never computes duty.
 */
import { usd, type Money } from "@/lib/format";

export type EstimateState =
  | { kind: "estimate"; method: string; low: Money; high: Money; confirmedOn: string }
  | { kind: "confirm" }
  | { kind: "not-served" };

export type MockDestination = { country: string; ports: Array<{ port: string; state: EstimateState }> };

export const MOCK_DESTINATIONS: MockDestination[] = [
  {
    country: "Ghana",
    ports: [{ port: "Tema", state: { kind: "estimate", method: "container", low: usd(2900), high: usd(3600), confirmedOn: "12 Oct 2026" } }],
  },
  {
    country: "Nigeria",
    ports: [
      { port: "Lagos (Apapa)", state: { kind: "estimate", method: "RoRo", low: usd(2400), high: usd(3100), confirmedOn: "8 Oct 2026" } },
      { port: "Lagos (Tin Can)", state: { kind: "confirm" } },
    ],
  },
  { country: "Kenya", ports: [{ port: "Mombasa", state: { kind: "confirm" } }] },
  {
    country: "United Arab Emirates",
    ports: [{ port: "Jebel Ali", state: { kind: "estimate", method: "container", low: usd(3400), high: usd(4200), confirmedOn: "15 Oct 2026" } }],
  },
  { country: "Jamaica", ports: [{ port: "Kingston", state: { kind: "confirm" } }] },
  { country: "Other country", ports: [{ port: "Any port", state: { kind: "not-served" } }] },
];
