import { StandInCredit } from "@/components/ui/VehicleImage";
import { FloatingActions, SiteFooter, SiteHeader } from "@/prototype/site/SiteChrome";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <div className="mx-auto max-w-7xl px-4 pb-24 md:px-6">
        <StandInCredit />
      </div>
      <FloatingActions />
    </>
  );
}
