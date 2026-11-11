import type { Metadata } from "next";
import Link from "next/link";
import { PillButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/Chip";
import { DelayNotice } from "@/components/ui/DelayNotice";
import { DottedWorldMap } from "@/components/ui/DottedWorldMap";
import { CheckIcon, DownloadIcon } from "@/components/ui/icons";
import { StageTracker } from "@/components/ui/StageTracker";
import { KeyValueList } from "@/components/ui/Table";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { Wordmark } from "@/components/ui/Wordmark";
import { formatMoney } from "@/lib/format";
import { MOCK_ORDER } from "@/mock/MOCK_DATA_orders";
import { JOURNEY_STAGES, MOCK_JOURNEY } from "@/mock/MOCK_DATA_shipments";
import { routes, whatsappHref } from "@/prototype/routes";

export const metadata: Metadata = { title: "Journey Tracker (Figures 12-13)" };

/** Read-only buyer page: shows only this buyer's vehicle (Part 1 §4.8). */
export default function JourneyPage() {
  const j = MOCK_JOURNEY;
  return (
    <>
      <header className="border-b border-platinum bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <Wordmark subtitle="Journey Tracker" />
          <span className="ml-auto text-sm text-slate">
            VIN ending <span className="font-mono text-charcoal">{j.vinEnding}</span>
          </span>
          <Link href={routes.track.signIn} className="text-sm font-semibold underline">
            Sign out
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold md:text-4xl">{j.vehicle}</h1>
            <p className="mt-1 text-sm text-slate">
              VIN <span className="font-mono">{j.vin}</span> · Order {j.order}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusChip status="Paid in full" />
              <span className="inline-flex h-7 items-center rounded-full border border-silver bg-white px-3 text-xs font-semibold">
                {j.method} · {j.route.from} → {j.route.to}
              </span>
            </div>
          </div>
        </div>

        <DelayNotice className="mt-6" date={j.delay.date} reason={j.delay.reason} newRange={j.delay.newRange}>
          {j.delay.note}
        </DelayNotice>

        {/* Glance: map, countdown, stages */}
        <Card className="mt-6 overflow-hidden">
          <div className="grid gap-6 p-5 md:grid-cols-[1fr_240px] md:p-8">
            <DottedWorldMap
              from={[-80.2, 25.8]}
              to={[0, 5.6]}
              progress={0.55}
              fromLabel={j.route.from}
              toLabel={j.route.to}
              positionLabel={j.position}
              updated={j.updated}
            />
            <div className="flex flex-col justify-center gap-1 rounded-panel bg-platinum p-5">
              <p className="eyebrow !text-charcoal">Arrives in</p>
              <p className="font-display text-5xl font-semibold tabular">{j.arrivesInDays} days</p>
              <p className="text-sm">Estimated {j.arrivalRange}</p>
              <p className="mt-2 text-xs">Estimate based on the last published update.</p>
            </div>
          </div>
          <div className="border-t border-platinum p-5 md:p-8">
            <StageTracker
              label="Journey stages"
              stages={JOURNEY_STAGES.map((s, i) => ({ label: s, date: j.stageDates[i] }))}
              current={j.currentStage}
            />
          </div>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            <Card className="p-5 md:p-8">
              <h2 className="font-display text-lg font-semibold">Journey updates</h2>
              <ol className="mt-4 flex flex-col">
                {j.updates.map((u) => (
                  <li key={u.when} className="relative border-l-2 border-platinum pb-6 pl-5 last:pb-0">
                    <span className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full ${u.delay ? "bg-amber-border" : "bg-charcoal"}`} aria-hidden />
                    <p className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold">{u.title}</span>
                      <span className="text-sm text-slate tabular">{u.when}</span>
                    </p>
                    <p className="mt-1 text-sm">{u.text}</p>
                    {u.photos > 0 && (
                      <div className="mt-3 flex gap-2">
                        <VehicleImage src="/stand-in/car-rear34-blue.png" alt="Loading photo" className="h-20 w-28 rounded-panel" sizes="112px" standIn={false} />
                        <VehicleImage src="/stand-in/car-side-2.png" alt="Loading photo" className="h-20 w-28 rounded-panel" sizes="112px" standIn={false} />
                        {u.photos > 2 && (
                          <span className="flex h-20 w-20 items-center justify-center rounded-panel bg-platinum text-sm font-semibold">
                            +{u.photos - 2} photos
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </Card>

            <Card className="p-5 md:p-8">
              <h2 className="font-display text-lg font-semibold">Customs clearance checklist</h2>
              <p className="mt-1 text-sm text-slate">
                Requirements are set by your country&apos;s customs authority. This list shows what we have sent and what is
                yours to arrange.
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {j.clearance.map((c) => (
                  <li key={c.item} className="flex items-center gap-3 text-sm">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${c.done ? "bg-charcoal text-white" : "border-2 border-silver"}`}
                      aria-hidden
                    >
                      {c.done && <CheckIcon className="h-3.5 w-3.5" />}
                    </span>
                    {c.item}
                    <span className="sr-only">{c.done ? "(done)" : "(to do)"}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="p-5 md:p-6">
              <h2 className="font-display text-lg font-semibold">Your paperwork</h2>
              <ul className="mt-3 divide-y divide-platinum">
                {j.documents.map((d) => (
                  <li key={d} className="flex items-center justify-between gap-3 py-2.5">
                    <span>
                      <span className="block text-sm font-medium">{d}</span>
                      <span className="text-xs text-slate">PDF · ready</span>
                    </span>
                    <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-silver px-3 text-xs font-semibold hover:border-charcoal">
                      <DownloadIcon /> Download <span className="sr-only">{d}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <PillButton variant="dark" size="sm" className="mt-4">
                Download all
              </PillButton>
            </Card>

            <Card className="p-5 md:p-6">
              <h2 className="font-display text-lg font-semibold">Payment</h2>
              <KeyValueList
                className="mt-2"
                rows={[
                  { label: "Order total", value: formatMoney(MOCK_ORDER.total) },
                  { label: "Paid", value: formatMoney(MOCK_ORDER.total) },
                  { label: "Balance", value: "$0", strong: true },
                ]}
              />
              <p className="mt-2 text-sm text-slate">Paid in full · receipts available above.</p>
            </Card>

            <Card className="p-5 md:p-6">
              <h2 className="font-display text-lg font-semibold">Shipping details</h2>
              <KeyValueList className="mt-2" rows={j.shipping.map((s) => ({ label: s.label, value: s.value }))} />
            </Card>

            <Card tone="dark" className="p-5 md:p-6">
              <h2 className="font-display text-lg font-semibold">Your Raptors contact</h2>
              <p className="mt-1 text-sm text-white/85">[Named representative] · Mon–Sat, 9:00–18:00 [time zone]</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <PillButton href={whatsappHref(`Hello, about order ${j.order}`)} variant="primary" size="sm">
                  WhatsApp
                </PillButton>
                <PillButton href="tel:[phone]" variant="outline" size="sm">
                  Call
                </PillButton>
              </div>
            </Card>

            <Card className="p-5 md:p-6">
              <h2 className="font-display text-lg font-semibold">Share with your clearing agent</h2>
              <p className="mt-1 text-sm text-slate">
                A limited, read-only link with shipping details and documents. No payment information. You can turn it off
                at any time.
              </p>
              <PillButton variant="outline" size="sm" className="mt-3">
                Create share link
              </PillButton>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
