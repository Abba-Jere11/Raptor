"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/** Side panel built on <dialog> so focus is trapped and Escape closes it. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "right",
  footer,
  action,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: "right" | "left";
  footer?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className={cn(
        "m-0 h-dvh max-h-dvh w-full max-w-md bg-white p-0 shadow-lift backdrop:bg-charcoal/40",
        side === "right" ? "ml-auto" : "mr-auto",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-platinum px-6 py-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <div className="ml-auto mr-2">{action}</div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-platinum"
            aria-label="Close"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-platinum px-6 py-4">{footer}</div>}
      </div>
    </dialog>
  );
}
