import type { PublicDelivery, PublicFaq, PublicFeatured, PublicGuide, PublicPlatform, PublicSitePage, PublicSiteSettings, PublicSoldStrip, PublicVehicle } from "@/lib/db/types";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { withCovers, type CatalogVehicle } from "@/lib/public-catalog";
import { type PublicChromeData, type PublicNavItem } from "@/lib/site-chrome";

export type { PublicChromeData, PublicNavItem } from "@/lib/site-chrome";
export { whatsappHref } from "@/lib/site-chrome";

function filled(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : null;
}

export async function loadChrome(): Promise<PublicChromeData> {
  const supabase = await createClient();
  const [settings, pages, guides, faqs] = await Promise.all([
    supabase.from("public_site_settings").select("legal_name, whatsapp_e164").limit(1).maybeSingle(),
    supabase.from("public_site_pages").select("slug"),
    supabase.from("public_guides").select("id", { count: "exact", head: true }),
    supabase.from("public_faqs").select("id", { count: "exact", head: true }),
  ]);
  if (settings.error) throw new Error(settings.error.message);
  if (pages.error) throw new Error(pages.error.message);
  const published = new Set((pages.data ?? []).map((page) => page.slug));
  const nav: PublicNavItem[] = [
    { href: routes.home, label: "Home" },
    { href: routes.inventory, label: "Collection" },
  ];
  if (published.has("about")) nav.push({ href: routes.about, label: "About" });
  if ((guides.count ?? 0) > 0) nav.push({ href: routes.guides, label: "Guides" });
  if ((faqs.count ?? 0) > 0) nav.push({ href: routes.faqs, label: "FAQs" });
  if (published.has("contact")) nav.push({ href: routes.contact, label: "Contact" });
  const footer = [...nav];
  if (published.has("legal")) footer.push({ href: routes.legal, label: "Legal" });
  return {
    nav,
    footer,
    whatsapp: filled(settings.data?.whatsapp_e164),
    legalName: filled(settings.data?.legal_name),
  };
}

export async function loadPublishedPage(slug: "about" | "contact" | "legal"): Promise<PublicSitePage | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("public_site_pages").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function loadSettings(): Promise<PublicSiteSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("public_site_settings").select("*").limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function loadGuides(): Promise<PublicGuide[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("public_guides").select("*").order("confirmed_on", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function loadGuide(slug: string): Promise<PublicGuide | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("public_guides").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function loadFaqs(): Promise<PublicFaq[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("public_faqs").select("*").order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type HomeContent = {
  settings: PublicSiteSettings | null;
  platforms: PublicPlatform[];
  featured: PublicFeatured | null;
  heroCoverId: string | null;
  arrivals: CatalogVehicle[];
  sold: PublicSoldStrip[];
  acquisitions: CatalogVehicle[];
  deliveries: PublicDelivery[];
  shippedTo: number;
  guides: PublicGuide[];
  /** Up to three available vehicles: CEO-featured first, then the newest with a photo. */
  selection: CatalogVehicle[];
  /** Makes currently on the public list, most vehicles first. */
  makes: { make: string; count: number }[];
  aboutPublished: boolean;
  contactPublished: boolean;
};

export async function loadHome(): Promise<HomeContent> {
  const supabase = await createClient();
  // One available-vehicle pull powers selection, arrivals, and acquisitions.
  const [settings, platforms, featuredRows, deliveries, sold, guides, available, listed, pages] = await Promise.all([
    supabase.from("public_site_settings").select("*").limit(1).maybeSingle(),
    supabase.from("public_platforms").select("*").order("sort_order", { ascending: true }),
    supabase.from("public_featured").select("*").order("sort_order", { ascending: true }).order("approved_at", { ascending: false }).limit(3),
    supabase.from("public_deliveries").select("*").order("approved_at", { ascending: false }),
    supabase.from("public_sold_strip").select("*").order("year", { ascending: false }).limit(4),
    supabase.from("public_guides").select("*").order("confirmed_on", { ascending: false }).limit(4),
    supabase.from("public_vehicles").select("*").eq("status", "available").order("approved_at", { ascending: false, nullsFirst: false }).limit(24),
    supabase.from("public_vehicles").select("make").neq("status", "sold"),
    supabase.from("public_site_pages").select("slug"),
  ]);
  const failed = [settings, platforms, featuredRows, deliveries, sold, guides, available, listed, pages].find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);

  const featuredIds = (featuredRows.data ?? []).map((row) => row.vehicle_id);
  const stock = available.data ?? [];
  const candidates = await withCovers(supabase, stock);
  const byId = new Map(candidates.map((vehicle) => [vehicle.id, vehicle]));
  const rank = (vehicle: CatalogVehicle) => {
    const pick = featuredIds.indexOf(vehicle.id);
    return pick >= 0 ? pick : vehicle.coverId ? 10 : 20;
  };
  const selection = candidates
    .map((vehicle, index) => ({ vehicle, index }))
    .sort((a, b) => rank(a.vehicle) - rank(b.vehicle) || a.index - b.index)
    .slice(0, 3)
    .map((item) => item.vehicle);

  const arrivals = [...stock]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 4)
    .map((row) => byId.get(row.id))
    .filter((vehicle): vehicle is CatalogVehicle => Boolean(vehicle));
  const acquisitions = candidates.slice(0, 4);

  const counts = new Map<string, number>();
  for (const row of listed.data ?? []) counts.set(row.make, (counts.get(row.make) ?? 0) + 1);
  const makes = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([make, count]) => ({ make, count }));
  const published = new Set((pages.data ?? []).map((page) => page.slug));

  const featured = featuredRows.data?.[0] ?? null;
  let heroCoverId: string | null = null;
  if (featured) {
    const fromSelection = byId.get(featured.vehicle_id)?.coverId;
    if (fromSelection) {
      heroCoverId = fromSelection;
    } else {
      const cover = await supabase
        .from("public_vehicle_media")
        .select("id")
        .eq("vehicle_id", featured.vehicle_id)
        .eq("kind", "photo")
        .order("is_cover", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (cover.error) throw new Error(cover.error.message);
      heroCoverId = cover.data?.id ?? null;
    }
  }

  const places = new Set((deliveries.data ?? []).map((row) => row.place.trim().toLowerCase()).filter(Boolean));
  return {
    settings: settings.data,
    platforms: platforms.data ?? [],
    featured,
    heroCoverId,
    arrivals,
    sold: sold.data ?? [],
    acquisitions,
    deliveries: (deliveries.data ?? []).slice(0, 6),
    shippedTo: places.size,
    guides: guides.data ?? [],
    selection,
    makes,
    aboutPublished: published.has("about"),
    contactPublished: published.has("contact"),
  };
}
