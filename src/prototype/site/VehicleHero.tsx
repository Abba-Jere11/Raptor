"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { MOCK_360_FRAMES, MOCK_GALLERY, type MockVehicle, vehicleTitle } from "@/mock/MOCK_DATA_vehicles";
import { FavouriteButton } from "./VehicleCard";

type Mode = "photos" | "360" | "video";

/**
 * Figure 6: large cut-out on soft platinum, 360° / video / full screen on the
 * image, gallery strip with flaws labelled. 360° and video controls appear only
 * when the data exists (Part 1 §4.6).
 */
export function VehicleHero({ vehicle }: { vehicle: MockVehicle }) {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("photos");
  const [full, setFull] = useState(false);
  const has360 = vehicle.frames360 >= 24;
  const current = MOCK_GALLERY[index];

  return (
    <div>
      <div className="relative overflow-hidden rounded-card bg-linear-to-b from-white to-platinum">
        <div className="relative aspect-[16/9] md:aspect-[21/9]">
          {mode === "360" ? (
            <Viewer360 />
          ) : mode === "video" ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 bg-charcoal text-white">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-charcoal" aria-hidden>
                ▶
              </span>
              <p className="text-sm">Video streams from the host chosen in Milestone 3 (prototype placeholder).</p>
            </div>
          ) : (
            <Image
              src={current.src}
              alt={`${vehicleTitle(vehicle)}: ${current.alt}${current.flaw ? `. Flaw: ${current.flaw}` : ""}`}
              fill
              priority
              sizes="100vw"
              className="object-contain p-[4%]"
            />
          )}
        </div>
        <span className="absolute bottom-3 left-3 rounded-full bg-charcoal px-2 py-0.5 text-[0.65rem] font-semibold text-white">
          STAND-IN
        </span>
        {mode === "photos" && current.flaw && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-bg px-3 py-1 text-xs font-semibold text-amber-text">
            Flaw: {current.flaw}
          </span>
        )}
        <div className="absolute bottom-3 right-3 flex flex-wrap justify-end gap-2">
          <ModeButton active={mode === "photos"} onClick={() => setMode("photos")}>
            {vehicle.photoCount} photos
          </ModeButton>
          {has360 && (
            <ModeButton active={mode === "360"} onClick={() => setMode("360")}>
              360° view
            </ModeButton>
          )}
          {vehicle.hasVideo && (
            <ModeButton active={mode === "video"} onClick={() => setMode("video")}>
              Video
            </ModeButton>
          )}
          <ModeButton onClick={() => setFull(true)}>⤢ Full screen</ModeButton>
          <FavouriteButton vehicle={vehicle} className="h-9 w-9" />
        </div>
      </div>

      <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Gallery">
        {MOCK_GALLERY.map((g, i) => (
          <li key={g.src} className="shrink-0">
            <button
              type="button"
              onClick={() => {
                setIndex(i);
                setMode("photos");
              }}
              aria-label={g.flaw ? `Flaw: ${g.flaw}. Photo ${i + 1}: ${g.alt}` : `Photo ${i + 1}: ${g.alt}`}
              aria-current={i === index && mode === "photos" ? "true" : undefined}
              className={cn(
                "relative block h-20 w-32 overflow-hidden rounded-panel border-2 bg-platinum",
                i === index && mode === "photos" ? "border-charcoal" : "border-transparent",
              )}
            >
              <Image src={g.src} alt="" fill sizes="128px" className="object-contain p-1" />
              {g.flaw && (
                <span className="absolute bottom-1 left-1 rounded-full bg-amber-bg px-1.5 text-[0.6rem] font-bold text-amber-text">
                  Flaw
                </span>
              )}
            </button>
          </li>
        ))}
        <li className="flex h-20 w-24 shrink-0 items-center justify-center rounded-panel bg-platinum text-sm font-semibold tabular">
          +{vehicle.photoCount - MOCK_GALLERY.length} photos
        </li>
      </ul>

      {full && <FullScreen startIndex={index} onClose={() => setFull(false)} title={vehicleTitle(vehicle)} />}
    </div>
  );
}

function ModeButton({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 rounded-full px-3 text-xs font-semibold shadow-soft",
        active ? "bg-charcoal text-white" : "bg-white text-charcoal hover:bg-platinum",
      )}
    >
      {children}
    </button>
  );
}

/** Lightweight image-sequence viewer: drag or use the slider / arrow keys. */
function Viewer360() {
  const [frame, setFrame] = useState(0);
  const drag = useRef<number | null>(null);
  const n = MOCK_360_FRAMES.length;
  return (
    <div
      className="relative h-full w-full cursor-grab touch-none select-none"
      onPointerDown={(e) => (drag.current = e.clientX)}
      onPointerUp={() => (drag.current = null)}
      onPointerLeave={() => (drag.current = null)}
      onPointerMove={(e) => {
        if (drag.current === null) return;
        const dx = e.clientX - drag.current;
        if (Math.abs(dx) > 40) {
          setFrame((f) => (f + (dx > 0 ? -1 : 1) + n) % n);
          drag.current = e.clientX;
        }
      }}
    >
      <Image src={MOCK_360_FRAMES[frame]} alt={`360° view, frame ${frame + 1} of ${n}`} fill sizes="100vw" className="pointer-events-none object-contain p-[4%]" />
      <div className="absolute inset-x-0 top-3 flex justify-center">
        <label className="flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold shadow-soft">
          Rotate
          <input type="range" min={0} max={n - 1} value={frame} onChange={(e) => setFrame(Number(e.target.value))} className="accent-crimson" />
        </label>
      </div>
      <p className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[0.65rem] font-semibold">
        Prototype: {n} stand-in angles simulate a 24–36 frame sequence
      </p>
    </div>
  );
}

function FullScreen({ startIndex, onClose, title }: { startIndex: number; onClose: () => void; title: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(startIndex);
  const [zoom, setZoom] = useState(false);
  const n = MOCK_GALLERY.length;
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const g = MOCK_GALLERY[i];
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={`${title} gallery, full screen`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") setI((x) => (x + 1) % n);
        if (e.key === "ArrowLeft") setI((x) => (x - 1 + n) % n);
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-white p-0 backdrop:bg-charcoal/60"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-platinum px-4 py-3">
          <p className="font-display font-semibold">
            {title} · <span className="tabular">{i + 1}</span> / {n}
            {g.flaw && <span className="ml-2 rounded-full bg-amber-bg px-2 py-0.5 text-xs text-amber-text">Flaw: {g.flaw}</span>}
          </p>
          <div className="flex gap-2">
            <ModeButton active={zoom} onClick={() => setZoom((z) => !z)}>
              {zoom ? "Zoom out" : "Zoom in"}
            </ModeButton>
            <ModeButton onClick={() => ref.current?.close()}>Close</ModeButton>
          </div>
        </div>
        <div className="relative flex-1 overflow-auto bg-linear-to-b from-white to-platinum">
          <div className={cn("relative h-full w-full transition-transform", zoom && "origin-center scale-200")}>
            <Image src={g.src} alt={g.alt} fill sizes="100vw" className="object-contain p-8" />
          </div>
        </div>
        <div className="flex justify-center gap-3 border-t border-platinum p-3">
          <ModeButton onClick={() => setI((x) => (x - 1 + n) % n)}>← Previous</ModeButton>
          <ModeButton onClick={() => setI((x) => (x + 1) % n)}>Next →</ModeButton>
        </div>
      </div>
    </dialog>
  );
}
