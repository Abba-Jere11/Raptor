import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/ChartCard";
import { Chip, StatusChip } from "@/components/ui/Chip";
import { PortalShell } from "@/components/ui/PortalShell";
import { DataTable } from "@/components/ui/Table";
import { TabNav } from "@/components/ui/Tabs";
import { formatMoney, usd } from "@/lib/format";
import {
  DASHBOARD_PAGES,
  MOCK_EXCEPTIONS,
  MOCK_MARGIN_BY_VEHICLE,
  MOCK_RECEIVABLES_AGEING,
} from "@/mock/MOCK_DATA_dashboard";
import { type ChartId, DashboardChart } from "@/prototype/ceo/DashboardCharts";
import { CEO_NAV } from "@/prototype/portals";
import { routes } from "@/prototype/routes";

type PageId = (typeof DASHBOARD_PAGES)[number]["id"];
type Props = { params: Promise<{ page: string }> };

export function generateStaticParams() {
  return DASHBOARD_PAGES.map((p) => ({ page: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  const label = DASHBOARD_PAGES.find((p) => p.id === page)?.label ?? "Dashboard";
  return { title: `CEO · Dashboard · ${label}${page === "overview" ? " (Figure 18)" : ""}` };
}

const CHARTS: Record<Exclude<PageId, "exceptions">, ChartId[]> = {
  overview: ["revenue", "funnel", "cash", "destinations"],
  sales: ["revenue", "funnel", "daysToSell", "ownSourced"],
  margin: ["profit"],
  inventory: ["ageing", "mix", "daysToSell"],
  pipeline: ["funnel", "leads", "requests", "ownSourced"],
  cash: ["cash"],
  exports: ["shipments"],
  markets: ["destinations", "leads"],
};

const TILES = [
  { label: "Revenue · October", value: "$2.28M", delta: { text: "+25% on last October", up: true } },
  { label: "Gross profit · October", value: "$274k", delta: { text: "12.0% margin", up: true } },
  { label: "Cash received · October", value: "$2.05M", note: "Bank-confirmed only" },
  { label: "Waiting for a reply", value: "2", note: "Oldest: 1 h 10 min" },
];

const ACTIVE_NAV: Partial<Record<PageId, string>> = { cash: "Finance", exports: "Shipments" };

function Exceptions({ limit }: { limit?: number }) {
  const rows = limit ? MOCK_EXCEPTIONS.slice(0, limit) : MOCK_EXCEPTIONS;
  return (
    <Card as="section" aria-labelledby="exceptions-title" className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="exceptions-title" className="font-display text-base font-semibold">
          Needs your attention
        </h2>
        {limit && (
          <Link href={routes.ceo.dashboard("exceptions")} className="text-sm font-semibold underline">
            All exceptions
          </Link>
        )}
      </div>
      <ul className="mt-3 divide-y divide-platinum">
        {rows.map((e) => (
          <li key={e.ref} className="flex items-start justify-between gap-3 py-3 text-sm">
            <span>
              <span className="font-semibold">{e.kind}</span> · <span className="font-mono">{e.ref}</span>
              <span className="block text-slate">{e.detail}</span>
            </span>
            <StatusChip status={e.severity} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function MarginTable() {
  return (
    <section aria-labelledby="margin-title">
      <h2 id="margin-title" className="mb-2 font-display text-base font-semibold">
        Margin by vehicle
      </h2>
      <DataTable
        caption="Margin by vehicle"
        rowKey={(r) => r.vehicle}
        rows={MOCK_MARGIN_BY_VEHICLE}
        columns={[
          { key: "v", header: "Vehicle", render: (r) => r.vehicle },
          { key: "s", header: "Sale", align: "right", render: (r) => formatMoney(usd(r.sale)) },
          { key: "c", header: "Cost", align: "right", render: (r) => (r.cost === null ? "—" : formatMoney(usd(r.cost))) },
          {
            key: "m",
            header: "Margin",
            align: "right",
            render: (r) => (r.complete && r.margin !== null ? formatMoney(usd(r.margin)) : <Chip tone="warning">Incomplete data</Chip>),
          },
        ]}
      />
      <p className="mt-2 text-xs text-slate">A margin is shown only when every cost is recorded. Never estimated.</p>
    </section>
  );
}

function Receivables() {
  return (
    <section aria-labelledby="recv-title">
      <h2 id="recv-title" className="mb-2 font-display text-base font-semibold">
        Receivables ageing
      </h2>
      <DataTable
        caption="Receivables ageing"
        rowKey={(r) => r.band}
        rows={MOCK_RECEIVABLES_AGEING}
        columns={[
          { key: "b", header: "Age", render: (r) => r.band },
          { key: "a", header: "Outstanding", align: "right", render: (r) => formatMoney(usd(r.amount)) },
        ]}
      />
    </section>
  );
}

/** Figure 18 (Overview) and the eight further dashboard pages. All figures are MOCK DATA. */
export default async function DashboardPage({ params }: Props) {
  const { page } = await params;
  const current = DASHBOARD_PAGES.find((p) => p.id === page);
  if (!current) notFound();
  const id = current.id as PageId;
  const charts = id === "exceptions" ? [] : CHARTS[id];

  return (
    <PortalShell
      portal="CEO Portal"
      sectionLabel="Owner"
      nav={CEO_NAV}
      active={ACTIVE_NAV[id] ?? "Dashboard"}
      title={`Dashboard · ${current.label}`}
      actions={<span className="hidden text-sm text-slate sm:inline">Last 12 months · USD</span>}
    >
      <TabNav label="Dashboard pages" active={id} items={DASHBOARD_PAGES.map((p) => ({ id: p.id, label: p.label, href: routes.ceo.dashboard(p.id) }))} />

      {id === "overview" && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {TILES.map((t) => (
            <StatTile key={t.label} {...t} />
          ))}
        </div>
      )}

      {charts.length > 0 && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {charts.map((c, i) => (
            <DashboardChart key={c} id={c} className={charts.length === 1 || (charts.length === 3 && i === 0) ? "lg:col-span-2" : undefined} />
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6">
        {id === "overview" && <Exceptions limit={3} />}
        {id === "exceptions" && <Exceptions />}
        {id === "margin" && <MarginTable />}
        {id === "cash" && <Receivables />}
      </div>
    </PortalShell>
  );
}
