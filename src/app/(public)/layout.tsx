import { PublicFooter, PublicHeader } from "@/components/site/PublicChrome";
import { Reveal } from "@/components/site/Reveal";
import { loadChrome } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const chrome = await loadChrome();
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader nav={chrome.nav} whatsapp={chrome.whatsapp} />
      <div className="flex-1">{children}</div>
      <PublicFooter footer={chrome.footer} legalName={chrome.legalName} />
      <Reveal />
    </div>
  );
}
