"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { mediaFileUrl } from "@/lib/media/files";
import { FavouriteButton } from "./FavouriteButton";
import { VehiclePhoto } from "./VehiclePhoto";

export type GalleryPhoto = { id: string; alt: string; flaw: string | null };
export type GalleryFrame = { id: string; alt: string };

type Mode = "photos" | "360" | "video";

/** Swipe left or right on touch screens. Vertical scrolling is left to the browser. */
function useSwipe(onSwipe: (direction: 1 | -1) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (event: React.PointerEvent) => {
      if (event.pointerType === "mouse") return;
      start.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp: (event: React.PointerEvent) => {
      const from = start.current;
      start.current = null;
      if (!from) return;
      const dx = event.clientX - from.x;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(event.clientY - from.y)) onSwipe(dx < 0 ? 1 : -1);
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };
}

export function VehicleGallery({
  title,
  make,
  model,
  vehicleId,
  photos,
  frames,
  videoUrl,
}: {
  title: string;
  make: string;
  model: string;
  vehicleId: string;
  photos: GalleryPhoto[];
  frames: GalleryFrame[];
  videoUrl: string | null;
}) {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("photos");
  const [full, setFull] = useState(false);
  const has360 = frames.length >= 24;
  const count = photos.length;
  const current = photos[index];
  const step = (direction: 1 | -1) => {
    if (count < 2) return;
    setMode("photos");
    setIndex((value) => (value + direction + count) % count);
  };
  const swipe = useSwipe(step);

  return (
    <div className="-mx-5 md:mx-0">
      <div
        className="group relative overflow-hidden md:rounded-card"
        role="region"
        aria-roledescription="gallery"
        aria-label={`${title} photographs`}
        tabIndex={count > 1 ? 0 : undefined}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowRight") step(1);
          if (event.key === "ArrowLeft") step(-1);
        }}
      >
        <div className="relative aspect-[3/2] touch-pan-y" {...(mode === "photos" ? swipe : {})}>
          {mode === "360" && has360 ? (
            <Viewer360 frames={frames} />
          ) : mode === "video" && videoUrl ? (
            <VideoPane url={videoUrl} />
          ) : current ? (
            <Photo key={current.id} photo={current} title={title} priority={index === 0} />
          ) : (
            <VehiclePhoto mediaId={null} make={make} model={model} alt="" sizes="100vw" placeholderSize="lg" className="h-full w-full" />
          )}
        </div>

        {mode === "photos" && count > 1 && (
          <>
            <StageArrow direction={-1} onClick={() => step(-1)} />
            <StageArrow direction={1} onClick={() => step(1)} />
            <p className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-charcoal tabular md:bottom-5 md:left-5">
              {index + 1} / {count}
            </p>
          </>
        )}
        {mode === "photos" && current?.flaw && (
          <span className="absolute left-4 top-4 rounded-full bg-amber-bg px-3 py-1 text-xs font-semibold text-amber-text md:left-5 md:top-5">Flaw: {current.flaw}</span>
        )}
        <div className="absolute right-4 top-4 md:right-5 md:top-5">
          <FavouriteButton id={vehicleId} title={title} className="h-10 w-10" />
        </div>
        <div className="absolute bottom-4 right-4 flex flex-wrap justify-end gap-2 md:bottom-5 md:right-5">
          {(has360 || videoUrl) && count > 0 && (
            <ModeButton active={mode === "photos"} onClick={() => setMode("photos")}>
              Photos
            </ModeButton>
          )}
          {has360 && (
            <ModeButton active={mode === "360"} onClick={() => setMode("360")}>
              360° view
            </ModeButton>
          )}
          {videoUrl && (
            <ModeButton active={mode === "video"} onClick={() => setMode("video")}>
              Video
            </ModeButton>
          )}
          {count > 0 && mode === "photos" && <ModeButton onClick={() => setFull(true)}>Full screen</ModeButton>}
        </div>
      </div>

      {count > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto px-5 pb-1 md:px-0" aria-label="Choose a photo">
          {photos.map((photo, photoIndex) => {
            const active = photoIndex === index && mode === "photos";
            return (
              <li key={photo.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIndex(photoIndex);
                    setMode("photos");
                  }}
                  aria-label={photo.flaw ? `Flaw: ${photo.flaw}. Photo ${photoIndex + 1}: ${photo.alt}` : `Photo ${photoIndex + 1}: ${photo.alt}`}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "relative block aspect-[3/2] w-20 overflow-hidden rounded-xl transition-opacity duration-150 md:w-24",
                    active ? "ring-2 ring-charcoal ring-offset-2" : "opacity-70 hover:opacity-100",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaFileUrl(photo.id, "thumb")} alt="" loading="lazy" className="h-full w-full object-cover" />
                  {photo.flaw && (
                    <span className="absolute bottom-1 left-1 rounded-full bg-amber-bg px-1.5 text-[0.6rem] font-bold text-amber-text">Flaw</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {full && current && <Lightbox photos={photos} startIndex={index} title={title} onClose={() => setFull(false)} onIndex={setIndex} />}
    </div>
  );
}

function StageArrow({ direction, onClick }: { direction: 1 | -1; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 1 ? "Next photo" : "Previous photo"}
      className={cn(
        "absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-charcoal opacity-0 shadow-soft transition-opacity duration-150 hover:bg-platinum focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 md:flex",
        direction === 1 ? "right-5" : "left-5",
      )}
    >
      <svg viewBox="0 0 16 16" className={cn("h-4 w-4", direction === -1 && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function Photo({ photo, title, priority, whole }: { photo: GalleryPhoto; title: string; priority?: boolean; whole?: boolean }) {
  const alt = `${title}: ${photo.alt}${photo.flaw ? `. Flaw: ${photo.flaw}` : ""}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaFileUrl(photo.id, "gallery")}
      alt={alt}
      fetchPriority={priority ? "high" : "auto"}
      draggable={false}
      className={cn("fade-in h-full w-full select-none", whole ? "object-contain" : "object-cover")}
    />
  );
}

function ModeButton({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 rounded-full px-3.5 text-xs font-semibold shadow-soft transition-colors duration-150",
        active ? "bg-charcoal text-white" : "bg-white text-charcoal hover:bg-platinum",
      )}
    >
      {children}
    </button>
  );
}

function Viewer360({ frames }: { frames: GalleryFrame[] }) {
  const [frame, setFrame] = useState(0);
  const drag = useRef<number | null>(null);
  const count = frames.length;
  const current = frames[frame] ?? frames[0];
  return (
    <div
      className="relative h-full w-full cursor-grab touch-none select-none"
      onPointerDown={(event) => {
        drag.current = event.clientX;
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerLeave={() => {
        drag.current = null;
      }}
      onPointerMove={(event) => {
        if (drag.current === null) return;
        const delta = event.clientX - drag.current;
        if (Math.abs(delta) > 24) {
          setFrame((value) => (value + (delta > 0 ? -1 : 1) + count) % count);
          drag.current = event.clientX;
        }
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaFileUrl(current.id, "gallery")} alt={current.alt} className="pointer-events-none h-full w-full object-cover" />
      <div className="absolute inset-x-0 top-4 flex justify-center px-3">
        <label className="flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold shadow-soft">
          Rotate
          <input
            type="range"
            min={0}
            max={count - 1}
            value={frame}
            onChange={(event) => setFrame(Number(event.target.value))}
            className="accent-charcoal"
          />
        </label>
      </div>
    </div>
  );
}

function VideoPane({ url }: { url: string }) {
  const file = /\.(mp4|webm)(\?|$)/i.test(url);
  if (file) return <video controls src={url} className="h-full w-full bg-charcoal" aria-label="Vehicle video" />;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-charcoal px-6 text-center text-white">
      <a href={url} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-charcoal" rel="noopener noreferrer">
        Open the video
      </a>
    </div>
  );
}

function Lightbox({
  photos,
  startIndex,
  title,
  onClose,
  onIndex,
}: {
  photos: GalleryPhoto[];
  startIndex: number;
  title: string;
  onClose: () => void;
  onIndex: (index: number) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(false);
  const count = photos.length;
  const photo = photos[index];
  const step = (direction: 1 | -1) => {
    setZoom(false);
    setIndex((value) => (value + direction + count) % count);
  };
  const swipe = useSwipe(step);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  useEffect(() => {
    onIndex(index);
  }, [index, onIndex]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={`${title} gallery, full screen`}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") step(1);
        if (event.key === "ArrowLeft") step(-1);
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-white p-0 backdrop:bg-charcoal/60"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-4 md:px-8">
          <p className="min-w-0 truncate font-display font-semibold">
            {title} <span className="ml-2 text-sm font-medium text-slate tabular">{index + 1} / {count}</span>
            {photo.flaw && <span className="ml-2 rounded-full bg-amber-bg px-2 py-0.5 text-xs text-amber-text">Flaw: {photo.flaw}</span>}
          </p>
          <div className="flex shrink-0 gap-2">
            <ModeButton active={zoom} onClick={() => setZoom((value) => !value)}>
              {zoom ? "Zoom out" : "Zoom in"}
            </ModeButton>
            <ModeButton onClick={() => ref.current?.close()}>Close</ModeButton>
          </div>
        </div>
        <div className="relative flex-1 overflow-auto touch-pan-y" {...swipe}>
          <div className={cn("relative h-full min-h-[60vh] w-full px-4 md:px-20", zoom && "origin-center scale-[2]")}>
            <Photo key={photo.id} photo={photo} title={title} whole />
          </div>
          {count > 1 && (
            <>
              <LightboxArrow direction={-1} onClick={() => step(-1)} />
              <LightboxArrow direction={1} onClick={() => step(1)} />
            </>
          )}
        </div>
        {count > 1 && (
          <ul className="flex justify-center gap-1.5 py-5" aria-hidden>
            {photos.map((item, dot) => (
              <li key={item.id} className={cn("h-1.5 rounded-full transition-all duration-150", dot === index ? "w-6 bg-charcoal" : "w-1.5 bg-silver")} />
            ))}
          </ul>
        )}
      </div>
    </dialog>
  );
}

function LightboxArrow({ direction, onClick }: { direction: 1 | -1; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 1 ? "Next photo" : "Previous photo"}
      className={cn(
        "absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-charcoal shadow-soft ring-1 ring-platinum hover:bg-platinum md:flex",
        direction === 1 ? "right-6" : "left-6",
      )}
    >
      <svg viewBox="0 0 16 16" className={cn("h-4 w-4", direction === -1 && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
