"use client";

import { useState, useTransition } from "react";
import { approveChange, approveDelivery, approveFeatured, approveVehicle, declineApproval } from "@/app/ceo/actions";
import { approveQuoteDiscount } from "@/app/ceo/quotes/actions";
import { useToast } from "@/components/ui/Toast";
import type { ApprovalType } from "@/lib/db/types";

export function ApprovalActions({ id, type, vehicleId }: { id: string; type: ApprovalType; vehicleId: string | null }) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  function onApprove() {
    if (pending) return;
    start(async () => {
      const r =
        type === "vehicle_change"
          ? await approveChange(id)
          : type === "featured_selection"
            ? await approveFeatured(id)
            : type === "delivery_entry"
              ? await approveDelivery(id)
              : type === "quote_discount"
                ? await approveQuoteDiscount(id)
                : type === "vehicle_publication" && vehicleId
                  ? await approveVehicle(vehicleId)
                  : { error: "This request cannot be approved here." };
      const text = r.error ?? r.ok ?? "";
      setMsg(text);
      if (r.error) toast.error(r.error);
      else if (r.ok) toast.ok(r.ok);
    });
  }

  return (
    <div className="flex flex-col gap-2 lg:w-72">
      <label className="eyebrow" htmlFor={`reason-${id}`}>
        Reason (required to decline)
      </label>
      <input
        id={`reason-${id}`}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        disabled={pending}
        className="h-10 rounded-panel border border-silver px-3 disabled:opacity-60"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          className="h-10 flex-1 rounded-full bg-charcoal px-4 text-sm font-semibold text-white disabled:opacity-45"
          onClick={onApprove}
        >
          {pending ? "Working…" : "Approve"}
        </button>
        <button
          type="button"
          disabled={pending || !reason.trim()}
          className="h-10 flex-1 rounded-full border border-silver px-4 text-sm font-semibold disabled:opacity-45"
          onClick={() => {
            if (pending) return;
            start(async () => {
              const result = await declineApproval(id, reason);
              const text = result.error ?? "Declined.";
              setMsg(text);
              if (result.error) toast.error(result.error);
              else toast.ok("Declined.");
            });
          }}
        >
          Decline
        </button>
      </div>
      {msg && <p className="text-sm text-slate">{msg}</p>}
    </div>
  );
}
