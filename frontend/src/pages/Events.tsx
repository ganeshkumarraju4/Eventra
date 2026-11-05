import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  Users,
  ArrowRight,
  Sparkles,
  PlusCircle,
  X,
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type EventCategory =
  | "ALL"
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
  category: string;
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

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>(
    (searchParams.get("category") as EventCategory) || "ALL"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categories: { label: string; value: EventCategory }[] = [
    { label: "All Experiences", value: "ALL" },
    { label: "Workshops", value: "WORKSHOP" },
    { label: "Conferences", value: "CONFERENCE" },
    { label: "Technical", value: "TECHNICAL" },
    { label: "Seminars", value: "SEMINAR" },
    { label: "Concerts", value: "CONCERT" },
    { label: "Sports", value: "SPORTS" },
    { label: "Other", value: "OTHER" },
  ];

  useEffect(() => {
    let active = true;

    async function fetchEvents() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/events");
        const data = response.data;
        const eventList = Array.isArray(data) ? data : data.events ?? [];

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

  // Sync category changes with query param
  const handleCategorySelect = (category: EventCategory) => {
    setSelectedCategory(category);
    const newParams = new URLSearchParams(searchParams);
    if (category === "ALL") {
      newParams.delete("category");
    } else {
      newParams.set("category", category);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    const newParams = new URLSearchParams(searchParams);
    if (term.trim()) {
      newParams.set("search", term.trim());
    } else {
      newParams.delete("search");
    }
    setSearchParams(newParams);
  };

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !query ||
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.venue?.name?.toLowerCase().includes(query) ||
        event.venue?.location?.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "ALL" || event.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [events, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#20201F] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Page Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-black/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E85D3F]/30 bg-[#E85D3F]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#C64A30] mb-3">
              <Sparkles size={13} />
              Community Calendar
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#20201F] sm:text-4xl">
              Explore Events
            </h1>
            <p className="mt-2 text-sm text-[#77736E]">
              Discover approved gatherings, masterclasses, and conferences.
            </p>
          </div>

          <Link
            to="/create-event"
            className="inline-flex items-center gap-2 rounded-xl bg-[#E85D3F] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#20201F] self-start sm:self-auto"
          >
            <PlusCircle size={16} />
            <span>Host an Event</span>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-8 space-y-4">
          <div className="relative max-w-xl">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77736E]"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by event title, keyword, or venue..."
              className="w-full rounded-xl border border-black/15 bg-white py-3 pl-10 pr-10 text-sm text-[#20201F] outline-none transition placeholder:text-[#9C968F] focus:border-[#E85D3F] focus:ring-4 focus:ring-[#E85D3F]/10"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77736E] hover:text-[#20201F]"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => handleCategorySelect(cat.value)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    isSelected
                      ? "bg-[#20201F] text-white shadow-sm"
                      : "border border-black/10 bg-white text-[#77736E] hover:border-[#E85D3F] hover:text-[#E85D3F]"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter */}
        <div className="mt-8 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#77736E]">
          <span>
            {loading
              ? "Loading..."
              : `${filteredEvents.length} ${
                  filteredEvents.length === 1 ? "event" : "events"
                } found`}
          </span>

          {(searchTerm || selectedCategory !== "ALL") && (
            <button
              onClick={() => {
                handleSearchChange("");
                handleCategorySelect("ALL");
              }}
              className="text-[#E85D3F] hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-72 rounded-2xl border border-black/[0.08] bg-white p-6 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-10 text-center max-w-lg mx-auto shadow-sm">
            <p className="font-bold text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-[#20201F] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#E85D3F] transition"
            >
              Try again
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-black/15 bg-white p-14 text-center">
            <CalendarDays size={42} className="mx-auto text-[#77736E]" />
            <h3 className="mt-4 text-lg font-bold text-[#20201F]">
              No events found
            </h3>
            <p className="mt-1 text-sm text-[#77736E] max-w-md mx-auto">
              {events.length === 0
                ? "No approved events have been published yet. Be the first to host one!"
                : "No events match your search criteria. Try a different keyword or category."}
            </p>
            {events.length > 0 && (
              <button
                onClick={() => {
                  handleSearchChange("");
                  handleCategorySelect("ALL");
                }}
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#FAF7F2] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#20201F] border border-black/10 hover:bg-[#E85D3F] hover:text-white transition"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <article
                key={event.id}
                className="group flex flex-col justify-between rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#E85D3F]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#C64A30]">
                      {event.category}
                    </span>

                    <span className="rounded-full border border-black/10 bg-[#FAF7F2] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#77736E]">
                      {event.type}
                    </span>
                  </div>

                  <h2 className="mt-4 text-xl font-bold leading-snug text-[#20201F] group-hover:text-[#E85D3F] transition">
                    <Link to={`/events/${event.id}`}>{event.title}</Link>
                  </h2>

                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#77736E]">
                    {event.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-black/10 pt-4">
                  <div className="space-y-2 text-xs text-[#77736E] mb-5">
                    <div className="flex items-center gap-2 font-semibold text-[#20201F]">
                      <CalendarDays size={15} className="text-[#E85D3F]" />
                      <span>
                        {new Date(event.startTime).toLocaleDateString("en-IN", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock3 size={15} className="text-[#77736E]" />
                      <span>
                        {new Date(event.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        –{" "}
                        {new Date(event.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {event.venue && (
                      <div className="flex items-start gap-2">
                        <MapPin size={15} className="mt-0.5 shrink-0 text-[#77736E]" />
                        <span className="truncate">
                          <strong className="text-[#20201F] font-semibold">
                            {event.venue.name}
                          </strong>{" "}
                          · {event.venue.location}
                        </span>
                      </div>
                    )}

                    {event.maxParticipants !== null && (
                      <div className="flex items-center gap-2">
                        <Users size={15} className="text-[#77736E]" />
                        <span>Up to {event.maxParticipants} attendees</span>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/events/${event.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FAF7F2] py-3 text-xs font-bold uppercase tracking-wider text-[#20201F] transition hover:bg-[#E85D3F] hover:text-white"
                  >
                    View Details
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
