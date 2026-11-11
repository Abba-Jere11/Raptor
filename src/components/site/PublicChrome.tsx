"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { loadSavedVehicles } from "@/app/(public)/inventory/actions";
import { PillButton } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { HeartIcon, MenuIcon, WhatsAppIcon } from "@/components/ui/icons";
import { Wordmark } from "@/components/ui/Wordmark";
import { cn } from "@/lib/cn";
import { useFavourites } from "@/lib/favourites";
import { formatMoney } from "@/lib/format";
import type { CatalogVehicle } from "@/lib/public-catalog";
import { whatsappHref, type PublicChromeData, type PublicNavItem } from "@/lib/site-chrome";
import { routes } from "@/lib/routes";
import { emptyFilters, vehicleTitle } from "@/lib/inventory";
import { VehiclePhoto } from "@/components/inventory/VehiclePhoto";

function isActive(href: string, pathname: string) {
  return href === routes.home ? pathname === routes.home : pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicHeader({ nav, whatsapp }: Pick<PublicChromeData, "nav" | "whatsapp">) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const { ids } = useFavourites();
  const inCollection = isActive(routes.inventory, pathname);
  // The homepage hero carries its own Explore Collection button, so the header one waits until the hero has scrolled away.
  const showExplore = !inCollection && (pathname !== routes.home || pastHero);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      setPastHero(window.scrollY > 480);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("sticky top-0 z-40 border-b bg-white transition-colors duration-150", scrolled ? "border-platinum" : "border-transparent")}>
      <div className="shell flex h-[72px] items-center gap-4">
        <Link href={routes.home} className="shrink-0 rounded-md" aria-label="Raptors Auto Group, home">
          <Wordmark bare className="h-8 md:h-9" />
        </Link>
        <nav aria-label="Main" className="mx-auto hidden lg:block">
          <ul className="flex items-center gap-8">
            {nav.map((item) => (
              <li key={item.href}>
                <NavLink item={item} pathname={pathname} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <button
            type="button"
            onClick={() => setSavedOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-charcoal hover:bg-platinum"
          >
            <HeartIcon />
            <span className="sr-only">Saved vehicles ({ids.length})</span>
            {ids.length > 0 && (
              <span aria-hidden className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-charcoal px-1 text-[0.625rem] font-bold text-white">
                {ids.length}
              </span>
            )}
          </button>
          {whatsapp && (
            <a
              href={whatsappHref(whatsapp)}
              className="hidden h-10 w-10 items-center justify-center rounded-full text-charcoal hover:bg-platinum sm:flex"
              aria-label="Chat on WhatsApp"
            >
              <WhatsAppIcon />
            </a>
          )}
          {showExplore && (
            <span className="ml-1 hidden md:block">
              <PillButton href={routes.inventory} variant="dark" size="sm">
                Explore Collection
              </PillButton>
            </span>
          )}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-charcoal hover:bg-platinum lg:hidden"
            onClick={() => setMenu(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
        </div>
      </div>
      <Drawer open={menu} onClose={() => setMenu(false)} title="Menu">
        <nav aria-label="Mobile" className="flex min-h-full flex-col">
          <ul className="flex flex-col">
            {nav.map((item) => (
              <li key={item.href} className="border-b border-platinum">
                <Link
                  href={item.href}
                  onClick={() => setMenu(false)}
                  aria-current={isActive(item.href, pathname) ? "page" : undefined}
                  className="flex h-16 items-center font-display text-3xl font-semibold tracking-tight decoration-2 underline-offset-8 aria-[current=page]:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-3 pt-10">
            <PillButton href={routes.inventory} variant="primary" size="lg" className="justify-between" onClick={() => setMenu(false)}>
              Explore Collection
            </PillButton>
            {whatsapp && (
              <a href={whatsappHref(whatsapp)} className="flex h-14 items-center justify-center gap-2 rounded-full ring-1 ring-inset ring-charcoal font-display font-semibold">
                <WhatsAppIcon />
                Chat on WhatsApp
              </a>
            )}
          </div>
        </nav>
      </Drawer>
      <SavedDrawer open={savedOpen} onClose={() => setSavedOpen(false)} />
    </header>
  );
}

function NavLink({ item, pathname }: { item: PublicNavItem; pathname: string }) {
  const active = isActive(item.href, pathname);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex h-10 items-center text-[0.9375rem] font-medium text-charcoal transition-colors duration-150 hover:text-black",
        "after:absolute after:inset-x-0 after:bottom-1 after:mx-auto after:h-0.5 after:w-4 after:rounded-full after:bg-charcoal after:transition-opacity after:duration-150",
        active ? "after:opacity-100" : "after:opacity-0 hover:after:opacity-40",
      )}
    >
      {item.label}
    </Link>
  );
}

export function PublicFooter({ footer, legalName }: Pick<PublicChromeData, "footer" | "legalName">) {
  const company = footer.filter((item) => item.href !== routes.home && item.href !== routes.inventory);
  return (
    <footer className="border-t border-platinum bg-white">
      <div className="shell grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <Wordmark bare />
          <p className="mt-4 max-w-xs text-sm text-slate">Vehicles selected for those who appreciate more.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
          <FooterColumn title="Collection">
            <FooterLink href={routes.inventory}>All vehicles</FooterLink>
            <FooterLink href={`${routes.inventory}?availability=available`}>Available now</FooterLink>
            <FooterLink href={`${routes.inventory}?saved=1`}>Saved vehicles</FooterLink>
          </FooterColumn>
          {company.length > 0 && (
            <FooterColumn title="Company">
              {company.map((item) => (
                <FooterLink key={item.href} href={item.href}>
                  {item.label}
                </FooterLink>
              ))}
            </FooterColumn>
          )}
          <FooterColumn title="Staff">
            <FooterLink href={routes.signIn}>Staff sign in</FooterLink>
          </FooterColumn>
        </nav>
      </div>
      <div className="shell">
        <p className="border-t border-platinum py-6 text-sm text-slate">{legalName ?? "Raptors Auto Group"}</p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-display text-sm font-semibold text-charcoal">{title}</p>
      <ul className="mt-4 flex flex-col gap-3">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-slate transition-colors duration-150 hover:text-charcoal hover:underline underline-offset-4">
        {children}
      </Link>
    </li>
  );
}

function SavedDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { ids } = useFavourites();
  const [rows, setRows] = useState<CatalogVehicle[] | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    if (ids.length === 0) {
      setRows([]);
      return;
    }
    loadSavedVehicles(ids, emptyFilters()).then((next) => {
      if (!cancelled) setRows(next);
    });
    return () => {
      cancelled = true;
    };
  }, [open, key, ids]);

  return (
    <Drawer open={open} onClose={onClose} title="Saved vehicles">
      {rows === null && <p className="text-sm text-slate">Loading saved vehicles.</p>}
      {rows && rows.length === 0 && <p className="text-charcoal">You have not saved a vehicle on this device.</p>}
      {rows && rows.length > 0 && (
        <ul className="flex flex-col gap-4">
          {rows.map((vehicle) => (
            <li key={vehicle.id}>
              <Link href={routes.vehicle(vehicle.slug)} onClick={onClose} className="group flex items-center gap-4 rounded-panel">
                <VehiclePhoto
                  mediaId={vehicle.coverId}
                  make={vehicle.make}
                  model=""
                  alt=""
                  sizes="112px"
                  placeholderSize="sm"
                  className="aspect-[4/3] w-28 shrink-0 rounded-xl"
                />
                <span className="min-w-0">
                  <span className="block font-display font-semibold group-hover:underline">{vehicleTitle(vehicle)}</span>
                  <span className="block text-sm text-slate tabular">
                    {vehicle.status === "sold" ? "Sold" : `${formatMoney({ cents: vehicle.price_cents, currency: "USD" })} USD`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <PillButton href={routes.inventory} variant="secondary" className="mt-8" arrow={false}>
        View the collection
      </PillButton>
    </Drawer>
  );
}
