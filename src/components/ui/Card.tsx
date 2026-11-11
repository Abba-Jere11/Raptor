import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  as: Tag = "div",
  tone = "white",
  ...rest
}: {
  className?: string;
  children: React.ReactNode;
  as?: "div" | "section" | "article" | "aside";
  tone?: "white" | "platinum" | "dark";
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  const tones = {
    white: "bg-white border border-platinum shadow-soft",
    platinum: "bg-platinum",
    dark: "bg-charcoal text-white",
  };
  return (
    <Tag className={cn("rounded-card", tones[tone], className)} {...rest}>
      {children}
    </Tag>
  );
}

/** Numbered step "(01)" in the reference style. */
export function Step({
  n,
  title,
  children,
  tone = "dark",
}: {
  n: number;
  title: string;
  children?: React.ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <div className="flex gap-4">
      <span
        className={cn(
          "font-display text-sm font-semibold tabular",
          tone === "light" ? "text-white" : "text-crimson",
        )}
      >
        ({String(n).padStart(2, "0")})
      </span>
      <div>
        <p className={cn("font-display font-semibold", tone === "light" ? "text-white" : "text-charcoal")}>{title}</p>
        {children && <p className={cn("mt-1 text-sm", tone === "light" ? "text-white/85" : "text-slate")}>{children}</p>}
      </div>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
  id,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 id={id} className="text-2xl font-semibold md:text-3xl">
          {title}
        </h2>
        {description && <p className="mt-2 text-slate">{description}</p>}
      </div>
      {action}
    </div>
  );
}
