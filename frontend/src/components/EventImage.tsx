import type { ReactNode } from "react";

const categoryImages: Record<string, string> = {
  CONFERENCE: "/events/conference.jpg",
  WORKSHOP: "/events/workshop.jpg",
  SEMINAR: "/events/seminar.jpg",
  CONCERT: "/events/concert.jpg",
  SPORTS: "/events/sports.jpg",
  TECHNICAL: "/events/technical.jpg",
  OTHER: "/events/other.jpg",
};

interface EventImageProps {
  category?: string;
  className?: string;
  children?: ReactNode;
}

export default function EventImage({
  category = "OTHER",
  className = "h-36",
  children,
}: EventImageProps) {
  const normalizedCategory = category.toUpperCase();
  const image = categoryImages[normalizedCategory] ?? categoryImages.OTHER;

  return (
    <div className={`group/event-image relative shrink-0 overflow-hidden bg-[#20201F] ${className}`}>
      <img
        src={image}
        alt={`${normalizedCategory.toLowerCase()} event`}
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
