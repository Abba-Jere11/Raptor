import { routes } from "@/lib/routes";

export const PAGE_SIZE = 24;
export const MAX_LIMIT = 240;

export const SORTS = ["newest", "price-asc", "price-desc", "mileage", "year"] as const;
export type SortKey = (typeof SORTS)[number];

const TITLES = ["clean", "rebuilt", "pending"] as const;
const AVAILABILITY = ["available", "reserved", "sold"] as const;

export type InventoryFilters = {
  q: string;
  make: string;
  model: string;
  yearMin: string;
  yearMax: string;
  priceMin: string;
  priceMax: string;
  mileageMin: string;
  mileageMax: string;
  body: string;
  fuel: string;
  transmission: string;
  drivetrain: string;
  colour: string;
  title: string;
  location: string;
  availability: string;
  exportReady: boolean;
  sort: SortKey;
  limit: number;
  saved: boolean;
};

export type FilterOptions = {
  makes: string[];
  models: { make: string; model: string }[];
  bodies: string[];
  fuels: string[];
  transmissions: string[];
  drivetrains: string[];
  colours: string[];
  titles: string[];
  locations: string[];
};

type SearchInput = URLSearchParams | Record<string, string | string[] | undefined>;

function read(input: SearchInput, key: string) {
  const raw = input instanceof URLSearchParams ? input.get(key) : Array.isArray(input[key]) ? input[key]?.[0] : input[key];
  return (raw ?? "").trim();
}

function whole(raw: string) {
  return /^\d+$/.test(raw) ? raw : "";
}

function decimal(raw: string) {
  return /^\d+(\.\d+)?$/.test(raw) ? raw : "";
}

function allowed(raw: string, values: readonly string[]) {
  return (values as readonly string[]).includes(raw) ? raw : "";
}

export function parseLimit(raw: string) {
  if (!/^\d+$/.test(raw)) return PAGE_SIZE;
  return Math.min(MAX_LIMIT, Math.max(PAGE_SIZE, Number(raw)));
}

export function emptyFilters(): InventoryFilters {
  return {
    q: "",
    make: "",
    model: "",
    yearMin: "",
    yearMax: "",
    priceMin: "",
    priceMax: "",
    mileageMin: "",
    mileageMax: "",
    body: "",
    fuel: "",
    transmission: "",
    drivetrain: "",
    colour: "",
    title: "",
    location: "",
    availability: "",
    exportReady: false,
    sort: "newest",
    limit: PAGE_SIZE,
    saved: false,
  };
}

export function parseInventorySearch(input: SearchInput): InventoryFilters {
  const sort = read(input, "sort");
  const availability = read(input, "availability");
  const title = read(input, "title");
  return {
    q: read(input, "q").replace(/\s+/g, " ").slice(0, 80),
    make: read(input, "make"),
    model: read(input, "model"),
    yearMin: whole(read(input, "yearMin")),
    yearMax: whole(read(input, "yearMax")),
    priceMin: decimal(read(input, "priceMin")),
    priceMax: decimal(read(input, "priceMax")),
    mileageMin: whole(read(input, "mileageMin")),
    mileageMax: whole(read(input, "mileageMax")),
    body: read(input, "body"),
    fuel: read(input, "fuel"),
    transmission: read(input, "transmission"),
    drivetrain: read(input, "drivetrain"),
    colour: read(input, "colour"),
    title: allowed(title, TITLES),
    location: read(input, "location"),
    availability: allowed(availability, AVAILABILITY),
    exportReady: read(input, "exportReady") === "1",
    sort: (SORTS as readonly string[]).includes(sort) ? (sort as SortKey) : "newest",
    limit: parseLimit(read(input, "limit")),
    saved: read(input, "saved") === "1",
  };
}

export function dollarsToCents(raw: string) {
  if (!decimal(raw)) return null;
  return Math.round(Number(raw) * 100);
}

export function toSearchParams(filters: InventoryFilters) {
  const params = new URLSearchParams();
  const set = (key: string, value: string) => {
    if (value) params.set(key, value);
  };
  set("q", filters.q);
  set("make", filters.make);
  set("model", filters.model);
  set("yearMin", filters.yearMin);
  set("yearMax", filters.yearMax);
  set("priceMin", filters.priceMin);
  set("priceMax", filters.priceMax);
  set("mileageMin", filters.mileageMin);
  set("mileageMax", filters.mileageMax);
  set("body", filters.body);
  set("fuel", filters.fuel);
  set("transmission", filters.transmission);
  set("drivetrain", filters.drivetrain);
  set("colour", filters.colour);
  set("title", filters.title);
  set("location", filters.location);
  set("availability", filters.availability);
  if (filters.exportReady) params.set("exportReady", "1");
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.limit !== PAGE_SIZE) params.set("limit", String(filters.limit));
  if (filters.saved) params.set("saved", "1");
  return params;
}

export function inventoryPath(filters: InventoryFilters) {
  const query = toSearchParams(filters).toString();
  return query ? `${routes.inventory}?${query}` : routes.inventory;
}

export function hasInventoryFilters(filters: InventoryFilters) {
  const { sort, limit, saved, ...rest } = filters;
  void sort;
  void limit;
  void saved;
  return Object.values(rest).some(Boolean) || filters.exportReady || filters.saved || filters.sort !== "newest";
}

/** Words for the make, model and trim search. Characters that would break a PostgREST filter are dropped. */
export function searchTerms(q: string) {
  return q
    .replace(/[,()%*\\:"'.]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);
}

export const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest",
  "price-asc": "Price, low to high",
  "price-desc": "Price, high to low",
  mileage: "Lowest mileage",
  year: "Year, newest",
};

export const AVAILABILITY_LABELS: Record<string, string> = { available: "Available", reserved: "Reserved", sold: "Sold" };

export type FilterChip = { key: string; label: string; patch: Partial<InventoryFilters> };

function rangeText(name: string, min: string, max: string, unit: (value: string) => string) {
  if (min && max) return `${name} ${unit(min)} to ${unit(max)}`;
  if (min) return `${name} from ${unit(min)}`;
  return `${name} up to ${unit(max)}`;
}

/** The active filters as removable chips, in the order the panel lists them. Sort and search stay in the bar. */
export function filterChips(filters: InventoryFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  const dollars = (value: string) => `$${Number(value).toLocaleString("en-US")}`;
  const miles = (value: string) => `${Number(value).toLocaleString("en-US")} mi`;
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”`, patch: { q: "" } });
  if (filters.make) chips.push({ key: "make", label: filters.make, patch: { make: "", model: "" } });
  if (filters.model) chips.push({ key: "model", label: filters.model, patch: { model: "" } });
  if (filters.body) chips.push({ key: "body", label: filters.body, patch: { body: "" } });
  if (filters.colour) chips.push({ key: "colour", label: filters.colour, patch: { colour: "" } });
  if (filters.priceMin || filters.priceMax)
    chips.push({ key: "price", label: rangeText("Price", filters.priceMin, filters.priceMax, dollars), patch: { priceMin: "", priceMax: "" } });
  if (filters.yearMin || filters.yearMax)
    chips.push({ key: "year", label: rangeText("Year", filters.yearMin, filters.yearMax, (value) => value), patch: { yearMin: "", yearMax: "" } });
  if (filters.mileageMin || filters.mileageMax)
    chips.push({ key: "mileage", label: rangeText("Mileage", filters.mileageMin, filters.mileageMax, miles), patch: { mileageMin: "", mileageMax: "" } });
  if (filters.fuel) chips.push({ key: "fuel", label: filters.fuel, patch: { fuel: "" } });
  if (filters.transmission) chips.push({ key: "transmission", label: filters.transmission, patch: { transmission: "" } });
  if (filters.drivetrain) chips.push({ key: "drivetrain", label: filters.drivetrain, patch: { drivetrain: "" } });
  if (filters.availability) chips.push({ key: "availability", label: AVAILABILITY_LABELS[filters.availability], patch: { availability: "" } });
  if (filters.title) chips.push({ key: "title", label: titleStatusLabel(filters.title), patch: { title: "" } });
  if (filters.exportReady) chips.push({ key: "exportReady", label: "Export-ready", patch: { exportReady: false } });
  if (filters.location) chips.push({ key: "location", label: filters.location, patch: { location: "" } });
  if (filters.saved) chips.push({ key: "saved", label: "Saved on this device", patch: { saved: false } });
  return chips;
}

/** Address with one chip removed. The list goes back to the first page. */
export function withoutChip(filters: InventoryFilters, chip: FilterChip) {
  return inventoryPath({ ...filters, ...chip.patch, limit: PAGE_SIZE });
}

/** Address with every filter and the search cleared. The chosen sort stays. */
export function clearedPath(filters: InventoryFilters) {
  return inventoryPath({ ...emptyFilters(), sort: filters.sort });
}

export function vehicleTitle(vehicle: { year: number; make: string; model: string; trim?: string | null }) {
  return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ");
}

export function titleStatusLabel(status: string) {
  if (status === "clean") return "Clean title";
  if (status === "rebuilt") return "Rebuilt title";
  if (status === "pending") return "Pending title";
  return status;
}
