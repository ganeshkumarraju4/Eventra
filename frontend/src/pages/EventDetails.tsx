import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  Ticket,
} from "lucide-react";
import api from "../api/axios";

interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "PUBLIC" | "PRIVATE";
  startTime: string;
  endTime: string;
  maxParticipants: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  venueId?: string;
  organizerId?: string;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [venue, setVenue] = useState<{
    name: string;
    location: string;
    capacity: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchEventDetails() {
      if (!eventId) {
        setError("Event ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/events/${eventId}`);
        const fetchedEvent: EventItem = response.data.event;

        if (!active) return;

        setEvent(fetchedEvent);

        // The getEvent endpoint currently returns the event without its venue.
        // Fetch venues separately and match the event's venueId.
        if (fetchedEvent.venueId) {
          const venueResponse = await api.get("/venues");
          const venueList = venueResponse.data.venues;

          if (active && Array.isArray(venueList)) {
            const matchedVenue = venueList.find(
              (item: {
                id: string;
                name: string;
                location: string;
                capacity: number;
              }) => item.id === fetchedEvent.venueId
            );

            if (matchedVenue) {
              setVenue(matchedVenue);
            }
          }
        }
      } catch (err: unknown) {
        if (active) {
          const axiosError = err as {
            response?: {
              status?: number;
              data?: { message?: string };
            };
          };

          setError(
            axiosError.response?.data?.message ??
              "Unable to load event details. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchEventDetails();

    return () => {
      active = false;
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7fb]">
        <div className="text-sm font-medium text-gray-500">
          Loading event details...
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f7fb] px-5 text-center">
        <h1 className="text-2xl font-bold text-[#24243a]">
          Event unavailable
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {error || "We couldn't find this event."}
        </p>
        <button
          onClick={() => navigate("/events")}
          className="mt-6 rounded-xl bg-[#5147a5] px-5 py-3 text-sm font-semibold text-white hover:bg-[#403687]"
        >
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-[#24243a]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            onClick={() => navigate("/events")}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#5147a5]"
          >
            <ArrowLeft size={18} />
            Back to Events
          </button>

          <span className="text-xl font-extrabold tracking-tight text-[#393477]">
            Eventra<span className="text-[#8c83e8]">.</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="relative h-56 sm:h-80">
            <img
              src={`/events/${event.category.toLowerCase()}.jpg`}
              alt={`${event.category.toLowerCase()} event`}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/events/other.jpg";
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            <span className="absolute bottom-5 left-5 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#5147a5]">
              {event.category.charAt(0) +
                event.category.slice(1).toLowerCase()}
            </span>

            <span className="absolute right-5 top-5 rounded-full bg-black/40 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm">
              {event.status}
            </span>
          </div>

          <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[1fr_300px]">
            <section>
              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
                {event.title}
              </h1>

              <p className="mt-5 whitespace-pre-line text-base leading-7 text-gray-600">
                {event.description}
              </p>

              <div className="mt-8 grid gap-5 border-t border-gray-100 pt-7 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <CalendarDays
                    size={20}
                    className="mt-1 shrink-0 text-[#7770d8]"
                  />
                  <div>
                    <p className="text-sm font-semibold">Date</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatDate(event.startTime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock3
                    size={20}
                    className="mt-1 shrink-0 text-[#7770d8]"
                  />
                  <div>
                    <p className="text-sm font-semibold">Time</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatTime(event.startTime)} –{" "}
                      {formatTime(event.endTime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin
                    size={20}
                    className="mt-1 shrink-0 text-[#7770d8]"
                  />
                  <div>
                    <p className="text-sm font-semibold">Venue</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {venue?.name ?? "Venue details unavailable"}
                    </p>
                    {venue?.location && (
                      <p className="mt-1 text-xs text-gray-400">
                        {venue.location}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users
                    size={20}
                    className="mt-1 shrink-0 text-[#7770d8]"
                  />
                  <div>
                    <p className="text-sm font-semibold">Capacity</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {event.maxParticipants ??
                        venue?.capacity ??
                        "Not specified"}
                      {event.maxParticipants !== null &&
                      event.maxParticipants !== undefined
                        ? " participants"
                        : venue
                          ? " people at venue"
                          : ""}
                    </p>
                  </div>
                </div>
              </div>
            </section>

<aside className="h-fit rounded-2xl border border-gray-100 bg-[#faf9ff] p-6">
  <p className="text-sm text-gray-500">Ready to attend?</p>

  <p className="mt-2 text-xl font-bold">Join this event</p>

  <p className="mt-2 text-sm leading-6 text-gray-500">
    Secure your spot and be part of the experience.
  </p>

  <button
    onClick={() => navigate(`/events/${event.id}/register`)}
    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5147a5] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#403687]"
  >
    <Ticket size={18} />
    Register for Event
  </button>
</aside>
```

          </div>
        </div>
      </main>
    </div>
  );
}

