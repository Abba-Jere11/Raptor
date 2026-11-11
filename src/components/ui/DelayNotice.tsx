import { cn } from "@/lib/cn";

/** Amber delay notice (Figures 12, 13, 20). Amber is a status colour, not a brand colour. */
export function DelayNotice({
  date,
  reason,
  children,
  newRange,
  className,
}: {
  date: string;
  reason: string;
  children?: React.ReactNode;
  newRange?: string;
  className?: string;
}) {
  return (
    <div role="status" className={cn("rounded-panel border border-amber-border bg-amber-bg p-4 text-amber-text", className)}>
      <p className="flex flex-wrap items-center gap-2 font-display font-semibold">
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M10 2l8.5 15h-17L10 2zm0 5a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm0 9a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4z" />
        </svg>
        Delay notice · {date}
        <span className="font-sans font-normal">{reason}</span>
      </p>
      {children && <p className="mt-1.5 text-sm">{children}</p>}
      {newRange && <p className="mt-1.5 text-sm font-semibold">Revised arrival: {newRange}</p>}
    </div>
  );
}
