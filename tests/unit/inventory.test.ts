import { describe, expect, it } from "vitest";
import { clearedPath, dollarsToCents, filterChips, inventoryPath, PAGE_SIZE, parseInventorySearch, searchTerms, withoutChip } from "@/lib/inventory";
describe("inventory links", () => {
  it("keeps filters and the larger page size in the address", () => {
    const filters = parseInventorySearch({
      make: "Ferrari",
      model: "Roma",
      priceMin: "10.5",
      colour: "Red",
      exportReady: "1",
      sort: "price-asc",
      availability: "sold",
      limit: "48",
    });
    expect(filters.make).toBe("Ferrari");
    expect(filters.model).toBe("Roma");
    expect(dollarsToCents(filters.priceMin)).toBe(1050);
    expect(filters.colour).toBe("Red");
    expect(filters.exportReady).toBe(true);
    expect(filters.sort).toBe("price-asc");
    expect(filters.availability).toBe("sold");
    expect(filters.limit).toBe(48);
    expect(parseInventorySearch({ availability: "draft", title: "secret", priceMin: "nope" })).toMatchObject({
      availability: "",
      title: "",
      priceMin: "",
      limit: PAGE_SIZE,
      sort: "newest",
    });

    const shared = inventoryPath({ ...filters, limit: filters.limit + PAGE_SIZE });
    expect(shared).toContain("make=Ferrari");
    expect(shared).toContain("model=Roma");
    expect(shared).toContain("colour=Red");
    expect(shared).toContain("exportReady=1");
    expect(shared).toContain("sort=price-asc");
    expect(shared).toContain("limit=72");
    const again = parseInventorySearch(new URLSearchParams(shared.split("?")[1]));
    expect(again.limit).toBe(72);
    expect(again.make).toBe("Ferrari");
  });
});

describe("collection search, sort and chips", () => {
  it("keeps one tidy search in the address and drops characters that break a filter", () => {
    const filters = parseInventorySearch({ q: "  458   Spider ", sort: "year" });
    expect(filters.q).toBe("458 Spider");
    expect(filters.sort).toBe("year");
    expect(inventoryPath(filters)).toBe("/inventory?q=458+Spider&sort=year");
    expect(parseInventorySearch({ q: "x".repeat(200) }).q).toHaveLength(80);
    expect(searchTerms("Roma, (Spider)% *a:b \"c\" 'd'.e")).toEqual(["Roma", "Spider", "a", "b", "c"]);
    expect(searchTerms("")).toEqual([]);
  });

  it("lists active filters as chips, removes one at a time and clears all but the sort", () => {
    const filters = parseInventorySearch({ q: "Spider", make: "Ferrari", model: "458", priceMax: "230000", exportReady: "1", sort: "price-asc", limit: "48" });
    const chips = filterChips(filters);
    expect(chips.map((chip) => chip.label)).toEqual(["“Spider”", "Ferrari", "458", "Price up to $230,000", "Export-ready"]);
    const withoutMake = withoutChip(filters, chips[1]!);
    expect(withoutMake).not.toContain("make=");
    expect(withoutMake).not.toContain("model=");
    expect(withoutMake).not.toContain("limit=");
    expect(withoutMake).toContain("q=Spider");
    expect(clearedPath(filters)).toBe("/inventory?sort=price-asc");
    expect(filterChips(parseInventorySearch({}))).toEqual([]);
  });
});
