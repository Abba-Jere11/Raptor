import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PillButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/Chip";
import { CheckIcon, LockIcon } from "@/components/ui/icons";
import { KeyValueList } from "@/components/ui/Table";
import { formatMiles, formatMoney } from "@/lib/format";
import { getVehicle, MOCK_VEHICLE_DETAIL, MOCK_VEHICLES, publicVehicles, vehicleTitle } from "@/mock/MOCK_DATA_vehicles";
import { routes, whatsappHref } from "@/prototype/routes";
import { DestinationEstimator } from "@/prototype/site/DestinationEstimator";
import { VehicleCard } from "@/prototype/site/VehicleCard";
import { VehicleHero } from "@/prototype/site/VehicleHero";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return MOCK_VEHICLES.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = getVehicle((await params).slug);
  return { title: v ? `${vehicleTitle(v)} (Figures 6-7)` : "Vehicle" };
}

export default async function VehiclePage({ params }: Props) {
  const v = getVehicle((await params).slug);
  if (!v) notFound();
  const sold = v.status === "Sold";
  const similar = publicVehicles.filter((x) => x.id !== v.id && x.status !== "Sold").slice(0, 4);
  const waMessage = `Hello, I am interested in the ${vehicleTitle(v)} (${v.id}). Can you send me a quotation to [port]?`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: vehicleTitle(v),
    vehicleIdentificationNumber: v.vin,
    mileageFromOdometer: { "@type": "QuantitativeValue", value: v.mileage, unitCode: "SMI" },
    offers: { "@type": "Offer", priceCurrency: "USD", price: v.price.cents / 100, availability: sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock" },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="text-sm text-slate">
        <Link href={routes.site.inventory} className="hover:underline">
          Inventory
        </Link>{" "}
        / <span className="text-charcoal">{vehicleTitle(v)}</span>
      </nav>

      {/* Figure 6: title */}
      <header className="mx-auto mt-6 max-w-3xl text-center">
        <div className="flex flex-wrap justify-center gap-2">
          {sold && <StatusChip status="Sold" />}
          {v.status === "Reserved" && <StatusChip status="Reserved" />}
          {v.exportReady && !sold && <StatusChip status="Export-ready" />}
          <StatusChip status={`${v.titleStatus} title`} />
        </div>
        <h1 className="mt-4 text-4xl font-semibold md:text-5xl">{vehicleTitle(v)}</h1>
        <p className="mt-2 text-slate">
          Exotic · Model year {v.year} · {v.drivetrain} · {v.titleStatus} title · {v.location}
        </p>
        {!sold && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <PillButton href="#quote" variant="primary">
              Request a quote
            </PillButton>
            <PillButton href={whatsappHref(waMessage)} variant="outline">
              Chat on WhatsApp
            </PillButton>
          </div>
        )}
        {sold && (
          <p className="mt-6 rounded-panel bg-platinum p-4 text-sm">
            This vehicle has been sold. It stays here so shared links still work.{" "}
            <Link href={routes.site.request} className="font-semibold underline">
              Ask us to find one like it
            </Link>
            .
          </p>
        )}
      </header>

      <div className="mt-8">
        <VehicleHero vehicle={v} />
      </div>

      {/* Figure 7 */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="text-2xl font-semibold">Overview</h2>
            <p className="mt-3 max-w-2xl leading-relaxed">{MOCK_VEHICLE_DETAIL.overview}</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold">Technical specs</h2>
            <Card className="mt-4 px-5 py-2">
              <KeyValueList
                rows={[
                  { label: "VIN", value: <span className="font-mono">{v.vin}</span> },
                  { label: "Mileage", value: formatMiles(v.mileage) },
                  { label: "Drivetrain", value: v.drivetrain },
                  { label: "Engine", value: v.engine },
                  { label: "Power", value: v.power },
                  { label: "Transmission", value: v.transmission },
                  { label: "Fuel type", value: v.fuel },
                  { label: "Exterior · interior", value: `${v.exterior} · ${v.interior}` },
                ]}
              />
            </Card>
          </section>
          <div className="grid gap-6 md:grid-cols-2">
            <section>
              <h2 className="eyebrow">Features</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {MOCK_VEHICLE_DETAIL.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-success" /> {f}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="eyebrow">Documents</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {MOCK_VEHICLE_DETAIL.documents.map((d) => (
                  <li key={d.name} className="flex items-start gap-2">
                    {d.visibility === "public" ? <CheckIcon className="mt-1 h-4 w-4 text-success" /> : <LockIcon className="mt-1 h-4 w-4 text-slate" />}
                    <span>
                      <span className="font-medium">{d.name}</span>
                      <span className="block text-sm text-slate">{d.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <aside id="quote" className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            {sold ? (
              <p className="font-display text-2xl font-semibold">Sold</p>
            ) : (
              <>
                <p className="font-display text-3xl font-semibold tabular">
                  {formatMoney(v.price)} <span className="text-base font-normal text-slate">USD · vehicle only</span>
                </p>
                <p className="mt-2 text-sm text-slate">Contact us for a quotation with shipping to your port.</p>
                <div className="mt-5 flex flex-col gap-2">
                  <PillButton variant="primary" className="justify-between">
                    Get a quote
                  </PillButton>
                  <PillButton href={whatsappHref(waMessage)} variant="outline" className="justify-between">
                    Chat on WhatsApp
                  </PillButton>
                </div>
              </>
            )}
            <div className="mt-6 border-t border-platinum pt-6">
              <DestinationEstimator compact />
            </div>
          </Card>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold">Similar vehicles</h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {similar.map((s) => (
              <li key={s.id}>
                <VehicleCard vehicle={s} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
