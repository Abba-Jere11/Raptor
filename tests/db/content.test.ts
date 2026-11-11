import { describe, expect, it } from "vitest";
import { TEST } from "../helpers/fixtures";
import { localSql, markSold } from "../helpers/local-sql";
import { anonClient, signInAal2 } from "../helpers/supabase";

const uniqueVin = () => `ZFF67NFA2D0${String(Math.floor(100000 + Math.random() * 899999))}`;

async function publishVehicle(make: string, model: string) {
  const admin = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
  const ceo = await signInAal2(TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
  const created = await admin
    .from("vehicles")
    .insert({ vin: uniqueVin(), year: 2016, make, model, price_cents: 3200000, mileage: 12000, location: "Dallas, TX" })
    .select("id, slug")
    .single();
  if (created.error || !created.data) throw new Error(created.error?.message ?? "vehicle was not created");
  const id = created.data.id;
  expect((await admin.from("vehicles").update({ status: "submitted" }).eq("id", id)).error).toBeNull();
  expect((await ceo.rpc("approve_vehicle", { p_id: id })).error).toBeNull();
  expect((await admin.from("vehicles").update({ status: "available" }).eq("id", id)).error).toBeNull();
  return { admin, ceo, id, slug: created.data.slug };
}

describe("public content", () => {
  it("hides drafts, prices and personal details, and shows a feature only after the CEO approves it", async () => {
    const anon = anonClient();
    expect((await anon.from("site_pages").select("body")).error).toBeTruthy();
    expect((await anon.from("guides").select("body")).error).toBeTruthy();
    expect((await anon.from("featured_selections").select("id")).error).toBeTruthy();
    expect((await anon.from("delivery_entries").select("title")).error).toBeTruthy();
    expect((await anon.from("site_settings").select("whatsapp_e164")).error).toBeTruthy();

    const sales = await signInAal2(TEST.sales.email, TEST.sales.password, TEST.sales.totp);
    expect((await sales.from("site_pages").insert({ slug: "about", title: "Sales draft" })).error).toBeTruthy();

    const admin = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
    const ceo = await signInAal2(TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
    const about = await admin.from("site_pages").select("id").eq("slug", "about").single();
    expect((await admin.from("site_pages").update({ body: "About the company.", status: "published" }).eq("id", about.data!.id)).error).toBeTruthy();
    expect((await anon.from("public_site_pages").select("slug").eq("slug", "about")).data).toEqual([]);

    expect((await ceo.from("site_pages").update({ title: "About", body: "About the company.", status: "published" }).eq("id", about.data!.id)).error).toBeNull();
    const published = await anon.from("public_site_pages").select("slug, body").eq("slug", "about").single();
    expect(published.data?.body).toBe("About the company.");
    expect((await ceo.from("site_pages").update({ body: "", status: "draft" }).eq("id", about.data!.id)).error).toBeNull();

    const featured = await publishVehicle(`Feature${Date.now()}`, "Shown");
    const proposed = await featured.admin.rpc("propose_featured", { p_vehicle_id: featured.id });
    expect(proposed.error).toBeNull();
    expect((await anon.from("public_featured").select("vehicle_id").eq("vehicle_id", featured.id)).data).toEqual([]);
    const waiting = await featured.ceo.from("approval_requests").select("id").eq("type", "featured_selection").eq("vehicle_id", featured.id).eq("status", "pending").single();
    expect((await featured.ceo.rpc("approve_featured", { p_id: waiting.data!.id })).error).toBeNull();
    const visible = await anon.from("public_featured").select("*").eq("vehicle_id", featured.id).single();
    expect(visible.data?.slug).toBe(featured.slug);
    expect(visible.data && "price_cents" in visible.data).toBe(false);
    expect(visible.data && "vin" in visible.data).toBe(false);

    const declined = await publishVehicle(`FeatureNo${Date.now()}`, "Hidden");
    expect((await declined.admin.rpc("propose_featured", { p_vehicle_id: declined.id })).error).toBeNull();
    const declinedRequest = await declined.ceo.from("approval_requests").select("id").eq("type", "featured_selection").eq("vehicle_id", declined.id).eq("status", "pending").single();
    expect((await declined.ceo.rpc("decline_approval", { p_id: declinedRequest.data!.id, p_reason: "Not for the homepage." })).error).toBeNull();
    expect((await anon.from("public_featured").select("vehicle_id").eq("vehicle_id", declined.id)).data).toEqual([]);

    markSold(featured.id);
    const sold = await anon.from("public_sold_strip").select("*").eq("id", featured.id).single();
    expect(sold.data?.location).toBe("Dallas, TX");
    expect(sold.data && "price_cents" in sold.data).toBe(false);
    expect(sold.data && "vin" in sold.data).toBe(false);

    const deliveryTitle = `Delivery ${Date.now()}`;
    const delivery = await admin.rpc("propose_delivery", { p_title: deliveryTitle, p_place: "Tema" });
    expect(delivery.error).toBeNull();
    expect((await anon.from("public_deliveries").select("title").eq("title", deliveryTitle)).data).toEqual([]);
    const deliveryRequest = await ceo.from("approval_requests").select("id").eq("type", "delivery_entry").eq("status", "pending").order("requested_at", { ascending: false }).limit(1).single();
    expect((await ceo.rpc("approve_delivery", { p_id: deliveryRequest.data!.id })).error).toBeNull();
    const publicDelivery = await anon.from("public_deliveries").select("*").eq("title", deliveryTitle).single();
    expect(Object.keys(publicDelivery.data ?? {}).sort()).toEqual(["approved_at", "id", "place", "title"]);
    expect(publicDelivery.data && "price" in publicDelivery.data).toBe(false);

    expect((await anon.from("public_site_settings").select("whatsapp_e164").single()).data?.whatsapp_e164).toBeNull();
    expect((await ceo.from("site_settings").update({ whatsapp_e164: "+15551230000" }).eq("singleton", true)).error).toBeNull();
    expect((await anon.from("public_site_settings").select("whatsapp_e164").single()).data?.whatsapp_e164).toBe("+15551230000");
    expect((await ceo.from("site_settings").update({ whatsapp_e164: null }).eq("singleton", true)).error).toBeNull();

    expect((await admin.from("dealer_platforms").insert({ name: "Copart" })).error).toBeTruthy();
    expect((await admin.from("dealer_platforms").insert({ name: "IAA" })).error).toBeTruthy();

    const guide = await admin
      .from("guides")
      .insert({ slug: `draft-guide-${Date.now()}`, title: "Unpublished guide", body: "Not public.", confirmed_on: "2026-11-01" })
      .select("id, slug")
      .single();
    expect((await anon.from("public_guides").select("slug").eq("slug", guide.data!.slug)).data).toEqual([]);
    expect((await admin.from("guides").delete().eq("id", guide.data!.id)).error).toBeNull();

    if (publicDelivery.data?.id) expect((await ceo.rpc("withdraw_delivery", { p_id: publicDelivery.data.id })).error).toBeNull();
    localSql(`DELETE FROM vehicles WHERE id IN ('${featured.id}', '${declined.id}');`);
  });
});
