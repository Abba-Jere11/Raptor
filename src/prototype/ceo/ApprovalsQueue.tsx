"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Field, TextInput } from "@/components/ui/Field";
import { MOCK_APPROVALS } from "@/mock/MOCK_DATA_orders";

type Decision = "Approved" | "Declined";

/**
 * Newly designed. Everything that needs the CEO's decision, in one queue.
 * Declining needs a reason; every decision is written to the audit log.
 */
export function ApprovalsQueue() {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const open = MOCK_APPROVALS.filter((a) => !decisions[a.id]).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate" role="status">
        {open} waiting · urgent items first · each decision is logged with your name and time
      </p>
      <ul className="flex flex-col gap-3">
        {MOCK_APPROVALS.map((a) => {
          const d = decisions[a.id];
          return (
            <li key={a.id}>
              <Card className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
                <div>
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{a.id}</span>
                    <Chip tone="outline">{a.type}</Chip>
                    {a.urgent && <Chip tone="brand">Urgent</Chip>}
                    {d && <Chip tone={d === "Approved" ? "success" : "neutral"}>{d}</Chip>}
                  </p>
                  <h2 className="mt-2 font-display text-base font-semibold">{a.summary}</h2>
                  <p className="text-sm">{a.detail}</p>
                  <p className="mt-1 text-xs text-slate">
                    Requested by {a.requestedBy} · {a.requested}
                  </p>
                </div>
                {!d ? (
                  <div className="flex flex-col gap-2 lg:w-72">
                    <Field label="Reason (required to decline)">
                      {(id) => (
                        <TextInput
                          id={id}
                          className="h-10"
                          value={reasons[a.id] ?? ""}
                          onChange={(e) => setReasons((r) => ({ ...r, [a.id]: e.target.value }))}
                        />
                      )}
                    </Field>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDecisions((x) => ({ ...x, [a.id]: "Approved" }))}
                        className="h-10 flex-1 rounded-full bg-charcoal px-4 text-sm font-semibold text-white hover:bg-black"
                      >
                        Approve <span className="sr-only">{a.id}</span>
                      </button>
                      <button
                        type="button"
                        disabled={!reasons[a.id]?.trim()}
                        onClick={() => setDecisions((x) => ({ ...x, [a.id]: "Declined" }))}
                        className="h-10 flex-1 rounded-full border border-silver px-4 text-sm font-semibold hover:border-charcoal disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Decline <span className="sr-only">{a.id}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="self-center text-sm text-slate">Logged {d === "Declined" ? `· reason: ${reasons[a.id]}` : ""}</p>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
