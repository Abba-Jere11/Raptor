import type { Metadata } from "next";
import Link from "next/link";
import { PillButton, TextLink } from "@/components/ui/Button";
import { InventoryControls } from "@/components/inventory/InventoryControls";
import { SavedList } from "@/components/inventory/SavedList";
import { VehicleCard } from "@/components/inventory/VehicleCard";
import { clearedPath, filterChips, hasInventoryFilters, inventoryPath, MAX_LIMIT, PAGE_SIZE, parseInventorySearch, withoutChip } from "@/lib/inventory";
import { loadFilterOptions, loadInventory } from "@/lib/public-catalog";
import { loadPublishedPage } from "@/lib/public-content";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Explore the collection",
  description: "Find a vehicle that fits your preferences. Available, reserved and recently sold vehicles from Raptors Auto Group.",
  alternates: { canonical: "/inventory" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function InventoryPage({ searchParams }: Props) {
  const filters = parseInventorySearch(await searchParams);
  const [options, result, contact] = await Promise.all([
    loadFilterOptions(),
    filters.saved ? Promise.resolve(null) : loadInventory(filters),
    loadPublishedPage("contact"),
  ]);
  const nextLimit = Math.min(MAX_LIMIT, filters.limit + PAGE_SIZE);
  const more = result ? result.count > result.vehicles.length && nextLimit > filters.limit : false;
  const chips = filterChips(filters);
  const lastChip = chips.at(-1);

  return (
    <main>
      <div className="shell flex flex-col gap-3 pb-8 pt-10 md:pb-10 md:pt-14 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <h1 className="display-lg">Explore the collection.</h1>
        <p className="lede text-slate lg:pb-1 lg:text-right">Find a vehicle that fits your preferences.</p>
      </div>

      <InventoryControls filters={filters} options={options}>
        <div className="shell pb-24 pt-6 md:pb-32">
          {filters.saved ? (
            <SavedList filters={filters} />
          ) : result && result.vehicles.length > 0 ? (
            <>
              <p className="text-sm text-slate" aria-live="polite">
                Showing <span className="tabular">{result.vehicles.length}</span> of <span className="tabular">{result.count}</span>
                {result.count === 1 ? " vehicle" : " vehicles"}
              </p>
              <ul className="mt-6 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {result.vehicles.map((vehicle, index) => (
                  <li key={vehicle.id} data-reveal={index >= 6 ? "" : undefined}>
                    <VehicleCard vehicle={vehicle} />
                  </li>
                ))}
              </ul>
              {more && (
                <div className="mt-16 flex flex-col items-center gap-3">
                  <PillButton href={inventoryPath({ ...filters, limit: nextLimit })} variant="secondary" arrow={false}>
                    Load more
                  </PillButton>
                  <p className="text-sm text-slate tabular">{result.count - result.vehicles.length} more to see</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center rounded-card bg-platinum px-6 py-20 text-center md:py-28">
              <h2 className="display-md">{hasInventoryFilters(filters) ? "Nothing matches these filters." : "No vehicles are published yet."}</h2>
              {hasInventoryFilters(filters) ? (
                <>
                  <p className="mt-3 max-w-md text-charcoal">Try removing a filter or widening a range. Everything else stays as you set it.</p>
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    {lastChip && chips.length > 1 && (
                      <PillButton href={withoutChip(filters, lastChip)} variant="secondary" arrow={false}>
                        Remove {lastChip.label}
                      </PillButton>
                    )}
                    <PillButton href={clearedPath(filters)} variant="dark" arrow={false}>
                      Clear all filters
                    </PillButton>
                  </div>
                </>
              ) : (
                <p className="mt-3 max-w-md text-charcoal">New vehicles appear here as soon as they are approved.</p>
              )}
            </div>
          )}

          <div className="mt-24 flex flex-col gap-4 border-t border-platinum pt-10 md:flex-row md:items-center md:justify-between">
            {contact && <p className="font-display text-lg font-semibold">Looking for something specific?</p>}
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {contact && <TextLink href={routes.contact}>Contact Raptors</TextLink>}
              <Link href={routes.home} className="font-display font-semibold text-charcoal underline-offset-[6px] hover:underline">
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </InventoryControls>
    </main>
  );
}
