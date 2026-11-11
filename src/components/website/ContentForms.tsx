"use client";

import { useActionState, useState } from "react";
import {
  addPlatform,
  createFaq,
  createGuide,
  proposeDelivery,
  proposeFeatured,
  saveFaq,
  saveGuide,
  savePage,
  savePlatform,
  saveSettings,
  withdrawDelivery,
  withdrawFeatured,
  type ActionState,
} from "@/lib/content-actions";
import type { DealerPlatform, DeliveryEntry, Faq, Guide, SitePage, SiteSettings } from "@/lib/db/types";

const control = "w-full rounded-panel border border-silver bg-white px-3 py-2 text-charcoal";

function Note({ state }: { state: ActionState }) {
  if (!state.error && !state.ok) return null;
  return <p className={state.error ? "text-sm text-crimson" : "text-sm text-charcoal"}>{state.error ?? state.ok}</p>;
}

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState(saveSettings, {});
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <label className="text-sm font-semibold">
        Legal name
        <input name="legal_name" defaultValue={settings.legal_name ?? ""} className={control} />
      </label>
      <label className="text-sm font-semibold">
        Licence
        <input name="licence" defaultValue={settings.licence ?? ""} className={control} />
      </label>
      <label className="text-sm font-semibold">
        City
        <input name="city" defaultValue={settings.city ?? ""} className={control} />
      </label>
      <label className="text-sm font-semibold">
        Year started
        <input name="year_started" defaultValue={settings.year_started ?? ""} inputMode="numeric" className={control} />
      </label>
      <label className="text-sm font-semibold md:col-span-2">
        WhatsApp number
        <input name="whatsapp_e164" defaultValue={settings.whatsapp_e164 ?? ""} className={control} />
      </label>
      <div className="md:col-span-2 flex items-center gap-3">
        <button disabled={pending} className="h-10 rounded-full bg-charcoal px-4 text-sm font-semibold text-white">
          Save settings
        </button>
        <Note state={state} />
      </div>
    </form>
  );
}

export function PageForm({ page, canPublish }: { page: SitePage; canPublish: boolean }) {
  const [state, action, pending] = useActionState(savePage, {});
  const locked = page.status === "published" && !canPublish;
  return (
    <form action={action} className="flex flex-col gap-3 border-t border-platinum pt-4">
      <input type="hidden" name="id" value={page.id} />
      <p className="text-sm font-semibold text-charcoal">
        {page.slug} · {page.status}
      </p>
      <label className="text-sm font-semibold">
        Title
        <input name="title" defaultValue={page.title} readOnly={locked} className={control} />
      </label>
      <label className="text-sm font-semibold">
        Wording
        <textarea name="body" defaultValue={page.body} readOnly={locked} rows={6} className={control} />
      </label>
      <label className="text-sm font-semibold">
        Search title
        <input name="seo_title" defaultValue={page.seo_title ?? ""} className={control} />
      </label>
      <label className="text-sm font-semibold">
        Search description
        <textarea name="seo_description" defaultValue={page.seo_description ?? ""} rows={2} className={control} />
      </label>
      {canPublish && (
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="publish" defaultChecked={page.status === "published"} />
          Published
        </label>
      )}
      <div className="flex items-center gap-3">
        <button disabled={pending} className="h-10 rounded-full bg-charcoal px-4 text-sm font-semibold text-white">
          Save page
        </button>
        <Note state={state} />
      </div>
    </form>
  );
}

function GuideFields({ guide }: { guide?: Guide }) {
  return (
    <>
      {guide && <input type="hidden" name="id" value={guide.id} />}
      <label className="text-sm font-semibold">
        Address
        <input name="slug" defaultValue={guide?.slug ?? ""} className={control} />
      </label>
      <label className="text-sm font-semibold">
        Title
        <input name="title" defaultValue={guide?.title ?? ""} className={control} />
      </label>
      <label className="text-sm font-semibold">
        Topic
        <input name="topic" defaultValue={guide?.topic ?? ""} className={control} />
      </label>
      <label className="text-sm font-semibold">
        Last confirmed
        <input type="date" name="confirmed_on" defaultValue={guide?.confirmed_on ?? ""} className={control} />
      </label>
      <label className="text-sm font-semibold">
        Minutes
        <input name="minutes" defaultValue={guide?.minutes ?? ""} inputMode="numeric" className={control} />
      </label>
      <label className="text-sm font-semibold md:col-span-2">
        Excerpt
        <textarea name="excerpt" defaultValue={guide?.excerpt ?? ""} rows={2} className={control} />
      </label>
      <label className="text-sm font-semibold md:col-span-2">
        Wording
        <textarea name="body" defaultValue={guide?.body ?? ""} rows={8} className={control} />
      </label>
      <label className="text-sm font-semibold">
        Search title
        <input name="seo_title" defaultValue={guide?.seo_title ?? ""} className={control} />
      </label>
      <label className="text-sm font-semibold">
        Search description
        <textarea name="seo_description" defaultValue={guide?.seo_description ?? ""} rows={2} className={control} />
      </label>
    </>
  );
}

export function NewGuideForm() {
  const [state, action, pending] = useActionState(createGuide, {});
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <GuideFields />
      <div className="md:col-span-2 flex items-center gap-3">
        <button disabled={pending} className="h-10 rounded-full bg-charcoal px-4 text-sm font-semibold text-white">
          Save guide draft
        </button>
        <Note state={state} />
      </div>
    </form>
  );
}

export function GuideForm({ guide, canPublish }: { guide: Guide; canPublish: boolean }) {
  const [state, action, pending] = useActionState(saveGuide, {});
  return (
    <form action={action} className="grid gap-3 border-t border-platinum pt-4 md:grid-cols-2">
      <p className="text-sm font-semibold text-charcoal md:col-span-2">
        {guide.title} · {guide.status}
      </p>
      <GuideFields guide={guide} />
      {canPublish && (
        <label className="flex items-center gap-2 text-sm font-semibold md:col-span-2">
          <input type="checkbox" name="publish" defaultChecked={guide.status === "published"} />
          Published
        </label>
      )}
      <div className="md:col-span-2 flex items-center gap-3">
        <button disabled={pending} className="h-10 rounded-full bg-charcoal px-4 text-sm font-semibold text-white">
          Save guide
        </button>
        <Note state={state} />
      </div>
    </form>
  );
}

export function NewFaqForm() {
  const [state, action, pending] = useActionState(createFaq, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="text-sm font-semibold">
        Question
        <input name="question" className={control} />
      </label>
      <label className="text-sm font-semibold">
        Answer
        <textarea name="answer" rows={4} className={control} />
      </label>
      <label className="text-sm font-semibold">
        Order
        <input name="sort_order" defaultValue="0" inputMode="numeric" className={control} />
      </label>
      <div className="flex items-center gap-3">
        <button disabled={pending} className="h-10 rounded-full bg-charcoal px-4 text-sm font-semibold text-white">
          Save question draft
        </button>
        <Note state={state} />
      </div>
    </form>
  );
}

export function FaqForm({ faq, canPublish }: { faq: Faq; canPublish: boolean }) {
  const [state, action, pending] = useActionState(saveFaq, {});
  return (
    <form action={action} className="flex flex-col gap-3 border-t border-platinum pt-4">
      <input type="hidden" name="id" value={faq.id} />
      <p className="text-sm font-semibold text-charcoal">{faq.status}</p>
      <label className="text-sm font-semibold">
        Question
        <input name="question" defaultValue={faq.question} className={control} />
      </label>
      <label className="text-sm font-semibold">
        Answer
        <textarea name="answer" defaultValue={faq.answer} rows={4} className={control} />
      </label>
      <label className="text-sm font-semibold">
        Order
        <input name="sort_order" defaultValue={faq.sort_order} inputMode="numeric" className={control} />
      </label>
      {canPublish && (
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="publish" defaultChecked={faq.status === "published"} />
          Published
        </label>
      )}
      <div className="flex items-center gap-3">
        <button disabled={pending} className="h-10 rounded-full bg-charcoal px-4 text-sm font-semibold text-white">
          Save question
        </button>
        <Note state={state} />
      </div>
    </form>
  );
}

export function NewPlatformForm() {
  const [state, action, pending] = useActionState(addPlatform, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="text-sm font-semibold">
        Extra platform name
        <input name="name" className={control} />
      </label>
      <button disabled={pending} className="h-10 rounded-full bg-charcoal px-4 text-sm font-semibold text-white">
        Save draft
      </button>
      <Note state={state} />
    </form>
  );
}

export function PlatformForm({ platform }: { platform: DealerPlatform }) {
  const [state, action, pending] = useActionState(savePlatform, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-3 border-t border-platinum pt-3">
      <input type="hidden" name="id" value={platform.id} />
      <label className="text-sm font-semibold">
        Name
        <input name="name" defaultValue={platform.name} className={control} />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="publish" defaultChecked={platform.status === "published"} />
        Published
      </label>
      <button disabled={pending} className="h-10 rounded-full bg-charcoal px-4 text-sm font-semibold text-white">
        Save
      </button>
      <Note state={state} />
    </form>
  );
}

export function FeatureForm({ vehicles }: { vehicles: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(proposeFeatured, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="min-w-64 text-sm font-semibold">
        Public vehicle
        <select name="vehicle_id" className={control} defaultValue="">
          <option value="" disabled>
            Choose a vehicle
          </option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.label}
            </option>
          ))}
        </select>
      </label>
      <button disabled={pending || vehicles.length === 0} className="h-10 rounded-full bg-charcoal px-4 text-sm font-semibold text-white">
        Propose for the homepage
      </button>
      <Note state={state} />
    </form>
  );
}

export function DeliveryForm() {
  const [state, action, pending] = useActionState(proposeDelivery, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="text-sm font-semibold">
        Vehicle description
        <input name="title" className={control} />
      </label>
      <label className="text-sm font-semibold">
        Place
        <input name="place" className={control} />
      </label>
      <div className="flex items-center gap-3">
        <button disabled={pending} className="h-10 rounded-full bg-charcoal px-4 text-sm font-semibold text-white">
          Propose delivery
        </button>
        <Note state={state} />
      </div>
    </form>
  );
}

export function WithdrawButton({ id, kind }: { id: string; kind: "featured" | "delivery" }) {
  const [msg, setMsg] = useState("");
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className="h-9 rounded-full border border-silver px-3 text-sm font-semibold"
        onClick={async () => {
          const result = kind === "featured" ? await withdrawFeatured(id) : await withdrawDelivery(id);
          setMsg(result.error ?? result.ok ?? "");
        }}
      >
        Withdraw
      </button>
      {msg && <span className="text-sm text-charcoal">{msg}</span>}
    </span>
  );
}

export function ProposalList({
  featured,
  deliveries,
}: {
  featured: { id: string; status: string; label: string }[];
  deliveries: Pick<DeliveryEntry, "id" | "title" | "place" | "status">[];
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="font-display font-semibold">Featured vehicles</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {featured.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {row.label} · {row.status}
              </span>
              {(row.status === "pending" || row.status === "approved") && <WithdrawButton id={row.id} kind="featured" />}
            </li>
          ))}
          {featured.length === 0 && <li className="text-sm text-charcoal">None proposed.</li>}
        </ul>
      </div>
      <div>
        <h3 className="font-display font-semibold">Deliveries</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {deliveries.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {row.title} · {row.place} · {row.status}
              </span>
              {(row.status === "pending" || row.status === "approved") && <WithdrawButton id={row.id} kind="delivery" />}
            </li>
          ))}
          {deliveries.length === 0 && <li className="text-sm text-charcoal">None proposed.</li>}
        </ul>
      </div>
    </div>
  );
}
