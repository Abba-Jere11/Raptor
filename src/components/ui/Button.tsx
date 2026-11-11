import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "dark" | "outline" | "ghost" | "secondary" | "light";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-crimson text-white hover:bg-crimson-dark",
  dark: "bg-charcoal text-white hover:bg-black",
  outline: "bg-white text-charcoal border border-silver hover:border-charcoal",
  ghost: "bg-transparent text-charcoal hover:bg-platinum",
  secondary: "bg-transparent text-charcoal ring-1 ring-inset ring-charcoal hover:bg-charcoal hover:text-white",
  light: "bg-transparent text-white ring-1 ring-inset ring-white hover:bg-white hover:text-charcoal",
};

const circles: Record<Variant, string> = {
  primary: "bg-white text-crimson",
  dark: "bg-white text-charcoal",
  outline: "bg-charcoal text-white",
  ghost: "bg-charcoal text-white",
  secondary: "bg-charcoal text-white",
  light: "bg-white text-charcoal",
};

const sizes: Record<Size, string> = {
  sm: "h-9 pl-4 text-sm gap-2",
  md: "h-11 pl-5 text-[0.95rem] gap-3",
  lg: "h-14 pl-6 text-base gap-3",
};

function Arrow({ variant, size }: { variant: Variant; size: Size }) {
  const dim = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center rounded-full", circles[variant], dim)}>
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

type Common = {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** Pill button with an arrow circle (Figure 1). Crimson is reserved for the key action on a screen. */
export function PillButton({
  href,
  variant = "dark",
  size = "md",
  arrow = true,
  className,
  children,
  ...rest
}: Common & { href?: string } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  const classes = cn(
    "inline-flex select-none items-center rounded-full font-display font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45",
    variants[variant],
    sizes[size],
    arrow ? (size === "lg" ? "pr-2" : "pr-1.5") : "pr-5",
    className,
  );
  const inner = (
    <>
      <span>{children}</span>
      {arrow && <Arrow variant={variant} size={size} />}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        aria-label={rest["aria-label"]}
        onClick={rest.onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {inner}
    </button>
  );
}

/** Tertiary action: a text link followed by a small arrow that moves on hover. */
export function TextLink({
  href,
  tone = "dark",
  className,
  children,
}: {
  href: string;
  tone?: "dark" | "light";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group/link inline-flex items-center gap-2 font-display font-semibold underline-offset-[6px] hover:underline",
        tone === "light" ? "text-white" : "text-charcoal",
        className,
      )}
    >
      <span>{children}</span>
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

/** Plain pill without arrow, for secondary or filter actions. */
export function Pill({
  active,
  className,
  children,
  ...rest
}: { active?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
        active ? "border-charcoal bg-charcoal text-white" : "border-silver bg-white text-charcoal hover:border-charcoal",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
