import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { CheckIcon } from "@/components/ui/icons";
import { MOCK_GUIDES, TRUST_POINTS } from "@/mock/MOCK_DATA_content";
import { routes } from "@/prototype/routes";

export const metadata: Metadata = { title: "Guides and trust (Figure 15)" };

type Props = { searchParams: Promise<{ topic?: string }> };

export default async function GuidesPage({ searchParams }: Props) {
  const topic = (await searchParams).topic ?? "All";
  const topics = ["All", "Shipping", "Customs", "Payments"];
  const guides = topic === "All" ? MOCK_GUIDES : MOCK_GUIDES.filter((g) => g.topic === topic);

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-6 lg:grid-cols-[1fr_340px]">
      <div>
        <h1 className="text-4xl font-semibold">Guides for buyers</h1>
        <p className="mt-2 max-w-2xl text-slate">
          Helpful, dated, honest articles. Rules change by country and by year, so we show what we last confirmed, with the
          date.
        </p>
        <nav aria-label="Guide topics" className="mt-6">
          <ul className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <li key={t}>
                <Link
                  href={t === "All" ? routes.site.guides : `${routes.site.guides}?topic=${t}`}
                  aria-current={topic === t ? "page" : undefined}
                  className={
                    topic === t
                      ? "inline-flex h-10 items-center rounded-full bg-charcoal px-4 text-sm font-medium text-white"
                      : "inline-flex h-10 items-center rounded-full border border-silver px-4 text-sm font-medium hover:border-charcoal"
                  }
                >
                  {t}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {guides.map((g) => (
            <li key={g.slug}>
              <Card className="h-full p-6">
                <Chip tone="outline">{g.topic}</Chip>
                <h2 className="mt-3 font-display text-lg font-semibold">
                  <Link href={routes.site.guide(g.slug)} className="hover:underline">
                    {g.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm">{g.excerpt}</p>
                <p className="mt-4 text-sm text-slate">
                  Last confirmed {g.confirmed} · {g.minutes} min read
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </div>
      <aside className="flex flex-col gap-4">
        <Card className="p-6">
          <h2 className="eyebrow">Why trust Raptors</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {TRUST_POINTS.map((t) => (
              <li key={t} className="flex gap-2 text-sm">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {t}
              </li>
            ))}
          </ul>
        </Card>
        <Card tone="platinum" className="p-6">
          <h2 className="eyebrow !text-charcoal">Search and SEO (built in later milestones)</h2>
          <ul className="mt-3 list-inside list-disc text-sm">
            <li>Clean, readable addresses</li>
            <li>Vehicle pages with structured data</li>
            <li>Guides by country and topic</li>
            <li>Fast images on phones</li>
            <li>Social sharing cards</li>
          </ul>
        </Card>
      </aside>
    </div>
  );
}
