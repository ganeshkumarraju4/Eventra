import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import api from "../api/axios";

type EventCategory =
  | "CONFERENCE"
  | "WORKSHOP"
  | "SEMINAR"
  | "CONCERT"
  | "SPORTS"
  | "TECHNICAL"
  | "OTHER";

interface EventItem {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  type: "PUBLIC" | "PRIVATE";
  startTime: string;
  endTime: string;
  maxParticipants: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  venue?: {
    id: string;
    name: string;
    location: string;
    capacity: number;
  };
}


function formatCategory(category: string) {
  return category.charAt(0) + category.slice(1).toLowerCase();
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Events() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
     useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchEvents() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/events");
        const data = response.data;

        // Supports either an array response or { events: [...] }.
        const eventList = Array.isArray(data) ? data : data.events;

        if (!Array.isArray(eventList)) {
          throw new Error("The server returned an unexpected events response.");
        }

        if (active) {
          setEvents(eventList);
        }
      } catch (err: unknown) {
        if (active) {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to load events. Please try again.";

          setError(message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchEvents();

    return () => {
      active = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.venue?.name.toLowerCase().includes(query) ||
        event.venue?.location.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "ALL" ||
        event.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [events, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-[#24243a]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-[#5550a5]"
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>

          <div className="text-xl font-extrabold tracking-tight text-[#393477]">
            Eventra<span className="text-[#8c83e8]">.</span>
          </div>

          <button
            onClick={() => navigate("/create-event")}
            className="rounded-xl bg-[#5147a5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#403687]"
          >
            + Create Event
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
    
<section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-2xl font-bold tracking-tight text-[#24243a]">
      Explore Events
    </h1>
    <p className="mt-1 text-sm text-gray-500">
      {loading
        ? "Loading events..."
        : `${filteredEvents.length} ${
            filteredEvents.length === 1 ? "event" : "events"
          } found`}
    </p>
  </div>

  <div className="flex flex-col gap-3 sm:flex-row">
    <div className="relative">
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="text"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search events..."
        aria-label="Search events"
        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#5147a5] sm:w-56"
      />
    </div>

    <select
      value={selectedCategory}
      onChange={(event) =>
        setSelectedCategory(
          event.target.value 
        )
      }
      aria-label="Filter by event category"
      className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-[#5147a5]"
    >
      <option value="ALL">All Categories</option>
      <option value="CONFERENCE">Conference</option>
      <option value="WORKSHOP">Workshop</option>
      <option value="SEMINAR">Seminar</option>
      <option value="CONCERT">Concert</option>
      <option value="SPORTS">Sports</option>
      <option value="TECHNICAL">Technical</option>
      <option value="OTHER">Other</option>
    </select>
  </div>
</section>



        {loading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white p-6"
              >
                <div className="h-5 w-24 rounded bg-gray-200" />
                <div className="mt-5 h-6 w-3/4 rounded bg-gray-200" />
                <div className="mt-3 h-4 w-full rounded bg-gray-100" />
                <div className="mt-2 h-4 w-2/3 rounded bg-gray-100" />
                <div className="mt-7 h-4 w-1/2 rounded bg-gray-200" />
                <div className="mt-5 h-10 rounded-xl bg-gray-200" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-100 bg-white px-6 py-12 text-center">
            <p className="font-semibold text-red-600">
              Couldn't load events
            </p>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-[#5147a5] px-5 py-3 text-sm font-semibold text-white hover:bg-[#403687]"
            >
              Try again
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0effb] text-[#5147a5]">
              <CalendarDays size={30} />
            </div>

            <h3 className="mt-5 text-xl font-bold">
              {events.length === 0
                ? "No public events yet"
                : "No matching events"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              {events.length === 0
                ? "New events will appear here once they have been approved by an administrator."
                : "Try another search term or choose a different category."}
            </p>

            {events.length > 0 && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("ALL");
                }}
                className="mt-5 font-semibold text-[#5147a5] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <article
                key={event.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
             
            <div className="group/image relative h-44 overflow-hidden bg-[#eeecfa]">
            <img
                src={`/events/${event.category.toLowerCase()}.jpg`}
                alt={`${event.category.toLowerCase()} event`}
               className="h-full w-full object-cover transition-transform duration-500 group-hover/image:scale-105"
                onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/events/other.jpg";
                }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

            <span className="absolute bottom-3 left-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#5147a5] shadow-sm">
                {formatCategory(event.category)}
            </span>

            <span className="absolute right-3 top-3 rounded-full bg-black/35 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                {event.type === "PUBLIC" ? "Public event" : "Private"}
            </span>
            </div>


                <div className="flex flex-1 flex-col p-6">
                  
                 <h3 className="text-xl font-bold leading-snug transition group-hover:text-[#5147a5]">
                    {event.title}
                  </h3>

                  <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-gray-500">
                    {event.description}
                  </p>

                  <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
                    <div className="flex items-start gap-3 text-sm text-gray-600">
                      <CalendarDays
                        size={17}
                        className="mt-0.5 shrink-0 text-[#7770d8]"
                      />
                      <span>{formatDate(event.startTime)}</span>
                    </div>

                    <div className="flex items-start gap-3 text-sm text-gray-600">
                      <Clock3
                        size={17}
                        className="mt-0.5 shrink-0 text-[#7770d8]"
                      />
                      <span>
                        {formatTime(event.startTime)} –{" "}
                        {formatTime(event.endTime)}
                      </span>
                    </div>

                    {event.venue && (
                      <div className="flex items-start gap-3 text-sm text-gray-600">
                        <MapPin
                          size={17}
                          className="mt-0.5 shrink-0 text-[#7770d8]"
                        />
                        <div>
                          <p className="font-semibold text-gray-700">
                            {event.venue.name}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {event.venue.location}
                          </p>
                        </div>
                      </div>
                    )}

                    {event.maxParticipants !== null &&
                      event.maxParticipants !== undefined && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Users
                            size={17}
                            className="shrink-0 text-[#7770d8]"
                          />
                          <span>
                            Up to {event.maxParticipants} participants
                          </span>
                        </div>
                      )}
                  </div>

                  <button
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0effb] px-4 py-3 font-semibold text-[#5147a5] transition hover:bg-[#5147a5] hover:text-white"
                  >
                    View Details
                    <ArrowRight size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            <span className="font-bold text-[#5147a5]">Eventra.</span> Make
            every gathering count.
          </p>
          <p>Discover. Connect. Experience.</p>
        </div>
      </footer>
    </div>
  );
}

