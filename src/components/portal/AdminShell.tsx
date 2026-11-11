import { PortalShell } from "@/components/ui/PortalShell";
import { SignOutButton } from "@/components/portal/SignOutButton";
import { ADMIN_NAV } from "@/lib/portals";

export function AdminShell({
  title,
  active,
  actions,
  children,
}: {
  title: string;
  active: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <PortalShell
      portal="Administrator"
      sectionLabel="Records and technical"
      nav={ADMIN_NAV}
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
