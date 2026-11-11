import { requireStaff } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { staff } = await requireStaff(["administrator"]);
  return (
    <div>
      {children}
      <span className="sr-only">Signed in as {staff.name}</span>
    </div>
  );
}
