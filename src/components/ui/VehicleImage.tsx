import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Cut-out vehicle on soft platinum (Section 6). In the prototype every image is a
 * labelled STAND-IN; real photography replaces it.
 */
export function VehicleImage({
  src,
  alt,
  className,
  priority,
  sizes = "(min-width: 1024px) 33vw, 100vw",
  standIn = true,
  surface = "platinum",
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  standIn?: boolean;
  surface?: "platinum" | "none" | "dark";
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        surface === "platinum" && "bg-linear-to-b from-white to-platinum",
        surface === "dark" && "bg-linear-to-b from-[#2e3237] to-charcoal",
        className,
      )}
    >
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-contain p-[6%]" />
      {standIn && (
        <span className="absolute bottom-2 left-2 rounded-full bg-charcoal px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-white">
          STAND-IN
        </span>
      )}
    </div>
  );
}

export function StandInCredit({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-slate", className)}>
      Stand-in renders: Ferrari 458 Italia model by vicent091036 (Sketchfab, CC BY), rendered with three.js. Raptors&apos;
      own photography replaces them.
    </p>
  );
}
