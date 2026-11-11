"use server";

import { parseInventorySearch, toSearchParams, type InventoryFilters } from "@/lib/inventory";
import { loadSaved } from "@/lib/public-catalog";

export async function loadSavedVehicles(ids: string[], filters: InventoryFilters) {
  return loadSaved(ids, parseInventorySearch(toSearchParams(filters)));
}
