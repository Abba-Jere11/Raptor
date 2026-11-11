import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PillButton, TextLink } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/Chip";
import { CheckIcon, LockIcon } from "@/components/ui/icons";
import { VehicleGallery } from "@/components/inventory/VehicleGallery";
import { VehicleCard } from "@/components/inventory/VehicleCard";
import { VehicleSpecs } from "@/components/inventory/VehicleSpecs";
import { VehicleActions } from "@/components/enquiry/VehicleActions";
import { cn } from "@/lib/cn";
import { formatMiles, formatMoney } from "@/lib/format";
import { routes } from "@/lib/routes";
import { titleStatusLabel, vehicleTitle } from "@/lib/inventory";
import { mediaFileUrl } from "@/lib/media/files";
import { loadPublicDestinations, loadVehiclePage } from "@/lib/public-catalog";
import { loadPublishedPage } from "@/lib/public-content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ quote?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const page = await loadVehiclePage(slug);
  if (!page) return { title: "Vehicle" };
  const title = vehicleTitle(page.vehicle);
  const description = [
    `${title} from Raptors Auto Group.`,
    formatMiles(page.vehicle.mileage),
    page.vehicle.location,
    page.vehicle.status === "sold" ? "Sold." : null,
  ]
    .filter(Boolean)
    .join(" ");
  const cover = page.photos[0];
  return {
    title,
    description,
    alternates: { canonical: routes.vehicle(slug) },
    openGraph: { title, description, url: routes.vehicle(slug), images: cover ? [mediaFileUrl(cover.id, "gallery")] : undefined },
  };
}

export default async function VehiclePage({ params, searchParams }: Props) {
  const slug = (await params).slug;
  const openQuote = (await searchParams).quote === "1";
  const [page, contact, destinations] = await Promise.all([loadVehiclePage(slug), loadPublishedPage("contact"), loadPublicDestinations()]);
  if (!page) notFound();
  const { vehicle, photos, frames, videoUrl, documents, similar } = page;
  const title = vehicleTitle(vehicle);
  const sold = vehicle.status === "sold";
  const reserved = vehicle.status === "reserved";
  const canQuote = vehicle.status === "available";
  const price = formatMoney({ cents: vehicle.price_cents, currency: "USD" });
  const subtitle = [formatMiles(vehicle.mileage), vehicle.drivetrain, vehicle.location].filter(Boolean).join(" · ");
  const summary = [
    { label: "Mileage", value: formatMiles(vehicle.mileage) },
    { label: "Transmission", value: vehicle.transmission },
    { label: "Drivetrain", value: vehicle.drivetrain },
    { label: "Exterior", value: vehicle.exterior },
    { label: "Interior", value: vehicle.interior },
    { label: "Title", value: titleStatusLabel(vehicle.title_status) },
    { label: "Location", value: vehicle.location },
    { label: "Stock", value: vehicle.stock_number, mono: true },
  ].filter((item): item is { label: string; value: string; mono?: boolean } => Boolean(item.value));
  const features = (vehicle.features ?? []).map((f) => f.trim()).filter(Boolean);
  const paragraphs = (vehicle.description ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: title,
    sku: vehicle.stock_number,
    vehicleIdentificationNumber: vehicle.vin,
    brand: { "@type": "Brand", name: vehicle.make },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    color: vehicle.exterior ?? undefined,
    vehicleInteriorColor: vehicle.interior ?? undefined,
    mileageFromOdometer: { "@type": "QuantitativeValue", value: vehicle.mileage, unitCode: "SMI" },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (vehicle.price_cents / 100).toFixed(2),
      availability: sold
        ? "https://schema.org/SoldOut"
        : reserved
          ? "https://schema.org/LimitedAvailability"
          : "https://schema.org/InStock",
    },
  };

  return (
    <main className={cn(canQuote && "pb-20 lg:pb-0")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="shell pb-4 pt-5 md:pt-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex min-w-0 items-center gap-2 text-sm text-slate">
            <li>
              <Link href={routes.inventory} className="hover:text-charcoal hover:underline">
                Collection
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="truncate text-charcoal" aria-current="page">
              {title}
            </li>
          </ol>
        </nav>
      </div>

      <div className="shell grid gap-10 lg:grid-cols-12 lg:gap-14 lg:items-start">
        <div className="min-w-0 lg:col-span-8">
          <VehicleGallery
            title={title}
            make={vehicle.make}
            model={vehicle.model}
            vehicleId={vehicle.id}
            photos={photos.map((photo) => ({ id: photo.id, alt: photo.alt_text || "Photo", flaw: photo.flaw_label }))}
            frames={frames.length >= 24 ? frames.map((frame, index) => ({ id: frame.id, alt: frame.alt_text || `360° frame ${index + 1}` })) : []}
            videoUrl={videoUrl}
          />
        </div>

        <aside className="min-w-0 lg:col-span-4 lg:sticky lg:top-[96px]" aria-label="Summary">
          <div className="flex flex-wrap gap-2">
            {sold ? <StatusChip status="Sold" /> : reserved ? <StatusChip status="Reserved" /> : <StatusChip status="Available" />}
            {vehicle.export_ready && !sold && <StatusChip status="Export-ready" />}
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-slate tabular">{vehicle.year}</p>
          <h1 className="mt-2 font-display text-[2.125rem] font-semibold leading-[1.08] tracking-tight md:text-[2.5rem]">
            {vehicle.make} {vehicle.model}
            {vehicle.trim ? ` ${vehicle.trim}` : ""}
          </h1>
          {subtitle && <p className="mt-3 text-[0.9875rem] text-slate">{subtitle}</p>}

          {sold ? (
            <div className="mt-8 border-t border-platinum pt-6">
              <p className="font-display text-[2rem] font-semibold leading-none">Sold</p>
              <p className="mt-3 text-sm text-charcoal">This vehicle has been sold. The page stays here so an old link still opens.</p>
              <p className="mt-4 text-sm text-slate">
                Last listed price <span className="tabular">{price} USD</span>
              </p>
            </div>
          ) : (
            <div className="mt-8 border-t border-platinum pt-6">
              <p className="font-display text-[2.125rem] font-semibold leading-none tabular">
                {price} <span className="text-base font-medium text-slate">USD</span>
              </p>
              <p className="mt-2 text-sm text-slate">Vehicle only. Shipping to your port is added in the quotation.</p>
            </div>
          )}

          {summary.length > 0 && (
            <dl className="mt-8 border-t border-charcoal">
              {summary.map((item) => (
                <div key={item.label} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-baseline gap-4 border-b border-platinum py-3">
                  <dt className="text-sm text-slate">{item.label}</dt>
                  <dd className={cn("text-right text-[0.9375rem] font-semibold text-charcoal tabular", item.mono && "font-mono text-[0.8125rem] font-medium")}>
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {sold ? (
            <div className="mt-8">
              <PillButton href={routes.inventory} variant="secondary" size="lg" className="w-full justify-between">
                Explore the collection
              </PillButton>
            </div>
          ) : (
            <VehicleActions
              vehicleId={vehicle.id}
              title={title}
              price={price}
              canQuote={canQuote}
              destinations={destinations}
              sourcePath={routes.vehicle(vehicle.slug)}
              openQuote={openQuote}
            />
          )}
        </aside>
      </div>

      {(paragraphs.length > 0 || features.length > 0) && (
        <section aria-labelledby="overview-heading" className="shell mt-24 md:mt-32">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            {paragraphs.length > 0 && (
              <div data-reveal className="lg:col-span-7">
                <p className="eyebrow">Overview</p>
                <h2 id="overview-heading" className="display-lg mt-3">
                  About this vehicle.
                </h2>
                <div className="mt-8 space-y-5 body-copy text-charcoal">
                  {paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </div>
            )}
            {features.length > 0 && (
              <div data-reveal className={cn(paragraphs.length > 0 ? "lg:col-span-5" : "lg:col-span-10")}>
                <p className="eyebrow">Included</p>
                <h2
                  id={paragraphs.length > 0 ? undefined : "overview-heading"}
                  className={cn(paragraphs.length > 0 ? "mt-3 font-display text-2xl font-semibold tracking-tight" : "display-lg mt-3")}
                >
                  Features.
                </h2>
                <ul className={cn("mt-6 divide-y divide-platinum border-t border-charcoal", paragraphs.length === 0 && "columns-1 sm:columns-2 gap-x-12")}>
                  {features.map((feature) => (
                    <li key={feature} className="flex break-inside-avoid items-start gap-3 py-3.5 text-[0.9375rem] text-charcoal">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-crimson" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <VehicleSpecs vehicle={vehicle} />

      <section aria-labelledby="documents-heading" className="shell mt-20 md:mt-24">
        <div data-reveal className="max-w-2xl">
          <p className="eyebrow">Paperwork</p>
          <h2 id="documents-heading" className="display-lg mt-3">
            Documents.
          </h2>
          <p className="lede mt-4 text-slate">Inspection and history files cleared for the public. Title copy stays private.</p>
        </div>
        <ul data-reveal className="mt-10 divide-y divide-platinum border-y border-platinum md:mt-12">
          {documents.map((document) => (
            <li key={document.id}>
              <a className="group flex items-center justify-between gap-4 py-5 transition-colors hover:text-crimson" href={mediaFileUrl(document.id, "file")}>
                <span className="min-w-0">
                  <span className="block font-display text-lg font-semibold text-charcoal group-hover:text-crimson">
                    {document.document_kind === "inspection" ? "Inspection" : "History"}
                  </span>
                  {document.alt_text ? <span className="mt-0.5 block text-sm text-slate">{document.alt_text}</span> : null}
                </span>
                <span className="shrink-0 text-sm font-semibold underline-offset-4 group-hover:underline">Open</span>
              </a>
            </li>
          ))}
          <li className="flex items-start gap-4 py-5">
            <LockIcon className="mt-1 h-5 w-5 shrink-0 text-slate" />
            <span>
              <span className="block font-display text-lg font-semibold text-charcoal">Title copy</span>
              <span className="mt-0.5 block text-sm text-slate">Private. Shared only with the buyer after the sale is agreed.</span>
            </span>
          </li>
        </ul>
      </section>

      {similar.length > 0 && (
        <section aria-labelledby="similar-heading" className="shell mt-24 md:mt-32">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="similar-heading" data-reveal className="display-lg">
              You may also like.
            </h2>
            <TextLink href={routes.inventory}>View the full collection</TextLink>
          </div>
          <ul data-reveal className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 md:mt-14 lg:grid-cols-4">
            {similar.map((item) => (
              <li key={item.id}>
                <VehicleCard vehicle={item} headingLevel={3} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {contact && (
        <section aria-labelledby="contact-heading" className="shell mt-24 md:mt-32">
          <div className="flex flex-col items-start gap-8 border-t border-charcoal pt-12 md:flex-row md:items-end md:justify-between md:pt-16">
            <div className="max-w-xl">
              <h2 id="contact-heading" className="display-md">
                {sold ? "Looking for something similar?" : `Interested in this ${vehicle.make}?`}
              </h2>
              <p className="mt-3 text-slate">Speak with the Raptors team about this vehicle or the collection.</p>
            </div>
            <PillButton href={routes.contact} variant="dark" size="lg">
              Contact Raptors
            </PillButton>
          </div>
        </section>
      )}

      <div className="h-24 md:h-32" />
    </main>
  );
}
