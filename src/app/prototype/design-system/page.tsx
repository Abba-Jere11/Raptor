import type { Metadata } from "next";
import Link from "next/link";
import { Pill, PillButton } from "@/components/ui/Button";
import { Card, SectionHeading, Step } from "@/components/ui/Card";
import { Chip, StatusChip } from "@/components/ui/Chip";
import { DelayNotice } from "@/components/ui/DelayNotice";
import { EmailLayout } from "@/components/ui/EmailLayout";
import { KeyValueList } from "@/components/ui/Table";
import { StageTracker } from "@/components/ui/StageTracker";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { Wordmark } from "@/components/ui/Wordmark";
import { contrastPairs, contrastRatio, palette } from "@/design/tokens";
import { DesignSystemInteractive } from "@/prototype/DesignSystemInteractive";
import { JOURNEY_STAGES } from "@/mock/MOCK_DATA_shipments";
import { routes } from "@/prototype/routes";

export const metadata: Metadata = { title: "Design system (Figure 1)" };

export default function DesignSystemPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <p className="eyebrow">Figure 1 · Design system · Interim logo</p>
      <h1 className="mt-2 text-4xl font-semibold md:text-5xl">Brand foundation</h1>
      <p className="mt-3 max-w-2xl text-slate">
        One system across the website, the portals, emails and documents. Calm light canvas, cut-out vehicles, soft
        rounded cards, numbered steps, pill buttons with an arrow circle, quiet chips and thin silver borders.
      </p>

      <section className="mt-12" aria-labelledby="logo">
        <SectionHeading id="logo" eyebrow="01" title="Logo (interim)" description="Cleaned text wordmark until the final logo file arrives (Decision 8)." />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="flex h-40 items-center justify-center">
            <Wordmark className="scale-150" />
          </Card>
          <Card tone="dark" className="flex h-40 items-center justify-center">
            <Wordmark tone="light" className="scale-150" />
          </Card>
        </div>
      </section>

      <section className="mt-14" aria-labelledby="palette">
        <SectionHeading id="palette" eyebrow="02" title="Palette" description="Exactly the six logo colours. Crimson is used sparingly, for emphasis and the key action." />
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(palette).map((c) => (
            <li key={c.hex}>
              <Card className="overflow-hidden">
                <div className="h-24 border-b border-platinum" style={{ background: c.hex }} />
                <div className="p-4">
                  <p className="font-display font-semibold">{c.name}</p>
                  <p className="font-mono text-sm">{c.hex}</p>
                  <p className="mt-1 text-sm text-slate">{c.use}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-slate">
          Functional status colours (not brand colours): amber for delay notices and warnings, green for cleared and
          export-ready.
        </p>
      </section>

      <section className="mt-14" aria-labelledby="contrast">
        <SectionHeading id="contrast" eyebrow="03" title="Contrast (calculated)" description="WCAG 2.2 AA: 4.5:1 for normal text, 3:1 for large text." />
        <Card className="mt-6 p-2 md:p-4">
          <table className="w-full text-sm">
            <caption className="sr-only">Contrast ratios for colour pairs used as text</caption>
            <thead>
              <tr>
                <th scope="col" className="eyebrow p-2 text-left">Pair</th>
                <th scope="col" className="eyebrow p-2 text-left">Sample</th>
                <th scope="col" className="eyebrow p-2 text-right">Ratio</th>
                <th scope="col" className="eyebrow p-2 text-left">Result</th>
                <th scope="col" className="eyebrow hidden p-2 text-left md:table-cell">Used for</th>
              </tr>
            </thead>
            <tbody>
              {contrastPairs.map((p) => {
                const r = contrastRatio(p.fg, p.bg);
                return (
                  <tr key={p.label} className="border-t border-platinum">
                    <td className="p-2 font-medium">{p.label}</td>
                    <td className="p-2">
                      <span
                        className={`inline-block rounded-md px-2 py-1 ${p.min < 4.5 ? "text-2xl font-bold" : "font-semibold"}`}
                        style={{ color: p.fg, background: p.bg }}
                      >
                        Aa 189,500
                      </span>
                    </td>
                    <td className="p-2 text-right tabular">{r.toFixed(1)}:1</td>
                    <td className="p-2">
                      <Chip tone={r >= 4.5 ? "success" : r >= 3 ? "warning" : "brand"}>
                        {r >= 4.5 ? "AA" : r >= 3 ? "Large text only" : "Fail"}
                      </Chip>
                    </td>
                    <td className="hidden p-2 text-slate md:table-cell">{p.usage}</td>
                  </tr>
                );
              })}
              <tr className="border-t border-platinum">
                <td className="p-2 font-medium">Silver on White</td>
                <td className="p-2">
                  <span className="inline-block h-6 w-20 rounded-md border-2 border-silver" aria-hidden />
                </td>
                <td className="p-2 text-right tabular">{contrastRatio(palette.silver.hex, palette.white.hex).toFixed(1)}:1</td>
                <td className="p-2">
                  <Chip tone="outline">Decoration only</Chip>
                </td>
                <td className="hidden p-2 text-slate md:table-cell">Borders and fine details; never text</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </section>

      <section className="mt-14" aria-labelledby="type">
        <SectionHeading id="type" eyebrow="04" title="Type" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <p className="eyebrow">Headlines · Plus Jakarta Sans</p>
            <p className="mt-3 font-display text-3xl font-semibold leading-tight">Premium vehicles, found and delivered worldwide.</p>
          </Card>
          <Card className="p-6">
            <p className="eyebrow">Body and data · Inter</p>
            <p className="mt-3">
              Clear, quiet body text for specifications, quotations and documents. Tabular figures keep prices and mileage
              aligned:
            </p>
            <p className="mt-2 tabular font-semibold">$189,500 · 14,200 mi</p>
          </Card>
          <Card className="p-6">
            <p className="eyebrow">Identifiers · JetBrains Mono</p>
            <p className="mt-3 font-mono">VIN ZFF67NFA2D0189186</p>
            <p className="mt-1 font-mono">RAG-7K4Q-92XM</p>
          </Card>
        </div>
      </section>

      <section className="mt-14" aria-labelledby="components">
        <SectionHeading id="components" eyebrow="05" title="Components" />
        <Card className="mt-6 flex flex-wrap items-center gap-3 p-6">
          <PillButton variant="primary">Request a vehicle</PillButton>
          <PillButton variant="dark">Get a quote</PillButton>
          <PillButton variant="outline">Browse</PillButton>
          <PillButton variant="outline" size="sm">
            Track
          </PillButton>
          <PillButton variant="dark" disabled>
            Disabled
          </PillButton>
          <Pill>Make</Pill>
          <Pill active>Export-ready</Pill>
        </Card>
        <Card className="mt-4 flex flex-wrap gap-2 p-6">
          {["New", "Export-ready", "Reserved", "Sold", "Clean title", "Draft", "Awaiting CEO", "Part paid", "Paid in full", "Delayed", "Overdue"].map(
            (s) => (
              <StatusChip key={s} status={s} />
            ),
          )}
        </Card>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <Step n={1} title="Choose your vehicle">
              Browse our stock, or tell us any make and model.
            </Step>
          </Card>
          <Card className="p-6">
            <Step n={2} title="We find it and quote it" />
          </Card>
          <Card tone="dark" className="p-6">
            <Step n={3} title="Follow it to your port" tone="light" />
          </Card>
        </div>

        <DesignSystemInteractive />

        <Card className="mt-4 p-6">
          <p className="eyebrow mb-4">Stage tracker</p>
          <StageTracker label="Journey stages" stages={JOURNEY_STAGES.map((l, i) => ({ label: l, date: i < 5 ? `${12 + i} Oct` : undefined }))} current={5} />
          <DelayNotice className="mt-6" date="16 Oct" reason="Port congestion at Tema" newRange="17–24 Nov">
            The vessel is expected to wait about 3 days to berth.
          </DelayNotice>
        </Card>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card className="overflow-hidden">
            <VehicleImage src="/stand-in/car-34-blue.png" alt="Stand-in vehicle, front three-quarter" className="aspect-[16/10]" />
            <div className="p-5">
              <p className="font-display font-semibold">2013 Ferrari 458 Spider</p>
              <p className="text-sm text-slate tabular">14,200 mi · Miami, FL</p>
              <p className="mt-2 font-display text-lg font-semibold tabular">$189,500</p>
            </div>
          </Card>
          <Card className="p-6">
            <p className="eyebrow mb-2">Money summary</p>
            <KeyValueList
              rows={[
                { label: "Order total", value: "$225,250" },
                { label: "Paid to date", value: "$45,000" },
                { label: "Balance outstanding", value: "$180,250", strong: true },
              ]}
            />
          </Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <EmailLayout subject="Your quotation is ready" kicker="Quotation" headline="Your quotation for the Rolls-Royce Ghost" cta="View your quotation">
            <p>Email layout: logo, red rule, one headline, short text and one button.</p>
          </EmailLayout>
          <Card className="p-6">
            <p className="eyebrow">Document layout</p>
            <p className="mt-2 text-sm">
              Quotations, invoices and receipts share one A4 layout. See the{" "}
              <Link className="font-semibold text-crimson underline" href={routes.documents("quotation")}>
                document designs
              </Link>
              .
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}
