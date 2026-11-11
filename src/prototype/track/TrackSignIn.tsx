"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, TextInput } from "@/components/ui/Field";
import { Wordmark } from "@/components/ui/Wordmark";
import { routes } from "@/prototype/routes";

const MAX_ATTEMPTS = 5;
/** Prototype only. The real check compares a hash on the server (Milestone 7B). */
const DEMO = { vinEnding: "189186", buyerId: "RAG-7K4Q-92XM-H6TD" };

/**
 * VIN + Buyer ID sign-in. Errors never say which field was wrong; repeated
 * failures pause the page and alert the CEO (Part 1 §4.8).
 */
export function TrackSignIn() {
  const router = useRouter();
  const [vin, setVin] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState(false);
  const paused = attempts >= MAX_ATTEMPTS;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14">
      <Wordmark subtitle="Journey Tracker" />
      <Card className="mt-8 w-full p-6 md:p-8">
        <h1 className="text-2xl font-semibold">Follow your vehicle</h1>
        <p className="mt-2 text-sm text-slate">Sign in with the VIN and the Buyer ID from your order confirmation email.</p>
        {paused ? (
          <div role="alert" className="mt-6 rounded-panel border border-amber-border bg-amber-bg p-4 text-sm text-amber-text">
            <p className="font-semibold">Sign-in is paused for this page.</p>
            <p className="mt-1">
              For your security we have paused sign-in after several attempts and let your Raptors representative know. Please
              try again later or contact us on WhatsApp.
            </p>
          </div>
        ) : (
          <form
            className="mt-6 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const ok =
                vin.trim().toUpperCase().endsWith(DEMO.vinEnding) && buyerId.trim().toUpperCase() === DEMO.buyerId;
              if (ok) router.push(routes.track.journey);
              else {
                setAttempts((a) => a + 1);
                setError(true);
              }
            }}
          >
            <Field label="VIN">
              {(id) => (
                <TextInput
                  id={id}
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  className="font-mono uppercase"
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
              )}
            </Field>
            <Field label="Buyer ID">
              {(id) => (
                <TextInput
                  id={id}
                  value={buyerId}
                  onChange={(e) => setBuyerId(e.target.value)}
                  className="font-mono uppercase"
                  placeholder="RAG-XXXX-XXXX-XXXX"
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
              )}
            </Field>
            {error && (
              <p role="alert" className="rounded-panel bg-platinum p-3 text-sm">
                We could not find a vehicle with those details. Check both and try again.
              </p>
            )}
            <PillButton type="submit" variant="dark" className="justify-between">
              Open my tracker
            </PillButton>
          </form>
        )}
        <p className="mt-6 text-xs text-slate">
          Prototype: use VIN ending <span className="font-mono">{DEMO.vinEnding}</span> and Buyer ID{" "}
          <span className="font-mono">{DEMO.buyerId}</span>. After {MAX_ATTEMPTS} wrong attempts the page pauses.
        </p>
      </Card>
    </div>
  );
}
