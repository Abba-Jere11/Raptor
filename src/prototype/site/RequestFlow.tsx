"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChoiceChips, Field, Select, TextInput } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { MOCK_DESTINATIONS } from "@/mock/MOCK_DATA_destinations";
import { MAKES } from "@/mock/MOCK_DATA_requests";
import { routes } from "@/prototype/routes";

const STEP_TITLES = ["Which make are you looking for?", "Tell us about the car", "Where is it going?", "How can we reach you?"];

/** Figures 8-9: four calm steps with a live summary. Sending a request does not promise a vehicle. */
export function RequestFlow() {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [condition, setCondition] = useState("Pre-owned");
  const [years, setYears] = useState("2020 – 2024");
  const [steering, setSteering] = useState("Left-hand drive");
  const [options, setOptions] = useState("");
  const [country, setCountry] = useState("Ghana");
  const [port, setPort] = useState("Tema");
  const [budget, setBudget] = useState("250000");
  const [when, setWhen] = useState("Within 3 months");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [via, setVia] = useState("WhatsApp");
  const [phone, setPhone] = useState("");

  const dest = MOCK_DESTINATIONS.find((d) => d.country === country)!;
  const portState = (dest.ports.find((p) => p.port === port) ?? dest.ports[0]).state;

  const go = (n: number) => {
    setStep(n);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const canContinue = [!!make, !!model, !!port, !!name && !!email][step];

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:px-6 lg:grid-cols-[1fr_340px]">
      <div>
        <ol className="flex gap-2" aria-label="Progress">
          {STEP_TITLES.map((t, i) => (
            <li key={t} className="flex-1">
              <span className={cn("block h-1.5 rounded-full", i <= step ? "bg-charcoal" : "bg-platinum")} aria-hidden />
              <span className="sr-only">
                Step {i + 1}: {t} {i < step ? "(done)" : i === step ? "(current)" : ""}
              </span>
            </li>
          ))}
        </ol>
        <p className="eyebrow mt-6">
          Step {step + 1} of 4 · Request a vehicle
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-3xl font-semibold outline-none md:text-4xl">
          {STEP_TITLES[step]}
        </h1>

        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canContinue) return;
            if (step < 3) go(step + 1);
            else router.push(routes.site.requestPage("RQ-V-0112"));
          }}
        >
          {step === 0 && (
            <>
              <p className="max-w-2xl text-slate">
                Choose any manufacturer. Not listed? Pick Other. We search our dealer network and platforms privately and
                come back to you with the vehicle and one clear quotation.
              </p>
              <fieldset className="mt-6">
                <legend className="sr-only">Make</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {MAKES.map((m) => (
                    <label
                      key={m}
                      className={cn(
                        "flex h-24 cursor-pointer items-center justify-center rounded-card border text-center font-display font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-crimson",
                        make === m ? "border-charcoal bg-charcoal text-white" : "border-platinum bg-white hover:border-charcoal",
                      )}
                    >
                      <input type="radio" name="make" value={m} checked={make === m} onChange={() => setMake(m)} className="sr-only" />
                      {m}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {step === 1 && (
            <div className="grid max-w-2xl gap-5">
              <p className="text-slate">The more you tell us, the better we match.</p>
              <Field label="Model">{(id) => <TextInput id={id} value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Ghost" required />}</Field>
              <ChoiceChips legend="Condition" options={["Pre-owned", "New", "Either"]} value={condition} onChange={setCondition} />
              <Field label="Year range">{(id) => <TextInput id={id} value={years} onChange={(e) => setYears(e.target.value)} />}</Field>
              <ChoiceChips legend="Steering" options={["Left-hand drive", "Right-hand drive"]} value={steering} onChange={setSteering} />
              <Field label="Colour and options (optional)">
                {(id) => <TextInput id={id} value={options} onChange={(e) => setOptions(e.target.value)} placeholder="Black, Starlight headliner" />}
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="grid max-w-2xl gap-5">
              <p className="text-slate">We show the shipping estimate as soon as you choose a port.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Destination country">
                  {(id) => (
                    <Select
                      id={id}
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value);
                        setPort(MOCK_DESTINATIONS.find((d) => d.country === e.target.value)!.ports[0].port);
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
              <Card tone="platinum" className="p-5" aria-live="polite">
                <p className="eyebrow !text-charcoal">Shipping estimate to {port}</p>
                {portState.kind === "estimate" ? (
                  <p className="mt-1 font-display text-2xl font-semibold tabular">
                    {formatMoney(portState.low)} – {formatMoney(portState.high)}{" "}
                    <span className="font-sans text-sm font-normal">By {portState.method} · estimate</span>
                  </p>
                ) : portState.kind === "confirm" ? (
                  <p className="mt-1 font-display text-xl font-semibold">We will confirm</p>
                ) : (
                  <p className="mt-1 font-display text-xl font-semibold">Not currently exported there</p>
                )}
              </Card>
              <Field label="Budget for the vehicle (USD)">
                {(id) => <TextInput id={id} inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))} className="tabular" />}
              </Field>
              <ChoiceChips legend="When do you need it?" options={["As soon as possible", "Within 3 months", "Flexible"]} value={when} onChange={setWhen} />
            </div>
          )}

          {step === 3 && (
            <div className="grid max-w-2xl gap-5">
              <p className="text-slate">This is how we contact you while we search.</p>
              <Field label="Full name">{(id) => <TextInput id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" required />}</Field>
              <Field label="Email">
                {(id) => <TextInput id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />}
              </Field>
              <ChoiceChips legend="Preferred way to reach you" options={["WhatsApp", "Email", "Phone call"]} value={via} onChange={setVia} />
              {via !== "Email" && (
                <Field label={via === "WhatsApp" ? "WhatsApp number" : "Phone number"}>
                  {(id) => <TextInput id={id} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233 …" autoComplete="tel" />}
                </Field>
              )}
              <p className="text-sm text-slate">
                We will email you a request number and a page to follow the search. Sending a request does not promise a
                vehicle.
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {step > 0 && (
              <PillButton variant="ghost" arrow={false} onClick={() => go(step - 1)}>
                ← Back
              </PillButton>
            )}
            <PillButton type="submit" variant={step === 3 ? "primary" : "dark"} disabled={!canContinue}>
              {step === 3 ? "Send my request" : "Continue"}
            </PillButton>
          </div>
        </form>
      </div>

      <aside aria-label="Your request" className="lg:sticky lg:top-24 lg:self-start">
        <Card className="p-6">
          <p className="eyebrow">Your request</p>
          <p className="mt-2 font-display text-xl font-semibold">{make || "Choose a make"}</p>
          <dl className="mt-3 flex flex-col gap-1.5 text-sm">
            {model && <SummaryRow k="Model" v={`${model} · ${years}`} />}
            {step >= 1 && model && <SummaryRow k="Details" v={`${steering} · ${condition.toLowerCase()}`} />}
            {step >= 2 && <SummaryRow k="Destination" v={`${port}, ${country}`} />}
            {step >= 2 && budget && <SummaryRow k="Budget" v={`Up to ${formatMoney({ cents: Number(budget) * 100, currency: "USD" })}`} />}
            {step >= 3 && <SummaryRow k="Reach you by" v={via} />}
          </dl>
          {step === 0 && <p className="mt-3 text-sm text-slate">Model, destination and contact come next.</p>}
          <p className="mt-5 flex items-center gap-2 rounded-panel bg-platinum px-3 py-2 text-sm font-semibold">
            <span aria-hidden>●</span> We search privately
          </p>
        </Card>
      </aside>
    </div>
  );
}

function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
