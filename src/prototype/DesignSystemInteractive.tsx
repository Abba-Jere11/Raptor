"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ChoiceChips, Field, SearchBox, Select, TextInput } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/Table";
import { StatusChip } from "@/components/ui/Chip";

export function DesignSystemInteractive() {
  const [cond, setCond] = useState("Pre-owned");
  return (
    <>
      <Card className="mt-4 grid gap-5 p-6 md:grid-cols-2">
        <SearchBox label="Search make, model or VIN" placeholder="Make, model or VIN" />
        <Field label="Destination country">
          {(id) => (
            <Select id={id} defaultValue="Ghana">
              <option>Ghana</option>
              <option>Nigeria</option>
              <option>Kenya</option>
            </Select>
          )}
        </Field>
        <Field label="Full name" hint="Inputs use a silver border and a visible crimson focus ring.">
          {(id) => <TextInput id={id} placeholder="Your name" />}
        </Field>
        <ChoiceChips legend="Condition" options={["Pre-owned", "New", "Either"]} value={cond} onChange={setCond} />
      </Card>
      <Card className="mt-4 p-6">
        <Tabs
          items={[
            {
              id: "table",
              label: "Table",
              content: (
                <DataTable
                  caption="Example table"
                  rowKey={(r) => r.id}
                  rows={[
                    { id: "RA-0412", v: "2013 Ferrari 458 Spider", p: "$189,500", s: "Available" },
                    { id: "RA-0405", v: "2012 Ferrari 458 Spider", p: "$176,800", s: "Reserved" },
                  ]}
                  columns={[
                    { key: "id", header: "Stock", render: (r) => <span className="font-mono">{r.id}</span> },
                    { key: "v", header: "Vehicle", render: (r) => r.v },
                    { key: "p", header: "Price", align: "right", render: (r) => r.p },
                    { key: "s", header: "Status", render: (r) => <StatusChip status={r.s} /> },
                  ]}
                />
              ),
            },
            { id: "second", label: "Second tab", content: <p className="text-slate">Tabs use arrow keys to move.</p> },
            { id: "third", label: "Third tab", content: <p className="text-slate">Only the active tab is in the tab order.</p> },
          ]}
        />
      </Card>
    </>
  );
}
