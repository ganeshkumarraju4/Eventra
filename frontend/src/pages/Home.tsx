import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  Sparkles,
  Ticket,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../api/axios";

interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  startTime: string;
  endTime: string;
  venue?: {
    name: string;
    location: string;
  };
}

export default function Home() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await api.get("/events");
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.events ?? [];
        setEvents(list.slice(0, 6));
      } catch (err) {
        console.warn("Could not load featured events:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadEvents();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/events");
    }
  };

  const categoryPresets = [
    { label: "All experiences", filter: "ALL" },
    { label: "Workshop", filter: "WORKSHOP" },
    { label: "Conference", filter: "CONFERENCE" },
    { label: "Technical", filter: "TECHNICAL" },
    { label: "Concert", filter: "CONCERT" },
    { label: "Seminar", filter: "SEMINAR" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#20201F] flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:px-10 md:py-24 lg:gap-16">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E85D3F]/30 bg-[#E85D3F]/10 px-4 py-2 text-xs font-bold tracking-[0.15em] text-[#C64A30]">
              <Sparkles size={15} />
              YOUR NEXT GREAT EXPERIENCE
            </div>

            <h1 className="text-5xl font-black leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Make room
              <br />
              for something
              <br />
              <span className="font-editorial italic text-[#E85D3F]">
                unforgettable.
              </span>
            </h1>

            <p className="mt-8 max-w-lg text-base leading-relaxed text-[#77736E] md:text-lg">
              Discover experiences worth showing up for. Find your people,
              explore new ideas, and make your next story a great one.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to="/events"
                className="inline-flex items-center gap-3 rounded-full bg-[#E85D3F] px-8 py-4 font-bold text-white shadow-md shadow-[#E85D3F]/20 transition-all hover:bg-[#20201F] hover:shadow-none hover:-translate-y-0.5 active:translate-y-0"
              >
                Explore events
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/create-event"
                className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-7 py-4 font-bold text-[#20201F] transition hover:bg-[#FAF7F2] hover:border-black/30"
              >
                Host an event ↗
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-4 border-t border-black/10 pt-6">
              <div className="flex -space-x-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#FAF7F2] bg-[#E8BDA9] text-xs font-bold text-[#20201F]">
                  EM
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#FAF7F2] bg-[#C7D6C0] text-xs font-bold text-[#20201F]">
                  RA
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#FAF7F2] bg-[#D8C8E9] text-xs font-bold text-[#20201F]">
                  SK
                </span>
              </div>

              <p className="text-sm text-[#77736E]">
                <span className="font-bold text-[#20201F]">
                  Find your community.
                </span>
                <br />
                Over 500+ attendees connecting every week.
              </p>
            </div>
          </div>

          {/* Featured Visual */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -right-3 -top-4 h-full w-full rounded-[2.5rem] border border-[#E85D3F]/30 md:-right-5 md:-top-5" />

            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#20201F] shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85"
                alt="Event atmosphere"
                className="h-[440px] w-full object-cover opacity-90 transition duration-700 hover:scale-105 sm:h-[520px]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

              <div className="absolute left-6 top-6 rounded-full bg-[#FAF7F2] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#20201F] shadow-sm">
                The Spotlight
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-8 text-white sm:p-10">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#FFC6B6]">
                  Experiences That Bring Us Together
                </p>

                <h2 className="text-3xl font-black leading-tight sm:text-4xl">
                  Good people.
                  <br />
                  Great moments.
                </h2>

                <div className="mt-6 flex items-center justify-between text-sm text-white/80">
                  <span className="flex items-center gap-2 font-medium">
                    <Sparkles size={16} className="text-[#E85D3F]" />
                    Live gatherings & workshops
                  </span>
                  <Link
                    to="/events"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#20201F] transition hover:bg-[#E85D3F] hover:text-white"
                  >
                    <ArrowDownRight size={20} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-4 hidden items-center gap-3 rounded-2xl bg-white p-4 shadow-xl border border-black/5 sm:flex md:-left-8">
              <div className="rounded-xl bg-[#FBE6DF] p-3 text-[#E85D3F]">
                <Ticket size={24} />
              </div>
              <div>
                <p className="font-bold text-sm text-[#20201F]">Your next story</p>
                <p className="text-xs text-[#77736E]">Starts with an RSVP.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Search Bar Section */}
        <section id="discover" className="border-y border-black/10 bg-white/70 backdrop-blur-sm px-6 py-12 md:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E85D3F]">
                  Discover Events
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                  What are you looking to experience?
                </h2>
              </div>
              <Link to="/events" className="text-sm font-bold text-[#E85D3F] hover:underline flex items-center gap-1">
                View all upcoming <ArrowRight size={15} />
              </Link>
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="grid gap-3 rounded-2xl border border-black/10 bg-white p-2.5 shadow-sm md:grid-cols-[1fr_auto]"
            >
              <label className="flex items-center gap-3 px-3 py-2">
                <Search className="shrink-0 text-[#E85D3F]" size={20} />
                <input
                  type="text"
                  placeholder="Search events by title, topic, or venue location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#9C968F]"
                />
              </label>

              <button
                type="submit"
                className="rounded-xl bg-[#20201F] px-8 py-3.5 text-sm font-bold text-white transition hover:bg-[#E85D3F]"
              >
                Find events
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2 pt-2">
              {categoryPresets.map((cat) => (
                <button
                  key={cat.filter}
                  onClick={() => navigate(cat.filter === "ALL" ? "/events" : `/events?category=${cat.filter}`)}
                  className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-[#77736E] transition hover:border-[#E85D3F] hover:text-[#E85D3F]"
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Events List */}
        <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-24">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E85D3F]">
                Handpicked Experiences
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Worth showing up for.
              </h2>
            </div>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 text-sm font-bold hover:text-[#E85D3F] transition"
            >
              Explore all events <ArrowRight size={17} />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-80 rounded-2xl border border-black/10 bg-white/60 animate-pulse"
                />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/15 bg-white p-12 text-center">
              <CalendarDays size={36} className="mx-auto text-[#77736E]" />
              <h3 className="mt-4 font-bold text-lg">No public events listed yet</h3>
              <p className="mt-1 text-sm text-[#77736E]">
                Be the first to create and publish an event to our community!
              </p>
              <Link
                to="/create-event"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#E85D3F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#20201F] transition"
              >
                Create Event
              </Link>
            </div>
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="group rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#E85D3F]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#C64A30]">
                        {event.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#77736E]">
                        <Clock3 size={14} />
                        {new Date(event.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-bold tracking-tight text-[#20201F] group-hover:text-[#E85D3F] transition">
                      <Link to={`/events/${event.id}`}>{event.title}</Link>
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#77736E]">
                      {event.description}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-black/10 pt-4">
                    <div className="flex items-center justify-between text-xs text-[#77736E]">
                      <span className="flex items-center gap-1 font-semibold text-[#20201F]">
                        <CalendarDays size={14} className="text-[#E85D3F]" />
                        {new Date(event.startTime).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>

                      {event.venue && (
                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                          <MapPin size={14} />
                          {event.venue.name}
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/events/${event.id}`}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 py-2.5 text-xs font-bold uppercase tracking-wider text-[#20201F] transition hover:bg-[#E85D3F] hover:text-white hover:border-[#E85D3F]"
                    >
                      View Details
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Organizer Call to Action */}
        <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10 md:pb-24">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#20201F] px-8 py-16 text-white md:px-16">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#E85D3F]/20 blur-3xl pointer-events-none" />

            <div className="relative max-w-2xl">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#FFC6B6]">
                Host with Eventra
              </span>

              <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                Ready to bring your community together?
              </h2>

              <p className="mt-4 text-base leading-relaxed text-white/70 sm:text-lg">
                Create events, customize registration forms, manage approvals, and
                deliver an unforgettable experience.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/create-event"
                  className="inline-flex items-center gap-2 rounded-full bg-[#E85D3F] px-8 py-4 font-bold text-white transition hover:bg-white hover:text-[#20201F]"
                >
                  Start an event <ArrowRight size={18} />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-4 font-bold text-white transition hover:bg-white/10"
                >
                  Create Organizer Account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}