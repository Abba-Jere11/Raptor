"use client";

import { useState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip, StatusChip } from "@/components/ui/Chip";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { type Access, MOCK_STAFF, PERMISSION_AREAS, type Role } from "@/mock/MOCK_DATA_staff";

const ROLES: Role[] = ["CEO", "Administrator", "Sales", "Finance"];

const accessTone: Record<Access, "success" | "neutral" | "outline" | "warning"> = {
  Full: "success",
  Manage: "success",
  Prepare: "warning",
  Record: "warning",
  View: "outline",
  None: "neutral",
};

/**
 * Newly designed. The Administrator creates accounts only when the CEO has
 * authorised them and assigns the role the CEO decided. Roles with finance or
 * approval powers need CEO approval. Two-step verification is mandatory.
 */
export function StaffAccounts() {
  const [auth, setAuth] = useState("");
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section aria-label="Staff accounts" className="overflow-x-auto rounded-panel border border-platinum bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">Staff accounts</caption>
            <thead>
              <tr className="border-b border-platinum">
                {["Name", "Role", "Status", "Two-step", "Last sign-in", "Authorised by", "Actions"].map((h) => (
                  <th key={h} scope="col" className="eyebrow px-3 py-3 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_STAFF.map((s) => (
                <tr key={s.id} className="border-b border-platinum last:border-0">
                  <td className="px-3 py-3">
                    <span className="block font-medium">{s.name}</span>
                    <span className="text-xs text-slate">{s.email}</span>
                  </td>
                  <td className="px-3 py-3">{s.role}</td>
                  <td className="px-3 py-3">
                    <StatusChip status={s.status} />
                  </td>
                  <td className="px-3 py-3">{s.twoStep ? "On" : <span className="font-semibold text-crimson">Not set up</span>}</td>
                  <td className="px-3 py-3">{s.lastSignIn}</td>
                  <td className="px-3 py-3 text-xs">{s.authorisedBy}</td>
                  <td className="px-3 py-3">
                    {s.role !== "CEO" && s.status !== "Deactivated" && (
                      <div className="flex flex-wrap gap-1">
                        {["Deactivate", "Force sign-out", "Reset two-step"].map((a) => (
                          <button key={a} type="button" className="rounded-full border border-silver px-2 py-1 text-xs font-semibold hover:border-charcoal">
                            {a} <span className="sr-only">{s.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <Card as="section" aria-label="Create an account" className="p-5 md:p-6">
          <h2 className="font-display text-lg font-semibold">Create an account</h2>
          <p className="mt-1 text-sm text-slate">Only with a CEO authorisation. The CEO decides the role.</p>
          <form className="mt-4 grid gap-4" onSubmit={(e) => e.preventDefault()}>
            <Field label="CEO authorisation">
              {(id) => (
                <Select id={id} value={auth} onChange={(e) => setAuth(e.target.value)} required>
                  <option value="">Choose an authorisation…</option>
                  <option value="AP-309">AP-309 · Finance 01 · Finance role</option>
                </Select>
              )}
            </Field>
            <Field label="Name">{(id) => <TextInput id={id} defaultValue={auth ? "Finance 01" : ""} key={auth + "n"} />}</Field>
            <Field label="Work email">{(id) => <TextInput id={id} type="email" defaultValue={auth ? "finance@[domain]" : ""} key={auth + "e"} />}</Field>
            <Field label="Role (set by the CEO's authorisation)">
              {(id) => <TextInput id={id} value={auth ? "Finance" : ""} readOnly placeholder="From authorisation" />}
            </Field>
            <p className="rounded-panel bg-platinum p-3 text-sm">
              Two-step verification is mandatory. The new user sets it up at first sign-in before they can see anything.
            </p>
            <PillButton type="submit" variant="dark" disabled={!auth}>
              Create account
            </PillButton>
          </form>
        </Card>
      </div>

      <section id="permissions" aria-labelledby="perm-title">
        <h2 id="perm-title" className="font-display text-lg font-semibold">
          Roles and permissions
        </h2>
        <p className="text-sm text-slate">
          Enforced in the database, not only hidden in menus. Every change is logged. Sales and Finance exist only if the
          CEO authorises them.
        </p>
        <div tabIndex={0} role="region" aria-label="Permission matrix, scrolls sideways" className="mt-4 overflow-x-auto rounded-panel border border-platinum bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">Permission matrix</caption>
            <thead>
              <tr className="border-b border-platinum">
                <th scope="col" className="eyebrow px-3 py-3 text-left">Area</th>
                {ROLES.map((r) => (
                  <th key={r} scope="col" className="eyebrow px-3 py-3 text-left">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_AREAS.map((p) => (
                <tr key={p.area} className="border-b border-platinum last:border-0">
                  <th scope="row" className="px-3 py-2.5 text-left font-medium">
                    {p.area}
                  </th>
                  {ROLES.map((r) => (
                    <td key={r} className="px-3 py-2.5">
                      <Chip tone={accessTone[p.access[r]]}>{p.access[r]}</Chip>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
