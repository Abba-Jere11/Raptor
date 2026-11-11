import type { Metadata } from "next";
import { Suspense } from "react";
import { InventoryView } from "@/prototype/site/InventoryView";

export const metadata: Metadata = { title: "Inventory (Figure 5)" };

export default function InventoryPage() {
  return (
    <Suspense>
      <InventoryView />
    </Suspense>
  );
}
