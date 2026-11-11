import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { TEST } from "../helpers/fixtures";
import { anonClient, signInAal2 } from "../helpers/supabase";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const uniqueVin = () => `ZFF67NFA2D0${String(Math.floor(100000 + Math.random() * 899999))}`;

describe("media permissions and files", () => {
  it("anonymous, Sales and Finance cannot read media", async () => {
    const anon = anonClient();
    const { data: anonRows, error: anonError } = await anon.from("vehicle_media").select("id");
    expect(anonRows ?? []).toEqual([]);
    expect(anonError).toBeTruthy();

    for (const account of [TEST.sales, TEST.finance]) {
      const db = await signInAal2(account.email, account.password, account.totp);
      const { data } = await db.from("vehicle_media").select("id");
      expect(data ?? []).toEqual([]);
    }
  });

  it("a title image cannot be saved as public", async () => {
    const admin = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
    const { error } = await admin.from("vehicle_media").insert({
      vehicle_id: TEST.vehicles.draft,
      kind: "document",
      document_kind: "title",
      visibility: "public",
      alt_text: "title",
    });
    expect(error).toBeTruthy();

    const { data: created } = await admin
      .from("vehicle_media")
      .insert({
        vehicle_id: TEST.vehicles.draft,
        kind: "document",
        document_kind: "title",
        visibility: "internal",
        alt_text: "title private",
      })
      .select("id")
      .single();
    const { error: opened } = await admin.from("vehicle_media").update({ visibility: "public" }).eq("id", created!.id);
    expect(opened).toBeTruthy();
    const { data: stored } = await admin.from("vehicle_media").select("visibility").eq("id", created!.id).single();
    expect(stored?.visibility).toBe("internal");
    await admin.from("vehicle_media").delete().eq("id", created!.id);
  });

  it("an http video link is rejected and an https link is stored", async () => {
    const admin = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
    const { error } = await admin.from("vehicle_media").insert({
      vehicle_id: TEST.vehicles.draft,
      kind: "video",
      video_provider: "link",
      video_url: "http://example.com/video",
      status: "ready",
    });
    expect(error).toBeTruthy();
    const { data, error: ok } = await admin
      .from("vehicle_media")
      .insert({
        vehicle_id: TEST.vehicles.draft,
        kind: "video",
        video_provider: "link",
        video_url: "https://example.com/video",
        status: "ready",
        alt_text: "MOCK DATA video link",
      })
      .select("id")
      .single();
    expect(ok).toBeNull();
    await admin.from("vehicle_media").delete().eq("id", data!.id);
  });

  it("records media changes in the audit log without file bytes", async () => {
    const admin = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
    const ceo = await signInAal2(TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
    const { data, error } = await admin
      .from("vehicle_media")
      .insert({
        vehicle_id: TEST.vehicles.draft,
        kind: "photo",
        alt_text: "audit photo",
        status: "pending",
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    const { data: rows } = await ceo.from("audit_log").select("action, table_name, after").eq("row_id", data!.id);
    expect(rows?.some((row) => row.table_name === "vehicle_media" && row.action === "INSERT")).toBe(true);
    const after = JSON.stringify(rows?.[0]?.after ?? {});
    expect(after).not.toMatch(/base64/i);
    expect(after.length).toBeLessThan(4000);
    await admin.from("vehicle_media").delete().eq("id", data!.id);
  });

  it("stores 36 spin frames and keeps a new order", async () => {
    const admin = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
    const { data: vehicle } = await admin
      .from("vehicles")
      .insert({ vin: uniqueVin(), year: 2014, make: "Ferrari", model: "458 Spider", price_cents: 100 })
      .select("id")
      .single();
    const ids: string[] = [];
    for (let frame = 1; frame <= 36; frame += 1) {
      const { data, error } = await admin
        .from("vehicle_media")
        .insert({
          vehicle_id: vehicle!.id,
          kind: "spin",
          frame_index: frame,
          sort_order: frame,
          status: "ready",
          alt_text: `frame-${frame}`,
        })
        .select("id")
        .single();
      expect(error).toBeNull();
      ids.push(data!.id);
    }
    const reversed = [...ids].reverse();
    const { error } = await admin.rpc("reorder_vehicle_media", {
      p_vehicle_id: vehicle!.id,
      p_kind: "spin",
      p_ids: reversed,
    });
    expect(error).toBeNull();
    const { data: frames } = await admin
      .from("vehicle_media")
      .select("id, frame_index")
      .eq("vehicle_id", vehicle!.id)
      .eq("kind", "spin")
      .order("frame_index");
    expect(frames?.map((frame) => frame.id)).toEqual(reversed);
    expect(frames?.[0]?.frame_index).toBe(1);
    expect(frames?.[35]?.frame_index).toBe(36);
  });

  it("makes the first photo the cover when the order changes", async () => {
    const admin = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
    const { data: vehicle } = await admin
      .from("vehicles")
      .insert({ vin: uniqueVin(), year: 2012, make: "Ferrari", model: "458 Spider", price_cents: 100 })
      .select("id")
      .single();
    const ids: string[] = [];
    for (let index = 1; index <= 3; index += 1) {
      const { data } = await admin
        .from("vehicle_media")
        .insert({
          vehicle_id: vehicle!.id,
          kind: "photo",
          sort_order: index,
          is_cover: index === 1,
          status: "ready",
          alt_text: `cover-${index}`,
        })
        .select("id")
        .single();
      ids.push(data!.id);
    }
    const next = [ids[2], ids[0], ids[1]];
    const { error } = await admin.rpc("reorder_vehicle_media", { p_vehicle_id: vehicle!.id, p_kind: "photo", p_ids: next });
    expect(error).toBeNull();
    const { data: photos } = await admin.from("vehicle_media").select("id, is_cover, sort_order").eq("vehicle_id", vehicle!.id).order("sort_order");
    expect(photos?.map((photo) => photo.id)).toEqual(next);
    expect(photos?.filter((photo) => photo.is_cover).map((photo) => photo.id)).toEqual([ids[2]]);
  });

  it("keeps private documents out of other roles and the public storage API", async () => {
    const admin = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
    const path = `${TEST.vehicles.draft}/${randomUUID()}/original`;
    const { error: uploadError } = await admin.storage.from("media-documents").upload(path, PNG, { contentType: "image/png" });
    expect(uploadError).toBeNull();

    const sales = await signInAal2(TEST.sales.email, TEST.sales.password, TEST.sales.totp);
    const finance = await signInAal2(TEST.finance.email, TEST.finance.password, TEST.finance.totp);
    const anon = anonClient();
    const ceo = await signInAal2(TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);

    const { data: salesFile, error: salesError } = await sales.storage.from("media-documents").download(path);
    expect(salesFile).toBeNull();
    expect(salesError).toBeTruthy();
    const { data: financeFile, error: financeError } = await finance.storage.from("media-documents").download(path);
    expect(financeFile).toBeNull();
    expect(financeError).toBeTruthy();
    const { data: anonFile, error: anonError } = await anon.storage.from("media-documents").download(path);
    expect(anonFile).toBeNull();
    expect(anonError).toBeTruthy();
    const { error: salesUpload } = await sales.storage.from("media-originals").upload(path, PNG, { contentType: "image/png" });
    expect(salesUpload).toBeTruthy();

    const { data: ceoFile, error: ceoError } = await ceo.storage.from("media-documents").download(path);
    expect(ceoError).toBeNull();
    expect(ceoFile).toBeTruthy();
    const { data: adminFile, error: adminError } = await admin.storage.from("media-documents").download(path);
    expect(adminError).toBeNull();
    expect(adminFile).toBeTruthy();

    await admin.storage.from("media-documents").remove([path]);
  });
});
