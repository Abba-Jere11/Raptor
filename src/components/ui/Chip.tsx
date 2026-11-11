import { cn } from "@/lib/cn";

export type ChipTone = "neutral" | "dark" | "brand" | "success" | "warning" | "outline";

const tones: Record<ChipTone, string> = {
  neutral: "bg-platinum text-charcoal",
  dark: "bg-charcoal text-white",
  brand: "bg-crimson text-white",
  success: "bg-success-bg text-success",
  warning: "bg-amber-bg text-amber-text",
  outline: "bg-white text-charcoal border border-silver",
};

export function Chip({ tone = "neutral", className, children }: { tone?: ChipTone; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Maps every lifecycle status in Part 1 §6 to a quiet chip tone. */
const statusTones: Record<string, ChipTone> = {
  New: "brand",
  "Export-ready": "success",
  "Clean title": "outline",
  Available: "success",
  "Just added": "success",
  Reserved: "warning",
  Sold: "dark",
  Draft: "neutral",
  Submitted: "warning",
  "Awaiting CEO": "warning",
  Approved: "success",
  Withdrawn: "neutral",
  Contacted: "neutral",
  Quoted: "neutral",
  Negotiating: "warning",
  Won: "success",
  Lost: "neutral",
  Spam: "neutral",
  Sent: "neutral",
  Viewed: "neutral",
  Accepted: "success",
  Declined: "neutral",
  Expired: "neutral",
  Superseded: "neutral",
  "Awaiting payment": "warning",
  "Part paid": "warning",
  "Paid in full": "success",
  Cleared: "success",
  Awaiting: "warning",
  Delayed: "warning",
  "On track": "success",
  Overdue: "brand",
  Active: "success",
  Deactivated: "neutral",
  Pending: "warning",
  Urgent: "brand",
};

export function StatusChip({ status, className }: { status: string; className?: string }) {
  return (
    <Chip tone={statusTones[status] ?? "neutral"} className={className}>
      {status}
    </Chip>
  );
}
