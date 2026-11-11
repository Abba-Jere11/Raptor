"use client";

import Image from "next/image";
import { useState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip, StatusChip } from "@/components/ui/Chip";
import { Field, SearchBox, Select, TextInput } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { MOCK_GALLERY, MOCK_VEHICLES, vehicleTitle } from "@/mock/MOCK_DATA_vehicles";

/**
 * Figure 19. "Submit, don't publish": the Administrator prepares and previews;
 * only the CEO's approval puts a listing live. Status is maintained, not decided.
 */
export function VehicleRecords() {
  const [selectedId, setSelectedId] = useState("RA-0412");
  const [checked, setChecked] = useState<string[]>([]);
  const [photos, setPhotos] = useState(MOCK_GALLERY.map((g, i) => ({ ...g, key: `p${i}` })));
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const v = MOCK_VEHICLES.find((x) => x.id === selectedId)!;

  const counts = ["Available", "Reserved", "Draft", "Awaiting CEO"].map((s) => ({
    s,
    n: MOCK_VEHICLES.filter((x) => x.status === s).length,
  }));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= photos.length) return;
    const next = [...photos];
    const [p] = next.splice(from, 1);
    next.splice(to, 0, p);
    setPhotos(next);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
      <section aria-label="Record list">
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox label="Search VIN, stock number, make" placeholder="Search VIN, stock number, make…" className="min-w-60 flex-1" />
          <PillButton variant="dark" size="sm">
            New draft
          </PillButton>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {counts.map((c) => (
            <Chip key={c.s} tone="outline">
              {c.s} · <span className="tabular">{c.n}</span>
            </Chip>
          ))}
          {checked.length > 0 && (
            <span className="ml-auto flex items-center gap-2">
              <span className="font-semibold">{checked.length} selected:</span>
              <button type="button" className="rounded-full border border-silver px-3 py-1 font-semibold hover:border-charcoal">
                Submit for approval
              </button>
              <button type="button" className="rounded-full border border-silver px-3 py-1 font-semibold hover:border-charcoal">
                Propose as featured
              </button>
            </span>
          )}
        </div>
        <div className="mt-4 overflow-x-auto rounded-panel border border-platinum bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">Vehicle records</caption>
            <thead>
              <tr className="border-b border-platinum">
                <th scope="col" className="w-10 px-3 py-3">
                  <span className="sr-only">Select</span>
                </th>
                <th scope="col" className="eyebrow px-3 py-3 text-left">Vehicle</th>
                <th scope="col" className="eyebrow px-3 py-3 text-right">Price</th>
                <th scope="col" className="eyebrow px-3 py-3 text-left">Location</th>
                <th scope="col" className="eyebrow px-3 py-3 text-left">Status</th>
                <th scope="col" className="eyebrow px-3 py-3 text-left">Media</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_VEHICLES.map((x) => (
                <tr key={x.id} className={cn("border-b border-platinum last:border-0", x.id === selectedId && "bg-platinum/60")}>
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${x.id}`}
                      checked={checked.includes(x.id)}
                      onChange={(e) => setChecked((c) => (e.target.checked ? [...c, x.id] : c.filter((y) => y !== x.id)))}
                      className="h-4 w-4 accent-crimson"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <button type="button" onClick={() => { setSelectedId(x.id); setSubmitted(false); }} className="text-left hover:underline">
                      <span className="block font-medium">{vehicleTitle(x)}</span>
                      <span className="font-mono text-xs">{x.id}</span>
                    </button>
                  </td>
                  <td className="px-3 py-3 text-right tabular">{formatMoney(x.price)}</td>
                  <td className="px-3 py-3">{x.location}</td>
                  <td className="px-3 py-3">
                    <StatusChip status={x.status} />
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <span className={x.photoCount < 10 ? "font-semibold text-crimson" : ""}>{x.photoCount}</span>
                    {x.frames360 >= 24 && " · 360"}
                    {x.hasVideo && " · video"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Card as="section" aria-label={`Edit ${v.id}`} className="p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="eyebrow">{v.id} · Edit</p>
            <h2 className="font-display text-xl font-semibold">{vehicleTitle(v)}</h2>
          </div>
          <StatusChip status={submitted ? "Awaiting CEO" : v.status} />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="VIN">{(id) => <TextInput id={id} defaultValue={v.vin} className="font-mono" key={v.id + "vin"} />}</Field>
          <Field label="Title status">
            {(id) => (
              <Select id={id} defaultValue={v.titleStatus} key={v.id + "t"}>
                <option>Clean</option>
                <option>Rebuilt</option>
                <option>Pending</option>
              </Select>
            )}
          </Field>
          <Field label="Price (USD)">{(id) => <TextInput id={id} defaultValue={v.price.cents / 100} className="tabular" inputMode="numeric" key={v.id + "p"} />}</Field>
          <Field label="Mileage">{(id) => <TextInput id={id} defaultValue={v.mileage} className="tabular" inputMode="numeric" key={v.id + "m"} />}</Field>
          <Field label="Location">{(id) => <TextInput id={id} defaultValue={v.location} key={v.id + "l"} />}</Field>
          <Field label="Status (maintained, not decided)">
            {(id) => (
              <Select id={id} defaultValue={v.status} key={v.id + "s"}>
                <option>Draft</option>
                <option>Withdrawn</option>
                <option disabled>Available (CEO approval)</option>
              </Select>
            )}
          </Field>
        </div>

        <div className="mt-6">
          <p className="eyebrow">Photos · drag to reorder · tag flaws</p>
          <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Photo order">
            {photos.map((p, i) => (
              <li
                key={p.key}
                draggable
                onDragStart={() => setDragKey(p.key)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  const from = photos.findIndex((x) => x.key === dragKey);
                  move(from, i);
                }}
                className="group relative aspect-[4/3] cursor-grab overflow-hidden rounded-panel border border-platinum bg-platinum"
              >
                <Image src={p.src} alt={p.alt} fill sizes="120px" className="object-contain p-1" />
                {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-charcoal px-1.5 text-[0.6rem] font-bold text-white">Cover</span>}
                {p.flaw && <span className="absolute bottom-1 left-1 rounded-full bg-amber-bg px-1.5 text-[0.6rem] font-bold text-amber-text">Flaw</span>}
                <span className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                  <button type="button" onClick={() => move(i, i - 1)} className="h-6 w-6 rounded-full bg-white text-xs shadow-soft" aria-label={`Move ${p.alt} earlier`}>
                    ←
                  </button>
                  <button type="button" onClick={() => move(i, i + 1)} className="h-6 w-6 rounded-full bg-white text-xs shadow-soft" aria-label={`Move ${p.alt} later`}>
                    →
                  </button>
                </span>
              </li>
            ))}
            <li className="flex aspect-[4/3] items-center justify-center rounded-panel border-2 border-dashed border-silver text-sm font-semibold">
              + Drop
            </li>
          </ul>
        </div>

        <div className="mt-5 rounded-panel bg-platinum/60 p-3 text-sm">
          <p className="font-semibold">360° sequence · {v.frames360} of 36 frames</p>
          <p className="text-xs">The 360° tab shows on the public page only with 24 or more frames.</p>
        </div>

        <div className="mt-5">
          <p className="eyebrow">Documents</p>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            <li><Chip tone="outline">History report · public</Chip></li>
            <li><Chip tone="outline">Inspection · public</Chip></li>
            <li><Chip tone="neutral">Title copy · internal</Chip></li>
          </ul>
        </div>

        <p className="mt-6 text-sm text-slate">Draft → Submitted → Approved by CEO → Live</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <PillButton variant="outline" size="sm">
            Preview public page
          </PillButton>
          <PillButton variant="primary" size="sm" onClick={() => setSubmitted(true)} disabled={submitted}>
            {submitted ? "Submitted to CEO" : "Submit for CEO approval"}
          </PillButton>
        </div>
        {submitted && (
          <p role="status" className="mt-3 rounded-panel bg-success-bg p-3 text-sm text-success">
            Submitted. The CEO sees this in Approvals. Nothing is published until the CEO approves.
          </p>
        )}
      </Card>
    </div>
  );
}
