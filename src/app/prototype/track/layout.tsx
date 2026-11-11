import { StandInCredit } from "@/components/ui/VehicleImage";

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100dvh-30px)] bg-platinum/50">
      {children}
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <StandInCredit />
      </div>
    </div>
  );
}
