import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { CeoShell } from "@/components/portal/CeoShell";
import { FaqForm, GuideForm, PageForm, PlatformForm, ProposalList, SettingsForm } from "@/components/website/ContentForms";
import { requireStaff } from "@/lib/auth";
import { vehicleTitle } from "@/lib/inventory";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "CEO · Website content" };

export default async function WebsiteContentPage() {
  await requireStaff(["ceo"]);
  const supabase = await createClient();
  const [settings, pages, guides, faqs, platforms, featured, deliveries] = await Promise.all([
    supabase.from("site_settings").select("*").eq("singleton", true).single(),
    supabase.from("site_pages").select("*").order("slug"),
    supabase.from("guides").select("*").order("created_at", { ascending: false }),
    supabase.from("faqs").select("*").order("sort_order"),
    supabase.from("dealer_platforms").select("*").order("name"),
    supabase.from("featured_selections").select("*").order("created_at", { ascending: false }),
    supabase.from("delivery_entries").select("*").order("created_at", { ascending: false }),
  ]);
  const vehicleIds = (featured.data ?? []).map((row) => row.vehicle_id);
  const named = vehicleIds.length
    ? await supabase.from("vehicles").select("id, year, make, model, trim, stock_number").in("id", vehicleIds)
    : { data: [], error: null };
  const failed = [settings, pages, guides, faqs, platforms, featured, deliveries, named].find((result) => result.error);
  if (failed?.error || !settings.data) throw new Error(failed?.error?.message ?? "Settings are missing.");
  const names = new Map((named.data ?? []).map((vehicle) => [vehicle.id, `${vehicleTitle(vehicle)} · ${vehicle.stock_number}`]));

  return (
    <CeoShell title="Website content" active="Website content">
      <div className="flex flex-col gap-6">
        <Card className="p-5">
          <h2 className="font-display text-xl font-semibold">Public details</h2>
          <p className="mt-1 mb-4 text-sm text-charcoal">Leave a field blank and it stays off the public site. WhatsApp uses a full international number, starting with +.</p>
          <SettingsForm settings={settings.data} />
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-xl font-semibold">Pages</h2>
          <p className="mt-1 text-sm text-charcoal">Publishing makes the wording public. Clearing Published takes it off the site.</p>
          {(pages.data ?? []).map((page) => (
            <PageForm key={page.id} page={page} canPublish />
          ))}
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-xl font-semibold">Guides</h2>
          {(guides.data ?? []).map((guide) => (
            <GuideForm key={guide.id} guide={guide} canPublish />
          ))}
          {(guides.data ?? []).length === 0 && <p className="mt-3 text-sm text-charcoal">The Administrator drafts guides.</p>}
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-xl font-semibold">Questions</h2>
          {(faqs.data ?? []).map((faq) => (
            <FaqForm key={faq.id} faq={faq} canPublish />
          ))}
          {(faqs.data ?? []).length === 0 && <p className="mt-3 text-sm text-charcoal">The Administrator drafts questions.</p>}
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-xl font-semibold">Extra dealer platforms</h2>
          <p className="mt-1 mb-4 text-sm text-charcoal">Manheim and OpenLane stay on the homepage. Publish an extra name here. Copart and IAA cannot be named.</p>
          {(platforms.data ?? []).map((platform) => (
            <PlatformForm key={platform.id} platform={platform} />
          ))}
          {(platforms.data ?? []).length === 0 && <p className="text-sm text-charcoal">No extra names have been drafted.</p>}
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-xl font-semibold">Homepage proposals</h2>
          <p className="mt-1 mb-4 text-sm text-charcoal">Approve a proposal from Approvals. Withdrawing removes it from the site.</p>
          <ProposalList
            featured={(featured.data ?? []).map((row) => ({ id: row.id, status: row.status, label: names.get(row.vehicle_id) ?? row.vehicle_id }))}
            deliveries={deliveries.data ?? []}
          />
        </Card>
      </div>
    </CeoShell>
  );
}
