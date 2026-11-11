import { requireStaff } from "@/lib/auth";

export default async function CeoLayout({ children }: { children: React.ReactNode }) {
  const { staff } = await requireStaff(["ceo", "sales", "finance"]);
  return (
    <div>
      {children}
      <span className="sr-only">Signed in as {staff.name}</span>
    </div>
  );
}
