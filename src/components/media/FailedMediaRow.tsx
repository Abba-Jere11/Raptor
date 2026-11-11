"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { finishUpload, replaceUpload } from "@/app/admin/media/actions";
import { uploadSigned } from "./upload-client";

export function FailedMediaRow({
  id,
  name,
  error,
  onDone,
}: {
  id: string;
  name: string;
  error: string | null;
  onDone?: (message: string) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (replace: boolean) => {
    const file = inputRef.current?.files?.[0] ?? null;
    start(async () => {
      setMessage(null);
      if (replace) {
        if (!file) {
          setMessage("Choose a replacement file first.");
          return;
        }
        const ticket = await replaceUpload(id, file.type, file.name);
        if (!("token" in ticket)) {
          setMessage(ticket.error);
          return;
        }
        const uploadError = await uploadSigned(ticket.bucket, ticket.path, ticket.token, file);
        if (uploadError) {
          setMessage(uploadError);
          return;
        }
      }
      const result = await finishUpload(id);
      if (result.error) setMessage(result.error);
      else onDone?.(result.ok ?? "Done.");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="font-medium">{name}</p>
      <p className="text-sm text-crimson">{error ?? "Processing failed."}</p>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => run(false)}
          disabled={pending}
          className="h-9 rounded-full border border-silver px-3 text-sm font-semibold"
        >
          Re-process {name}
        </button>
        <input
          ref={inputRef}
          aria-label={`Replace ${name}`}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="max-w-full text-sm"
        />
        <button
          type="button"
          onClick={() => run(true)}
          disabled={pending}
          className="h-9 rounded-full bg-charcoal px-3 text-sm font-semibold text-white"
        >
          Retry {name}
        </button>
      </div>
    </div>
  );
}
