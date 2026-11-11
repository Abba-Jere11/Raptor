"use client";

import { useState } from "react";
import { Field, Select } from "@/components/ui/Field";
import { formatMoney } from "@/lib/format";
import { MOCK_DESTINATIONS } from "@/mock/MOCK_DATA_destinations";

/**
 * Destination estimator with its three honest states (Section 7, Journey A step 4):
 * Estimate available · We will confirm · Not currently exported there.
 * Never states duty or rules as fact; never calculates import duty.
 */
export function DestinationEstimator({ compact }: { compact?: boolean }) {
  const [country, setCountry] = useState(MOCK_DESTINATIONS[0].country);
  const dest = MOCK_DESTINATIONS.find((d) => d.country === country)!;
  const [port, setPort] = useState(dest.ports[0].port);
  const state = (dest.ports.find((p) => p.port === port) ?? dest.ports[0]).state;

  return (
    <div>
      <p className="eyebrow">Where will you ship it?</p>
      <div className={compact ? "mt-3 grid gap-3" : "mt-3 grid gap-3 sm:grid-cols-2"}>
        <Field label="Country">
          {(id) => (
            <Select
              id={id}
              value={country}
              onChange={(e) => {
                const c = e.target.value;
                setCountry(c);
                setPort(MOCK_DESTINATIONS.find((d) => d.country === c)!.ports[0].port);
              }}
            >
              {MOCK_DESTINATIONS.map((d) => (
                <option key={d.country}>{d.country}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Port">
          {(id) => (
            <Select id={id} value={port} onChange={(e) => setPort(e.target.value)}>
              {dest.ports.map((p) => (
                <option key={p.port}>{p.port}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <div className="mt-4 rounded-panel border border-platinum bg-white p-4" aria-live="polite">
        {state.kind === "estimate" && (
          <>
            <p className="font-display text-lg font-semibold tabular">
              Estimate {formatMoney(state.low)} – {formatMoney(state.high)}{" "}
              <span className="font-sans text-sm font-normal text-slate">by {state.method}</span>
            </p>
            <p className="mt-1 text-sm text-slate">
              Estimate, confirmed {state.confirmedOn}. Final requirements are set by your country&apos;s customs authority.
            </p>
          </>
        )}
        {state.kind === "confirm" && (
          <>
            <p className="font-display text-lg font-semibold">We will confirm</p>
            <p className="mt-1 text-sm text-slate">
              We confirm shipping to this port with you before quoting. Ask for a quote and we will come back with a dated
              figure.
            </p>
          </>
        )}
        {state.kind === "not-served" && (
          <>
            <p className="font-display text-lg font-semibold">Not currently exported there</p>
            <p className="mt-1 text-sm text-slate">Message us on WhatsApp and we will tell you what is possible.</p>
          </>
        )}
      </div>
    </div>
  );
}
