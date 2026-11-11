"use client";

import { useActionState, useState, useTransition } from "react";
import { PillButton } from "@/components/ui/Button";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import type { ActionState } from "@/app/ceo/actions";
import { approveTemplate, saveTemplateDraft, testSendTemplate } from "@/app/ceo/templates/actions";
import type { EmailTemplate } from "@/lib/db/types";
import { SAMPLE_VALUES, renderEmail } from "@/lib/email/render";

function Message({ state }: { state: ActionState }) {
  if (state.error) return <p className="text-sm text-crimson" role="alert">{state.error}</p>;
  if (state.ok) return <p className="text-sm text-success" role="status">{state.ok}</p>;
  return null;
}

export function TemplateEditor({
  template,
  fields,
  siteUrl,
  canEdit,
}: {
  template: EmailTemplate;
  fields: string[];
  siteUrl: string;
  canEdit: boolean;
}) {
  const [draft, setDraft] = useState({
    subject: template.subject,
    eyebrow: template.eyebrow ?? "",
    heading: template.heading,
    body: template.body,
    button_label: template.button_label ?? "",
  });
  const [state, action, pending] = useActionState(saveTemplateDraft.bind(null, template.key), {});
  const [busy, start] = useTransition();
  const [other, setOther] = useState<ActionState>({});
  const dirty =
    draft.subject !== template.subject ||
    draft.eyebrow !== (template.eyebrow ?? "") ||
    draft.heading !== template.heading ||
    draft.body !== template.body ||
    draft.button_label !== (template.button_label ?? "");

  const preview = renderEmail(
    { ...template, ...draft, eyebrow: draft.eyebrow || null, button_label: draft.button_label || null },
    SAMPLE_VALUES,
    { siteUrl, buttonUrl: draft.button_label ? siteUrl : null, footer: "Raptors Auto Group · Footer filled in from Website settings when sent." },
  );
  const set = (name: keyof typeof draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [name]: e.target.value }));

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <form action={action} className="grid content-start gap-4">
        <Field label="Subject">{(id) => <TextInput id={id} name="subject" value={draft.subject} onChange={set("subject")} readOnly={!canEdit} maxLength={150} />}</Field>
        <Field label="Small label above the heading (optional)">
          {(id) => <TextInput id={id} name="eyebrow" value={draft.eyebrow} onChange={set("eyebrow")} readOnly={!canEdit} maxLength={60} />}
        </Field>
        <Field label="Heading">{(id) => <TextInput id={id} name="heading" value={draft.heading} onChange={set("heading")} readOnly={!canEdit} maxLength={150} />}</Field>
        <Field label="Message" hint="Leave a blank line between paragraphs.">
          {(id) => <TextArea id={id} name="body" value={draft.body} onChange={set("body")} readOnly={!canEdit} maxLength={5000} className="min-h-64" />}
        </Field>
        <Field label="Button label (optional)">
          {(id) => <TextInput id={id} name="button_label" value={draft.button_label} onChange={set("button_label")} readOnly={!canEdit} maxLength={40} />}
        </Field>
        <div className="rounded-panel bg-platinum p-4 text-sm">
          <p className="font-semibold">Fields you can use</p>
          <p className="mt-1 font-mono text-xs leading-6">{fields.map((f) => `{{${f}}}`).join("  ")}</p>
          {preview.missing.length > 0 && <p className="mt-2 text-crimson">Unknown fields: {preview.missing.join(", ")}. They will show empty.</p>}
        </div>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-3">
            <PillButton type="submit" variant="dark" disabled={pending || !dirty}>
              {template.status === "approved" ? "Save as new draft version" : "Save draft"}
            </PillButton>
            {template.status === "draft" && (
              <PillButton
                variant="primary"
                disabled={busy || dirty}
                onClick={() => start(async () => setOther(await approveTemplate(template.key, template.id)))}
              >
                Approve version {template.version}
              </PillButton>
            )}
            <PillButton
              variant="outline"
              disabled={busy || dirty}
              onClick={() => start(async () => setOther(await testSendTemplate(template.key, template.id)))}
            >
              Send me a test
            </PillButton>
          </div>
        )}
        {canEdit && dirty && <p className="text-sm text-slate">Save your changes before you approve or send a test.</p>}
        <Message state={other.error || other.ok ? other : state} />
      </form>
      <div className="grid content-start gap-2">
        <p className="text-sm text-slate">
          Preview with sample values · Subject: <span className="font-medium text-charcoal">{preview.subject}</span>
        </p>
        <iframe title="Email preview" srcDoc={preview.html} sandbox="" className="h-[680px] w-full rounded-panel border border-platinum bg-white" />
      </div>
    </div>
  );
}
