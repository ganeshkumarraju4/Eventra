import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock3,
  LogOut,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import api from "../api/axios";

interface EventItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  startTime: string;
  endTime: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
  >("ALL");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/events");
      const data = response.data;

      const fetchedEvents: EventItem[] = Array.isArray(data)
        ? data
        : data.events ?? [];

      setEvents(fetchedEvents);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          status?: number;
          data?: { message?: string };
        };
      };

      if (
        axiosError.response?.status === 401 ||
        axiosError.response?.status === 403
      ) {
        setError(
          axiosError.response?.data?.message ??
            "You are not authorized to access the admin dashboard.",
        );
      } else {
        setError("Unable to load events. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

 useEffect(() => {
  let active = true;

  async function verifyAdmin() {
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const response = await api.get("/auth/me");

      if (!active) return;

      const user = response.data.user;

      if (user?.role !== "ADMIN") {
        navigate("/dashboard", { replace: true });
        return;
      }

      await loadEvents();
    } catch {
      if (!active) return;

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      navigate("/login", { replace: true });
    }
  }

  void verifyAdmin();

  return () => {
    active = false;
  };
}, [navigate, loadEvents]);

  async function updateEvent(
    eventId: string,
    action: "approve" | "reject",
  ) {
    setProcessingId(eventId);
    setActionError("");

    try {
      await api.patch(`/events/${eventId}/${action}`);
      await loadEvents();
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          data?: { message?: string };
        };
      };

      setActionError(
        axiosError.response?.data?.message ??
          `Unable to ${action} this event.`,
      );
    } finally {
      setProcessingId(null);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  const pendingCount = events.filter(
    (event) => event.status === "PENDING",
  ).length;

  const approvedCount = events.filter(
    (event) => event.status === "APPROVED",
  ).length;

  const rejectedCount = events.filter(
    (event) => event.status === "REJECTED",
  ).length;

  const filteredEvents = events.filter(
    (event) => filter === "ALL" || event.status === filter,
  );

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#20253b]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#303b76] text-white">
              <ShieldCheck size={23} />
            </span>

            <div>
              <h1 className="text-xl font-extrabold text-[#303b76]">
                Eventra Admin
              </h1>
              <p className="text-xs text-gray-500">
                Administration workspace
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={17} />
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#d96d59]">
              ADMINISTRATION
            </p>

            <h2 className="mt-2 text-3xl font-extrabold">
              Event Management
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Review event submissions and manage approval decisions.
            </p>
          </div>

          <button
            onClick={() => void loadEvents()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#303b76] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#252e60] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh events
          </button>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total events"
            count={events.length}
            icon={<CalendarDays size={22} />}
          />

          <StatCard
            label="Pending approval"
            count={pendingCount}
            icon={<Clock3 size={22} />}
          />

          <StatCard
            label="Approved events"
            count={approvedCount}
            icon={<CheckCircle2 size={22} />}
          />

          <StatCard
            label="Rejected events"
            count={rejectedCount}
            icon={<XCircle size={22} />}
          />
        </section>

        {actionError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {actionError}
          </div>
        )}

        <section className="mt-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-bold">Submitted events</h3>
              <p className="mt-1 text-sm text-gray-500">
                Review event details and take appropriate action.
              </p>
            </div>

            <select
              value={filter}
              onChange={(event) =>
                setFilter(
                  event.target.value as
                    | "ALL"
                    | "PENDING"
                    | "APPROVED"
                    | "REJECTED"
                    | "CANCELLED",
                )
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#303b76]"
            >
              <option value="ALL">All events</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#303b76]/20 border-t-[#303b76]" />
              <p className="mt-4 text-sm text-gray-500">
                Loading events...
              </p>
            </div>
          ) : error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-white p-8 text-center">
              <p className="font-semibold text-red-700">{error}</p>

              <button
                onClick={() => void loadEvents()}
                className="mt-5 rounded-xl bg-[#303b76] px-5 py-3 text-sm font-semibold text-white"
              >
                Try again
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
              <CalendarDays
                size={36}
                className="mx-auto text-gray-400"
              />

              <h3 className="mt-4 font-semibold">No events found</h3>

              <p className="mt-2 text-sm text-gray-500">
                There are no events matching the selected filter.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredEvents.map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-[#eeeef8] px-3 py-1 text-xs font-semibold text-[#303b76]">
                          {event.category}
                        </span>

                        <StatusBadge status={event.status} />
                      </div>

                      <h3 className="mt-3 text-lg font-bold">
                        {event.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        {event.description || "No description provided."}
                      </p>

                      {event.startTime && (
                        <p className="mt-3 text-sm text-gray-500">
                          Starts:{" "}
                          {new Date(event.startTime).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        onClick={() => navigate(`/events/${event.id}`)}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        View details
                        <ArrowRight size={16} />
                      </button>

                      {event.status === "PENDING" && (
                        <>
                          <button
                            disabled={processingId === event.id}
                            onClick={() =>
                              void updateEvent(event.id, "approve")
                            }
                            className="rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                          >
                            {processingId === event.id
                              ? "Processing..."
                              : "Approve"}
                          </button>

                          <button
                            disabled={processingId === event.id}
                            onClick={() =>
                              void updateEvent(event.id, "reject")
                            }
                            className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: EventItem["status"];
}) {
  const styles: Record<EventItem["status"], string> = {
    PENDING: "bg-amber-50 text-amber-700",
    APPROVED: "bg-green-50 text-green-700",
    REJECTED: "bg-red-50 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  count,
  icon,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eeeef8] text-[#303b76]">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold">{count}</p>
    </div>
  );
}