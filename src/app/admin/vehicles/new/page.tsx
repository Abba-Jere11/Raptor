import type { Metadata } from "next";
import { AdminShell } from "@/components/portal/AdminShell";
import { VehicleForm } from "@/app/admin/vehicles/VehicleForm";

export const metadata: Metadata = { title: "Administrator · New vehicle" };

export default function NewVehiclePage() {
  return (
    <AdminShell title="New vehicle draft" active="Vehicle records">
      <VehicleForm />
    </AdminShell>
  );
}
