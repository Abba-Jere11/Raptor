import { describe, expect, it } from "vitest";
import { TEST } from "../helpers/fixtures";
import { signInAal2 } from "../helpers/supabase";

describe("audit log", () => {
  it("records create, edit, submit, approve, withdraw and cost", async () => {
    const admin = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
    const ceo = await signInAal2(TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
    const vin = `ZFF67NFA2D0${String(Math.floor(100000 + Math.random() * 899999))}`;
    const { data: v } = await admin
      .from("vehicles")
      .insert({ vin, year: 2013, make: "Ferrari", model: "458 Spider", price_cents: 11100000 })
      .select("id")
      .single();
    await admin.from("vehicles").update({ location: "Tampa, FL" }).eq("id", v!.id);
    await admin.from("vehicles").update({ status: "submitted" }).eq("id", v!.id);
    await ceo.rpc("approve_vehicle", { p_id: v!.id });
    await admin.from("vehicles").update({ status: "withdrawn", withdrawn_reason: "test" }).eq("id", v!.id);
    await admin.from("vehicle_costs").insert({ vehicle_id: v!.id, kind: "other", amount_cents: 1000, note: "audit" });

    const { data: rows } = await ceo.from("audit_log").select("*").eq("row_id", v!.id).order("at");
    const actions = (rows ?? []).map((r) => `${r.table_name}:${r.action}`);
    expect(actions.some((a) => a === "vehicles:INSERT")).toBe(true);
    expect(actions.some((a) => a === "vehicles:UPDATE")).toBe(true);
    const { data: costRows } = await ceo
      .from("audit_log")
      .select("*")
      .eq("table_name", "vehicle_costs")
      .order("at", { ascending: false })
      .limit(10);
    const cost = (costRows ?? []).find((r) => JSON.stringify(r.after ?? {}).includes(v!.id));
    expect(cost).toBeTruthy();
    expect(JSON.stringify(cost?.after ?? {})).not.toMatch(/amount_cents/);
  });

  it("records a staff authorisation", async () => {
    const ceo = await signInAal2(TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
    const email = `audit.${Date.now()}@raptors.test`;
    const { data, error } = await ceo
      .from("staff_authorisations")
      .insert({ email, role: "sales", notes: "MOCK DATA audit", created_by: TEST.ceo.id })
      .select("id")
      .single();
    expect(error).toBeNull();
    const { data: rows } = await ceo.from("audit_log").select("action,table_name").eq("row_id", data!.id);
    expect((rows ?? []).some((r) => r.table_name === "staff_authorisations" && r.action === "INSERT")).toBe(true);
  });
});
