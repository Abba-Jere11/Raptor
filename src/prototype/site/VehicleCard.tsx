"use client";

import Link from "next/link";
import { StatusChip } from "@/components/ui/Chip";
import { HeartIcon } from "@/components/ui/icons";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { cn } from "@/lib/cn";
import { useFavourites } from "@/lib/favourites";
import { formatMiles, formatMoney } from "@/lib/format";
import { type MockVehicle, vehicleTitle } from "@/mock/MOCK_DATA_vehicles";
import { routes } from "@/prototype/routes";

export function FavouriteButton({ vehicle, className }: { vehicle: MockVehicle; className?: string }) {
  const { has, toggle } = useFavourites();
  const saved = has(vehicle.id);
  return (
    <button
      type="button"
      onClick={() => toggle(vehicle.id)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${vehicleTitle(vehicle)} from saved` : `Save ${vehicleTitle(vehicle)}`}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft hover:bg-platinum",
        saved ? "text-crimson" : "text-charcoal",
        className,
      )}
    >
      <HeartIcon filled={saved} />
    </button>
  );
}

/** Soft card, large cut-out, status badge, favourite heart, exact USD price (Figures 3, 5). */
export function VehicleCard({ vehicle, priority }: { vehicle: MockVehicle; priority?: boolean }) {
  const badge = vehicle.status === "Reserved" ? "Reserved" : vehicle.status === "Sold" ? "Sold" : vehicle.isNew ? "New" : null;
  return (
    <article className="group relative overflow-hidden rounded-card border border-platinum bg-white shadow-soft transition-shadow hover:shadow-lift">
      <VehicleImage
        src={vehicle.image}
        alt={`${vehicleTitle(vehicle)}, ${vehicle.exterior}`}
        className="aspect-[16/10]"
        priority={priority}
        sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
      />
      <div className="absolute left-3 top-3 flex gap-1.5">
        {badge && <StatusChip status={badge} />}
        {vehicle.exportReady && vehicle.status !== "Sold" && <StatusChip status="Export-ready" />}
      </div>
      <FavouriteButton vehicle={vehicle} className="absolute right-3 top-3" />
      <div className="p-5">
        <h3 className="font-display font-semibold">
          <Link href={routes.site.vehicle(vehicle.slug)} className="after:absolute after:inset-0">
            {vehicleTitle(vehicle)}
          </Link>
        </h3>
        <p className="mt-0.5 text-sm text-slate tabular">
          {formatMiles(vehicle.mileage)} · {vehicle.location}
        </p>
        <p className="mt-3 font-display text-lg font-semibold tabular">
          {vehicle.status === "Sold" ? "Sold" : formatMoney(vehicle.price)}
        </p>
      </div>
    </article>
  );
}
