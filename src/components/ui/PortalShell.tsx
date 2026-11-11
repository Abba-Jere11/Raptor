"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Drawer } from "./Drawer";
import { MenuIcon } from "./icons";
import { Wordmark } from "./Wordmark";

export type PortalNavItem = { label: string; href?: string; badge?: number };

/**
 * Shared working layout for the Administrator and CEO portals: same palette and
 * components as the public site, denser (Part 1 §7). Items without href are not
 * part of this milestone and render as disabled.
 */
export function PortalShell({
  portal,
  sectionLabel,
  nav,
  active,
  title,
  actions,
  children,
}: {
  portal: "Administrator" | "CEO Portal";
  sectionLabel: string;
  nav: PortalNavItem[];
  active: string;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const navList = (
    <nav aria-label={`${portal} navigation`}>
      <p className="eyebrow mb-2 px-3">{sectionLabel}</p>
      <ul className="flex flex-col gap-0.5">
        {nav.map((n) => (
          <li key={n.label}>
            {n.href ? (
              <Link
                href={n.href}
                onClick={() => setOpen(false)}
                aria-current={active === n.label ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center justify-between rounded-full px-3 text-sm font-medium",
                  active === n.label ? "bg-charcoal text-white" : "text-charcoal hover:bg-platinum",
                )}
              >
                {n.label}
                {n.badge ? (
                  <span
                    className={cn(
                      "rounded-full px-2 text-xs font-bold",
                      active === n.label ? "bg-white text-charcoal" : "bg-crimson text-white",
                    )}
                  >
                    {n.badge}
                  </span>
                ) : null}
              </Link>
            ) : (
              <span
                className="flex h-9 items-center rounded-full px-3 text-sm text-slate"
                title="Designed in a later milestone"
                aria-disabled="true"
              >
                {n.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className="flex min-h-[calc(100dvh-30px)] bg-platinum/50">
      <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-platinum bg-white px-3 py-5 lg:flex">
        <div className="px-3">
          <Wordmark subtitle={portal} />
        </div>
        {navList}
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-platinum bg-white/95 px-4 py-3 backdrop-blur md:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-silver lg:hidden"
            aria-label="Open navigation"
          >
            <MenuIcon />
          </button>
          <h1 className="min-w-0 flex-1 truncate font-display text-lg font-semibold md:text-xl">{title}</h1>
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} title={portal} side="left">
        {navList}
      </Drawer>
    </div>
  );
}
