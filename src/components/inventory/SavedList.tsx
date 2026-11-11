"use client";

import { useEffect, useState } from "react";
import { loadSavedVehicles } from "@/app/(public)/inventory/actions";
import { emptyFilters, hasInventoryFilters, inventoryPath, type InventoryFilters } from "@/lib/inventory";
import type { CatalogVehicle } from "@/lib/public-catalog";
import { useFavourites } from "@/lib/favourites";
import { VehicleCard, VehicleCardSkeleton } from "./VehicleCard";
import { PillButton } from "@/components/ui/Button";

export function SavedList({ filters }: { filters: InventoryFilters }) {
  const { ids } = useFavourites();
  const [rows, setRows] = useState<CatalogVehicle[] | null>(null);
  const key = `${ids.join(",")}?${inventoryPath(filters)}`;

  useEffect(() => {
    let cancelled = false;
    if (ids.length === 0) {
      setRows([]);
      return;
    }
    loadSavedVehicles(ids, filters).then((next) => {
      if (!cancelled) setRows(next);
    });
    return () => {
      cancelled = true;
    };
  }, [key, ids, filters]);

  if (rows === null) {
    return (
      <div role="status">
        <p className="sr-only">Loading saved vehicles.</p>
        <div className="mt-6 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <VehicleCardSkeleton key={item} />
          ))}
        </div>
      </div>
    );
  }
  const filtered = hasInventoryFilters({ ...filters, saved: false });
  if (ids.length === 0 || rows.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-card bg-platinum px-6 py-20 text-center md:py-28">
        <h2 className="display-md">
          {ids.length === 0 ? "You have not saved a vehicle on this device." : filtered ? "Nothing matches these filters." : "Those saved vehicles are not on the public list."}
        </h2>
        <p className="mt-3 max-w-md text-charcoal">Use the heart on any vehicle to keep it here. Saved vehicles stay on this device only.</p>
        <PillButton href={filtered ? inventoryPath({ ...emptyFilters(), sort: filters.sort, saved: true }) : "/inventory"} variant="dark" className="mt-8" arrow={false}>
          {filtered ? "Clear all filters" : "View the collection"}
        </PillButton>
      </div>
    );
  }
  return (
    <>
      <p className="text-sm text-slate">
        <span className="tabular">{rows.length}</span> saved on this device
        {filtered ? " that match these filters" : ""}
      </p>
      <ul className="mt-6 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((vehicle) => (
          <li key={vehicle.id}>
            <VehicleCard vehicle={vehicle} />
          </li>
        ))}
      </ul>
    </>
  );
}
