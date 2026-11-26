import type { ReactNode } from "react";
import { resolveEventImage } from "./eventImageUtils";

interface EventImageProps {
  category?: string;
  title?: string;
  imageUrl?: string | null;
  className?: string;
  children?: ReactNode;
}

export default function EventImage({
  category = "OTHER",
  title = "",
  imageUrl,
  className = "h-36",
  children,
}: EventImageProps) {
  const normalizedCategory = category.toUpperCase();
  const isCodingEvent = title.toLowerCase().includes("coding");
  const image = resolveEventImage(category, title, imageUrl);

  return (
    <div className={`group/event-image relative shrink-0 overflow-hidden bg-[#20201F] ${className}`}>
      <img
        src={image}
        alt={imageUrl ? "Event cover" : isCodingEvent ? "Coding event" : `${normalizedCategory.toLowerCase()} event`}
        className="h-full w-full object-cover transition duration-500 group-hover/event-image:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/20" />
      <div className="absolute inset-x-4 bottom-3 flex items-center justify-between gap-3">
        <span className="rounded-full border border-white/25 bg-black/25 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          {normalizedCategory}
        </span>
        {children}
      </div>
    </div>
  );
}
