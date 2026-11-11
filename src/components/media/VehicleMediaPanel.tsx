"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addVideoLink,
  beginVideoUpload,
  finishUpload,
  markVideoUploaded,
  prepareUpload,
  refreshVehicleMedia,
  removeMedia,
  reorderMedia,
  reprocessMedia,
  saveFlaw,
  saveVisibility,
  setCoverPhoto,
} from "@/app/admin/media/actions";
import { Chip } from "@/components/ui/Chip";
import { useToast } from "@/components/ui/Toast";
import { friendlyMediaError } from "@/lib/media/errors";
import { mediaFileUrl } from "@/lib/media/files";
import type { DocumentKind, MediaVisibility, VehicleMedia } from "@/lib/db/types";
import { uploadSigned } from "./upload-client";

const DOCUMENT_LABEL: Record<DocumentKind, string> = {
  history: "History report",
  inspection: "Inspection",
  title: "Title image",
  other: "Other",
};

function byOrder(a: VehicleMedia, b: VehicleMedia) {
  return a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at);
}

export function VehicleMediaPanel({
  vehicleId,
  media,
  muxReady,
  locked = false,
}: {
  vehicleId: string;
  media: VehicleMedia[];
  muxReady: boolean;
  locked?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const busy = pending || locked;
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [docKind, setDocKind] = useState<DocumentKind>("history");
  const [docVisibility, setDocVisibility] = useState<MediaVisibility>("public");
  const [videoUrl, setVideoUrl] = useState("");
  const photos = media.filter((item) => item.kind === "photo").sort(byOrder);
  const spins = media.filter((item) => item.kind === "spin").sort(byOrder);
  const documents = media.filter((item) => item.kind === "document");
  const videos = media.filter((item) => item.kind === "video");
  const readyPhotos = photos.filter((item) => item.status === "ready");
  const preview = readyPhotos.find((item) => item.is_cover) ?? readyPhotos[0] ?? null;
  const [previewId, setPreviewId] = useState<string | null>(null);
  const shown = readyPhotos.find((item) => item.id === previewId) ?? preview;
  const readySpins = spins.filter((item) => item.status === "ready").length;

  const refresh = () => router.refresh();

  const uploadMany = (files: File[], kind: "photo" | "spin" | "document") => {
    if (!files.length || locked) return;
    start(async () => {
      setError(null);
      let ok = 0;
      const failures: string[] = [];
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        setStatus(`Uploading ${i + 1} of ${files.length}…`);
        try {
          const ticket = await prepareUpload({
            vehicleId,
            kind,
            mime: file.type,
            fileName: file.name,
            documentKind: kind === "document" ? docKind : undefined,
            visibility: kind === "document" ? (docKind === "title" ? "internal" : docVisibility) : undefined,
          });
          if (!("token" in ticket)) {
            failures.push(`${file.name}: ${friendlyMediaError(ticket.error)}`);
            continue;
          }
          const uploadError = await uploadSigned(ticket.bucket, ticket.path, ticket.token, file);
          if (uploadError) {
            failures.push(`${file.name}: ${friendlyMediaError(uploadError)}`);
            continue;
          }
          const done = await finishUpload(ticket.id, { refresh: false });
          if (done.error) failures.push(`${file.name}: ${friendlyMediaError(done.error)}`);
          else ok += 1;
        } catch (err) {
          const raw = err instanceof Error ? err.message : "Upload failed.";
          failures.push(`${file.name}: ${friendlyMediaError(raw)}`);
        }
      }
      const noun = kind === "spin" ? "frames" : kind === "document" ? "documents" : "photos";
      await refreshVehicleMedia(vehicleId);
      refresh();
      if (ok && !failures.length) {
        const message = `${ok} ${noun} ready`;
        setStatus(message);
        toast.ok(message);
      } else if (ok && failures.length) {
        const message = `${ok} ready, ${failures.length} failed`;
        setStatus(message);
        setError(failures.slice(0, 5).join(" · "));
        toast.error(message);
      } else {
        const message = failures[0] ?? `No ${noun} could be uploaded.`;
        setStatus(null);
        setError(failures.slice(0, 5).join(" · ") || message);
        toast.error(message);
      }
    });
  };

  const move = (items: VehicleMedia[], index: number, direction: number, kind: "photo" | "spin") => {
    const next = index + direction;
    if (next < 0 || next >= items.length) return;
    const ids = items.map((item) => item.id);
    const [picked] = ids.splice(index, 1);
    ids.splice(next, 0, picked);
    start(async () => {
      const result = await reorderMedia(vehicleId, kind, ids);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result.ok) toast.ok(result.ok);
      refresh();
    });
  };

  const chooseCover = (photoId: string) => {
    if (locked) return;
    start(async () => {
      setError(null);
      const result = await setCoverPhoto(vehicleId, photoId);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.ok(result.ok ?? "Cover photo updated.");
        setPreviewId(photoId);
      }
      refresh();
    });
  };

  const deleteMedia = (id: string, label: string) => {
    if (locked) return;
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    start(async () => {
      setError(null);
      const result = await removeMedia(id);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.ok(result.ok ?? "Removed.");
        if (previewId === id) setPreviewId(null);
      }
      refresh();
    });
  };

  return (
    <div className="mt-6 flex flex-col gap-6">
      {locked && (
        <p role="status" className="rounded-panel border border-amber-border bg-amber-bg px-4 py-3 text-sm text-amber-text">
          Photos and files are locked while this vehicle is with the CEO or closed.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-panel bg-white p-3 text-sm text-crimson">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="text-sm text-slate">
          {status}
        </p>
      )}

      <section aria-label="Photos" className="rounded-card border border-platinum bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Photos</h2>
            <p className="text-sm text-slate">
              Choose any ready photo as the cover. Delete failed or unwanted shots. Originals stay private until the vehicle is available.
            </p>
          </div>
          <input
            aria-label="Add photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            onChange={(event) => {
              uploadMany(Array.from(event.target.files ?? []), "photo");
              event.target.value = "";
            }}
            className="max-w-full text-sm"
          />
        </div>
        {shown && (
          // The preview is a private file. A plain image sends the staff session cookie; next/image would not.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaFileUrl(shown.id, "gallery")}
            alt={`${shown.alt_text ?? "Photo"}, large preview`}
            className="mt-4 aspect-[16/9] w-full rounded-panel bg-platinum object-contain"
          />
        )}
        <ul aria-label="Photo order" className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
          {photos.map((photo, index) => {
            const name = photo.alt_text ?? `Photo ${index + 1}`;
            const ready = photo.status === "ready" && Boolean(photo.thumb_path);
            const isCover = photo.is_cover;
            return (
              <li
                key={photo.id}
                className={`flex min-w-0 flex-col gap-2 rounded-panel border p-2 ${isCover ? "border-charcoal" : "border-platinum"}`}
              >
                {ready ? (
                  <button type="button" onClick={() => setPreviewId(photo.id)} className="block w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaFileUrl(photo.id, "thumb")} alt={name} className="aspect-[4/3] w-full rounded-panel bg-platinum object-contain" />
                  </button>
                ) : (
                  <p className="flex aspect-[4/3] items-center justify-center rounded-panel bg-platinum px-2 text-center text-sm text-crimson">
                    {photo.status === "failed" ? photo.error : "Processing"}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {isCover && <Chip tone="dark">Cover</Chip>}
                  {photo.status === "failed" && <Chip tone="warning">Failed</Chip>}
                  {photo.flaw_label && <Chip tone="warning">Flaw: {photo.flaw_label}</Chip>}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    className="h-9 rounded-full bg-charcoal px-2 text-xs font-semibold text-white disabled:opacity-45"
                    disabled={busy || !ready || isCover}
                    onClick={() => chooseCover(photo.id)}
                  >
                    {isCover ? "Cover" : "Use as cover"}
                  </button>
                  <button
                    type="button"
                    className="h-9 rounded-full border border-crimson px-2 text-xs font-semibold text-crimson disabled:opacity-45"
                    disabled={busy}
                    onClick={() => deleteMedia(photo.id, name)}
                  >
                    Delete
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    className="h-8 rounded-full border border-silver px-2 text-xs font-semibold"
                    disabled={busy || index === 0}
                    onClick={() => move(photos, index, -1, "photo")}
                  >
                    Earlier
                  </button>
                  <button
                    type="button"
                    className="h-8 rounded-full border border-silver px-2 text-xs font-semibold"
                    disabled={busy || index === photos.length - 1}
                    onClick={() => move(photos, index, 1, "photo")}
                  >
                    Later
                  </button>
                  {photo.status === "failed" && (
                    <button
                      type="button"
                      className="h-8 rounded-full border border-silver px-2 text-xs font-semibold"
                      disabled={busy}
                      onClick={() =>
                        start(async () => {
                          const result = await reprocessMedia(photo.id);
                          if (result.error) {
                            setError(result.error);
                            toast.error(result.error);
                          } else toast.ok(result.ok ?? "Re-processed.");
                          refresh();
                        })
                      }
                    >
                      Retry
                    </button>
                  )}
                </div>
                <label className="text-xs font-semibold text-slate" htmlFor={`flaw-${photo.id}`}>
                  Flaw for {name}
                </label>
                <input
                  id={`flaw-${photo.id}`}
                  aria-label={`Flaw for ${name}`}
                  defaultValue={photo.flaw_label ?? ""}
                  maxLength={120}
                  className="h-9 rounded-panel border border-silver px-2 text-sm"
                  onBlur={(event) => {
                    const next = event.target.value;
                    if (next === (photo.flaw_label ?? "")) return;
                    start(async () => {
                      const result = await saveFlaw(photo.id, next);
                      if (result.error) setError(result.error);
                      refresh();
                    });
                  }}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="360 degree frames" className="rounded-card border border-platinum bg-white p-4 md:p-5">
        <h2 className="font-display text-lg font-semibold">360° sequence</h2>
        <p className="text-sm text-slate">
          {readySpins} frames stored. The public page shows a 360° view only when 24 or more frames are stored.
        </p>
        <input
          aria-label="Add 360 frames"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy}
          className="mt-3 max-w-full text-sm"
          onChange={(event) => {
            uploadMany(Array.from(event.target.files ?? []), "spin");
            event.target.value = "";
          }}
        />
        <ol aria-label="360 frame order" className="mt-3 flex flex-col gap-2">
          {spins.map((frame, index) => {
            const name = frame.alt_text ?? `Frame ${index + 1}`;
            return (
              <li key={frame.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="tabular w-8 font-semibold">{frame.frame_index ?? index + 1}</span>
                {frame.status === "ready" && frame.thumb_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaFileUrl(frame.id, "thumb")} alt={name} className="h-12 w-16 rounded-panel bg-platinum object-contain" />
                ) : (
                  <span>{frame.status === "failed" ? frame.error : "Processing"}</span>
                )}
                <button type="button" className="h-8 rounded-full border border-silver px-2 text-xs font-semibold" disabled={busy || index === 0} onClick={() => move(spins, index, -1, "spin")}>
                  Move {name} earlier
                </button>
                <button type="button" className="h-8 rounded-full border border-silver px-2 text-xs font-semibold" disabled={busy || index === spins.length - 1} onClick={() => move(spins, index, 1, "spin")}>
                  Move {name} later
                </button>
                <button
                  type="button"
                  className="h-8 rounded-full border border-crimson px-2 text-xs font-semibold text-crimson"
                  disabled={busy}
                  onClick={() => deleteMedia(frame.id, name)}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-label="Documents" className="rounded-card border border-platinum bg-white p-4 md:p-5">
        <h2 className="font-display text-lg font-semibold">Documents</h2>
        <p className="text-sm text-slate">
          History and inspection files marked for the future vehicle page appear on the public vehicle page when that vehicle is Available, Reserved or Sold. Title images stay internal.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-sm font-semibold" htmlFor="doc-kind">
            Document type
          </label>
          <select
            id="doc-kind"
            value={docKind}
            onChange={(event) => {
              const next = event.target.value as DocumentKind;
              setDocKind(next);
              if (next === "title") setDocVisibility("internal");
            }}
            className="h-10 rounded-full border border-silver px-3 text-sm"
          >
            {Object.entries(DOCUMENT_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="text-sm font-semibold" htmlFor="doc-visibility">
            Marking
          </label>
          <select
            id="doc-visibility"
            value={docKind === "title" ? "internal" : docVisibility}
            disabled={docKind === "title"}
            onChange={(event) => setDocVisibility(event.target.value as MediaVisibility)}
            className="h-10 rounded-full border border-silver px-3 text-sm"
          >
            <option value="public">Future vehicle page</option>
            <option value="internal">Internal</option>
          </select>
          <input
            aria-label="Add document"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadMany([file], "document");
              event.target.value = "";
            }}
            className="max-w-full text-sm"
          />
        </div>
        <ul className="mt-4 flex flex-col gap-3">
          {documents.map((doc) => {
            const name = doc.alt_text ?? DOCUMENT_LABEL[doc.document_kind ?? "other"];
            return (
              <li key={doc.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{DOCUMENT_LABEL[doc.document_kind ?? "other"]}</span>
                <span>{name}</span>
                <Chip tone={doc.visibility === "internal" ? "neutral" : "outline"}>
                  {doc.visibility === "internal" ? "Internal" : "Future vehicle page"}
                </Chip>
                {doc.document_kind !== "title" && (
                  <button
                    type="button"
                    className="h-8 rounded-full border border-silver px-2 text-xs font-semibold"
                    onClick={() =>
                      start(async () => {
                        const next = doc.visibility === "internal" ? "public" : "internal";
                        const result = await saveVisibility(doc.id, next);
                        if (result.error) setError(result.error);
                        refresh();
                      })
                    }
                  >
                    Mark {name} {doc.visibility === "internal" ? "for the future vehicle page" : "internal"}
                  </button>
                )}
                {doc.status === "ready" && (
                  <a className="font-semibold underline" href={mediaFileUrl(doc.id, "file")}>
                    Open {name}
                  </a>
                )}
                {doc.status === "failed" && <span className="text-crimson">{doc.error}</span>}
                <button
                  type="button"
                  className="h-8 rounded-full border border-crimson px-2 text-xs font-semibold text-crimson"
                  disabled={busy}
                  onClick={() => deleteMedia(doc.id, name)}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Video" className="rounded-card border border-platinum bg-white p-4 md:p-5">
        <h2 className="font-display text-lg font-semibold">Video</h2>
        <p className="text-sm text-slate">
          Uploads go to Mux and stay private. Until that account is connected, paste an https link. The link is not shown on the website.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="text-sm font-semibold" htmlFor="video-url">
            https link
          </label>
          <input
            id="video-url"
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder="https://"
            className="h-10 min-w-0 flex-1 rounded-full border border-silver px-3 text-sm"
          />
          <button
            type="button"
            className="h-10 rounded-full bg-charcoal px-4 text-sm font-semibold text-white"
            disabled={busy}
            onClick={() =>
              start(async () => {
                const result = await addVideoLink(vehicleId, videoUrl);
                if (result.error) setError(result.error);
                else {
                  setVideoUrl("");
                  setStatus(result.ok ?? "Saved.");
                }
                refresh();
              })
            }
          >
            Save video link
          </button>
        </div>
        {muxReady ? (
          <input
            aria-label="Upload video"
            type="file"
            accept="video/*"
            disabled={busy}
            className="mt-3 max-w-full text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              start(async () => {
                const started = await beginVideoUpload(vehicleId, window.location.origin);
                if ("error" in started) {
                  setError(started.error);
                  return;
                }
                const sent = await fetch(started.url, { method: "PUT", body: file });
                if (!sent.ok) {
                  setError("The video did not reach Mux.");
                  return;
                }
                const marked = await markVideoUploaded(started.id);
                if (marked.error) setError(marked.error);
                else setStatus(marked.ok ?? "Processing.");
                refresh();
              });
            }}
          />
        ) : (
          <p className="mt-3 text-sm text-slate">Video upload is not connected yet. Paste an https link, or add the Mux keys.</p>
        )}
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {videos.map((video) => (
            <li key={video.id} className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{video.video_provider === "mux" ? "Mux" : "Link"}</span>
              <span>{video.status}</span>
              {video.video_url && <span className="break-all">{video.video_url}</span>}
              {video.error && <span className="text-crimson">{video.error}</span>}
              <button
                type="button"
                className="h-8 rounded-full border border-crimson px-2 text-xs font-semibold text-crimson"
                disabled={busy}
                onClick={() => deleteMedia(video.id, "this video")}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
