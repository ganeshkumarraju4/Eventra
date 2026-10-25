import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  XCircle,
  Clock3,
  RefreshCw,
  Mail,
  CalendarDays,
} from "lucide-react";
import api from "../api/axios";

interface Attendee {
  id: string;
  name: string;
  email: string;
}

type RegistrationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

interface Registration {
  id: string;
  status: RegistrationStatus;
  createdAt: string;
  user: Attendee;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusStyle(status: RegistrationStatus) {
  switch (status) {
    case "APPROVED":
      return "bg-green-50 text-green-700";

    case "PENDING":
      return "bg-amber-50 text-amber-700";

    case "REJECTED":
      return "bg-red-50 text-red-700";

    case "CANCELLED":
      return "bg-gray-100 text-gray-600";
  }
}

export default function EventRegistrations() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [eventTitle, setEventTitle] = useState("Event Registrations");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | RegistrationStatus>("ALL");

  const loadRegistrations = useCallback(async () => {
    if (!eventId) {
      setError("Event ID is missing.");
      setLoading(false);
      return;
    }

    try {
      const [registrationsResponse, eventResponse] = await Promise.all([
        api.get(`/registrations/event/${eventId}`),
        api.get(`/events/${eventId}`),
      ]);

      setRegistrations(registrationsResponse.data.registrations ?? []);
      setEventTitle(eventResponse.data.event?.title ?? "Event Registrations");
      setError("");
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
            "You are not authorized to view these registrations."
        );
        return;
      }

      setError(
        axiosError.response?.data?.message ??
          "Unable to load registrations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      if (!localStorage.getItem("token")) {
        navigate("/login", { replace: true });
        return;
      }

      if (!eventId) {
        setError("Event ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const [registrationsResponse, eventResponse] = await Promise.all([
          api.get(`/registrations/event/${eventId}`),
          api.get(`/events/${eventId}`),
        ]);

        if (!active) return;

        setRegistrations(registrationsResponse.data.registrations ?? []);
        setEventTitle(eventResponse.data.event?.title ?? "Event Registrations");
        setError("");
      } catch (err: unknown) {
        if (!active) return;

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
              "You are not authorized to view these registrations."
          );
        } else {
          setError(
            axiosError.response?.data?.message ??
              "Unable to load registrations. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchData();

    return () => {
      active = false;
    };
  }, [eventId, navigate]);

  async function updateRegistration(
    registrationId: string,
    action: "approve" | "reject"
  ) {
    setProcessingId(registrationId);
    setActionError("");

    try {
      await api.patch(`/registrations/${registrationId}/${action}`);
      await loadRegistrations();
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          data?: { message?: string };
        };
      };

      setActionError(
        axiosError.response?.data?.message ??
          `Unable to ${action} this registration.`
      );
    } finally {
      setProcessingId(null);
    }
  }

  const pendingCount = registrations.filter(
    (registration) => registration.status === "PENDING"
  ).length;

  const approvedCount = registrations.filter(
    (registration) => registration.status === "APPROVED"
  ).length;

  const rejectedCount = registrations.filter(
    (registration) => registration.status === "REJECTED"
  ).length;

  const filteredRegistrations = registrations.filter(
    (registration) =>
      filter === "ALL" || registration.status === filter
  );

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#20253b]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#303b76]"
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>

          <span className="text-xl font-extrabold text-[#303b76]">
            Eventra<span className="text-[#e77c68]">.</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-[#d96d59]">
              ORGANIZER WORKSPACE
            </p>

            <h1 className="mt-2 text-3xl font-extrabold">
              Manage Registrations
            </h1>

            <p className="mt-2 text-sm text-gray-500">{eventTitle}</p>
          </div>

          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            View Event
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-72 flex-col items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#303b76]/20 border-t-[#303b76]" />

            <p className="mt-4 text-sm text-gray-500">
              Loading registrations...
            </p>
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-8 text-center">
            <p className="font-semibold text-red-700">{error}</p>

            <button
              onClick={() => {
                setLoading(true);
                void loadRegistrations();
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#303b76] px-5 py-3 text-sm font-semibold text-white"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total registrations"
                count={registrations.length}
                icon={<Users size={22} />}
              />

              <StatCard
                label="Pending"
                count={pendingCount}
                icon={<Clock3 size={22} />}
              />

              <StatCard
                label="Approved"
                count={approvedCount}
                icon={<CheckCircle2 size={22} />}
              />

              <StatCard
                label="Rejected"
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
                  <h2 className="text-xl font-bold">Attendees</h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Review and manage event registrations.
                  </p>
                </div>

                <select
                  value={filter}
                  onChange={(e) =>
                    setFilter(e.target.value as "ALL" | RegistrationStatus)
                  }
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#303b76]"
                >
                  <option value="ALL">All registrations</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {filteredRegistrations.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
                  <Users
                    size={36}
                    className="mx-auto text-gray-400"
                  />

                  <h3 className="mt-4 font-semibold">
                    No registrations found
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Registrations matching this filter will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {filteredRegistrations.map((registration) => (
                    <article
                      key={registration.id}
                      className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eeeef8] text-lg font-bold text-[#303b76]">
                            {registration.user?.name
                              ?.trim()
                              .charAt(0)
                              .toUpperCase() || "U"}
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-bold">
                              {registration.user?.name ?? "Unknown attendee"}
                            </h3>

                            <p className="mt-1 flex items-center gap-2 break-all text-sm text-gray-500">
                              <Mail size={15} className="shrink-0" />
                              {registration.user?.email ?? "No email available"}
                            </p>

                            <p className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                              <CalendarDays size={14} />
                              Registered{" "}
                              {formatDate(registration.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                              registration.status
                            )}`}
                          >
                            {registration.status}
                          </span>

                          {registration.status === "PENDING" && (
                            <div className="flex gap-2">
                              <button
                                disabled={processingId === registration.id}
                                onClick={() =>
                                  void updateRegistration(
                                    registration.id,
                                    "approve"
                                  )
                                }
                                className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                {processingId === registration.id
                                  ? "Processing..."
                                  : "Approve"}
                              </button>

                              <button
                                disabled={processingId === registration.id}
                                onClick={() =>
                                  void updateRegistration(
                                    registration.id,
                                    "reject"
                                  )
                                }
                                className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
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