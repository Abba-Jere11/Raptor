"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type TabItem = { id: string; label: string; content: React.ReactNode };

/** Accessible tabs: arrow keys move between tabs (WAI-ARIA tabs pattern). */
export function Tabs({ items, initial, className }: { items: TabItem[]; initial?: string; className?: string }) {
  const [active, setActive] = useState(initial ?? items[0]?.id);
  const base = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + items.length) % items.length;
    setActive(items[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div className={className}>
      <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-full bg-platinum p-1">
        {items.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`${base}-tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "h-9 rounded-full px-4 text-sm font-semibold transition-colors",
              active === t.id ? "bg-white text-charcoal shadow-soft" : "text-charcoal hover:bg-white/60",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {items.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={active !== t.id}
          className="mt-6"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}

/** Link-style tab bar for navigating between pages (e.g. dashboard pages). */
export function TabNav({
  items,
  active,
  label,
}: {
  items: Array<{ href: string; label: string; id: string }>;
  active: string;
  label: string;
}) {
  return (
    <nav aria-label={label} className="overflow-x-auto">
      <ul className="inline-flex gap-1 rounded-full bg-platinum p-1">
        {items.map((t) => (
          <li key={t.id}>
            <a
              href={t.href}
              aria-current={active === t.id ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold",
                active === t.id ? "bg-white text-charcoal shadow-soft" : "text-charcoal hover:bg-white/60",
              )}
            >
              {t.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
