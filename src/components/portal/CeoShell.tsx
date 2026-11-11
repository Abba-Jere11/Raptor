import { PortalShell } from "@/components/ui/PortalShell";
import { SignOutButton } from "@/components/portal/SignOutButton";
import type { StaffRole } from "@/lib/db/types";
import { ceoNav } from "@/lib/portals";

export function CeoShell({
  title,
  active,
  actions,
  children,
  role = "ceo",
}: {
  title: string;
  active: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  role?: StaffRole;
}) {
  return (
    <PortalShell
      portal="CEO Portal"
      sectionLabel="Owner"
      nav={ceoNav(role)}
      active={active}
      title={title}
      actions={
        <>
          {actions}
          <SignOutButton />
        </>
      }
    >
      {children}
    </PortalShell>
  );
}
