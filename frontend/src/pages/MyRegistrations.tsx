import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Ticket,
  RefreshCw,
  Eye,
  ClipboardList,
} from "lucide-react";
import api from "../api/axios";

interface EventItem {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  category?: string;
  venue?: {
    name?: string;
    location?: string;
  } | null;
}

interface RegistrationAnswer {
  id: string;
  value: unknown;
  field?: {
    label: string;
    fieldType: string;
  };
}

interface Registration {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  event?: EventItem;
  answers?: RegistrationAnswer[];
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusStyle(status: Registration["status"]) {
  switch (status) {
    case "APPROVED":
      return "bg-green-50 text-green-700";

    case "PENDING":
      return "bg-amber-50 text-amber-700";

    case "REJECTED":
      return "bg-red-50 text-red-700";

    case "CANCELLED":
      return "bg-gray-100 text-gray-600";

    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function MyRegistrations() {
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

 async function loadRegistrations() {
  try {
    const response = await api.get("/registrations/my");
    const data = response.data.registrations;

    setRegistrations(Array.isArray(data) ? data : []);
    setError("");
  } catch (err: unknown) {
    const axiosError = err as {
      response?: {
        status?: number;
        data?: {
          message?: string;
        };
      };
    };

    if (
      axiosError.response?.status === 401 ||
      axiosError.response?.status === 403
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
      return;
    }

    setError(
      axiosError.response?.data?.message ??
        "Unable to load your registrations. Please try again."
    );
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  let active = true;

  if (!localStorage.getItem("token")) {
    navigate("/login", { replace: true });
    return;
  }

  async function fetchRegistrations() {
    try {
      const response = await api.get("/registrations/my");

      if (!active) return;

      const data = response.data.registrations;
      setRegistrations(Array.isArray(data) ? data : []);
      setError("");
    } catch (err: unknown) {
      if (!active) return;

      const axiosError = err as {
        response?: {
          status?: number;
          data?: {
            message?: string;
          };
        };
      };

      if (
        axiosError.response?.status === 401 ||
        axiosError.response?.status === 403
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      setError(
        axiosError.response?.data?.message ??
          "Unable to load your registrations. Please try again."
      );
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }

  void fetchRegistrations();

  return () => {
    active = false;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#20253b]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-[#303b76]"
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>

          <span className="text-xl font-extrabold text-[#303b76]">
            Eventra<span className="text-[#e77c68]">.</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eeeef8] text-[#303b76]">
                <Ticket size={24} />
              </span>

              <div>
                <h1 className="text-3xl font-extrabold">
                  My Registrations
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Keep track of the events you've joined.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate("/events")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#303b76] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#252e60]"
          >
            <CalendarDays size={18} />
            Explore Events
          </button>
        </div>

        {/* Registration count */}
        {!loading && !error && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white p-5">
            <ClipboardList className="text-[#303b76]" size={23} />

            <div>
              <p className="text-2xl font-bold">
                {registrations.length}
              </p>

              <p className="text-sm text-gray-500">
                Total registrations
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-72 flex-col items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#303b76]/20 border-t-[#303b76]" />

            <p className="mt-4 text-sm text-gray-500">
              Loading your registrations...
            </p>
          </div>
        ) : error ? (
          /* Error */
          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-8 text-center">
            <p className="font-semibold text-red-700">{error}</p>

           <button
            onClick={() => {
              setError("");
              setLoading(true);
              void loadRegistrations();
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#303b76] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#252e60]"
          >
            <RefreshCw size={16} />
            Try Again
          </button>     
          </div>
        ) : registrations.length === 0 ? (
          /* Empty state */
          <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <Ticket
              size={42}
              className="mx-auto text-gray-400"
              strokeWidth={1.4}
            />

            <h2 className="mt-5 text-xl font-bold">
              No registrations yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Events you register for will appear here, along with their
              registration status and details.
            </p>

            <button
              onClick={() => navigate("/events")}
              className="mt-6 rounded-xl bg-[#303b76] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#252e60]"
            >
              Explore Events
            </button>
          </div>
        ) : (
          /* Registration list */
          <div className="mt-8 space-y-5">
            {registrations.map((registration) => {
              const event = registration.event;

              return (
                <article
                  key={registration.id}
                  className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="p-5 sm:p-7">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        {event?.category && (
                          <span className="inline-flex rounded-full bg-[#eeeef8] px-3 py-1 text-xs font-semibold text-[#303b76]">
                            {event.category}
                          </span>
                        )}

                        <h2 className="mt-3 text-xl font-bold">
                          {event?.title ?? "Event details unavailable"}
                        </h2>

                        {event?.description && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                            {event.description}
                          </p>
                        )}
                      </div>

                      <span
                        className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                          registration.status
                        )}`}
                      >
                        {registration.status}
                      </span>
                    </div>

                    {event && (
                      <div className="mt-5 grid gap-3 border-t border-gray-100 pt-5 sm:grid-cols-2">
                        <div className="flex items-start gap-3 text-sm text-gray-600">
                          <CalendarDays
                            size={18}
                            className="mt-0.5 shrink-0 text-[#303b76]"
                          />

                          <div>
                            <p className="font-medium text-gray-800">
                              {formatDate(event.startTime)}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Event date
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 text-sm text-gray-600">
                          <Clock3
                            size={18}
                            className="mt-0.5 shrink-0 text-[#303b76]"
                          />

                          <div>
                            <p className="font-medium text-gray-800">
                              {formatTime(event.startTime)}
                              {" - "}
                              {formatTime(event.endTime)}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Event time
                            </p>
                          </div>
                        </div>

                        {event.venue?.name && (
                          <div className="flex items-start gap-3 text-sm text-gray-600 sm:col-span-2">
                            <MapPin
                              size={18}
                              className="mt-0.5 shrink-0 text-[#303b76]"
                            />

                            <span>{event.venue.name}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-6 flex flex-col justify-between gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center">
                      <p className="break-all text-xs text-gray-400">
                        Registration ID: {registration.id}
                      </p>

                      {event && (
                        <button
                          onClick={() => navigate(`/events/${event.id}`)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#303b76]/20 px-5 py-2.5 text-sm font-semibold text-[#303b76] transition hover:bg-[#303b76] hover:text-white"
                        >
                          <Eye size={17} />
                          View Event
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}