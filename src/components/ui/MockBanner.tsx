import Link from "next/link";

/** Every prototype page carries this label (Part 1 §1.5: MOCK DATA must be visible). */
export function MockBanner() {
  return (
    <div role="note" className="no-print relative z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-charcoal px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-white">
      <span>PROTOTYPE · MOCK DATA FOR DESIGN ONLY · STAND-IN IMAGERY · PLACEHOLDERS IN [BRACKETS]</span>
      <Link href="/prototype" className="underline underline-offset-2">
        All screens
      </Link>
    </div>
  );
}
