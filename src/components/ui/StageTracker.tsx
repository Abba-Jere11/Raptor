import { cn } from "@/lib/cn";

export type Stage = { label: string; date?: string };

/**
 * Horizontal (desktop) / vertical (phone) stage tracker. `current` is the index
 * of the stage in progress; earlier stages are complete.
 */
export function StageTracker({
  stages,
  current,
  orientation = "responsive",
  label,
}: {
  stages: Stage[];
  current: number;
  orientation?: "responsive" | "horizontal" | "vertical";
  label: string;
}) {
  const layout =
    orientation === "vertical"
      ? "flex-col"
      : orientation === "horizontal"
        ? "flex-row"
        : "flex-col md:flex-row";
  return (
    <ol aria-label={label} className={cn("flex gap-0", layout)}>
      {stages.map((s, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li
            key={s.label}
            aria-current={now ? "step" : undefined}
            className={cn(
              "relative flex flex-1 items-center gap-3 md:items-start",
              orientation !== "vertical" && "md:flex-col md:gap-2",
              orientation === "horizontal" && "flex-col gap-2",
            )}
          >
            <div className="flex items-center md:w-full">
              <span
                className={cn(
                  "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                  done && "border-charcoal bg-charcoal text-white",
                  now && "border-crimson bg-white text-crimson ring-4 ring-crimson/15",
                  !done && !now && "border-silver bg-white text-slate",
                )}
              >
                {done ? (
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span aria-hidden>{i + 1}</span>
                )}
              </span>
              {i < stages.length - 1 && (
                <span
                  aria-hidden
                  className={cn("hidden h-0.5 flex-1 md:block", done ? "bg-charcoal" : "bg-silver")}
                />
              )}
            </div>
            <div className="py-1.5 md:py-0">
              <p className={cn("text-sm font-semibold", now ? "text-crimson" : "text-charcoal")}>{s.label}</p>
              <p className="text-xs text-slate tabular">
                {s.date ?? (now ? "Now" : "—")}
                <span className="sr-only">{done ? ", complete" : now ? ", in progress" : ", not started"}</span>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
