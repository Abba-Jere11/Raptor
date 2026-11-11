import { Wordmark } from "@/components/ui/Wordmark";

export function AuthFrame({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <Wordmark stacked />
      <h1 className="mt-8 font-display text-3xl font-semibold">{title}</h1>
      {note && <p className="mt-2 text-sm text-slate">{note}</p>}
      <div className="mt-8">{children}</div>
    </main>
  );
}
