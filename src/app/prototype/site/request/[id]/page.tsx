import type { Metadata } from "next";
import Link from "next/link";
import { PillButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckIcon } from "@/components/ui/icons";
import { StageTracker } from "@/components/ui/StageTracker";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { MOCK_REQUEST_PAGE, REQUEST_STAGES } from "@/mock/MOCK_DATA_requests";
import { routes, whatsappHref } from "@/prototype/routes";

export const metadata: Metadata = { title: "Your request (Figure 10)" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string }> };

/**
 * Figure 10. The customer's request page. "Vehicle found" shows photos and
 * specifications only: never the source, platform or any price (price-privacy rule).
 */
export default async function RequestStatusPage({ params, searchParams }: Props) {
  const { id } = await params;
  const found = (await searchParams).view === "found";
  const r = MOCK_REQUEST_PAGE;
  const current = found ? 2 : 1;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <nav aria-label="Prototype states" className="mb-6 flex flex-wrap gap-2 text-sm">
        <span className="text-slate">Prototype state:</span>
        <Link href={routes.site.requestPage(id)} aria-current={!found ? "page" : undefined} className={!found ? "font-semibold underline" : "underline"}>
          Just sent
        </Link>
        <Link href={`${routes.site.requestPage(id)}?view=found`} aria-current={found ? "page" : undefined} className={found ? "font-semibold underline" : "underline"}>
          Vehicle found
        </Link>
      </nav>

      {!found ? (
        <Card className="p-6 md:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-success">
            <CheckIcon className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-3xl font-semibold md:text-4xl">We have your request</h1>
          <p className="mt-2 text-slate">
            Request <span className="font-mono text-charcoal">{id}</span> · we have emailed you and messaged your WhatsApp.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <p className="eyebrow">Your request</p>
              <p className="mt-2 font-display text-lg font-semibold">{r.summary}</p>
              <p className="text-sm">{r.details}</p>
              <p className="text-sm">{r.extra}</p>
            </div>
            <div>
              <p className="eyebrow">What happens next</p>
              <p className="mt-2 text-sm leading-relaxed">
                We begin the search straight away and keep you updated by email and WhatsApp. When we find your vehicle you
                will see its photos and specifications, followed by a quotation with one all-in price.
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <PillButton href="#tracker" variant="dark">
              Follow my request
            </PillButton>
            <PillButton href={whatsappHref(`Hello, about my request ${id}`)} variant="outline">
              Chat on WhatsApp
            </PillButton>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="p-6 md:p-10">
            <p className="eyebrow">
              Request {id} · Rolls-Royce Ghost
            </p>
            <h1 className="mt-2 text-3xl font-semibold md:text-4xl">We found your vehicle</h1>
            <p className="mt-2 font-display text-lg font-semibold">{r.found.title}</p>
            <p className="text-slate">{r.found.facts}</p>
          </div>
          <div className="grid gap-2 px-6 sm:grid-cols-3 md:px-10">
            {r.found.images.map((src, i) => (
              <VehicleImage key={src} src={src} alt={`Found vehicle, photo ${i + 1}`} className="aspect-[4/3] rounded-panel" sizes="(min-width: 640px) 33vw, 100vw" />
            ))}
          </div>
          <p className="p-6 text-sm md:px-10">
            Your quotation with the all-in price is being prepared and will reach you shortly.
          </p>
        </Card>
      )}

      <section id="tracker" className="mt-8">
        <Card className="p-6 md:p-8">
          <h2 className="font-display text-lg font-semibold">Follow your request</h2>
          <div className="mt-6">
            <StageTracker label="Request stages" stages={REQUEST_STAGES.map((s) => ({ label: s }))} current={current} />
          </div>
        </Card>
      </section>
    </div>
  );
}
