import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnquiryForm } from "@/components/enquiry/EnquiryForm";
import { JsonLd } from "@/components/site/JsonLd";
import { env } from "@/lib/env";
import { loadPublishedPage, loadSettings, whatsappHref } from "@/lib/public-content";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadPublishedPage("contact");
  if (!page) return { title: "Contact" };
  const title = page.seo_title?.trim() || page.title;
  const description = page.seo_description?.trim() || undefined;
  return { title, description, alternates: { canonical: routes.contact }, openGraph: { title, description, url: routes.contact, type: "website" } };
}

export default async function ContactPage() {
  const [page, settings] = await Promise.all([loadPublishedPage("contact"), loadSettings()]);
  if (!page) notFound();
  const whatsapp = settings?.whatsapp_e164?.trim() || null;
  const city = settings?.city?.trim() || null;
  const legalName = settings?.legal_name?.trim() || null;
  return (
    <article className="shell grid gap-12 py-12 md:py-16 lg:grid-cols-12 lg:gap-16">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ContactPage", name: page.title, url: `${env.siteUrl}${routes.contact}` }} />
      <div className="lg:col-span-5">
        <h1 className="text-4xl font-semibold">{page.title}</h1>
        <p className="mt-6 whitespace-pre-wrap leading-7 text-charcoal">{page.body}</p>
        <dl className="mt-8 flex flex-col gap-3 text-charcoal">
          {legalName && (
            <div>
              <dt className="text-sm font-semibold">Name</dt>
              <dd>{legalName}</dd>
            </div>
          )}
          {city && (
            <div>
              <dt className="text-sm font-semibold">Based in</dt>
              <dd>{city}</dd>
            </div>
          )}
          {whatsapp && (
            <div>
              <dt className="text-sm font-semibold">WhatsApp</dt>
              <dd>
                <a href={whatsappHref(whatsapp)} className="font-semibold underline underline-offset-4">
                  Chat on WhatsApp
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
      <section aria-labelledby="enquiry-heading" className="rounded-card border border-platinum p-6 md:p-10 lg:col-span-7">
        <h2 id="enquiry-heading" className="font-display text-2xl font-semibold">
          Send us a message
        </h2>
        <p className="mt-2 text-sm text-slate">We reply by your preferred way of contact. Your message goes only to the Raptors team.</p>
        <div className="mt-8">
          <EnquiryForm kind="enquiry" sourcePath={routes.contact} />
        </div>
      </section>
    </article>
  );
}
