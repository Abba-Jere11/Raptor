"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/cn";

type Tone = "ok" | "error";
type ToastItem = { id: number; message: string; tone: Tone };

type ToastApi = {
  push: (message: string, tone?: Tone) => void;
  ok: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside ToastProvider");
  return api;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const push = useCallback((message: string, tone: Tone = "ok") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((prev) => [...prev.slice(-4), { id, message, tone }]);
    window.setTimeout(() => dismiss(id), tone === "error" ? 8000 : 4500);
  }, [dismiss]);

  const api = useMemo<ToastApi>(
    () => ({
      push,
      ok: (message) => push(message, "ok"),
      error: (message) => push(message, "error"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role={item.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex max-w-md items-start gap-3 rounded-panel border px-4 py-3 text-sm shadow-lg",
              item.tone === "error"
                ? "border-crimson bg-white text-crimson"
                : "border-success bg-success-bg text-success",
            )}
          >
            <p className="flex-1 font-medium">{item.message}</p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(item.id)}
              className="shrink-0 font-semibold underline"
            >
              Close
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
