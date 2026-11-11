import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Interim lockup from Master Plan v5 Figure 1 (page 15).
 * A high-resolution final file still replaces this (Decision 8).
 */
export function Wordmark({
  tone = "dark",
  subtitle = "Auto Group",
  stacked = false,
  bare = false,
  className,
}: {
  tone?: "dark" | "light";
  subtitle?: string;
  stacked?: boolean;
  /** Crops the rounded frame baked into the interim lockup file, leaving the emblem and name. */
  bare?: boolean;
  className?: string;
}) {
  if (bare && !stacked && tone === "dark") {
    return (
      <span
        className={cn("relative inline-block aspect-[323/74] h-9 overflow-hidden leading-none", className)}
        role="img"
        aria-label={`Raptors ${subtitle}`}
        title="Interim logo from the Master Plan. A high-resolution file still replaces this."
      >
        <Image
          src="/brand/lockup-light.png"
          alt=""
          width={657}
          height={161}
          className="absolute left-[-19.2%] top-[-51.4%] h-auto w-[203.4%] max-w-none"
          priority
        />
      </span>
    );
  }
  const src =
    tone === "light"
      ? stacked
        ? "/brand/emblem-dark.png"
        : "/brand/lockup-dark.png"
      : stacked
        ? "/brand/emblem-light.png"
        : "/brand/lockup-light.png";
  return (
    <span
      className={cn("inline-flex items-center leading-none", className)}
      role="img"
      aria-label={`Raptors ${subtitle}`}
      title="Interim logo from the Master Plan. A high-resolution file still replaces this."
    >
      <Image
        src={src}
        alt=""
        width={stacked ? 280 : 320}
        height={stacked ? 160 : 72}
        className={stacked ? "h-24 w-auto" : "h-10 w-auto"}
        priority
      />
    </span>
  );
}
