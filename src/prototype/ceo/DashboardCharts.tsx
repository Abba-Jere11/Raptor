"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/ui/ChartCard";
import {
  MOCK_CASH,
  MOCK_DAYS_TO_SELL,
  MOCK_FUNNEL,
  MOCK_GROSS_PROFIT,
  MOCK_INVENTORY_AGEING,
  MOCK_LEAD_SOURCES,
  MOCK_OWN_VS_SOURCED,
  MOCK_REQUEST_RESPONSE,
  MOCK_REVENUE_BY_DESTINATION,
  MOCK_REVENUE_BY_MONTH,
  MOCK_SHIPMENTS_BY_STAGE,
  MOCK_STOCK_MIX,
} from "@/mock/MOCK_DATA_dashboard";

/** Chart palette: charcoal for the main series, crimson for the one to notice, silver for comparison. */
const C = { main: "#24272b", key: "#c62838", muted: "#b7bcc2", slate: "#68717b", grid: "#e9eaec" };
const axis = { stroke: C.slate, fontSize: 12, tickLine: false, axisLine: false } as const;
const k = (v: number) => `$${v >= 1000 ? (v / 1000).toFixed(1) + "M" : v + "k"}`;
const tooltipStyle = { borderRadius: 12, border: "1px solid #e9eaec", fontSize: 12 };

export type ChartId =
  | "revenue"
  | "profit"
  | "funnel"
  | "destinations"
  | "cash"
  | "ageing"
  | "mix"
  | "shipments"
  | "ownSourced"
  | "requests"
  | "leads"
  | "daysToSell";

/** The twelve release-1 charts (Master Plan Section 16). Each answers one question. */
export function DashboardChart({ id, className }: { id: ChartId; className?: string }) {
  switch (id) {
    case "revenue":
      return (
        <ChartCard
          className={className}
          title="Revenue by month"
          question="Are sales growing compared with last year?"
          table={{ columns: ["month", "revenue", "previous"], rows: MOCK_REVENUE_BY_MONTH.map((r) => ({ ...r, revenue: k(r.revenue), previous: k(r.previous) })) }}
        >
          <ResponsiveContainer>
            <AreaChart data={MOCK_REVENUE_BY_MONTH} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="month" {...axis} />
              <YAxis tickFormatter={k} width={56} {...axis} />
              <Tooltip formatter={(v) => k(Number(v))} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="previous" name="Last year" stroke={C.muted} fill="transparent" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="revenue" name="This year" stroke={C.main} fill={C.main} fillOpacity={0.08} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case "profit":
      return (
        <ChartCard
          className={className}
          title="Gross profit and margin"
          question="Is each sale still earning enough?"
          table={{ columns: ["month", "profit", "margin"], rows: MOCK_GROSS_PROFIT.map((r) => ({ month: r.month, profit: k(r.profit), margin: `${r.margin}%` })) }}
        >
          <ResponsiveContainer>
            <BarChart data={MOCK_GROSS_PROFIT} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="month" {...axis} />
              <YAxis tickFormatter={k} width={56} {...axis} />
              <Tooltip formatter={(v) => k(Number(v))} contentStyle={tooltipStyle} />
              <Bar dataKey="profit" name="Gross profit" fill={C.main} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case "funnel":
      return (
        <ChartCard
          className={className}
          title="Enquiry to sale"
          question="Where do buyers drop out?"
          table={{ columns: ["stage", "count"], rows: MOCK_FUNNEL }}
        >
          <ResponsiveContainer>
            <BarChart data={MOCK_FUNNEL} layout="vertical" margin={{ left: 16, right: 56 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="stage" width={96} {...axis} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Count" fill={C.main} radius={[0, 6, 6, 0]} label={{ position: "right", fontSize: 12, fill: C.main }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case "destinations":
      return (
        <ChartCard
          className={className}
          title="Revenue by destination"
          question="Which markets bring the most revenue?"
          table={{ columns: ["market", "revenue"], rows: MOCK_REVENUE_BY_DESTINATION.map((r) => ({ ...r, revenue: k(r.revenue) })) }}
        >
          <ResponsiveContainer>
            <BarChart data={MOCK_REVENUE_BY_DESTINATION} layout="vertical" margin={{ left: 8, right: 40 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="market" width={72} {...axis} />
              <Tooltip formatter={(v) => k(Number(v))} contentStyle={tooltipStyle} />
              <Bar dataKey="revenue" name="Revenue" fill={C.main} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case "cash":
      return (
        <ChartCard
          className={className}
          title="Cash received and outstanding"
          question="Is money arriving as fast as we invoice?"
          table={{ columns: ["month", "received", "outstanding"], rows: MOCK_CASH.map((r) => ({ month: r.month, received: k(r.received), outstanding: k(r.outstanding) })) }}
        >
          <ResponsiveContainer>
            <BarChart data={MOCK_CASH} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="month" {...axis} />
              <YAxis tickFormatter={k} width={56} {...axis} />
              <Tooltip formatter={(v) => k(Number(v))} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="received" name="Received (bank-confirmed)" stackId="a" fill={C.main} />
              <Bar dataKey="outstanding" name="Outstanding" stackId="a" fill={C.key} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case "ageing":
      return (
        <ChartCard
          className={className}
          title="Inventory ageing (days in stock)"
          question="Which vehicles have been waiting too long?"
          table={{ columns: ["band", "vehicles"], rows: MOCK_INVENTORY_AGEING }}
        >
          <ResponsiveContainer>
            <BarChart data={MOCK_INVENTORY_AGEING} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="band" {...axis} />
              <YAxis width={32} {...axis} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="vehicles" name="Vehicles" radius={[6, 6, 0, 0]} fill={C.main} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case "mix":
      return (
        <ChartCard
          className={className}
          title="Stock mix"
          question="What kind of vehicles are we holding?"
          table={{ columns: ["type", "vehicles"], rows: MOCK_STOCK_MIX }}
        >
          <ResponsiveContainer>
            <BarChart data={MOCK_STOCK_MIX} layout="vertical" margin={{ left: 8, right: 24 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="type" width={104} {...axis} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="vehicles" name="Vehicles" fill={C.main} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case "shipments":
      return (
        <ChartCard
          className={className}
          title="Shipments by stage"
          question="Where are vehicles in the export journey right now?"
          table={{ columns: ["stage", "count"], rows: MOCK_SHIPMENTS_BY_STAGE }}
        >
          <ResponsiveContainer>
            <BarChart data={MOCK_SHIPMENTS_BY_STAGE} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="stage" {...axis} />
              <YAxis width={32} {...axis} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Shipments" fill={C.main} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case "ownSourced":
      return (
        <ChartCard
          className={className}
          title="Own stock vs sourced on request"
          question="How much of the business comes from requests?"
          table={{ columns: ["month", "own", "sourced"], rows: MOCK_OWN_VS_SOURCED }}
        >
          <ResponsiveContainer>
            <BarChart data={MOCK_OWN_VS_SOURCED} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="month" {...axis} />
              <YAxis width={32} {...axis} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="own" name="Own stock" stackId="a" fill={C.main} />
              <Bar dataKey="sourced" name="Sourced" stackId="a" fill={C.key} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case "requests":
      return (
        <ChartCard
          className={className}
          title="Request response time"
          question="How quickly do we answer vehicle requests?"
          table={{ columns: ["month", "requests", "hours"], rows: MOCK_REQUEST_RESPONSE }}
        >
          <ResponsiveContainer>
            <LineChart data={MOCK_REQUEST_RESPONSE} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="month" {...axis} />
              <YAxis width={32} {...axis} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="hours" name="Hours to first reply" stroke={C.key} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case "leads":
      return (
        <ChartCard
          className={className}
          title="Lead sources and reply speed"
          question="Which channels bring buyers, and do we answer them fast?"
          table={{ columns: ["source", "leads", "replyHours"], rows: MOCK_LEAD_SOURCES }}
        >
          <ResponsiveContainer>
            <BarChart data={MOCK_LEAD_SOURCES} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="source" {...axis} />
              <YAxis width={40} {...axis} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="leads" name="Leads" fill={C.main} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case "daysToSell":
      return (
        <ChartCard
          className={className}
          title="Average days to sell"
          question="Are vehicles selling faster?"
          table={{ columns: ["month", "days"], rows: MOCK_DAYS_TO_SELL }}
        >
          <ResponsiveContainer>
            <LineChart data={MOCK_DAYS_TO_SELL} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="month" {...axis} />
              <YAxis width={32} {...axis} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="days" name="Days" stroke={C.main} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      );
  }
}
