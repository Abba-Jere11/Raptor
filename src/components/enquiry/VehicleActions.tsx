"use client";

import { useState } from "react";
import { EnquiryForm } from "@/components/enquiry/EnquiryForm";
import { PillButton } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Select } from "@/components/ui/Field";
import type { PublicDestination } from "@/lib/db/types";
import { destinationPublicState } from "@/lib/quotes";

type Panel = "quote" | "information" | null;

export function VehicleActions({
  vehicleId,
  title,
  price,
  canQuote,
  destinations,
  sourcePath,
  openQuote = false,
}: {
  vehicleId: string;
  title: string;
  price: string;
  canQuote: boolean;
  destinations: PublicDestination[];
  sourcePath: string;
  openQuote?: boolean;
}) {
  const [panel, setPanel] = useState<Panel>(openQuote && canQuote ? "quote" : null);
  const [country, setCountry] = useState("");
  const [port, setPort] = useState("");
  const countries = [...new Set(destinations.map((d) => d.country))].sort();
  const ports = destinations.filter((d) => d.country === country);
  const chosen = destinations.find((d) => d.id === port);

  return (
    <>
      <div className="mt-6 border-t border-platinum pt-6">
        <p className="eyebrow">Where will you ship it?</p>
        {destinations.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Select
              aria-label="Country"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setPort("");
              }}
            >
              <option value="">Country</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select aria-label="Port" value={port} onChange={(e) => setPort(e.target.value)} disabled={!country}>
              <option value="">Port</option>
              {ports.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.port}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        <p className="mt-3 font-semibold text-charcoal" aria-live="polite">
          {chosen ? destinationPublicState(chosen.status) : "We will confirm"}
        </p>
        <p className="mt-1 text-sm text-slate">
          {chosen?.status === "not_served"
            ? "Raptors does not currently ship there. Ask us anyway and we will tell you honestly what is possible."
            : "Shipping is confirmed with you, for your port, in the quotation. Final requirements are set by your country's customs authority."}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {canQuote ? (
          <PillButton variant="primary" size="lg" className="w-full justify-between" onClick={() => setPanel("quote")}>
            Get a quote
          </PillButton>
        ) : null}
        <button
          type="button"
          onClick={() => setPanel("information")}
          className="self-start font-display text-sm font-semibold text-charcoal underline underline-offset-4 hover:text-crimson"
        >
          Not ready? Send me the details
        </button>
      </div>

      {canQuote && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-platinum bg-white lg:hidden">
          <div className="shell flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-xs text-slate">{title}</p>
              <p className="font-display text-lg font-semibold tabular">
                {price} <span className="text-xs font-medium text-slate">USD</span>
              </p>
            </div>
            <PillButton variant="primary" onClick={() => setPanel("quote")}>
              Get a quote
            </PillButton>
          </div>
        </div>
      )}

      <Drawer open={panel === "quote"} onClose={() => setPanel(null)} title="Get a quote">
        <p className="mb-6 text-sm text-slate">
          {title}. We reply with a quotation for the vehicle and shipping to your port. Saving or sending this form never commits you to anything.
        </p>
        {panel === "quote" && (
          <EnquiryForm kind="quote_request" vehicleId={vehicleId} destinations={destinations} sourcePath={sourcePath} initialDestination={port || undefined} />
        )}
      </Drawer>
      <Drawer open={panel === "information"} onClose={() => setPanel(null)} title="Send me the details">
        <p className="mb-6 text-sm text-slate">{title}. We email you the details. No pressure and no deadline.</p>
        {panel === "information" && <EnquiryForm kind="information" vehicleId={vehicleId} sourcePath={sourcePath} />}
      </Drawer>
    </>
  );
}
