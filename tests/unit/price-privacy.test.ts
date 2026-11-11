import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = new URL("../../src/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(p) ? [p] : [];
  });
}

/**
 * Customer-facing prototype surfaces: public site, tracker, emails, documents.
 * The homepage may name the platforms Raptors is registered at; it must never
 * reveal where a particular vehicle came from or what was paid for it.
 */
const customerFacing = [
  "app/prototype/site",
  "app/prototype/track",
  "app/prototype/emails",
  "app/prototype/documents",
  "prototype/site",
  "prototype/track",
].flatMap((d) => files(join(root, d)));

describe("price-privacy rule", () => {
  it("finds the customer-facing files", () => {
    expect(customerFacing.length).toBeGreaterThan(10);
  });

  it.each(customerFacing.map((f) => [f.slice(root.length)]))("%s never touches CEO-only sourcing data", (rel) => {
    const src = readFileSync(join(root, rel), "utf8");
    expect(src).not.toMatch(/MOCK_PRIVATE_SOURCING|purchasePrice|platformFees|transportToPort|foundOn|\bmargin\b/i);
    expect(src).not.toMatch(/auction price|lot no\.|\[Lot/i);
  });
});
