import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Ticket,
  RefreshCw,
  Eye,
  XCircle,
  FileText,
  X,
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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

const statusBadgeStyles: Record<string, string> = {
  APPROVED: "bg-[#EBF5E8] text-[#266B22] border border-[#C7E6C0]",
  PENDING: "bg-[#FEF5E7] text-[#B45309] border border-[#FADFA8]",
  REJECTED: "bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4]",
  CANCELLED: "bg-[#F1EFEB] text-[#6B6862] border border-[#DFDAD0]",
};

export default function MyRegistrations() {
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

  async function loadRegistrations() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/registrations/my");
      const data = response.data.registrations;
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { status?: number; data?: { message?: string } };
      };

      if (
        axiosError.response?.status === 401 ||
        axiosError.response?.status === 403
      ) {
        localStorage.removeItem("token");
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
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }
    void loadRegistrations();
  }, [navigate]);

  const handleCancelRegistration = async (registrationId: string, eventTitle?: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel your registration for "${eventTitle || "this event"}"?`
    );
    if (!confirmed) return;

    setCancellingId(registrationId);
    try {
      await api.patch(`/registrations/${registrationId}/cancel`);
      await loadRegistrations();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      alert(axiosError.response?.data?.message || "Failed to cancel registration.");
    } finally {
      setCancellingId(null);
    }
  };

  const confirmedCount = registrations.filter((r) => r.status === "APPROVED").length;
  const pendingCount = registrations.filter((r) => r.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#20201F] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-black/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E85D3F]/30 bg-[#E85D3F]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#C64A30] mb-3">
              <Ticket size={13} />
              Personal Wallet
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#20201F] sm:text-4xl">
              My Registrations & Tickets
            </h1>
            <p className="mt-2 text-sm text-[#77736E]">
              Track your RSVPs, view event schedules, and access confirmation details.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 rounded-xl bg-[#E85D3F] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#20201F] transition"
            >
              <CalendarDays size={16} />
              Explore More Events
            </Link>

            <button
              onClick={() => void loadRegistrations()}
              disabled={loading}
              className="rounded-xl border border-black/15 bg-white p-3 text-[#20201F] hover:bg-[#FAF7F2] transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#77736E]">
              Total Tickets
            </p>
            <p className="mt-2 text-3xl font-black text-[#20201F]">
              {registrations.length}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#77736E]">
              Confirmed RSVPs
            </p>
            <p className="mt-2 text-3xl font-black text-[#266B22]">
              {confirmedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#77736E]">
              Pending Approvals
            </p>
            <p className="mt-2 text-3xl font-black text-[#B45309]">
              {pendingCount}
            </p>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E85D3F]/20 border-t-[#E85D3F]" />
            <p className="mt-4 text-sm font-semibold text-[#77736E]">
              Loading your tickets...
            </p>
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-8 text-center max-w-md mx-auto shadow-sm">
            <p className="font-bold text-red-700">{error}</p>
            <button
              onClick={() => void loadRegistrations()}
              className="mt-4 rounded-xl bg-[#20201F] px-5 py-2 text-xs font-bold uppercase text-white hover:bg-[#E85D3F]"
            >
              Retry
            </button>
          </div>
        ) : registrations.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-black/15 bg-white p-16 text-center">
            <Ticket size={42} className="mx-auto text-[#77736E]" />
            <h2 className="mt-5 text-xl font-bold text-[#20201F]">
              No registrations found
            </h2>
            <p className="mt-1 text-sm text-[#77736E] max-w-md mx-auto">
              You haven't signed up for any events yet. Check out the community
              calendar to find experiences worth showing up for.
            </p>
            <Link
              to="/events"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#E85D3F] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#20201F] transition"
            >
              Explore Events Now
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {registrations.map((registration) => {
              const event = registration.event;

              return (
                <article
                  key={registration.id}
                  className="rounded-3xl border border-black/[0.08] bg-white p-6 sm:p-8 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      {event?.category && (
                        <span className="rounded-full bg-[#E85D3F]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#C64A30]">
                          {event.category}
                        </span>
                      )}

                      <h2 className="mt-3 text-2xl font-bold text-[#20201F]">
                        {event?.title ?? "Event Details Unavailable"}
                      </h2>

                      {event?.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#77736E] max-w-2xl">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <span
                      className={`rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider self-start shrink-0 ${
                        statusBadgeStyles[registration.status] ??
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {registration.status}
                    </span>
                  </div>

                  {event && (
                    <div className="mt-6 grid gap-4 sm:grid-cols-3 border-t border-black/5 pt-5 text-xs text-[#77736E]">
                      <div className="flex items-center gap-2 font-medium text-[#20201F]">
                        <CalendarDays size={16} className="text-[#E85D3F]" />
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
                        <Clock3 size={16} />
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

                      {event.venue?.name && (
                        <div className="flex items-center gap-2 truncate">
                          <MapPin size={16} className="text-[#E85D3F] shrink-0" />
                          <span className="truncate">
                            <strong className="text-[#20201F] font-semibold">{event.venue.name}</strong>
                            {event.venue.location && ` · ${event.venue.location}`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-black/10 pt-5">
                    <p className="text-[11px] font-mono text-[#77736E]">
                      Ticket ID: {registration.id}
                    </p>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {registration.answers && registration.answers.length > 0 && (
                        <button
                          onClick={() => setSelectedRegistration(registration)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-black/15 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#20201F] hover:bg-[#FAF7F2] transition"
                        >
                          <FileText size={13} />
                          My Responses
                        </button>
                      )}

                      {event && (
                        <Link
                          to={`/events/${event.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#20201F] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#E85D3F] hover:text-white transition"
                        >
                          <Eye size={13} className="text-white" />
                          <span className="text-white">Event Page</span>
                        </Link>
                      )}

                      {registration.status !== "CANCELLED" && (
                        <button
                          disabled={cancellingId === registration.id}
                          onClick={() =>
                            handleCancelRegistration(registration.id, event?.title)
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                        >
                          <XCircle size={13} />
                          {cancellingId === registration.id ? "Cancelling..." : "Cancel RSVP"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Modal: View Submitted Responses */}
        {selectedRegistration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-black/10">
              <div className="flex items-center justify-between pb-4 border-b border-black/10">
                <div>
                  <h2 className="text-xl font-black text-[#20201F]">
                    Your Registration Responses
                  </h2>
                  <p className="text-xs text-[#77736E]">
                    {selectedRegistration.event?.title}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRegistration(null)}
                  className="rounded-full p-1.5 text-[#77736E] hover:bg-black/5"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {selectedRegistration.answers?.map((ans) => (
                  <div
                    key={ans.id}
                    className="rounded-xl border border-black/10 bg-[#FAF7F2] p-4 text-xs"
                  >
                    <p className="font-bold text-[#20201F] uppercase tracking-wider text-[11px]">
                      {ans.field?.label || "Field"}
                    </p>
                    <p className="mt-1 text-sm text-[#77736E]">
                      {Array.isArray(ans.value)
                        ? ans.value.join(", ")
                        : typeof ans.value === "boolean"
                        ? ans.value ? "Yes" : "No"
                        : String(ans.value ?? "None provided")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-black/10 mt-5">
                <button
                  onClick={() => setSelectedRegistration(null)}
                  className="w-full rounded-xl bg-[#20201F] py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#E85D3F] transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}