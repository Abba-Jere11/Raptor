import { cn } from "@/lib/cn";
import type { PublicVehicle } from "@/lib/db/types";
import { formatMiles } from "@/lib/format";
import { titleStatusLabel } from "@/lib/inventory";

type Spec = { label: string; value: React.ReactNode; mono?: boolean };

function keep(rows: Array<Spec | false | null | undefined>): Spec[] {
  return rows.filter((row): row is Spec => Boolean(row && row.value));
}

function groups(vehicle: PublicVehicle) {
  return [
    {
      title: "Identity",
      rows: keep([
        { label: "Year", value: String(vehicle.year) },
        { label: "Make", value: vehicle.make },
        { label: "Model", value: vehicle.model },
        { label: "Trim", value: vehicle.trim },
        { label: "Body", value: vehicle.body },
        { label: "Exterior", value: vehicle.exterior },
        { label: "Interior", value: vehicle.interior },
      ]),
    },
    {
      title: "Performance",
      rows: keep([
        { label: "Engine", value: vehicle.engine },
        { label: "Power", value: vehicle.power },
        { label: "Transmission", value: vehicle.transmission },
        { label: "Drivetrain", value: vehicle.drivetrain },
        { label: "Fuel", value: vehicle.fuel },
      ]),
    },
    {
      title: "Condition & records",
      rows: keep([
        { label: "Mileage", value: formatMiles(vehicle.mileage) },
        { label: "Title", value: titleStatusLabel(vehicle.title_status) },
        { label: "Location", value: vehicle.location },
        vehicle.export_ready && { label: "Export", value: "Export-ready" },
        { label: "Stock number", value: vehicle.stock_number, mono: true },
        { label: "VIN", value: vehicle.vin, mono: true },
      ]),
    },
  ].filter((group) => group.rows.length > 0);
}

/** Specification groups for the public vehicle page. */
export function VehicleSpecs({ vehicle }: { vehicle: PublicVehicle }) {
  const detail = groups(vehicle);
  if (detail.length === 0) return null;

  return (
    <section aria-labelledby="specs-heading" className="mt-24 border-t border-platinum md:mt-32">
      <div className="shell py-16 md:py-20 lg:py-24">
        <div data-reveal className="max-w-2xl">
          <p className="eyebrow">Specifications</p>
          <h2 id="specs-heading" className="display-lg mt-3">
            The details.
          </h2>
          <p className="lede mt-4 text-slate">Identity, performance, condition and the identifiers used on documents.</p>
        </div>

        <div data-reveal className="mt-12 grid gap-12 md:mt-16 lg:grid-cols-3 lg:gap-16">
          {detail.map((group) => (
            <div key={group.title}>
              <h3 className="font-display text-lg font-semibold tracking-tight">{group.title}</h3>
              <dl className="mt-5 border-t border-charcoal">
                {group.rows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-baseline gap-4 border-b border-platinum py-3.5">
                    <dt className="text-sm text-slate">{row.label}</dt>
                    <dd
                      className={cn(
                        "text-right text-[0.9375rem] font-semibold text-charcoal",
                        row.mono && "font-mono text-[0.8125rem] font-medium tracking-tight break-all",
                      )}
                    >
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
