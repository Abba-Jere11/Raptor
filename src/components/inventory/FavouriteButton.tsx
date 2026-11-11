"use client";

import { HeartIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { useFavourites } from "@/lib/favourites";

export function FavouriteButton({ id, title, className }: { id: string; title: string; className?: string }) {
  const { has, toggle } = useFavourites();
  const saved = has(id);
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft hover:bg-platinum",
        saved ? "text-crimson" : "text-charcoal",
        className,
      )}
    >
      <HeartIcon filled={saved} />
    </button>
  );
}
