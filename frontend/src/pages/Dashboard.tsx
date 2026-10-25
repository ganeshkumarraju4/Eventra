import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Compass,
  Ticket,
  UserRound,
  LogOut,
  ArrowRight,
  MapPin,
  Clock3,
  RefreshCw,
} from "lucide-react";
import api from "../api/axios";

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
  event?: EventItem;
}

async function fetchDashboardData() {
  const [userResponse, eventsResponse, registrationsResponse] =
    await Promise.all([
      api.get("/auth/me"),
      api.get("/events"),
      api.get("/registrations/my"),
    ]);

  return {
    user: userResponse.data.user,

    events: Array.isArray(eventsResponse.data)
      ? eventsResponse.data
      : eventsResponse.data.events ?? [],

    registrations: Array.isArray(registrationsResponse.data)
      ? registrationsResponse.data
      : registrationsResponse.data.registrations ?? [],
  };
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

 async function loadDashboard() {
  try {
    const data = await fetchDashboardData();

    setUser(data.user);
    setEvents(data.events);
    setRegistrations(data.registrations);
    setError("");
  } catch (err) {
    console.error("Dashboard loading error:", err);

    const status = (
      err as { response?: { status?: number } }
    )?.response?.status;

    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
      return;
    }

    setError("We couldn't load your dashboard. Please try again.");
  } finally {
    setLoading(false);
  }
}
  useEffect(() => {
  if (!localStorage.getItem("token")) {
    navigate("/login", { replace: true });
    return;
  }

  async function initializeDashboard() {
    try {
      const data = await fetchDashboardData();

      setUser(data.user);
      setEvents(data.events);
      setRegistrations(data.registrations);
    } catch (err) {
      console.error("Dashboard loading error:", err);

      const status = (
        err as { response?: { status?: number } }
      )?.response?.status;

      if (status === 401 || status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      setError("We couldn't load your dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  void initializeDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";

  const approvedRegistrations = registrations.filter(
    (registration) => registration.status === "APPROVED"
  ).length;

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#20253b]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-gray-200 bg-white px-5 py-7 md:flex">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 px-3 text-left"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#303b76] text-white">
            <CalendarDays size={21} />
          </span>
          <span className="text-xl font-bold">Eventra</span>
        </button>

        <p className="mb-3 mt-12 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
          Workspace
        </p>

        <nav className="space-y-2">
          <button className="flex w-full items-center gap-3 rounded-xl bg-[#303b76] px-4 py-3 text-sm font-semibold text-white">
            <Compass size={19} />
            Overview
          </button>

          <button
            onClick={() => navigate("/events")}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
          >
            <CalendarDays size={19} />
            Explore events
          </button>
          <button
  onClick={() => navigate("/my-events")}
  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
>
  <CalendarDays size={19} />
  My Events
</button>
          <button
            onClick={() => navigate("/create-event")}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100"

            >

              <CalendarDays size={19} />
              Create event
            </button>

          <button
            onClick={() => navigate("/my-registrations")}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
          >
            <Ticket size={19} />
            My registrations
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
          >
            <UserRound size={19} />
            My profile
          </button>
        </nav>

        <div className="mt-auto border-t border-gray-100 pt-5">
          <div className="mb-4 rounded-xl bg-[#f5f4fb] p-4">
            <p className="text-sm font-semibold">
              Every event. One platform.
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Your next great experience starts here.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={19} />
            Log out
          </button>
        </div>
      </aside>

      <main className="min-h-screen md:ml-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-[#faf8f4]/95 px-5 py-4 backdrop-blur sm:px-8 lg:px-10">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
              Eventra / Dashboard
            </p>
            <h1 className="mt-1 text-lg font-bold sm:text-xl">
              Your workspace
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">
                {user?.name || "Loading..."}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role || "Member"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e9e8f6] font-bold text-[#303b76]">
              {user?.name?.trim().charAt(0).toUpperCase() || "U"}
            </div>

            <button
              onClick={handleLogout}
              title="Log out"
              className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 md:hidden"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          {loading ? (
            <div className="flex min-h-80 flex-col items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#303b76]/20 border-t-[#303b76]" />
              <p className="mt-4 text-sm text-gray-500">
                Preparing your dashboard...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
              <p className="font-semibold text-red-700">{error}</p>
                 <button
                onClick={() => {
                    setLoading(true);
                    setError("");
                    void loadDashboard();
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#303b76] px-5 py-3 text-sm font-semibold text-white hover:bg-[#252e60]"
                >
                <RefreshCw size={16} />
                Try again
                </button>
            </div>
          ) : (
            <>
              <section className="relative overflow-hidden rounded-[1.75rem] bg-[#303b76] p-7 text-white sm:p-10">
                <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
                <div className="absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-[#e77c68]/20 blur-3xl" />

                <div className="relative max-w-2xl">
                  <p className="text-sm font-medium tracking-wide text-white/70">
                    YOUR EVENT JOURNEY STARTS HERE
                  </p>

                  <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
                    Welcome back, {firstName}!
                  </h2>

                  <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
                    Discover what's happening, find experiences worth
                    remembering, and keep your registrations organized.
                  </p>

                  <button
                    onClick={() => navigate("/events")}
                    className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-[#303b76] transition hover:bg-[#f0effb]"
                  >
                    Explore events
                    <ArrowRight size={17} />
                  </button>
                  
                </div>
              </section>

              <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-gray-200/80 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Available events
                    </span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eeeef8] text-[#303b76]">
                      <CalendarDays size={21} />
                    </span>
                  </div>
                  <p className="mt-5 text-3xl font-bold">{events.length}</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Approved events to explore
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      My registrations
                    </span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff0eb] text-[#d96d59]">
                      <Ticket size={21} />
                    </span>
                  </div>
                  <p className="mt-5 text-3xl font-bold">
                    {registrations.length}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Total registrations
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-6 sm:col-span-2 xl:col-span-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Approved registrations
                    </span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f7ef] text-[#28764b]">
                      <Ticket size={21} />
                    </span>
                  </div>
                  <p className="mt-5 text-3xl font-bold">
                    {approvedRegistrations}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    You're confirmed to attend
                  </p>
                </div>
              </section>

              <section className="mt-12">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d96d59]">
                      FIND YOUR NEXT EXPERIENCE
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">
                      Explore events
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                      Discover approved events from your community.
                    </p>
                  </div>

                  <button
                    onClick={() => navigate("/events")}
                    className="hidden items-center gap-1 text-sm font-semibold text-[#303b76] hover:underline sm:flex"
                  >
                    View all <ArrowRight size={16} />
                  </button>
                </div>

                {events.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                    <CalendarDays
                      size={32}
                      className="mx-auto text-gray-400"
                    />
                    <h3 className="mt-4 font-semibold">
                      No approved events to show yet
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Approved events will appear here when they're available.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {events.slice(0, 6).map((event) => (
                      <article
                        key={event.id}
                        className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white transition hover:-translate-y-1 hover:shadow-lg hover:shadow-[#303b76]/5"
                      >
                        <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#eeeef8] to-[#fcece7]">
                          <CalendarDays
                            size={42}
                            strokeWidth={1.4}
                            className="text-[#303b76]/65"
                          />
                        </div>

                        <div className="p-5">
                          <span className="rounded-full bg-[#eeeef8] px-3 py-1 text-xs font-semibold text-[#303b76]">
                            {event.category || "Event"}
                          </span>

                          <h3 className="mt-4 text-lg font-bold">
                            {event.title}
                          </h3>

                          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500">
                            {event.description ||
                              "Explore this event to learn more."}
                          </p>

                          {event.startTime && (
                            <p className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                              <Clock3 size={16} />
                              {new Date(event.startTime).toLocaleString(
                                undefined,
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }
                              )}
                            </p>
                          )}

                          {event.venue?.name && (
                            <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                              <MapPin size={16} />
                              {event.venue.name}
                            </p>
                          )}

                          <div className="mt-5 flex flex-col gap-2">
  <button
    onClick={() => navigate(`/events/${event.id}`)}
    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#303b76]/20 px-4 py-3 text-sm font-semibold text-[#303b76] transition hover:bg-[#303b76] hover:text-white"
  >
    View details
    <ArrowRight size={16} />
  </button>

</div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

            </>
          )}
        </div>
      </main>
    </div>
  );
}

