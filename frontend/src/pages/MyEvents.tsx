import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import api from "../api/axios";

interface Venue {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

interface Booking {
  id: string;
  venue: Venue;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  category: string;
  type: "PUBLIC" | "PRIVATE";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  maxParticipants: number | null;
  booking: Booking | null;
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-200 text-gray-700",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyEvents() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/events/my");

      setEvents(response.data.events ?? []);
    } catch (err: unknown) {
      const error = err as {
        response?: {
          status?: number;
          data?: { message?: string };
        };
      };

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to load your events. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    navigate("/login", { replace: true });
    return;
  }

  const timer = window.setTimeout(() => {
    void loadEvents();
  }, 0);

  return () => window.clearTimeout(timer);
}, [navigate, loadEvents]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              <ArrowLeft size={17} />
              Back to Dashboard
            </button>

            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Organizer Workspace
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              My Events
            </h1>

            <p className="mt-2 text-slate-600">
              Manage the events you have created and track their approval status.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => void loadEvents()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={() => navigate("/create-event")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Plus size={18} />
              Create Event
            </button>
          </div>
        </div>

        {/* Event count */}
        {!loading && !error && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total events created
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {events.length}
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            <p className="mt-4 font-medium text-slate-600">
              Loading your events...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <p className="font-semibold text-red-700">{error}</p>

            <button
              onClick={() => void loadEvents()}
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && events.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <CalendarDays size={30} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Your event journey starts here
            </h2>

            <p className="mx-auto mt-2 max-w-md text-slate-600">
              You haven't created any events yet. Create your first event and
              track its progress right here.
            </p>

            <button
              onClick={() => navigate("/create-event")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              <Plus size={18} />
              Create Your First Event
            </button>
          </div>
        )}

        {/* Events list */}
        {!loading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {events.map((event) => {
              const venue = event.booking?.venue;

              return (
                <article
                  key={event.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  {/* Card header */}
                  <div className="border-b border-slate-100 p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                        {event.category.replace(/_/g, " ")}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          statusStyles[event.status] ??
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {event.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900">
                      {event.title}
                    </h2>

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                      {event.description || "No description provided."}
                    </p>
                  </div>

                  {/* Event information */}
                  <div className="space-y-4 p-6">
                    <div className="flex items-start gap-3">
                      <CalendarDays
                        size={19}
                        className="mt-0.5 shrink-0 text-indigo-600"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {formatDate(event.startTime)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatTime(event.startTime)} –{" "}
                          {formatTime(event.endTime)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin
                        size={19}
                        className="mt-0.5 shrink-0 text-indigo-600"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {venue?.name || "Venue information unavailable"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {venue?.location || "Location not available"}
                        </p>
                      </div>
                    </div>

                    {venue && (
                      <div className="flex items-center gap-3">
                        <Users
                          size={19}
                          className="shrink-0 text-indigo-600"
                        />
                        <p className="text-sm text-slate-600">
                          Venue capacity:{" "}
                          <span className="font-semibold text-slate-800">
                            {venue.capacity}
                          </span>
                        </p>
                      </div>
                    )}

                    {event.maxParticipants != null && (
                      <div className="flex items-center gap-3">
                        <Clock3
                          size={19}
                          className="shrink-0 text-indigo-600"
                        />
                        <p className="text-sm text-slate-600">
                          Maximum participants:{" "}
                          <span className="font-semibold text-slate-800">
                            {event.maxParticipants}
                          </span>
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                      <button
                        onClick={() => navigate(`/events/${event.id}`)}
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        View Details
                      </button>

                      {event.status === "APPROVED" && (
                        <button
                          onClick={() =>
                            navigate(`/events/${event.id}/registrations`)
                          }
                          className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                          Manage Registrations
                        </button>
                      )}
                    </div>

                    {event.status === "PENDING" && (
                      <p className="text-xs leading-5 text-amber-700">
                        Your event is awaiting administrator approval.
                      </p>
                    )}

                    {event.status === "REJECTED" && (
                      <p className="text-xs leading-5 text-red-700">
                        This event was rejected. Review its details before
                        deciding on your next steps.
                      </p>
                    )}

                    {event.status === "CANCELLED" && (
                      <p className="text-xs leading-5 text-slate-500">
                        This event has been cancelled.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}