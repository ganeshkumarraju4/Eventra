const categoryImages: Record<string, string> = {
  CONFERENCE: "/events/conference.png",
  WORKSHOP: "/events/workshop.jpg",
  SEMINAR: "/events/seminar.jpg",
  CONCERT: "/events/concert.jpg",
  SPORTS: "/events/sports.jpg",
  TECHNICAL: "/events/technical.png",
  OTHER: "/events/other.jpg",
};

export function resolveEventImage(
  category = "OTHER",
  title = "",
  imageUrl?: string | null
) {
  const normalizedCategory = category.toUpperCase();
  const isCodingEvent = title.toLowerCase().includes("coding");

  return (
    imageUrl ||
    (isCodingEvent ? "/events/coding.png" : undefined) ||
    categoryImages[normalizedCategory] ||
    categoryImages.OTHER
  );
}
