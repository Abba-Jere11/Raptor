"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { HeartIcon, MenuIcon, WhatsAppIcon } from "@/components/ui/icons";
import { Wordmark } from "@/components/ui/Wordmark";
import { cn } from "@/lib/cn";
import { useFavourites } from "@/lib/favourites";
import { formatMoney } from "@/lib/format";
import { MOCK_VEHICLES, vehicleTitle } from "@/mock/MOCK_DATA_vehicles";
import { routes, WHATSAPP_PLACEHOLDER, whatsappHref } from "@/prototype/routes";

const NAV = [
  { href: routes.site.home, label: "Home" },
  { href: routes.site.inventory, label: "Inventory" },
  { href: routes.site.request, label: "Request a Vehicle" },
  { href: routes.site.exportShipping, label: "Export & Shipping" },
  { href: routes.site.about, label: "About" },
  { href: routes.site.contact, label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [favs, setFavs] = useState(false);
  const { ids } = useFavourites();

  return (
    <header className="sticky top-0 z-40 border-b border-platinum bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Link href={routes.site.home} className="shrink-0">
          <Wordmark />
          <span className="sr-only">, home</span>
        </Link>
        <nav aria-label="Main" className="mx-auto hidden lg:block">
          <ul className="flex items-center gap-1 rounded-full border border-platinum bg-white p-1">
            {NAV.map((n) => {
              const active = n.href === pathname || (n.href !== routes.site.home && pathname.startsWith(n.href));
              return (
                <li key={n.label}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium",
                      active ? "bg-charcoal text-white" : "text-charcoal hover:bg-platinum",
                    )}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <button
            type="button"
            onClick={() => setFavs(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-silver hover:border-charcoal"
            aria-label={`Saved vehicles (${ids.length})`}
          >
            <HeartIcon />
            {ids.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson px-1 text-[0.65rem] font-bold text-white">
                {ids.length}
              </span>
            )}
          </button>
          <PillButton href={routes.track.signIn} variant="outline" size="sm" className="hidden sm:inline-flex">
            Track your vehicle
          </PillButton>
          <a
            href={whatsappHref()}
            className="hidden h-10 w-10 items-center justify-center rounded-full bg-charcoal text-white sm:flex"
            aria-label="Chat on WhatsApp"
          >
            <WhatsAppIcon />
          </a>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-silver lg:hidden"
            onClick={() => setMenu(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      <Drawer open={menu} onClose={() => setMenu(false)} title="Menu">
        <nav aria-label="Mobile">
          <ul className="flex flex-col gap-1">
            {NAV.map((n) => (
              <li key={n.label}>
                <Link
                  href={n.href}
                  onClick={() => setMenu(false)}
                  className="flex h-12 items-center rounded-panel px-3 font-display text-lg font-semibold hover:bg-platinum"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3">
            <PillButton href={routes.track.signIn} variant="dark">
              Track your vehicle
            </PillButton>
            <PillButton href={whatsappHref()} variant="outline">
              Chat on WhatsApp
            </PillButton>
          </div>
        </nav>
      </Drawer>

      <FavouritesDrawer open={favs} onClose={() => setFavs(false)} />
    </header>
  );
}

export function FavouritesDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { ids, toggle } = useFavourites();
  const saved = MOCK_VEHICLES.filter((v) => ids.includes(v.id));
  return (
    <Drawer open={open} onClose={onClose} title={`Saved vehicles · ${saved.length}`}>
      <p className="text-sm text-slate">Saved on this device only. No account needed.</p>
      {saved.length === 0 ? (
        <p className="mt-6 rounded-panel bg-platinum p-4 text-sm">
          Tap the heart on any vehicle to save it here.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-platinum">
          {saved.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 py-3">
              <Link href={routes.site.vehicle(v.slug)} onClick={onClose} className="hover:underline">
                <span className="block font-medium">{vehicleTitle(v)}</span>
                <span className="text-sm text-slate tabular">{formatMoney(v.price)}</span>
              </Link>
              <button
                type="button"
                onClick={() => toggle(v.id)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-crimson hover:bg-platinum"
                aria-label={`Remove ${vehicleTitle(v)} from saved`}
              >
                <HeartIcon filled />
              </button>
            </li>
          ))}
        </ul>
      )}
      {saved.length > 0 && (
        <form className="mt-6 flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="fav-email" className="eyebrow">
            Email me this list
          </label>
          <input
            id="fav-email"
            type="email"
            placeholder="you@example.com"
            className="h-12 rounded-panel border border-silver px-4"
          />
          <PillButton type="submit" variant="dark">
            Email me this list
          </PillButton>
        </form>
      )}
    </Drawer>
  );
}

export function SiteFooter() {
  return (
    <footer id="footer" className="mt-24 border-t border-platinum bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-[1.2fr_2fr_1fr] md:px-6">
        <div>
          <Wordmark />
          <p className="mt-4 text-sm text-slate">
            Registered US dealer · [Licence no.]
            <br />
            [Address]
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {[
              ["Inventory", routes.site.inventory],
              ["Request a Vehicle", routes.site.request],
              ["Export & Shipping", routes.site.exportShipping],
              ["Guides", routes.site.guides],
              ["About", routes.site.about],
              ["Contact", routes.site.contact],
              ["Terms", "#"],
              ["Privacy", "#"],
              ["Payment and refund policy", "#"],
            ].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-2 text-sm">
          <a href={whatsappHref()} className="hover:underline">
            WhatsApp {WHATSAPP_PLACEHOLDER}
          </a>
          <a href="mailto:hello@[domain]" className="hover:underline">
            hello@[domain]
          </a>
          <span>[Phone]</span>
        </div>
      </div>
    </footer>
  );
}

/** Floating WhatsApp + concierge (Figure 15). No AI chat, no pop-up before interaction. */
export function FloatingActions() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="no-print fixed bottom-5 right-5 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-12 rounded-full border border-silver bg-white px-5 font-display text-sm font-semibold shadow-lift hover:border-charcoal"
        >
          How can we help?
        </button>
        <a
          href={whatsappHref()}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-charcoal text-white shadow-lift"
          aria-label="Chat on WhatsApp"
        >
          <WhatsAppIcon className="h-6 w-6" />
        </a>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} title="How can we help?">
        <p className="text-sm text-slate">Your Raptors representative is a message away.</p>
        <ul className="mt-5 flex flex-col gap-3">
          {[
            { label: "Request a vehicle", note: "Any make and model", href: routes.site.request },
            { label: "Track your vehicle", note: "VIN and Buyer ID", href: routes.track.signIn },
            { label: "WhatsApp us", note: "Reply within hours", href: whatsappHref() },
            { label: "Guides", note: "Shipping and customs", href: routes.site.guides },
          ].map((a) => (
            <li key={a.label}>
              <Link
                href={a.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-panel border border-platinum p-4 hover:border-charcoal"
              >
                <span>
                  <span className="block font-display font-semibold">{a.label}</span>
                  <span className="text-sm text-slate">{a.note}</span>
                </span>
                <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal text-white">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Drawer>
    </>
  );
}
