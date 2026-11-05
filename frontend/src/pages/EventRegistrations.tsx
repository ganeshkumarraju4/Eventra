import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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

const statusBadgeStyles: Record<RegistrationStatus, string> = {
  APPROVED: "bg-[#EBF5E8] text-[#266B22] border border-[#C7E6C0]",
  PENDING: "bg-[#FEF5E7] text-[#B45309] border border-[#FADFA8]",
  REJECTED: "bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4]",
  CANCELLED: "bg-[#F1EFEB] text-[#6B6862] border border-[#DFDAD0]",
};

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
      } catch (err: unknown) {
        if (!active) return;
        const axiosError = err as {
          response?: { status?: number; data?: { message?: string } };
        };
        setError(
          axiosError.response?.data?.message ??
            "Unable to load registrations. Please try again."
        );
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
        response?: { data?: { message?: string } };
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
    (registration) => filter === "ALL" || registration.status === filter
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#20201F] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          to="/my-events"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#77736E] transition hover:text-[#E85D3F] mb-6"
        >
          <ArrowLeft size={16} />
          Back to My Events
        </Link>

        {/* Page Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-black/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E85D3F]/30 bg-[#E85D3F]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#C64A30] mb-3">
              <Users size={13} />
              Attendee Manager
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#20201F] sm:text-4xl">
              Registrations & RSVPs
            </h1>
            <p className="mt-2 text-sm text-[#77736E]">
              Event: <strong className="text-[#20201F]">{eventTitle}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/events/${eventId}`}
              className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#20201F] hover:bg-[#FAF7F2] transition"
            >
              Public Event Page
            </Link>

            <button
              onClick={() => {
                setLoading(true);
                void loadRegistrations();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#20201F] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#E85D3F] transition cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#77736E]">
                Total Registrations
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#20201F]">
                <Users size={18} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black text-[#20201F]">
              {registrations.length}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#77736E]">
                Pending Approval
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEF5E7] text-[#B45309]">
                <Clock3 size={18} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black text-[#B45309]">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#77736E]">
                Confirmed
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF5E8] text-[#266B22]">
                <CheckCircle2 size={18} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black text-[#266B22]">
              {approvedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#77736E]">
                Rejected / Cancelled
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDE8E8] text-[#9B1C1C]">
                <XCircle size={18} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black text-[#9B1C1C]">
              {rejectedCount}
            </p>
          </div>
        </div>

        {/* Action Error */}
        {actionError && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {actionError}
          </div>
        )}

        {/* Filter and Attendee List */}
        <section className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
            <div>
              <h2 className="text-xl font-bold text-[#20201F]">
                Registered Attendees
              </h2>
              <p className="text-xs text-[#77736E]">
                Review guest details and take required approval actions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#77736E]">
                Filter:
              </span>
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as "ALL" | RegistrationStatus)
                }
                className="rounded-xl border border-black/15 bg-white px-4 py-2 text-xs font-bold text-[#20201F] outline-none focus:border-[#E85D3F]"
              >
                <option value="ALL">All Statuses ({registrations.length})</option>
                <option value="PENDING">Pending Only ({pendingCount})</option>
                <option value="APPROVED">Confirmed Only ({approvedCount})</option>
                <option value="REJECTED">Rejected Only ({rejectedCount})</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[30vh] flex-col items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E85D3F]/20 border-t-[#E85D3F]" />
              <p className="mt-4 text-sm font-semibold text-[#77736E]">
                Loading attendees...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center max-w-md mx-auto shadow-sm">
              <p className="font-bold text-red-700">{error}</p>
              <button
                onClick={() => void loadRegistrations()}
                className="mt-4 rounded-xl bg-[#20201F] px-5 py-2 text-xs font-bold uppercase text-white hover:bg-[#E85D3F]"
              >
                Retry
              </button>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-black/15 bg-white p-14 text-center mt-4">
              <Users size={36} className="mx-auto text-[#77736E]" />
              <h3 className="mt-4 font-bold text-base text-[#20201F]">
                No attendees match this filter
              </h3>
              <p className="mt-1 text-xs text-[#77736E]">
                When attendees sign up for this event, their registration info will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {filteredRegistrations.map((registration) => (
                <article
                  key={registration.id}
                  className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm transition hover:shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E85D3F]/10 font-bold text-[#E85D3F] text-base">
                      {registration.user?.name?.trim().charAt(0).toUpperCase() || "U"}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-[#20201F]">
                        {registration.user?.name ?? "Unknown Attendee"}
                      </h3>

                      <p className="flex items-center gap-1.5 text-xs text-[#77736E] mt-0.5 truncate">
                        <Mail size={13} className="shrink-0 text-[#E85D3F]" />
                        {registration.user?.email}
                      </p>

                      <p className="flex items-center gap-1.5 text-[11px] text-[#77736E] mt-1.5">
                        <CalendarDays size={13} />
                        Signed up{" "}
                        {new Date(registration.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        statusBadgeStyles[registration.status] ??
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {registration.status}
                    </span>

                    {registration.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          disabled={processingId === registration.id}
                          onClick={() =>
                            void updateRegistration(registration.id, "approve")
                          }
                          className="rounded-xl bg-[#266B22] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#1E541B] transition disabled:opacity-50 cursor-pointer"
                        >
                          {processingId === registration.id ? "..." : "Approve"}
                        </button>

                        <button
                          disabled={processingId === registration.id}
                          onClick={() =>
                            void updateRegistration(registration.id, "reject")
                          }
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-700 hover:bg-red-100 transition disabled:opacity-50 cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}