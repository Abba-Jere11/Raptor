import Link from "next/link";
import { StatusChip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import { formatMiles, formatMoney } from "@/lib/format";
import type { CatalogVehicle } from "@/lib/public-catalog";
import { routes } from "@/lib/routes";
import { vehicleTitle } from "@/lib/inventory";
import { FavouriteButton } from "./FavouriteButton";
import { VehiclePhoto } from "./VehiclePhoto";

const GRID_SIZES = "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw";

export function VehicleCard({
  vehicle,
  headingLevel = 2,
  sizes = GRID_SIZES,
  ratio = "aspect-[4/3]",
  size = "md",
}: {
  vehicle: CatalogVehicle;
  headingLevel?: 2 | 3;
  sizes?: string;
  ratio?: string;
  size?: "md" | "lg";
}) {
  const title = vehicleTitle(vehicle);
  const sold = vehicle.status === "sold";
  const Heading = headingLevel === 3 ? "h3" : "h2";
  return (
    <article className="group relative">
      <Link href={routes.vehicle(vehicle.slug)} className="block rounded-panel focus-visible:outline-offset-4">
        <div className="relative">
          <VehiclePhoto
            mediaId={vehicle.coverId}
            make={vehicle.make}
            model={vehicle.model}
            alt={`${title}${vehicle.exterior ? `, ${vehicle.exterior}` : ""}`}
            sizes={sizes}
            zoom
            placeholderSize={size === "lg" ? "lg" : "md"}
            className={cn("rounded-panel", ratio)}
          />
          <div className="absolute left-3 top-3 flex gap-1.5">
            {vehicle.status === "reserved" && <StatusChip status="Reserved" />}
            {sold && <StatusChip status="Sold" />}
            {vehicle.export_ready && !sold && <StatusChip status="Export-ready" />}
          </div>
          <span
            aria-hidden
            className="absolute bottom-3 left-3 inline-flex h-8 items-center rounded-full bg-white px-3.5 font-display text-xs font-semibold text-charcoal opacity-0 shadow-soft transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
          >
            View vehicle
          </span>
        </div>
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <Heading className={cn("min-w-0 font-display font-semibold tracking-tight", size === "lg" ? "text-2xl md:text-[1.75rem]" : "text-lg")}>
            {title}
          </Heading>
          <p className={cn("shrink-0 font-display font-semibold tabular", size === "lg" ? "text-xl" : "text-base")}>
            {sold ? (
              "Sold"
            ) : (
              <>
                {formatMoney({ cents: vehicle.price_cents, currency: "USD" })} <span className="text-xs font-medium text-slate">USD</span>
              </>
            )}
          </p>
        </div>
        <p className="mt-1 text-sm text-slate tabular">
          {formatMiles(vehicle.mileage)}
          {vehicle.location ? ` · ${vehicle.location}` : ""}
        </p>
      </Link>
      <FavouriteButton id={vehicle.id} title={title} className="absolute right-3 top-3 z-10 h-9 w-9" />
    </article>
  );
}

/** Outlines that hold the grid's place while a new set loads. */
export function VehicleCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="aspect-[4/3] rounded-panel ring-1 ring-inset ring-platinum" />
      <div className="mt-4 h-5 w-2/3 rounded-full bg-platinum" />
      <div className="mt-2 h-4 w-1/3 rounded-full bg-platinum" />
    </div>
  );
}
