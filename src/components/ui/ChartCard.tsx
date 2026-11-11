"use client";

import { useState } from "react";
import { Card } from "./Card";

export type ChartTableRow = Record<string, string | number>;

/**
 * Every chart answers one question, offers "View as table" and export
 * (Master Plan Section 16). Export is inert in the prototype.
 */
export function ChartCard({
  title,
  question,
  table,
  children,
  className,
}: {
  title: string;
  question: string;
  table: { columns: string[]; rows: ChartTableRow[] };
  children: React.ReactNode;
  className?: string;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <Card className={`p-5 ${className ?? ""}`} as="section">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">{title}</h2>
          <p className="text-sm text-slate">{question}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAsTable((v) => !v)}
            aria-pressed={asTable}
            className="h-8 rounded-full border border-silver px-3 text-xs font-semibold hover:border-charcoal"
          >
            {asTable ? "View as chart" : "View as table"}
          </button>
          <button
            type="button"
            className="h-8 rounded-full border border-silver px-3 text-xs font-semibold hover:border-charcoal"
            title="Export (prototype: not active)"
          >
            Export
          </button>
        </div>
      </div>
      <div className="mt-4">
        {asTable ? (
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr>
                  {table.columns.map((c) => (
                    <th key={c} scope="col" className="eyebrow border-b border-platinum py-2 text-left">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, i) => (
                  <tr key={i} className="border-b border-platinum last:border-0">
                    {table.columns.map((c) => (
                      <td key={c} className="py-2 tabular">
                        {r[c]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-64" role="img" aria-label={`${title}: ${question} Use "View as table" for the figures.`}>
            {children}
          </div>
        )}
      </div>
    </Card>
  );
}

export function StatTile({
  label,
  value,
  delta,
  note,
}: {
  label: string;
  value: string;
  delta?: { text: string; up: boolean };
  note?: string;
}) {
  return (
    <Card className="p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tabular">{value}</p>
      {delta && (
        <p className="mt-1 text-sm text-slate">
          <span aria-hidden>{delta.up ? "▲" : "▼"}</span> {delta.text}
        </p>
      )}
      {note && <p className="mt-1 text-sm text-slate">{note}</p>}
    </Card>
  );
}
