import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PillButton } from "@/components/ui/Button";
import { Card, SectionHeading, Step } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { MOCK_ACQUISITIONS, MOCK_DELIVERIES, MOCK_GUIDES, MOCK_RECENTLY_SOLD } from "@/mock/MOCK_DATA_content";
import { publicVehicles } from "@/mock/MOCK_DATA_vehicles";
import { routes } from "@/prototype/routes";
import { VehicleCard } from "@/prototype/site/VehicleCard";

export const metadata: Metadata = { title: "Homepage (Figures 2-4)" };

export default function HomePage() {
  const arrivals = publicVehicles.filter((v) => v.status === "Available").slice(0, 4);
  return (
    <>
      {/* Figure 2: hero */}
      <section className="relative overflow-hidden bg-linear-to-b from-white via-white to-platinum">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-12 md:px-6 lg:grid-cols-[1fr_1.1fr] lg:pb-20 lg:pt-20">
          <div className="relative z-10">
            <p className="eyebrow">Registered US dealer · Worldwide export</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] md:text-6xl">
              Premium vehicles, found and delivered worldwide.
            </h1>
            <div className="mt-8 flex flex-wrap gap-3">
              <PillButton href={routes.site.request} variant="primary" size="lg">
                Request a vehicle
              </PillButton>
              <PillButton href={routes.site.inventory} variant="outline" size="lg">
                Browse inventory
              </PillButton>
            </div>
            <Card className="mt-10 max-w-md bg-white/80 p-6 backdrop-blur">
              <p className="text-sm text-slate">Our team finds it. You follow it, from first request to your port.</p>
              <div className="mt-4 flex flex-col gap-3">
                <Step n={1} title="Choose or request your vehicle">
                  Browse our stock, or tell us any make and model.
                </Step>
                <Step n={2} title="We find it and quote it" />
                <Step n={3} title="Follow it to your port" />
              </div>
            </Card>
          </div>
          <div className="relative min-h-64 lg:min-h-0">
            <Image
              src="/stand-in/hero-side-silver.png"
              alt="Stand-in vehicle, side profile"
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-contain object-center"
            />
            <span className="absolute bottom-2 right-2 rounded-full bg-charcoal px-2 py-0.5 text-[0.65rem] font-semibold text-white">
              STAND-IN
            </span>
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl gap-3 px-4 pb-10 sm:grid-cols-3 md:px-6">
          {[
            { k: "Registered dealer at", v: "Manheim · OpenLane", n: "+ more platforms" },
            { k: "Shipped", v: "Worldwide", n: "by RoRo or container" },
            { k: "Follow it", v: "Journey Tracker", n: "Updated at every stage" },
          ].map((x) => (
            <div key={x.k} className="rounded-panel border border-platinum bg-white p-4">
              <p className="eyebrow">{x.k}</p>
              <p className="mt-1 font-display font-semibold">{x.v}</p>
              <p className="text-sm text-slate">{x.n}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Figure 3: new arrivals */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <SectionHeading
          title="New arrivals"
          action={
            <PillButton href={routes.site.inventory} variant="outline" size="sm">
              View all inventory
            </PillButton>
          }
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {arrivals.map((v, i) => (
            <VehicleCard key={v.id} vehicle={v} priority={i < 2} />
          ))}
        </div>
      </section>

      {/* Figure 3: dealer-only access band */}
      <section className="bg-charcoal text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-6 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="eyebrow !text-white/80">Dealer-only access</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">We are registered dealers on the platforms you cannot enter.</h2>
            <p className="mt-4 max-w-xl text-white/85">
              Manheim, OpenLane and other leading dealer platforms are open only to licensed dealers. We search them for
              you, and you never pay a middleman&apos;s guess: you receive one clear quotation.
            </p>
            <div className="mt-8">
              <PillButton href={routes.site.request} variant="primary">
                Request a vehicle
              </PillButton>
            </div>
          </div>
          <ul className="grid content-center gap-3" aria-label="Platforms Raptors is registered with">
            {["MANHEIM", "OPENLANE", "+ other leading dealer platforms"].map((p) => (
              <li key={p} className="rounded-panel border border-white/20 px-5 py-4 font-display font-semibold tracking-[0.14em]">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Figure 3: how it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <SectionHeading eyebrow="How it works" title="Three steps, one clear price" />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Card className="p-7">
            <Step n={1} title="Tell us what you want">
              Any make, any model, any year. Four short steps.
            </Step>
          </Card>
          <Card className="p-7">
            <Step n={2} title="We find it, privately">
              Through our dealer network and platforms. You see the vehicle and one all-in price.
            </Step>
          </Card>
          <Card className="p-7">
            <Step n={3} title="We ship and you follow">
              Your Journey Tracker shows exactly where it is, until it reaches your port.
            </Step>
          </Card>
        </div>
      </section>

      {/* Figure 4: proof */}
      <section className="bg-platinum/60">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-6 lg:grid-cols-3">
          <ProofColumn title="Recently sold" note="Sold vehicles, shown without prices" chip="Sold" items={MOCK_RECENTLY_SOLD} />
          <ProofColumn title="Recent acquisitions" note="Just added to our stock" chip="Just acquired" items={MOCK_ACQUISITIONS} />
          <ProofColumn title="Approved customer deliveries" note="Shown with the customer's permission" chip="Delivered" items={MOCK_DELIVERIES} />
        </div>
      </section>

      {/* Figure 4: guides */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <SectionHeading
          title="Guides for buyers"
          action={
            <PillButton href={routes.site.guides} variant="outline" size="sm">
              All guides
            </PillButton>
          }
        />
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MOCK_GUIDES.map((g) => (
            <li key={g.slug}>
              <Card className="flex h-full flex-col p-6">
                <Chip tone="outline" className="self-start">
                  Guide
                </Chip>
                <h3 className="mt-4 font-display font-semibold">
                  <Link href={routes.site.guide(g.slug)} className="hover:underline">
                    {g.title}
                  </Link>
                </h3>
                <p className="mt-auto pt-4 text-sm text-slate">{g.minutes} min read</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* Figure 4: trust (placeholders until Decision 2) */}
      <section id="trust" className="mx-auto max-w-7xl px-4 md:px-6">
        <Card tone="platinum" className="grid gap-6 p-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["US dealer licence", "[Licence no.]"],
            ["Based in", "[City, State]"],
            ["Operating since", "[Year]"],
            ["Shipped to", "[Countries from records]"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="eyebrow !text-charcoal">{k}</p>
              <p className="mt-1 font-display text-xl font-semibold">{v}</p>
            </div>
          ))}
        </Card>
      </section>

      {/* Figure 4: final call */}
      <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6">
        <Card className="flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-12">
          <div>
            <h2 className="text-3xl font-semibold">Cannot find the car you want?</h2>
            <p className="mt-2 text-slate">Tell us the make and model. We search and send you a quotation.</p>
          </div>
          <PillButton href={routes.site.request} variant="primary" size="lg">
            Request a vehicle
          </PillButton>
        </Card>
      </section>
    </>
  );
}

function ProofColumn({
  title,
  note,
  chip,
  items,
}: {
  title: string;
  note: string;
  chip: string;
  items: Array<{ title: string; place: string; image: string }>;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-charcoal">{note}</p>
      <ul className="mt-5 grid grid-cols-2 gap-3">
        {items.map((i) => (
          <li key={i.title + i.place}>
            <Card className="overflow-hidden">
              <VehicleImage src={i.image} alt={i.title} className="aspect-[4/3]" sizes="(min-width: 1024px) 15vw, 50vw" />
              <div className="p-3">
                <p className="text-sm font-semibold">{i.title}</p>
                <p className="text-xs text-slate">{i.place}</p>
                <Chip tone={chip === "Sold" ? "dark" : "neutral"} className="mt-2">
                  {chip}
                </Chip>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
