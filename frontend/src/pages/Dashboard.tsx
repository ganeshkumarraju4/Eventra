import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Ticket,
  ArrowRight,
  MapPin,
  Clock3,
  RefreshCw,
  PlusCircle,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

interface EventItem {
  id: string;
  title: string;
  description?: string | null;
  startTime?: string;
  endTime?: string;
  organizerId?: string;
  status?: string;
  category?: string;
  booking?: {
    venue?: {
      id: string;
      name: string;
      location: string;
      capacity: number;
    } | null;
  } | null;
  venue?: {
    name?: string;
    location?: string;
    address?: string;
  } | null;
}

interface Registration {
  id: string;
  status: string;
  createdAt?: string;
  event?: EventItem;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  const [user, setUser] = useState<User | null>(authUser);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [userResponse, eventsResponse, registrationsResponse] =
        await Promise.all([
          api.get("/auth/me"),
          api.get("/events"),
          api.get("/registrations/my"),
        ]);

      setUser(userResponse.data.user);

      const eventList = Array.isArray(eventsResponse.data)
        ? eventsResponse.data
        : eventsResponse.data.events ?? [];
      setEvents(eventList);

      const regList = Array.isArray(registrationsResponse.data)
        ? registrationsResponse.data
        : registrationsResponse.data.registrations ?? [];
      setRegistrations(regList);
    } catch (err: unknown) {
      console.error("Dashboard loading error:", err);
      const status = (err as { response?: { status?: number } })?.response?.status;

      if (status === 401 || status === 403) {
        logout();
        navigate("/login", { replace: true });
        return;
      }
      setError("Unable to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  if (!localStorage.getItem("token")) {
    navigate("/login", { replace: true });
    return;
  }

  const timer = setTimeout(() => {
    void loadDashboard();
  }, 0);

  return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
  const approvedRegistrations = registrations.filter(
    (reg) => reg.status === "APPROVED"
  ).length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#20201F] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        {loading ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E85D3F]/20 border-t-[#E85D3F]" />
            <p className="mt-4 text-sm font-semibold text-[#77736E]">
              Loading your workspace...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center max-w-xl mx-auto shadow-sm">
            <p className="font-bold text-red-700">{error}</p>
            <button
              onClick={() => void loadDashboard()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#20201F] px-5 py-3 text-sm font-bold text-white hover:bg-[#E85D3F] transition"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Welcome Banner */}
            <section className="relative overflow-hidden rounded-[2.5rem] bg-[#20201F] p-8 sm:p-12 text-white shadow-xl">
              <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#E85D3F]/25 blur-3xl pointer-events-none" />
              <div className="absolute right-12 bottom-0 hidden lg:block opacity-15 pointer-events-none">
                <Sparkles size={220} />
              </div>

              <div className="relative max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#FFC6B6]">
                  <Sparkles size={13} />
                  Attendee & Organizer Workspace
                </div>

                <h1 className="mt-5 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                  Welcome back,{" "}
                  <span className="font-editorial italic text-[#E85D3F]">
                    {firstName}!
                  </span>
                </h1>

                <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
                  Discover what's happening around you, reserve your spot, or
                  coordinate your own community events with ease.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    to="/events"
                    className="inline-flex items-center gap-2 rounded-full bg-[#E85D3F] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-white hover:text-[#20201F]"
                  >
                    Explore all events
                    <ArrowRight size={16} />
                  </Link>

                  <Link
                    to="/create-event"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white hover:text-[#20201F]"
                  >
                    <PlusCircle size={16} />
                    Host a new event
                  </Link>                </div>
              </div>
            </section>

            {/* Quick Metrics */}
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#77736E]">
                    Available Events
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#E85D3F]">
                    <CalendarDays size={20} />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-black text-[#20201F]">
                  {events.length}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
                  <span className="text-xs text-[#77736E]">
                    Live events to attend
                  </span>
                  <Link
                    to="/events"
                    className="text-xs font-bold text-[#E85D3F] hover:underline"
                  >
                    Browse ↗
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#77736E]">
                    My Registrations
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FBE6DF] text-[#E85D3F]">
                    <Ticket size={20} />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-black text-[#20201F]">
                  {registrations.length}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
                  <span className="text-xs text-[#77736E]">
                    Events you registered for
                  </span>
                  <Link
                    to="/my-registrations"
                    className="text-xs font-bold text-[#E85D3F] hover:underline"
                  >
                    View tickets ↗
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm transition hover:shadow-md sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#77736E]">
                    Confirmed Status
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EBF5E8] text-[#266B22]">
                    <CheckCircle2 size={20} />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-black text-[#20201F]">
                  {approvedRegistrations}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
                  <span className="text-xs text-[#77736E]">
                    Approved & ready to attend
                  </span>
                  <span className="text-xs font-semibold text-[#266B22]">
                    Confirmed
                  </span>
                </div>
              </div>
            </section>

            {/* Quick Actions Shortcuts */}
            <section className="grid gap-4 sm:grid-cols-3">
              <Link
                to="/create-event"
                className="group flex items-center justify-between rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm transition hover:border-[#E85D3F] hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E85D3F]/10 text-[#E85D3F]">
                    <PlusCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#20201F] group-hover:text-[#E85D3F] transition">
                      Host an Event
                    </h3>
                    <p className="text-xs text-[#77736E]">
                      Submit a new gathering
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-[#77736E] group-hover:text-[#E85D3F] group-hover:translate-x-1 transition"
                />
              </Link>

              <Link
                to="/my-events"
                className="group flex items-center justify-between rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm transition hover:border-[#E85D3F] hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#20201F]">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#20201F] group-hover:text-[#E85D3F] transition">
                      Manage My Events
                    </h3>
                    <p className="text-xs text-[#77736E]">
                      Attendee lists & forms
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-[#77736E] group-hover:text-[#E85D3F] group-hover:translate-x-1 transition"
                />
              </Link>

              <Link
                to="/my-registrations"
                className="group flex items-center justify-between rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm transition hover:border-[#E85D3F] hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#20201F]">
                    <Ticket size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#20201F] group-hover:text-[#E85D3F] transition">
                      My Registrations
                    </h3>
                    <p className="text-xs text-[#77736E]">
                      View tickets & answers
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-[#77736E] group-hover:text-[#E85D3F] group-hover:translate-x-1 transition"
                />
              </Link>
            </section>

            {/* Upcoming Approved Events Preview */}
            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E85D3F]">
                    Discover Live Experiences
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-[#20201F]">
                    Featured Events
                  </h2>
                </div>

                <Link
                  to="/events"
                  className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-[#E85D3F] hover:underline"
                >
                  View all ({events.length}) <ArrowRight size={16} />
                </Link>
              </div>

              {events.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-black/15 bg-white p-12 text-center">
                  <CalendarDays size={36} className="mx-auto text-[#77736E]" />
                  <h3 className="mt-4 font-bold text-lg">
                    No approved events found
                  </h3>
                  <p className="mt-1 text-sm text-[#77736E]">
                    Submitted events will appear here once approved by an
                    administrator.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {events.slice(0, 6).map((event) => (
                    <article
                      key={event.id}
                      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-[#E85D3F]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#C64A30]">
                            {event.category || "Event"}
                          </span>

                          {event.startTime && (
                            <span className="flex items-center gap-1 text-xs text-[#77736E]">
                              <Clock3 size={13} />
                              {new Date(event.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>

                        <h3 className="mt-4 text-lg font-bold leading-snug text-[#20201F] group-hover:text-[#E85D3F] transition">
                          {event.title}
                        </h3>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#77736E]">
                          {event.description ||
                            "Click view details to learn more about this event."}
                        </p>
                      </div>

                      <div className="mt-6 border-t border-black/10 pt-4">
                        <div className="space-y-1.5 text-xs text-[#77736E] mb-4">
                          {event.startTime && (
                            <p className="flex items-center gap-1.5 font-medium text-[#20201F]">
                              <CalendarDays
                                size={14}
                                className="text-[#E85D3F]"
                              />
                              {new Date(event.startTime).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          )}

                          {event.venue?.name && (
                            <p className="flex items-center gap-1.5 truncate">
                              <MapPin size={14} />
                              {event.venue.name}
                            </p>
                          )}
                        </div>

                        <Link
                          to={`/events/${event.id}`}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FAF7F2] py-2.5 text-xs font-bold uppercase tracking-wider text-[#20201F] transition hover:bg-[#E85D3F] hover:text-white"
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
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
