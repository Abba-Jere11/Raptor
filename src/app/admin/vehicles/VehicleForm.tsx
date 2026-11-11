"use client";

import { useActionState, useEffect, useRef } from "react";
import { PillButton } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { addCost, createVehicle, markAvailable, submitVehicle, unsubmitVehicle, updateVehicle, withdrawVehicle, type ActionState } from "@/app/admin/actions";
import type { Vehicle, VehicleStatus } from "@/lib/db/types";

const empty = {
  vin: "",
  year: 2020,
  make: "",
  model: "",
  trim: "",
  body: "",
  fuel: "",
  transmission: "",
  drivetrain: "",
  engine: "",
  power: "",
  exterior: "",
  interior: "",
  mileage: 0,
  title_status: "pending",
  location: "",
  price_cents: 0,
  export_ready: false,
  description: null,
  features: [] as string[],
} as const;

function lockedReason(status: VehicleStatus | undefined) {
  if (status === "submitted") return "Waiting for CEO approval. The record is locked. Withdraw the submission to edit again.";
  if (status === "withdrawn") return "This vehicle was withdrawn and cannot be edited.";
  if (status === "sold") return "This vehicle is sold and cannot be edited.";
  return null;
}

export function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const action = vehicle ? updateVehicle.bind(null, vehicle.id, vehicle.status) : createVehicle;
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const v = vehicle ?? empty;
  const locked = Boolean(lockedReason(vehicle?.status));
  const lockMessage = lockedReason(vehicle?.status);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      {lockMessage && (
        <p role="status" className="rounded-panel border border-amber-border bg-amber-bg px-4 py-3 text-sm text-amber-text md:col-span-2">
          {lockMessage}
        </p>
      )}
      <Field label="VIN">
        {(id) => <TextInput id={id} name="vin" defaultValue={v.vin} required className="font-mono" maxLength={17} disabled={locked} />}
      </Field>
      <Field label="Year">{(id) => <TextInput id={id} name="year" type="number" defaultValue={v.year} required disabled={locked} />}</Field>
      <Field label="Make">{(id) => <TextInput id={id} name="make" defaultValue={v.make} required disabled={locked} />}</Field>
      <Field label="Model">{(id) => <TextInput id={id} name="model" defaultValue={v.model} required disabled={locked} />}</Field>
      <Field label="Trim">{(id) => <TextInput id={id} name="trim" defaultValue={v.trim ?? ""} disabled={locked} />}</Field>
      <Field label="Body">{(id) => <TextInput id={id} name="body" defaultValue={v.body ?? ""} disabled={locked} />}</Field>
      <Field label="Fuel">{(id) => <TextInput id={id} name="fuel" defaultValue={v.fuel ?? ""} disabled={locked} />}</Field>
      <Field label="Transmission">{(id) => <TextInput id={id} name="transmission" defaultValue={v.transmission ?? ""} disabled={locked} />}</Field>
      <Field label="Drivetrain">{(id) => <TextInput id={id} name="drivetrain" defaultValue={v.drivetrain ?? ""} disabled={locked} />}</Field>
      <Field label="Engine">{(id) => <TextInput id={id} name="engine" defaultValue={v.engine ?? ""} disabled={locked} />}</Field>
      <Field label="Power">{(id) => <TextInput id={id} name="power" defaultValue={v.power ?? ""} disabled={locked} />}</Field>
      <Field label="Exterior">{(id) => <TextInput id={id} name="exterior" defaultValue={v.exterior ?? ""} disabled={locked} />}</Field>
      <Field label="Interior">{(id) => <TextInput id={id} name="interior" defaultValue={v.interior ?? ""} disabled={locked} />}</Field>
      <Field label="Mileage">{(id) => <TextInput id={id} name="mileage" type="number" defaultValue={v.mileage} disabled={locked} />}</Field>
      <Field label="Title status">
        {(id) => (
          <Select id={id} name="title_status" defaultValue={v.title_status} disabled={locked}>
            <option value="clean">Clean</option>
            <option value="rebuilt">Rebuilt</option>
            <option value="pending">Pending</option>
          </Select>
        )}
      </Field>
      <Field label="Location">{(id) => <TextInput id={id} name="location" defaultValue={v.location ?? ""} disabled={locked} />}</Field>
      <Field label="Price (USD)">
        {(id) => <TextInput id={id} name="price" type="number" defaultValue={v.price_cents / 100} className="tabular" disabled={locked} />}
      </Field>
      <Field label="Description (shown on the vehicle page)" hint="Plain facts about this vehicle. Leave a blank line between paragraphs." className="md:col-span-2">
        {(id) => <TextArea id={id} name="description" defaultValue={v.description ?? ""} maxLength={4000} className="min-h-36" disabled={locked} />}
      </Field>
      <Field label="Features" hint="One per line, up to 40." className="md:col-span-2">
        {(id) => <TextArea id={id} name="features" defaultValue={(v.features ?? []).join("\n")} className="min-h-36" disabled={locked} />}
      </Field>
      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input type="checkbox" name="export_ready" defaultChecked={v.export_ready} className="accent-crimson" disabled={locked} />
        Export-ready (verified)
      </label>
      {vehicle && (vehicle.status === "approved" || vehicle.status === "available") && (
        <Field label="Reason for a change the CEO approves (price, VIN, year, make, model, description, features)" className="md:col-span-2">
          {(id) => <TextInput id={id} name="change_reason" placeholder="Required if those fields change" />}
        </Field>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-crimson md:col-span-2">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="text-sm text-success md:col-span-2">
          {state.ok}
        </p>
      )}
      {!locked && (
        <div className="md:col-span-2">
          <PillButton type="submit" variant="dark" disabled={pending}>
            {vehicle ? "Save" : "Create draft"}
          </PillButton>
        </div>
      )}
    </form>
  );
}

function useToastActionResult(state: ActionState) {
  const toast = useToast();
  const seen = useRef<ActionState>({});
  useEffect(() => {
    if (state.error && state.error !== seen.current.error) toast.error(state.error);
    if (state.ok && state.ok !== seen.current.ok) toast.ok(state.ok);
    seen.current = state;
  }, [state, toast]);
}

export function StatusActions({ id, status }: { id: string; status: VehicleStatus }) {
  const [submitState, submitAction, submitPending] = useActionState(submitVehicle.bind(null, id), {} as ActionState);
  const [unsubmitState, unsubmitAction, unsubmitPending] = useActionState(unsubmitVehicle.bind(null, id), {} as ActionState);
  const [availableState, availableAction, availablePending] = useActionState(markAvailable.bind(null, id), {} as ActionState);
  const [withdrawState, withdrawAction, withdrawPending] = useActionState(withdrawVehicle.bind(null, id), {} as ActionState);
  useToastActionResult(submitState);
  useToastActionResult(unsubmitState);
  useToastActionResult(availableState);
  useToastActionResult(withdrawState);
  const busy = submitPending || unsubmitPending || availablePending || withdrawPending;

  return (
    <div className="flex flex-col gap-3">
      {status === "submitted" && (
        <p role="status" className="rounded-panel border border-amber-border bg-amber-bg px-4 py-3 text-sm text-amber-text">
          Submitted to the CEO. Editing is locked until you withdraw the submission or the CEO decides.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {status === "draft" && (
          <form action={submitAction}>
            <PillButton type="submit" variant="primary" size="sm" disabled={busy}>
              {submitPending ? "Submitting…" : "Submit for CEO approval"}
            </PillButton>
          </form>
        )}
        {status === "submitted" && (
          <form action={unsubmitAction}>
            <PillButton type="submit" variant="outline" size="sm" arrow={false} disabled={busy}>
              {unsubmitPending ? "Updating…" : "Withdraw submission"}
            </PillButton>
          </form>
        )}
        {status === "approved" && (
          <form action={availableAction} className="flex flex-wrap items-center gap-2">
            <PillButton type="submit" variant="primary" size="sm" disabled={busy}>
              {availablePending ? "Publishing…" : "Mark available"}
            </PillButton>
            <p className="text-sm text-slate">CEO approved — this puts it on the public website.</p>
          </form>
        )}
        {status !== "withdrawn" && status !== "sold" && (
          <form action={withdrawAction} className="flex flex-wrap gap-2">
            <input
              name="reason"
              required
              placeholder="Reason to withdraw"
              disabled={busy}
              className="h-9 rounded-full border border-silver px-3 text-sm disabled:opacity-60"
            />
            <PillButton type="submit" variant="outline" size="sm" arrow={false} disabled={busy}>
              {withdrawPending ? "Withdrawing…" : "Withdraw vehicle"}
            </PillButton>
          </form>
        )}
      </div>
    </div>
  );
}

export function AddCostForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(addCost.bind(null, id), {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <Field label="Kind">
        {(fid) => (
          <Select id={fid} name="kind" required>
            <option value="purchase">Purchase</option>
            <option value="platform_fees">Platform fees</option>
            <option value="transport">Transport</option>
            <option value="repair">Repair</option>
            <option value="other">Other</option>
          </Select>
        )}
      </Field>
      <Field label="Amount (USD)">{(fid) => <TextInput id={fid} name="amount" type="number" required className="tabular" />}</Field>
      <Field label="Note" className="sm:col-span-2">
        {(fid) => <TextInput id={fid} name="note" />}
      </Field>
      <div className="sm:col-span-2">
        <PillButton type="submit" variant="outline" size="sm" arrow={false} disabled={pending}>
          Add cost entry
        </PillButton>
        <p className="mt-2 text-xs text-slate">You can add a cost. You cannot see existing costs, totals or margins.</p>
        {state.ok && <p className="mt-2 text-sm text-success">{state.ok}</p>}
        {state.error && <p className="mt-2 text-sm text-crimson">{state.error}</p>}
      </div>
    </form>
  );
}
