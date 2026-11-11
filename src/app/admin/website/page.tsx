import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { AdminShell } from "@/components/portal/AdminShell";
import { DeliveryForm, FeatureForm, GuideForm, NewFaqForm, NewGuideForm, NewPlatformForm, PageForm, ProposalList, SettingsForm, FaqForm } from "@/components/website/ContentForms";
import { requireStaff } from "@/lib/auth";
import { vehicleTitle } from "@/lib/inventory";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Administrator · Website structure" };

export default async function WebsiteStructurePage() {
  await requireStaff(["administrator"]);
  const supabase = await createClient();
  const [settings, pages, guides, faqs, platforms, featured, deliveries, vehicles] = await Promise.all([
    supabase.from("site_settings").select("*").eq("singleton", true).single(),
    supabase.from("site_pages").select("*").order("slug"),
    supabase.from("guides").select("*").order("created_at", { ascending: false }),
    supabase.from("faqs").select("*").order("sort_order"),
    supabase.from("dealer_platforms").select("*").order("name"),
    supabase.from("featured_selections").select("*").order("created_at", { ascending: false }),
    supabase.from("delivery_entries").select("*").order("created_at", { ascending: false }),
    supabase.from("vehicles").select("id, year, make, model, trim, stock_number, status").eq("is_mock", false).in("status", ["available", "reserved", "sold"]).order("created_at", { ascending: false }),
  ]);
  const failed = [settings, pages, guides, faqs, platforms, featured, deliveries, vehicles].find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
  const names = new Map((vehicles.data ?? []).map((vehicle) => [vehicle.id, `${vehicleTitle(vehicle)} · ${vehicle.stock_number}`]));

  return (
    <AdminShell title="Website structure" active="Website structure">
      <div className="flex flex-col gap-6">
        <Card className="p-5">
          <h2 className="font-display text-xl font-semibold">Public details</h2>
          <p className="mt-1 mb-4 text-sm text-charcoal">Blank fields stay off the public site. The CEO publishes pages, guides and questions.</p>
          {settings.data && <SettingsForm settings={settings.data} />}
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-xl font-semibold">Pages</h2>
          {(pages.data ?? []).map((page) => (
            <PageForm key={page.id} page={page} canPublish={false} />
          ))}
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-xl font-semibold">Guides</h2>
          <p className="mt-1 mb-4 text-sm text-charcoal">A published guide needs a last-confirmed date. Do not state a country’s duty or documents as fact.</p>
          <NewGuideForm />
          {(guides.data ?? []).map((guide) => (
            <GuideForm key={guide.id} guide={guide} canPublish={false} />
          ))}
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-xl font-semibold">Questions</h2>
          <div className="mt-4">
            <NewFaqForm />
          </div>
          {(faqs.data ?? []).map((faq) => (
            <FaqForm key={faq.id} faq={faq} canPublish={false} />
          ))}
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-xl font-semibold">Extra dealer platforms</h2>
          <p className="mt-1 mb-4 text-sm text-charcoal">Manheim and OpenLane are already named on the homepage. Add another name only when the CEO will publish it. Copart and IAA cannot be named.</p>
          <NewPlatformForm />
          <ul className="mt-4 text-sm text-charcoal">
            {(platforms.data ?? []).map((platform) => (
              <li key={platform.id}>
                {platform.name} · {platform.status}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-xl font-semibold">Homepage proposals</h2>
          <p className="mt-1 mb-4 text-sm text-charcoal">A featured vehicle and a delivery stay off the site until the CEO approves them.</p>
          <FeatureForm vehicles={(vehicles.data ?? []).map((vehicle) => ({ id: vehicle.id, label: names.get(vehicle.id) ?? vehicle.stock_number }))} />
          <div className="mt-6">
            <DeliveryForm />
          </div>
          <div className="mt-6">
            <ProposalList
              featured={(featured.data ?? []).map((row) => ({ id: row.id, status: row.status, label: names.get(row.vehicle_id) ?? row.vehicle_id }))}
              deliveries={deliveries.data ?? []}
            />
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
