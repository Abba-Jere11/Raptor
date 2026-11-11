import { describe, expect, it } from "vitest";
import { TEST } from "../helpers/fixtures";
import { markSold } from "../helpers/local-sql";
import { anonClient, signInAal2 } from "../helpers/supabase";

const uniqueVin = () => `ZFF67NFA2D0${String(Math.floor(100000 + Math.random() * 899999))}`;

describe("public inventory records", () => {
  it("anonymous visitors cannot read private tables, drafts, mock rows, costs, notes or file paths", async () => {
    const anon = anonClient();
    const vehicles = await anon.from("vehicles").select("id");
    expect(vehicles.error).toBeTruthy();
    const costs = await anon.from("vehicle_costs").select("amount_cents");
    expect(costs.error).toBeTruthy();
    const media = await anon.from("vehicle_media").select("original_path");
    expect(media.error).toBeTruthy();
    const notes = await anon.from("public_vehicles").select("notes");
    expect(notes.error).toBeTruthy();
    const path = await anon.from("public_vehicle_media").select("original_path");
    expect(path.error).toBeTruthy();
    const mux = await anon.from("public_vehicle_media").select("mux_playback_id");
    expect(mux.error).toBeTruthy();

    const published = await anon.from("public_vehicles").select("id, is_mock, notes");
    expect(published.error).toBeTruthy();
    const { data: rows, error: listError } = await anon.from("public_vehicles").select("id, status");
    expect(listError).toBeNull();
    const ids = (rows ?? []).map((row) => row.id);
    expect(ids).not.toContain(TEST.vehicles.available);
    expect(ids).not.toContain(TEST.vehicles.draft);
    expect(ids).not.toContain(TEST.vehicles.approved);
    expect((rows ?? []).every((row) => row.status === "available" || row.status === "reserved" || row.status === "sold")).toBe(true);
  });

  it("filters return the published row and hide a draft, a title file and a Mux id", async () => {
    const admin = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
    const ceo = await signInAal2(TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
    const make = `Public${Date.now()}`;
    const created = await admin
      .from("vehicles")
      .insert({
        vin: uniqueVin(),
        year: 2016,
        make,
        model: "Filter",
        trim: "Base",
        price_cents: 2500000,
        mileage: 4100,
        exterior: "Silver",
        body: "Coupe",
        fuel: "Gasoline",
        transmission: "Automatic",
        drivetrain: "RWD",
        title_status: "clean",
        location: "Miami, FL",
        export_ready: true,
        notes: "staff only note",
      })
      .select("id, slug, stock_number")
      .single();
    expect(created.error).toBeNull();
    const id = created.data!.id;
    expect(created.data!.slug).toBe(`2016-${make.toLowerCase()}-filter-${created.data!.stock_number.toLowerCase()}`);

    const draft = await admin
      .from("vehicles")
      .insert({ vin: uniqueVin(), year: 2017, make, model: "Draft", price_cents: 100 })
      .select("id")
      .single();

    await admin.from("vehicles").update({ status: "submitted" }).eq("id", id);
    expect((await ceo.rpc("approve_vehicle", { p_id: id })).error).toBeNull();
    expect((await admin.from("vehicles").update({ status: "available" }).eq("id", id)).error).toBeNull();

    const photo = await admin
      .from("vehicle_media")
      .insert({
        vehicle_id: id,
        kind: "photo",
        status: "ready",
        is_cover: true,
        alt_text: "front",
        flaw_label: "stone chip",
        original_path: `${id}/original.jpg`,
        rendition_path: `${id}/gallery.webp`,
        thumb_path: `${id}/thumb.webp`,
      })
      .select("id")
      .single();
    const history = await admin
      .from("vehicle_media")
      .insert({
        vehicle_id: id,
        kind: "document",
        document_kind: "history",
        visibility: "public",
        status: "ready",
        alt_text: "carfax",
        original_path: `${id}/history.pdf`,
      })
      .select("id")
      .single();
    const title = await admin
      .from("vehicle_media")
      .insert({
        vehicle_id: id,
        kind: "document",
        document_kind: "title",
        visibility: "internal",
        status: "ready",
        alt_text: "title scan",
        original_path: `${id}/title.jpg`,
      })
      .select("id")
      .single();
    const hiddenHistory = await admin
      .from("vehicle_media")
      .insert({
        vehicle_id: id,
        kind: "document",
        document_kind: "history",
        visibility: "internal",
        status: "ready",
        original_path: `${id}/private.pdf`,
      })
      .select("id")
      .single();
    const other = await admin
      .from("vehicle_media")
      .insert({
        vehicle_id: id,
        kind: "document",
        document_kind: "other",
        visibility: "public",
        status: "ready",
        original_path: `${id}/other.pdf`,
      })
      .select("id")
      .single();
    const mux = await admin
      .from("vehicle_media")
      .insert({
        vehicle_id: id,
        kind: "video",
        video_provider: "mux",
        status: "ready",
        mux_playback_id: "secret-playback",
      })
      .select("id")
      .single();
    const link = await admin
      .from("vehicle_media")
      .insert({
        vehicle_id: id,
        kind: "video",
        video_provider: "link",
        video_url: "https://example.com/watch",
        status: "ready",
      })
      .select("id")
      .single();
    const draftPhoto = await admin
      .from("vehicle_media")
      .insert({
        vehicle_id: draft.data!.id,
        kind: "photo",
        status: "ready",
        original_path: `${draft.data!.id}/a.jpg`,
        rendition_path: `${draft.data!.id}/a.webp`,
        thumb_path: `${draft.data!.id}/a-thumb.webp`,
      })
      .select("id")
      .single();

    const anon = anonClient();
    const listed = await anon.from("public_vehicles").select("*").eq("make", make).eq("model", "Filter");
    expect(listed.error).toBeNull();
    expect(listed.data).toHaveLength(1);
    expect(listed.data?.[0].id).toBe(id);
    expect(listed.data?.[0]).not.toHaveProperty("notes");
    expect(listed.data?.[0]).not.toHaveProperty("is_mock");
    const missed = await anon.from("public_vehicles").select("id").eq("make", make).eq("exterior", "Not a colour");
    expect(missed.data).toEqual([]);
    const priced = await anon.from("public_vehicles").select("id").eq("make", make).gte("price_cents", 2000000).lte("price_cents", 3000000);
    expect(priced.data?.map((row) => row.id)).toContain(id);
    const draftHidden = await anon.from("public_vehicles").select("id").eq("id", draft.data!.id);
    expect(draftHidden.data).toEqual([]);

    const visible = await anon.from("public_vehicle_media").select("*").eq("vehicle_id", id);
    const visibleIds = (visible.data ?? []).map((row) => row.id);
    expect(visibleIds).toContain(photo.data!.id);
    expect(visibleIds).toContain(history.data!.id);
    expect(visibleIds).toContain(link.data!.id);
    expect(visibleIds).not.toContain(title.data!.id);
    expect(visibleIds).not.toContain(hiddenHistory.data!.id);
    expect(visibleIds).not.toContain(other.data!.id);
    expect(visibleIds).not.toContain(mux.data!.id);
    expect(visibleIds).not.toContain(draftPhoto.data!.id);
    expect(visible.data?.find((row) => row.id === link.data!.id)).not.toHaveProperty("mux_playback_id");
    expect(visible.data?.every((row) => !("original_path" in row))).toBe(true);

    markSold(id);
    const sold = await anon.from("public_vehicles").select("status, slug").eq("id", id).single();
    expect(sold.data?.status).toBe("sold");
    expect(sold.data?.slug).toBe(created.data!.slug);
  });
});
