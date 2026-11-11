import type { PublicDestination, PublicMedia, PublicVehicle } from "@/lib/db/types";
import { dollarsToCents, searchTerms, type InventoryFilters } from "@/lib/inventory";
import { createClient } from "@/lib/supabase/server";

export type CatalogVehicle = PublicVehicle & { coverId: string | null };

type Client = Awaited<ReturnType<typeof createClient>>;

function applyFilters<Q extends { eq: Function; gte: Function; lte: Function; or: Function; order: Function; limit: Function }>(
  query: Q,
  filters: InventoryFilters,
) {
  let next = query as Q & {
    eq: (column: string, value: string | number | boolean) => Q;
    gte: (column: string, value: number) => Q;
    lte: (column: string, value: number) => Q;
    or: (filter: string) => Q;
    order: (column: string, options: { ascending: boolean }) => Q;
    limit: (count: number) => Q;
  };
  for (const term of searchTerms(filters.q)) {
    next = next.or(`make.ilike.%${term}%,model.ilike.%${term}%,trim.ilike.%${term}%`) as typeof next;
  }
  const eq = (column: string, value: string) => {
    if (value) next = next.eq(column, value) as typeof next;
  };
  const min = (column: string, value: number | null) => {
    if (value !== null) next = next.gte(column, value) as typeof next;
  };
  const max = (column: string, value: number | null) => {
    if (value !== null) next = next.lte(column, value) as typeof next;
  };
  eq("make", filters.make);
  eq("model", filters.model);
  min("year", filters.yearMin ? Number(filters.yearMin) : null);
  max("year", filters.yearMax ? Number(filters.yearMax) : null);
  min("price_cents", dollarsToCents(filters.priceMin));
  max("price_cents", dollarsToCents(filters.priceMax));
  min("mileage", filters.mileageMin ? Number(filters.mileageMin) : null);
  max("mileage", filters.mileageMax ? Number(filters.mileageMax) : null);
  eq("body", filters.body);
  eq("fuel", filters.fuel);
  eq("transmission", filters.transmission);
  eq("drivetrain", filters.drivetrain);
  eq("exterior", filters.colour);
  eq("title_status", filters.title);
  eq("location", filters.location);
  eq("status", filters.availability);
  if (filters.exportReady) next = next.eq("export_ready", true) as typeof next;
  if (filters.sort === "price-asc") next = next.order("price_cents", { ascending: true }) as typeof next;
  else if (filters.sort === "price-desc") next = next.order("price_cents", { ascending: false }) as typeof next;
  else if (filters.sort === "mileage") next = next.order("mileage", { ascending: true }) as typeof next;
  else if (filters.sort === "year") next = next.order("year", { ascending: false }).order("created_at", { ascending: false }) as typeof next;
  else next = next.order("created_at", { ascending: false }) as typeof next;
  next = next.order("id", { ascending: true }) as typeof next;
  return next.limit(filters.limit);
}

export async function withCovers(supabase: Client, vehicles: PublicVehicle[]): Promise<CatalogVehicle[]> {
  const covers = new Map<string, string>();
  const ids = vehicles.map((vehicle) => vehicle.id);
  if (ids.length > 0) {
    const { data } = await supabase
      .from("public_vehicle_media")
      .select("id, vehicle_id, is_cover, sort_order")
      .eq("kind", "photo")
      .in("vehicle_id", ids)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true });
    for (const row of data ?? []) {
      if (!covers.has(row.vehicle_id)) covers.set(row.vehicle_id, row.id);
    }
  }
  return vehicles.map((vehicle) => ({ ...vehicle, coverId: covers.get(vehicle.id) ?? null }));
}

export async function loadInventory(filters: InventoryFilters) {
  const supabase = await createClient();
  const query = applyFilters(supabase.from("public_vehicles").select("*", { count: "exact" }), filters);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { vehicles: await withCovers(supabase, data ?? []), count: count ?? 0 };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function loadSaved(ids: string[], filters: InventoryFilters) {
  const unique = [...new Set(ids.filter((id) => UUID.test(id)))].slice(0, 100);
  if (unique.length === 0) return [];
  const supabase = await createClient();
  const query = applyFilters(supabase.from("public_vehicles").select("*", { count: "exact" }).in("id", unique), {
    ...filters,
    limit: 100,
    saved: false,
  });
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return withCovers(supabase, data ?? []);
}

export async function loadFilterOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_vehicles")
    .select("make, model, body, fuel, transmission, drivetrain, exterior, title_status, location");
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const uniq = (values: Array<string | null>) => [...new Set(values.filter((value): value is string => Boolean(value)))].sort();
  return {
    makes: uniq(rows.map((row) => row.make)),
    models: rows.map((row) => ({ make: row.make, model: row.model })),
    bodies: uniq(rows.map((row) => row.body)),
    fuels: uniq(rows.map((row) => row.fuel)),
    transmissions: uniq(rows.map((row) => row.transmission)),
    drivetrains: uniq(rows.map((row) => row.drivetrain)),
    colours: uniq(rows.map((row) => row.exterior)),
    titles: uniq(rows.map((row) => row.title_status)),
    locations: uniq(rows.map((row) => row.location)),
  };
}

export type VehiclePage = {
  vehicle: PublicVehicle;
  photos: PublicMedia[];
  frames: PublicMedia[];
  videoUrl: string | null;
  documents: PublicMedia[];
  similar: CatalogVehicle[];
};

export async function loadPublicDestinations(): Promise<PublicDestination[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("public_destinations").select("*").order("country").order("port");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function loadVehiclePage(slug: string): Promise<VehiclePage | null> {
  const supabase = await createClient();
  const { data: vehicle, error } = await supabase.from("public_vehicles").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!vehicle) return null;

  const { data: media, error: mediaError } = await supabase
    .from("public_vehicle_media")
    .select("*")
    .eq("vehicle_id", vehicle.id)
    .order("sort_order", { ascending: true })
    .order("frame_index", { ascending: true });
  if (mediaError) throw new Error(mediaError.message);
  const rows = media ?? [];

  const { data: sameMake } = await supabase.from("public_vehicles").select("*").eq("make", vehicle.make).neq("id", vehicle.id).limit(8);
  const similar = (sameMake ?? []).filter((row) => row.status !== "sold").slice(0, 4);
  if (similar.length < 4) {
    const { data: more } = await supabase.from("public_vehicles").select("*").neq("id", vehicle.id).neq("status", "sold").limit(8);
    for (const row of more ?? []) {
      if (similar.length >= 4) break;
      if (!similar.some((item) => item.id === row.id)) similar.push(row);
    }
  }

  const video = rows.find((row) => row.kind === "video" && row.video_url);
  return {
    vehicle,
    photos: rows.filter((row) => row.kind === "photo"),
    frames: rows.filter((row) => row.kind === "spin"),
    videoUrl: video?.video_url ?? null,
    documents: rows.filter((row) => row.kind === "document" && (row.document_kind === "history" || row.document_kind === "inspection")),
    similar: await withCovers(supabase, similar),
  };
}
