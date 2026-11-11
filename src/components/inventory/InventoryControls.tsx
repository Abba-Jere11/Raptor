"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { PillButton } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { cn } from "@/lib/cn";
import {
  AVAILABILITY_LABELS,
  clearedPath,
  emptyFilters,
  filterChips,
  inventoryPath,
  PAGE_SIZE,
  SORT_LABELS,
  SORTS,
  titleStatusLabel,
  withoutChip,
  type FilterOptions,
  type InventoryFilters,
  type SortKey,
} from "@/lib/inventory";

function withCurrent(options: string[], current: string) {
  if (current && !options.includes(current)) return [...options, current].sort();
  return options;
}

/** Search, Filters and Sort above the collection, with the active filters as removable chips. */
export function InventoryControls({
  filters,
  options,
  children,
}: {
  filters: InventoryFilters;
  options: FilterOptions;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [panel, setPanel] = useState(false);
  const chips = filterChips(filters);
  const panelCount = chips.filter((chip) => chip.key !== "q").length;

  const go = (next: InventoryFilters) => {
    startTransition(() => router.replace(inventoryPath({ ...next, limit: PAGE_SIZE }), { scroll: false }));
  };

  return (
    <>
      <div className="sticky top-[72px] z-30 border-b border-platinum bg-white">
        <div className="shell grid grid-cols-2 gap-3 py-3 md:flex md:items-center">
          <SearchField value={filters.q} onSearch={(q) => go({ ...filters, q })} />
          <button
            type="button"
            onClick={() => setPanel(true)}
            aria-haspopup="dialog"
            className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full px-5 font-display text-[0.9375rem] font-semibold ring-1 ring-inset ring-silver transition-colors duration-150 hover:ring-charcoal"
          >
            <FiltersIcon />
            Filters
            {panelCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-charcoal px-1.5 text-xs text-white tabular">
                <span className="sr-only">, </span>
                {panelCount}
                <span className="sr-only"> active</span>
              </span>
            )}
          </button>
          <label className="relative inline-flex h-12 items-center rounded-full ring-1 ring-inset ring-silver transition-colors duration-150 focus-within:ring-charcoal hover:ring-charcoal">
            <span className="pointer-events-none absolute left-5 text-sm text-slate">Sort</span>
            <select
              value={filters.sort}
              onChange={(event) => go({ ...filters, sort: event.target.value as SortKey })}
              className="h-full w-full cursor-pointer appearance-none rounded-full bg-transparent pl-[3.75rem] pr-11 font-display text-[0.9375rem] font-semibold text-charcoal focus:outline-none md:w-auto"
            >
              {SORTS.map((sort) => (
                <option key={sort} value={sort}>
                  {SORT_LABELS[sort]}
                </option>
              ))}
            </select>
            <svg viewBox="0 0 16 16" className="pointer-events-none absolute right-5 h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </label>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="shell pt-5">
          <ul aria-label="Active filters" className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <li key={chip.key}>
                <Link
                  href={withoutChip(filters, chip)}
                  scroll={false}
                  aria-label={`Remove ${chip.label}`}
                  className="inline-flex h-8 items-center gap-2 rounded-full bg-platinum pl-3.5 pr-2.5 text-sm font-medium text-charcoal transition-colors duration-150 hover:bg-charcoal hover:text-white"
                >
                  {chip.label}
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                  </svg>
                </Link>
              </li>
            ))}
            <li>
              <Link href={clearedPath(filters)} scroll={false} className="ml-1 inline-flex h-8 items-center px-2 text-sm font-semibold text-charcoal underline underline-offset-4 hover:text-black">
                Clear all
              </Link>
            </li>
          </ul>
        </div>
      )}

      <div aria-busy={pending} className={cn("transition-opacity duration-150", pending && "opacity-60")}>
        {children}
      </div>

      <FilterPanel
        open={panel}
        filters={filters}
        options={options}
        onClose={() => setPanel(false)}
        onApply={(next) => {
          setPanel(false);
          go(next);
        }}
      />
    </>
  );
}

function SearchField({ value, onSearch }: { value: string; onSearch: (q: string) => void }) {
  const [text, setText] = useState(value);
  const latest = useRef(onSearch);
  latest.current = onSearch;
  useEffect(() => setText(value), [value]);
  useEffect(() => {
    const q = text.trim().replace(/\s+/g, " ");
    if (q === value) return;
    const timer = window.setTimeout(() => latest.current(q), 450);
    return () => window.clearTimeout(timer);
  }, [text, value]);

  return (
    <form
      role="search"
      className="col-span-2 md:flex-1"
      onSubmit={(event) => {
        event.preventDefault();
        const q = text.trim().replace(/\s+/g, " ");
        if (q !== value) onSearch(q);
      }}
    >
      <label className="relative flex h-12 items-center rounded-full bg-platinum transition-shadow duration-150 focus-within:ring-2 focus-within:ring-charcoal">
        <span className="sr-only">Search the collection</span>
        <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-5 h-[18px] w-[18px] text-charcoal" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="9" cy="9" r="5.5" />
          <path d="M13.2 13.2L17 17" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Search make, model or trim"
          maxLength={80}
          className="h-full w-full rounded-full bg-transparent pl-12 pr-5 text-[0.9375rem] text-charcoal placeholder:text-slate focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
      </label>
    </form>
  );
}

function FilterPanel({
  open,
  filters,
  options,
  onClose,
  onApply,
}: {
  open: boolean;
  filters: InventoryFilters;
  options: FilterOptions;
  onClose: () => void;
  onApply: (next: InventoryFilters) => void;
}) {
  const [draft, setDraft] = useState(filters);
  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);
  const set = (patch: Partial<InventoryFilters>) => setDraft((current) => ({ ...current, ...patch }));
  const models = draft.make ? [...new Set(options.models.filter((item) => item.make === draft.make).map((item) => item.model))].sort() : [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Filters"
      action={
        <button
          type="button"
          onClick={() => setDraft({ ...emptyFilters(), q: draft.q, sort: draft.sort })}
          className="h-10 rounded-full px-3 text-sm font-semibold text-charcoal underline underline-offset-4 hover:bg-platinum"
        >
          Clear all
        </button>
      }
      footer={
        <PillButton variant="primary" size="lg" className="w-full justify-between" onClick={() => onApply(draft)}>
          Show vehicles
        </PillButton>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onApply(draft);
        }}
      >
        <Group title="Vehicle">
          <SelectField label="Make" value={draft.make} options={withCurrent(options.makes, draft.make)} onChange={(make) => set({ make, model: "" })} />
          <SelectField
            label="Model"
            value={draft.model}
            options={withCurrent(models, draft.model)}
            disabled={!draft.make}
            placeholder={draft.make ? "Any model" : "Choose a make first"}
            onChange={(model) => set({ model })}
          />
          <OptionChips label="Body" value={draft.body} options={withCurrent(options.bodies, draft.body)} onChange={(body) => set({ body })} />
          <SelectField label="Colour" value={draft.colour} options={withCurrent(options.colours, draft.colour)} onChange={(colour) => set({ colour })} />
        </Group>
        <Group title="Price and year">
          <RangeField label="Price (USD)" min={draft.priceMin} max={draft.priceMax} decimal onChange={(priceMin, priceMax) => set({ priceMin, priceMax })} />
          <RangeField label="Year" min={draft.yearMin} max={draft.yearMax} onChange={(yearMin, yearMax) => set({ yearMin, yearMax })} />
        </Group>
        <Group title="Mileage">
          <RangeField label="Miles" min={draft.mileageMin} max={draft.mileageMax} onChange={(mileageMin, mileageMax) => set({ mileageMin, mileageMax })} />
        </Group>
        <Group title="Drive">
          <OptionChips label="Fuel" value={draft.fuel} options={withCurrent(options.fuels, draft.fuel)} onChange={(fuel) => set({ fuel })} />
          <OptionChips label="Transmission" value={draft.transmission} options={withCurrent(options.transmissions, draft.transmission)} onChange={(transmission) => set({ transmission })} />
          <OptionChips label="Drivetrain" value={draft.drivetrain} options={withCurrent(options.drivetrains, draft.drivetrain)} onChange={(drivetrain) => set({ drivetrain })} />
        </Group>
        <Group title="Status">
          <OptionChips
            label="Availability"
            value={draft.availability}
            options={Object.keys(AVAILABILITY_LABELS)}
            display={(value) => AVAILABILITY_LABELS[value] ?? value}
            onChange={(availability) => set({ availability })}
          />
          <OptionChips label="Title" value={draft.title} options={withCurrent(options.titles, draft.title)} display={titleStatusLabel} onChange={(title) => set({ title })} />
          <SelectField label="Location" value={draft.location} options={withCurrent(options.locations, draft.location)} onChange={(location) => set({ location })} />
          <Toggle label="Export-ready only" checked={draft.exportReady} onChange={(exportReady) => set({ exportReady })} />
          <Toggle label="Saved on this device only" checked={draft.saved} onChange={(saved) => set({ saved })} />
        </Group>
        <button type="submit" className="sr-only">
          Show vehicles
        </button>
      </form>
    </Drawer>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-platinum py-6 first:pt-1 last:border-b-0">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <div className="mt-4 flex flex-col gap-5">{children}</div>
    </section>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  if (options.length === 0 && !disabled) return null;
  return (
    <label className="block">
      <span className="text-sm font-medium text-charcoal">{label}</span>
      <span className="relative mt-2 block">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full cursor-pointer appearance-none rounded-xl bg-white pl-4 pr-10 text-[0.9375rem] text-charcoal ring-1 ring-inset ring-silver focus:outline-none focus:ring-2 focus:ring-charcoal disabled:cursor-not-allowed disabled:bg-platinum"
        >
          <option value="">{placeholder ?? `Any ${label.toLowerCase()}`}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <svg viewBox="0 0 16 16" className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  );
}

function OptionChips({
  label,
  value,
  options,
  onChange,
  display,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  display?: (value: string) => string;
}) {
  if (options.length === 0) return null;
  return (
    <fieldset>
      <legend className="text-sm font-medium text-charcoal">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? "" : option)}
              className={cn(
                "inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition-colors duration-150",
                active ? "bg-charcoal text-white" : "bg-white text-charcoal ring-1 ring-inset ring-silver hover:ring-charcoal",
              )}
            >
              {display ? display(option) : option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function RangeField({
  label,
  min,
  max,
  decimal,
  onChange,
}: {
  label: string;
  min: string;
  max: string;
  decimal?: boolean;
  onChange: (min: string, max: string) => void;
}) {
  const clean = (raw: string) => raw.replace(decimal ? /[^\d.]/g : /\D/g, "");
  return (
    <fieldset>
      <legend className="text-sm font-medium text-charcoal">{label}</legend>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="sr-only">{label} from</span>
          <input
            value={min}
            inputMode={decimal ? "decimal" : "numeric"}
            placeholder="From"
            onChange={(event) => onChange(clean(event.target.value), max)}
            className="h-12 w-full rounded-xl bg-white px-4 text-[0.9375rem] text-charcoal ring-1 ring-inset ring-silver tabular placeholder:text-slate focus:outline-none focus:ring-2 focus:ring-charcoal"
          />
        </label>
        <label className="block">
          <span className="sr-only">{label} to</span>
          <input
            value={max}
            inputMode={decimal ? "decimal" : "numeric"}
            placeholder="To"
            onChange={(event) => onChange(min, clean(event.target.value))}
            className="h-12 w-full rounded-xl bg-white px-4 text-[0.9375rem] text-charcoal ring-1 ring-inset ring-silver tabular placeholder:text-slate focus:outline-none focus:ring-2 focus:ring-charcoal"
          />
        </label>
      </div>
    </fieldset>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="text-[0.9375rem] text-charcoal">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className="relative h-7 w-12 shrink-0 rounded-full bg-silver transition-colors duration-150 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-soft after:transition-transform after:duration-150 peer-checked:bg-charcoal peer-checked:after:translate-x-5 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-crimson"
      />
    </label>
  );
}

function FiltersIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 6h9M15 6h2M3 14h3M9 14h8" strokeLinecap="round" />
      <circle cx="13.5" cy="6" r="1.8" />
      <circle cx="7.5" cy="14" r="1.8" />
    </svg>
  );
}
