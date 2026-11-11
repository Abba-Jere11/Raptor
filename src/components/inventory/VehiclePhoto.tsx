import { cn } from "@/lib/cn";
import { mediaFileUrl } from "@/lib/media/files";

/** A vehicle photograph that fills its fixed-ratio box, or a typographic outline when there is no photo. */
export function VehiclePhoto({
  mediaId,
  make,
  model,
  alt,
  sizes,
  priority,
  zoom,
  className,
  placeholderSize = "md",
}: {
  mediaId: string | null;
  make: string;
  model: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  zoom?: boolean;
  className?: string;
  placeholderSize?: "sm" | "md" | "lg";
}) {
  return (
    <div className={cn("relative overflow-hidden", !mediaId && "ring-1 ring-inset ring-silver", className)}>
      {mediaId ? (
        // The file route checks publication before it sends bytes. next/image is not used for that route.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaFileUrl(mediaId, "thumb")}
          srcSet={`${mediaFileUrl(mediaId, "thumb")} 480w, ${mediaFileUrl(mediaId, "gallery")} 1600w`}
          sizes={sizes}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          className={cn("absolute inset-0 h-full w-full object-cover", zoom && "transition-transform duration-[400ms] ease-out group-hover:scale-[1.02]")}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span className={cn("font-semibold uppercase tracking-[0.16em] text-charcoal", placeholderSize === "sm" ? "text-[0.625rem]" : "text-xs")}>{make}</span>
          {model && (
            <span
              className={cn(
                "mt-1 font-display font-semibold tracking-tight text-charcoal",
                placeholderSize === "lg" ? "text-4xl md:text-6xl" : placeholderSize === "sm" ? "text-xl" : "text-2xl md:text-3xl",
              )}
            >
              {model}
            </span>
          )}
          {placeholderSize !== "sm" && <span className="mt-3 text-xs text-charcoal">No photos yet.</span>}
        </div>
      )}
    </div>
  );
}
