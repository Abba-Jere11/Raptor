import { cn } from "@/lib/cn";

export type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  caption,
  rowKey,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  caption: string;
  rowKey: (row: T) => string;
  className?: string;
}) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={caption}
      className={cn("overflow-x-auto rounded-panel border border-platinum bg-white", className)}
    >
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-platinum">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  "eyebrow whitespace-nowrap px-4 py-3 font-semibold",
                  c.align === "right" ? "text-right" : "text-left",
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="border-b border-platinum last:border-0 hover:bg-platinum/40">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn("px-4 py-3 align-middle", c.align === "right" && "text-right tabular", c.className)}
                >
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Two-column label/value list used in quotations, specs and money summaries. */
export function KeyValueList({
  rows,
  className,
}: {
  rows: Array<{ label: React.ReactNode; value: React.ReactNode; strong?: boolean }>;
  className?: string;
}) {
  return (
    <dl className={cn("divide-y divide-platinum", className)}>
      {rows.map((r, i) => (
        <div key={i} className={cn("flex items-baseline justify-between gap-4 py-2.5", r.strong && "font-semibold")}>
          <dt className={r.strong ? "text-charcoal" : "text-slate"}>{r.label}</dt>
          <dd className="text-right tabular text-charcoal">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
