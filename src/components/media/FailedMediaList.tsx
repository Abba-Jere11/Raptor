"use client";

import Link from "next/link";
import { useState } from "react";
import { FailedMediaRow } from "./FailedMediaRow";

export function FailedMediaList({
  items,
}: {
  items: { id: string; name: string; error: string | null; href: string | null; vehicle: string | null }[];
}) {
  const [notice, setNotice] = useState<string | null>(null);
  if (items.length === 0) {
    return (
      <>
        {notice && (
          <p role="status" className="mt-2 text-sm">
            {notice}
          </p>
        )}
        <p className="mt-2 text-sm text-slate">No failed uploads.</p>
      </>
    );
  }
  return (
    <>
      {notice && (
        <p role="status" className="mt-2 text-sm">
          {notice}
        </p>
      )}
      <ul className="mt-4 flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.id} className="rounded-panel border border-platinum p-3">
            {item.href && item.vehicle && (
              <Link href={item.href} className="text-sm font-semibold underline">
                {item.vehicle}
              </Link>
            )}
            <div className="mt-2">
              <FailedMediaRow id={item.id} name={item.name} error={item.error} onDone={setNotice} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
