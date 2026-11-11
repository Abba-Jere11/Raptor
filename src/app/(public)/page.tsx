import type { Metadata } from "next";
import Link from "next/link";
import { PillButton, TextLink } from "@/components/ui/Button";
import { JsonLd } from "@/components/site/JsonLd";
import { VehicleCard } from "@/components/inventory/VehicleCard";
import { VehiclePhoto } from "@/components/inventory/VehiclePhoto";
import { StatusChip } from "@/components/ui/Chip";
import { env } from "@/lib/env";
import { formatDate, formatMiles, formatMoney } from "@/lib/format";
import { inventoryPath, emptyFilters, titleStatusLabel, vehicleTitle } from "@/lib/inventory";
import { mediaFileUrl } from "@/lib/media/files";
import type { CatalogVehicle } from "@/lib/public-catalog";
import { loadHome } from "@/lib/public-content";
import { routes } from "@/lib/routes";

const DESCRIPTION = "Discover vehicles selected for those who appreciate more. Raptors Auto Group.";

export const metadata: Metadata = {
  title: { absolute: "Raptors Auto Group · A different standard of driving" },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: "A different standard of driving.", description: DESCRIPTION, url: "/" },
};

const BASE_PLATFORMS = ["Manheim", "OpenLane"];

type Home = Awaited<ReturnType<typeof loadHome>>;

export default async function HomePage() {
  const home = await loadHome();
  const legalName = home.settings?.legal_name?.trim() || "Raptors Auto Group";
  const extras = home.platforms.filter((platform) => !BASE_PLATFORMS.some((name) => name.toLowerCase() === platform.name.trim().toLowerCase()));
  const platforms = [...BASE_PLATFORMS, ...extras.map((platform) => platform.name.trim())];
  const trust = trustFigures(home.settings, home.shippedTo);
  const organization: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: legalName,
    url: env.siteUrl,
  };
  if (home.settings?.city?.trim()) {
    organization.address = { "@type": "PostalAddress", addressLocality: home.settings.city.trim() };
  }
  const [lead, ...rest] = home.selection;
  const hasProof = home.sold.length > 0 || home.acquisitions.length > 0 || home.deliveries.length > 0;

  return (
    <main>
      <JsonLd data={organization} />
      <Hero home={home} />

      {lead && (
        <section aria-labelledby="featured-heading" className="section-y">
          <div className="shell">
            <div data-reveal className="max-w-3xl">
              <h2 id="featured-heading" className="display-lg">
                Exceptional vehicles. Carefully selected.
              </h2>
              <p className="lede mt-5 text-slate">Each one reviewed and approved before it appears in the collection.</p>
            </div>
            <LeadVehicle vehicle={lead} />
            {rest.length > 0 && (
              <ul data-reveal className="mt-16 grid gap-x-6 gap-y-12 sm:grid-cols-2 md:mt-20">
                {rest.map((vehicle) => (
                  <li key={vehicle.id} className="min-w-0">
                    <VehicleCard vehicle={vehicle} headingLevel={3} sizes="(min-width: 640px) 50vw, 100vw" />
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-12 md:mt-16">
              <TextLink href={routes.inventory}>View the full collection</TextLink>
            </div>
          </div>
        </section>
      )}

      {home.arrivals.length > 0 && (
        <section aria-labelledby="arrivals-heading" className="section-y border-t border-platinum">
          <div className="shell">
            <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="arrivals-heading" className="display-lg">
                New arrivals.
              </h2>
              <TextLink href={routes.inventory}>View inventory</TextLink>
            </div>
            <ul data-reveal className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 md:mt-14 lg:grid-cols-4">
              {home.arrivals.map((vehicle) => (
                <li key={vehicle.id} className="min-w-0">
                  <VehicleCard vehicle={vehicle} headingLevel={3} sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section aria-labelledby="platforms-heading" className="section-y bg-charcoal text-white">
        <div className="shell grid gap-12 lg:grid-cols-12">
          <div data-reveal className="lg:col-span-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white">Dealer-only access</p>
            <h2 id="platforms-heading" className="display-lg mt-4">
              We buy on dealer platforms that are closed to the public.
            </h2>
            <p className="lede mt-6 max-w-xl text-white">
              Manheim and OpenLane are named here in text. Any other platform appears only after it is published. There are no auction accounts, lot numbers or prices on this page.
            </p>
          </div>
          <div data-reveal className="lg:col-span-5 lg:col-start-8">
            <ul aria-label="Dealer platforms" className="border-t border-white/30">
              {platforms.map((name) => (
                <li key={name} className="display-md border-b border-white/30 py-5 md:py-6">
                  {name}
                </li>
              ))}
            </ul>
            {home.shippedTo > 0 && (
              <p className="mt-8 text-white">
                <span className="text-sm font-semibold uppercase tracking-[0.16em]">Shipped to</span>
                <span className="mt-1 block font-display text-2xl font-semibold tabular">
                  {home.shippedTo} {home.shippedTo === 1 ? "place" : "places"}
                </span>
              </p>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="collection-heading" className="section-y">
        <div className="shell grid gap-12 lg:grid-cols-12">
          <div data-reveal className="lg:col-span-5">
            <h2 id="collection-heading" className="display-lg">
              Find your next vehicle.
            </h2>
            <p className="lede mt-5 text-charcoal">Search by make, model or trim, narrow by price and specification, and save the ones you like on this device.</p>
            <PillButton href={routes.inventory} variant="dark" size="lg" className="mt-10">
              Browse Inventory
            </PillButton>
          </div>
          {home.makes.length > 0 && (
            <nav data-reveal aria-label="Makes in the collection" className="lg:col-span-6 lg:col-start-7">
              <ul className="border-t border-silver">
                {home.makes.slice(0, 5).map(({ make, count }) => (
                  <li key={make} className="border-b border-silver">
                    <Link href={inventoryPath({ ...emptyFilters(), make })} className="group flex items-center gap-6 py-5 md:py-6">
                      <span className="display-md min-w-0 flex-1 truncate">{make}</span>
                      <span className="text-sm text-charcoal tabular">{count === 1 ? "1 vehicle" : `${count} vehicles`}</span>
                      <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-charcoal transition-colors duration-150 group-hover:bg-charcoal group-hover:text-white">
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </section>

      <section aria-labelledby="story-heading" className="pb-18 md:pb-24 lg:pb-32">
        <figure className="relative">
          {/* Stand-in art is labelled and is not a vehicle in stock. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/stand-in/gallery-21.png"
            alt="Stand-in image. This is not a vehicle in stock."
            loading="lazy"
            className="aspect-[4/3] w-full object-cover md:aspect-[16/9] lg:aspect-[21/9] lg:max-h-[78vh]"
          />
          <StandInLabel />
        </figure>
        <div data-reveal className="shell mt-14 grid gap-8 md:mt-20 lg:grid-cols-12">
          <h2 id="story-heading" className="display-lg lg:col-span-5">
            More than finding a car.
          </h2>
          <div className="flex flex-col gap-5 text-charcoal lg:col-span-6 lg:col-start-7">
            <p className="body-copy">
              Every vehicle on this site is reviewed and approved before it is published. Each listing carries its photographs, its specification and its price, so you can see exactly what
              is offered.
            </p>
            <p className="body-copy">When you find the right one, we take care of the details with you, from the first conversation through to delivery.</p>
            {home.aboutPublished && (
              <div className="pt-3">
                <TextLink href={routes.about}>Discover Raptors</TextLink>
              </div>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="steps-heading" className="section-y border-t border-platinum">
        <div className="shell">
          <div data-reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <h2 id="steps-heading" className="display-lg lg:col-span-6">
              How it works.
            </h2>
            <p className="lede text-slate lg:col-span-5 lg:col-start-8">
              A buyer can choose a vehicle already in stock, or ask for a make and model. Delivery can be followed once the vehicle is on its way.
            </p>
          </div>
          <ol data-reveal className="mt-12 grid gap-10 md:mt-16 md:grid-cols-3 md:gap-6">
            <Step n="01" title="Explore">
              Browse the collection, compare specifications and save the vehicles you like on this device. You can also ask for any make, model and year.
              <span className="mt-5 block">
                <TextLink href={routes.inventory}>Explore the collection</TextLink>
              </span>
            </Step>
            <Step n="02" title="Request">
              Tell us which vehicle interests you. The search uses our dealer access, and you receive one quotation for that vehicle.
            </Step>
            <Step n="03" title="Follow your journey">
              Once the vehicle is yours and on its way, the journey is recorded through to delivery.
            </Step>
          </ol>
        </div>
      </section>

      {hasProof && (
        <section aria-label="Recent activity" className="section-y bg-platinum">
          <div className="shell grid gap-20 md:gap-24">
            {home.acquisitions.length > 0 && (
              <Proof title="Recent acquisitions" note="Available now, newest first." link={{ href: routes.inventory, label: "View inventory" }}>
                {home.acquisitions.map((vehicle) => (
                  <ProofCard
                    key={vehicle.id}
                    href={routes.vehicle(vehicle.slug)}
                    mediaId={vehicle.coverId}
                    make={vehicle.make}
                    model={vehicle.model}
                    title={vehicleTitle(vehicle)}
                    chip="Just added"
                    line={[vehicle.location, vehicle.approved_at ? `Public since ${formatDate(vehicle.approved_at)}` : null].filter(Boolean).join(" · ") || null}
                  />
                ))}
              </Proof>
            )}
            {home.sold.length > 0 && (
              <Proof title="Recently sold" note="Year, make, model and where the vehicle was. No price and no buyer.">
                {home.sold.map((vehicle) => (
                  <ProofCard
                    key={vehicle.id}
                    href={routes.vehicle(vehicle.slug)}
                    mediaId={vehicle.cover_media_id}
                    make={vehicle.make}
                    model={vehicle.model}
                    title={vehicleTitle(vehicle)}
                    chip="Sold"
                    line={[vehicle.exterior, vehicle.location].filter(Boolean).join(" · ") || null}
                  />
                ))}
              </Proof>
            )}
            {home.deliveries.length > 0 && (
              <Proof title="Deliveries" note="A vehicle description and a place. No price and no customer name.">
                {home.deliveries.map((delivery) => (
                  <li key={delivery.id} className="flex min-w-0 flex-col rounded-card bg-white p-6">
                    <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-platinum text-charcoal">
                      <svg viewBox="0 0 20 20" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <path d="M10 18s6-5.6 6-10a6 6 0 10-12 0c0 4.4 6 10 6 10z" strokeLinejoin="round" />
                        <circle cx="10" cy="8" r="2.2" />
                      </svg>
                    </span>
                    <h3 className="mt-6 font-display text-lg font-semibold">{delivery.title}</h3>
                    <p className="mt-1 text-sm text-charcoal">{delivery.place}</p>
                    {delivery.approved_at && <p className="mt-auto pt-6 text-xs text-slate">Delivered, recorded {formatDate(delivery.approved_at)}</p>}
                  </li>
                ))}
              </Proof>
            )}
          </div>
        </section>
      )}

      {home.guides.length > 0 && (
        <section aria-labelledby="guides-heading" className="section-y">
          <div className="shell">
            <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="guides-heading" className="display-lg">
                Guides.
              </h2>
              <TextLink href={routes.guides}>All guides</TextLink>
            </div>
            <ul data-reveal className="mt-10 grid gap-x-6 border-t border-charcoal sm:grid-cols-2 md:mt-14 lg:grid-cols-4">
              {home.guides.map((guide) => (
                <li key={guide.id} className="flex flex-col border-b border-platinum py-6 sm:pr-6">
                  {guide.topic && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">{guide.topic}</p>}
                  <h3 className="mt-3 font-display text-xl font-semibold">
                    <Link href={routes.guide(guide.slug)} className="underline-offset-4 hover:underline">
                      {guide.title}
                    </Link>
                  </h3>
                  {guide.confirmed_on && <p className="mt-auto pt-4 text-sm text-charcoal">Last confirmed {formatDate(guide.confirmed_on)}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {trust.length > 0 && (
        <section aria-label="About Raptors" className="pb-18 md:pb-24">
          <dl data-reveal className="shell grid gap-8 border-t border-silver pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {trust.map((item) => (
              <div key={item.label}>
                <dt className="text-sm font-semibold text-slate">{item.label}</dt>
                <dd className="mt-2 font-display text-2xl font-semibold text-charcoal">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section aria-labelledby="closing-heading" className="border-t border-platinum pt-24 md:pt-32">
        <div className="shell text-center">
          <h2 id="closing-heading" data-reveal className="display-xl">
            The road is yours.
          </h2>
          <p data-reveal className="lede mx-auto mt-5 max-w-xl text-charcoal">
            See what is available now. The inventory lists vehicles that are available, reserved or sold.
          </p>
          <div data-reveal className="mt-10 flex flex-wrap justify-center gap-3">
            <PillButton href={routes.inventory} variant="primary" size="lg">
              Explore Inventory
            </PillButton>
            {home.contactPublished && (
              <PillButton href={routes.contact} variant="secondary" size="lg">
                Contact Raptors
              </PillButton>
            )}
          </div>
        </div>
        <figure className="relative mx-auto mt-12 max-w-4xl px-5 md:mt-16">
          {/* Stand-in art is labelled and is not a vehicle in stock. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stand-in/car-rear34-blue.png" alt="Stand-in image. This is not a vehicle in stock." loading="lazy" className="mx-auto w-full object-contain" />
          <StandInLabel />
        </figure>
      </section>
    </main>
  );
}

function Hero({ home }: { home: Home }) {
  const featuredTitle = home.featured ? vehicleTitle(home.featured) : null;
  return (
    <section aria-labelledby="hero-heading" className="lg:grid lg:min-h-[min(calc(88vh-72px),52rem)] lg:grid-cols-12">
      <div className="flex flex-col justify-center px-5 pb-12 pt-10 md:px-8 md:pb-16 md:pt-16 lg:col-span-5 lg:py-20 lg:pl-[max(48px,calc((100vw-1280px)/2))] lg:pr-12">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-charcoal">Registered US dealer · Worldwide export</p>
        <h1 id="hero-heading" className="display-xl mt-5 max-w-[11ch]">
          A different standard of driving.
        </h1>
        <p className="lede mt-6 text-slate">Discover vehicles selected for those who appreciate more.</p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <PillButton href={routes.inventory} variant="primary" size="lg">
            Explore Collection
          </PillButton>
          {home.aboutPublished && <TextLink href={routes.about}>Discover Raptors</TextLink>}
        </div>
      </div>
      <div className="relative lg:col-span-7">
        {home.heroCoverId && featuredTitle ? (
          // The file route checks publication before it sends bytes.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaFileUrl(home.heroCoverId, "gallery")}
            alt={featuredTitle}
            fetchPriority="high"
            className="fade-in aspect-[4/3] w-full object-cover lg:absolute lg:inset-0 lg:aspect-auto lg:h-full"
          />
        ) : (
          <div className="relative flex aspect-[4/3] items-center justify-center lg:absolute lg:inset-0 lg:aspect-auto">
            {/* Stand-in art is labelled and is not a vehicle in stock. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/stand-in/car-34-black.png"
              alt="Stand-in image. This is not a vehicle in stock."
              fetchPriority="high"
              className="fade-in w-[92%] max-w-[880px] object-contain"
            />
            <StandInLabel />
          </div>
        )}
        {featuredTitle && home.featured && (
          <p className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
            <Link
              href={routes.vehicle(home.featured.slug)}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 font-display text-sm font-semibold text-charcoal shadow-soft hover:underline"
            >
              Featured vehicle, {featuredTitle}
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}

function LeadVehicle({ vehicle }: { vehicle: CatalogVehicle }) {
  const title = vehicleTitle(vehicle);
  const facts = [
    { label: "Mileage", value: formatMiles(vehicle.mileage) },
    { label: "Transmission", value: vehicle.transmission },
    { label: "Drivetrain", value: vehicle.drivetrain },
    { label: "Engine", value: vehicle.engine },
    { label: "Exterior", value: vehicle.exterior },
    { label: "Location", value: vehicle.location },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value));
  return (
    <article data-reveal className="group mt-12 grid gap-8 md:mt-16 lg:grid-cols-12 lg:gap-8">
      <Link href={routes.vehicle(vehicle.slug)} tabIndex={-1} aria-hidden className="block min-w-0 overflow-hidden rounded-card lg:col-span-8">
        <VehiclePhoto
          mediaId={vehicle.coverId}
          make={vehicle.make}
          model={vehicle.model}
          alt=""
          sizes="(min-width: 1024px) 840px, 100vw"
          zoom
          placeholderSize="lg"
          className="aspect-[16/9] w-full"
        />
      </Link>
      <div className="flex min-w-0 flex-col rounded-card border border-platinum p-6 md:p-8 lg:col-span-4">
        <div className="flex flex-wrap gap-2">
          <StatusChip status="Available" />
          {vehicle.export_ready && <StatusChip status="Export-ready" />}
          <StatusChip status={titleStatusLabel(vehicle.title_status)} />
        </div>
        <p className="mt-6 text-sm font-semibold text-charcoal tabular">{vehicle.year}</p>
        <h3 className="display-md mt-1">
          <Link href={routes.vehicle(vehicle.slug)} className="underline-offset-4 hover:underline">
            {vehicle.make} {vehicle.model}
            {vehicle.trim ? ` ${vehicle.trim}` : ""}
          </Link>
        </h3>
        <p className="mt-4 font-display text-[1.75rem] font-semibold leading-none tabular">
          {formatMoney({ cents: vehicle.price_cents, currency: "USD" })} <span className="text-sm font-medium text-slate">USD</span>
        </p>
        {facts.length > 0 && (
          <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-platinum pt-5">
            {facts.map((f) => (
              <div key={f.label} className="min-w-0">
                <dt className="text-xs text-slate">{f.label}</dt>
                <dd className="mt-0.5 truncate text-sm font-semibold text-charcoal tabular">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-auto flex flex-wrap gap-3 pt-8">
          <PillButton href={routes.vehicle(vehicle.slug)} variant="dark" aria-label={`View vehicle, ${title}`}>
            View vehicle
          </PillButton>
          <PillButton href={`${routes.vehicle(vehicle.slug)}?quote=1`} variant="secondary" aria-label={`Get a quote, ${title}`}>
            Get a quote
          </PillButton>
        </div>
      </div>
    </article>
  );
}

function ProofCard({
  href,
  mediaId,
  make,
  model,
  title,
  chip,
  line,
}: {
  href: string;
  mediaId: string | null;
  make: string;
  model: string;
  title: string;
  chip: string;
  line: string | null;
}) {
  return (
    <li className="min-w-0">
      <Link href={href} className="group block">
        <div className="relative">
          <VehiclePhoto mediaId={mediaId} make={make} model={model} alt="" sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw" zoom className="aspect-[4/3] rounded-card" />
          <span className="absolute left-3 top-3">
            <StatusChip status={chip} />
          </span>
        </div>
        <h3 className="mt-4 font-display text-lg font-semibold underline-offset-4 group-hover:underline">{title}</h3>
        {line && <p className="mt-1 text-sm text-slate">{line}</p>}
      </Link>
    </li>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="border-t border-silver pt-6">
      <span aria-hidden className="block font-display text-5xl font-semibold tracking-tight text-slate tabular md:text-6xl">
        {n}
      </span>
      <h3 className="mt-6 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-charcoal">{children}</p>
    </li>
  );
}

function Proof({
  title,
  note,
  link,
  children,
}: {
  title: string;
  note: string;
  link?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div data-reveal>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="display-md">{title}</h2>
          <p className="mt-2 text-sm text-charcoal">{note}</p>
        </div>
        {link && <TextLink href={link.href}>{link.label}</TextLink>}
      </div>
      <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">{children}</ul>
    </div>
  );
}

function StandInLabel() {
  return <span className="absolute bottom-4 right-4 rounded-full bg-charcoal px-2 py-0.5 text-[0.65rem] font-semibold text-white">STAND-IN</span>;
}

function trustFigures(
  settings: { licence: string | null; city: string | null; year_started: number | null } | null,
  shippedTo: number,
) {
  const items: { label: string; value: string }[] = [];
  if (settings?.licence?.trim()) items.push({ label: "US dealer licence", value: settings.licence.trim() });
  if (settings?.city?.trim()) items.push({ label: "Based in", value: settings.city.trim() });
  if (settings?.year_started) items.push({ label: "Operating since", value: String(settings.year_started) });
  if (shippedTo > 0) items.push({ label: "Shipped to", value: `${shippedTo} ${shippedTo === 1 ? "place" : "places"}` });
  return items;
}
