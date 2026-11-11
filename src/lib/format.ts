/** Money is always integer cents with a currency code (Part 1 §4.1). */
export type Money = { cents: number; currency: "USD" };

export const usd = (dollars: number): Money => ({ cents: Math.round(dollars * 100), currency: "USD" });

export function formatMoney(m: Money, opts: { cents?: boolean } = {}): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: m.currency,
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  }).format(m.cents / 100);
}

export function formatCompactUsd(m: Money): string {
  const d = m.cents / 100;
  if (d >= 1_000_000) return `$${(d / 1_000_000).toFixed(2)}M`;
  if (d >= 1_000) return `$${Math.round(d / 1_000)}k`;
  return formatMoney(m);
}

export const formatMiles = (mi: number) => `${new Intl.NumberFormat("en-US").format(mi)} mi`;

export function formatDate(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  const date = Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day) ? new Date(Date.UTC(year, month - 1, day)) : new Date(iso);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
