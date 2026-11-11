import { describe, expect, it } from "vitest";
import { TEST } from "../helpers/fixtures";
import { anonClient, signInAal1, signInAal2 } from "../helpers/supabase";

const uniqueVin = () =>
  `ZFF67NFA2D0${String(Math.floor(100000 + Math.random() * 899999))}`;

describe("database permissions", () => {
  it("anonymous visitors see nothing", async () => {
    const db = anonClient();
    const { data, error } = await db.from("vehicles").select("id");
    expect(data ?? []).toEqual([]);
    expect(error).toBeTruthy();
  });

  it("a signed-in user without two-step cannot read vehicles", async () => {
    const db = await signInAal1(TEST.no2fa.email, TEST.no2fa.password);
    const { data } = await db.from("vehicles").select("id");
    expect(data ?? []).toEqual([]);
  });

  it("a deactivated account cannot read vehicles", async () => {
    const db = await signInAal2(TEST.deactivated.email, TEST.deactivated.password, TEST.deactivated.totp);
    const { data } = await db.from("vehicles").select("id");
    expect(data ?? []).toEqual([]);
  });

  it("the Administrator can create, edit, submit and withdraw a draft", async () => {
    const db = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
    const { data: created, error } = await db
      .from("vehicles")
      .insert({
        vin: uniqueVin(),
        year: 2014,
        make: "Ferrari",
        model: "458 Spider",
        price_cents: 10000000,
      })
      .select("id,status")
      .single();
    expect(error).toBeNull();
    expect(created?.status).toBe("draft");

    const { error: editError } = await db.from("vehicles").update({ location: "Miami, FL" }).eq("id", created!.id);
    expect(editError).toBeNull();

    const { error: submitError } = await db.from("vehicles").update({ status: "submitted" }).eq("id", created!.id);
    expect(submitError).toBeNull();

    const { error: withdrawError } = await db.from("vehicles").update({ status: "draft" }).eq("id", created!.id);
    expect(withdrawError).toBeNull();
  });

  it("the Administrator cannot approve or mark available before approval", async () => {
    const db = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
    const { error: approve } = await db.rpc("approve_vehicle", { p_id: TEST.vehicles.submitted });
    expect(approve).toBeTruthy();
    const { error: available } = await db.from("vehicles").update({ status: "available" }).eq("id", TEST.vehicles.draft);
    expect(available).toBeTruthy();
  });

  it("the Administrator cannot read costs", async () => {
    const db = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
    const { data } = await db.from("vehicle_costs").select("id,amount_cents");
    expect(data ?? []).toEqual([]);
  });

  it("the Administrator can add a cost", async () => {
    const db = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
    const { error } = await db.from("vehicle_costs").insert({
      vehicle_id: TEST.vehicles.draft,
      kind: "repair",
      amount_cents: 50000,
      note: "MOCK DATA test",
    });
    expect(error).toBeNull();
  });

  it("Sales cannot write vehicles or read costs", async () => {
    const db = await signInAal2(TEST.sales.email, TEST.sales.password, TEST.sales.totp);
    const { data: vehicles } = await db.from("vehicles").select("id");
    expect((vehicles ?? []).length).toBeGreaterThan(0);
    const { data: updated } = await db.from("vehicles").update({ location: "X" }).eq("id", TEST.vehicles.draft).select("id");
    expect(updated ?? []).toEqual([]);
    const { data: after } = await db.from("vehicles").select("location").eq("id", TEST.vehicles.draft).single();
    expect(after?.location).not.toBe("X");
    const { data: costs } = await db.from("vehicle_costs").select("id");
    expect(costs ?? []).toEqual([]);
  });

  it("Finance can read vehicles and costs, not write vehicles", async () => {
    const db = await signInAal2(TEST.finance.email, TEST.finance.password, TEST.finance.totp);
    const { data: costs } = await db.from("vehicle_costs").select("id");
    expect((costs ?? []).length).toBeGreaterThan(0);
    const { error } = await db.from("vehicles").insert({
      vin: uniqueVin(),
      year: 2013,
      make: "Ferrari",
      model: "458",
      price_cents: 1,
    });
    expect(error).toBeTruthy();
  });

  it("only the CEO can approve; available is only from approved", async () => {
    const ceo = await signInAal2(TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
    const admin = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
    const { data: created } = await admin
      .from("vehicles")
      .insert({ vin: uniqueVin(), year: 2015, make: "Ferrari", model: "458 Spider", price_cents: 9000000 })
      .select("id")
      .single();
    await admin.from("vehicles").update({ status: "submitted" }).eq("id", created!.id);
    const { error: ceoErr } = await ceo.rpc("approve_vehicle", { p_id: created!.id });
    expect(ceoErr).toBeNull();
    const { error: availErr } = await admin.from("vehicles").update({ status: "available" }).eq("id", created!.id);
    expect(availErr).toBeNull();
  });

  it("nobody can edit or delete the audit log or a cost entry", async () => {
    const ceo = await signInAal2(TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
    const { data: logs } = await ceo.from("audit_log").select("id").limit(1);
    const { error: upd } = await ceo.from("audit_log").update({ action: "hack" } as never).eq("id", logs![0].id);
    expect(upd).toBeTruthy();
    const { error: del } = await ceo.from("audit_log").delete().eq("id", logs![0].id);
    expect(del).toBeTruthy();
    const { data: costs } = await ceo.from("vehicle_costs").select("id").limit(1);
    const { error: costUpd } = await ceo.from("vehicle_costs").update({ amount_cents: 1 }).eq("id", costs![0].id);
    expect(costUpd).toBeTruthy();
  });
});
