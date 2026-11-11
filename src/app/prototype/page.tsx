import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { SCREEN_GROUPS } from "@/prototype/screens";

export const metadata: Metadata = { title: "All screens" };

/** Milestone 1 index: every prototype screen, grouped by experience, with its Master Plan figure number. */
export default function PrototypeIndex() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <Wordmark subtitle="Milestone 1 prototype" />
      <h1 className="mt-8 font-display text-4xl font-semibold md:text-5xl">All screens</h1>
      <p className="mt-3 max-w-2xl text-slate">
        Design-only prototype. Every figure is MOCK DATA, all vehicle images are stand-ins, and anything in [brackets] is
        waiting for information from Raptors. Figure numbers refer to the Master Plan.
      </p>
      <div className="mt-10 grid gap-10">
        {SCREEN_GROUPS.map((g) => (
          <section key={g.title} aria-labelledby={`g-${g.title}`}>
            <h2 id={`g-${g.title}`} className="font-display text-2xl font-semibold">
              {g.title}
            </h2>
            <p className="text-sm text-slate">{g.description}</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.screens.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={s.href}
                    className="flex h-full flex-col rounded-panel border border-platinum bg-white p-4 transition-colors hover:border-charcoal"
                  >
                    <span className="eyebrow">{s.figure ? `Figure ${s.figure}` : "No figure"}</span>
                    <span className="mt-1 font-display font-semibold">{s.name}</span>
                    {s.note && <span className="mt-1 text-sm text-slate">{s.note}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
