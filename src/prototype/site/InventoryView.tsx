"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Pill, PillButton } from "@/components/ui/Button";
import { SearchBox } from "@/components/ui/Field";
import { PillPopover } from "@/components/ui/Popover";
import { formatMoney } from "@/lib/format";
import { publicVehicles, vehicleTitle } from "@/mock/MOCK_DATA_vehicles";
import { VehicleCard } from "./VehicleCard";

const PAGE_SIZE = 24;

type Filters = {
  q: string;
  make: string;
  model: string;
  year: string;
  maxPrice: string;
  body: string;
  title: string;
  location: string;
  exportReady: boolean;
  sort: "newest" | "price-asc" | "price-desc" | "mileage";
};

const SORTS: Record<Filters["sort"], string> = {
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  mileage: "Lowest mileage",
};

const uniq = (xs: Array<string | number>) => [...new Set(xs.map(String))].sort();

function OptionList({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="eyebrow mb-2">{name}</legend>
      <div className="flex flex-col gap-1">
        {["", ...options].map((o) => (
          <label key={o || "any"} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-platinum">
            <input type="radio" name={name} checked={value === o} onChange={() => onChange(o)} className="accent-crimson" />
            {o || "Any"}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function InventoryView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [shown, setShown] = useState(PAGE_SIZE);

  const f: Filters = {
    q: params.get("q") ?? "",
    make: params.get("make") ?? "",
    model: params.get("model") ?? "",
    year: params.get("year") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    body: params.get("body") ?? "",
    title: params.get("title") ?? "",
    location: params.get("location") ?? "",
    exportReady: params.get("exportReady") === "1",
    sort: (params.get("sort") as Filters["sort"]) ?? "newest",
  };

  /** Filters live in the address so any view can be shared (Milestone 4 requirement, designed here). */
  const set = (patch: Partial<Record<keyof Filters, string | boolean>>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === "" || v === false || v === undefined) next.delete(k);
      else next.set(k, v === true ? "1" : String(v));
    }
    if (patch.make !== undefined) next.delete("model");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const results = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const list = publicVehicles.filter(
      (v) =>
        (!q || `${vehicleTitle(v)} ${v.vin} ${v.id}`.toLowerCase().includes(q)) &&
        (!f.make || v.make === f.make) &&
        (!f.model || v.model === f.model) &&
        (!f.year || String(v.year) === f.year) &&
        (!f.maxPrice || v.price.cents <= Number(f.maxPrice) * 100) &&
        (!f.body || v.body === f.body) &&
        (!f.title || v.titleStatus === f.title) &&
        (!f.location || v.location === f.location) &&
        (!f.exportReady || v.exportReady),
    );
    const sorters: Record<Filters["sort"], (a: (typeof list)[0], b: (typeof list)[0]) => number> = {
      newest: (a, b) => a.addedDaysAgo - b.addedDaysAgo,
      "price-asc": (a, b) => a.price.cents - b.price.cents,
      "price-desc": (a, b) => b.price.cents - a.price.cents,
      mileage: (a, b) => a.mileage - b.mileage,
    };
    return [...list].sort(sorters[f.sort]);
  }, [f.q, f.make, f.model, f.year, f.maxPrice, f.body, f.title, f.location, f.exportReady, f.sort]);

  const activeCount = [f.make, f.model, f.year, f.maxPrice, f.body, f.title, f.location].filter(Boolean).length + (f.exportReady ? 1 : 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Inventory</h1>
          <p className="mt-1 text-slate">
            <span className="tabular">{results.length}</span> vehicles · every price in USD · export-ready vehicles marked
          </p>
        </div>
        <SearchBox
          label="Search make, model or VIN"
          placeholder="Search make, model or VIN"
          className="w-full sm:w-80"
          defaultValue={f.q}
          onChange={(e) => set({ q: e.target.value })}
        />
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2 lg:flex-wrap lg:overflow-visible" role="group" aria-label="Filters">
        <PillPopover label={f.make || "Make"} active={!!f.make}>
          <OptionList name="Make" options={uniq(publicVehicles.map((v) => v.make))} value={f.make} onChange={(v) => set({ make: v })} />
        </PillPopover>
        <PillPopover label={f.model || "Model"} active={!!f.model}>
          {f.make ? (
            <OptionList
              name="Model"
              options={uniq(publicVehicles.filter((v) => v.make === f.make).map((v) => v.model))}
              value={f.model}
              onChange={(v) => set({ model: v })}
            />
          ) : (
            <p className="text-sm">Choose a make first.</p>
          )}
        </PillPopover>
        <PillPopover label={f.year || "Year"} active={!!f.year}>
          <OptionList name="Year" options={uniq(publicVehicles.map((v) => v.year))} value={f.year} onChange={(v) => set({ year: v })} />
        </PillPopover>
        <PillPopover label={f.maxPrice ? `Up to ${formatMoney({ cents: Number(f.maxPrice) * 100, currency: "USD" })}` : "Price"} active={!!f.maxPrice}>
          <OptionList
            name="Maximum price (USD)"
            options={["180000", "200000", "220000", "250000"]}
            value={f.maxPrice}
            onChange={(v) => set({ maxPrice: v })}
          />
        </PillPopover>
        <PillPopover label={f.body || "Body type"} active={!!f.body}>
          <OptionList name="Body type" options={uniq(publicVehicles.map((v) => v.body))} value={f.body} onChange={(v) => set({ body: v })} />
        </PillPopover>
        <PillPopover label={f.title ? `${f.title} title` : "Title status"} active={!!f.title}>
          <OptionList name="Title status" options={["Clean", "Rebuilt", "Pending"]} value={f.title} onChange={(v) => set({ title: v })} />
        </PillPopover>
        <PillPopover label={f.location || "Location"} active={!!f.location}>
          <OptionList name="Location" options={uniq(publicVehicles.map((v) => v.location))} value={f.location} onChange={(v) => set({ location: v })} />
        </PillPopover>
        <Pill active={f.exportReady} onClick={() => set({ exportReady: !f.exportReady })}>
          Export-ready {f.exportReady ? "✓" : ""}
        </Pill>
        <PillPopover label={`Sort: ${SORTS[f.sort]}`} align="right">
          <OptionList
            name="Sort by"
            options={Object.values(SORTS)}
            value={f.sort === "newest" ? "" : SORTS[f.sort]}
            onChange={(label) => {
              const key = (Object.keys(SORTS) as Filters["sort"][]).find((k) => SORTS[k] === label) ?? "newest";
              set({ sort: key === "newest" ? "" : key });
            }}
          />
        </PillPopover>
        {activeCount > 0 && (
          <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className="h-10 whitespace-nowrap px-3 text-sm font-semibold underline">
            Clear filters ({activeCount})
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="mt-10 rounded-card border border-platinum p-10 text-center">
          <h2 className="text-xl font-semibold">No vehicles match these filters</h2>
          <p className="mt-2 text-slate">Clear a filter, or tell us what you want and we will find it.</p>
          <div className="mt-6 flex justify-center">
            <PillButton href="/prototype/site/request-a-vehicle" variant="primary">
              Request a vehicle
            </PillButton>
          </div>
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.slice(0, shown).map((v, i) => (
            <li key={v.id}>
              <VehicleCard vehicle={v} priority={i < 4} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 flex flex-col items-center gap-3">
        <p className="text-sm text-slate">
          Showing <span className="tabular">{Math.min(shown, results.length)}</span> of{" "}
          <span className="tabular">{results.length}</span> · 24 per page
        </p>
        {shown < results.length && (
          <PillButton variant="outline" onClick={() => setShown((s) => s + PAGE_SIZE)}>
            Load more
          </PillButton>
        )}
      </div>
    </div>
  );
}
