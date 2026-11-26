import { useCallback, useEffect, useState } from "react";
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
  Star,
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import EventImage from "../components/EventImage";

interface EventItem {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  category?: string;
  coverImageUrl?: string | null;
  status?: string;
  feedbackAvailable?: boolean;
  feedbacks?: { rating: number; comment: string | null }[];
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
  const [feedbackRegistration, setFeedbackRegistration] = useState<Registration | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const loadRegistrations = useCallback(async () => {
    try {
      const response = await api.get("/registrations/my");
      const data = response.data.registrations;
      setError("");
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
  }, [navigate]);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }
    void Promise.resolve().then(loadRegistrations);
  }, [loadRegistrations, navigate]);

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

  const openFeedback = (registration: Registration) => {
    const savedFeedback = registration.event?.feedbacks?.[0];
    setFeedbackRegistration(registration);
    setFeedbackRating(savedFeedback?.rating ?? 0);
    setFeedbackComment(savedFeedback?.comment ?? "");
  };

  const submitFeedback = async () => {
    const event = feedbackRegistration?.event;
    if (!event || feedbackRating === 0) return;

    setSubmittingFeedback(true);
    try {
      await api.post(`/events/${event.id}/feedback`, {
        rating: feedbackRating,
        comment: feedbackComment,
      });
      setFeedbackRegistration(null);
      await loadRegistrations();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      alert(axiosError.response?.data?.message || "Failed to save feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const confirmedCount = registrations.filter((r) => r.status === "APPROVED").length;
  const pendingCount = registrations.filter((r) => r.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#20201F] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
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
              onClick={() => {
                setLoading(true);
                void loadRegistrations();
              }}
              disabled={loading}
              className="rounded-xl border border-black/15 bg-white p-3 text-[#20201F] hover:bg-[#FAF7F2] transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm transition hover:shadow-md">
            <p className="text-xs font-bold uppercase tracking-wider text-[#77736E]">
              Total Tickets
            </p>
            <p className="mt-2 text-3xl font-black text-[#20201F]">
              {registrations.length}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm transition hover:shadow-md">
            <p className="text-xs font-bold uppercase tracking-wider text-[#77736E]">
              Confirmed RSVPs
            </p>
            <p className="mt-2 text-3xl font-black text-[#266B22]">
              {confirmedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm transition hover:shadow-md sm:col-span-2 lg:col-span-1">
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
              onClick={() => {
                setLoading(true);
                void loadRegistrations();
              }}
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
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {registrations.map((registration) => {
              const event = registration.event;

              return (
                <article
                  key={registration.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  {event && (
                    <EventImage category={event.category} title={event.title} imageUrl={event.coverImageUrl} className="h-32">
                      <span className="flex items-center gap-1 text-xs font-medium text-white drop-shadow">
                        <Clock3 size={13} />
                        {new Date(event.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </EventImage>
                  )}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-lg font-bold leading-snug text-[#20201F] transition group-hover:text-[#E85D3F]">
                        {event?.title ?? "Event Details Unavailable"}
                        </h2>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            statusBadgeStyles[registration.status] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {registration.status}
                        </span>
                      </div>

                      {event?.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#77736E]">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {event && (
                      <div className="mt-6 border-t border-black/10 pt-4">
                        <div className="mb-4 space-y-2 text-xs text-[#77736E]">
                          <p className="flex items-center gap-1.5 font-medium text-[#20201F]">
                            <CalendarDays size={14} className="shrink-0 text-[#E85D3F]" />
                            {new Date(event.startTime).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          {event.venue?.name && (
                            <p className="flex items-center gap-1.5 truncate">
                              <MapPin size={14} className="shrink-0" />
                              <span className="truncate">
                                {event.venue.name}
                                {event.venue.location && ` · ${event.venue.location}`}
                              </span>
                            </p>
                          )}

                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {registration.answers && registration.answers.length > 0 && (
                            <button
                              onClick={() => setSelectedRegistration(registration)}
                              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#20201F] hover:bg-[#FAF7F2] transition"
                            >
                              <FileText size={13} />
                              My Responses
                            </button>
                          )}

                          <Link
                            to={`/events/${event.id}`}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#FAF7F2] px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#20201F] hover:bg-[#E85D3F] hover:text-white transition"
                          >
                            <Eye size={13} />
                            Event Page
                          </Link>

                          {registration.status === "APPROVED" &&
                            event.status === "APPROVED" &&
                            event.feedbackAvailable && (
                              <button
                                onClick={() => openFeedback(registration)}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#E85D3F]/30 bg-[#E85D3F]/10 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#C64A30] hover:bg-[#E85D3F]/20 transition"
                              >
                                <Star size={13} />
                                {event.feedbacks?.length ? "Edit Feedback" : "Leave Feedback"}
                              </button>
                            )}

                          {registration.status !== "CANCELLED" && (
                            <button
                              disabled={cancellingId === registration.id}
                              onClick={() =>
                                handleCancelRegistration(registration.id, event.title)
                              }
                              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                            >
                              <XCircle size={13} />
                              {cancellingId === registration.id ? "Cancelling..." : "Cancel RSVP"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
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

        {feedbackRegistration?.event && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#20201F]">
                    Share your feedback
                  </h2>
                  <p className="mt-1 text-sm text-[#77736E]">
                    {feedbackRegistration.event.title}
                  </p>
                </div>
                <button
                  onClick={() => setFeedbackRegistration(null)}
                  className="rounded-full p-1.5 text-[#77736E] hover:bg-black/5"
                  aria-label="Close feedback form"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="mt-6 text-sm font-bold text-[#20201F]">
                How was the event?
              </p>
              <div className="mt-2 flex gap-2" role="group" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFeedbackRating(rating)}
                    aria-label={`${rating} ${rating === 1 ? "star" : "stars"}`}
                    aria-pressed={feedbackRating === rating}
                    className="rounded-md p-1 text-[#E85D3F] transition hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={rating <= feedbackRating ? "fill-current" : ""}
                    />
                  </button>
                ))}
              </div>

              <label className="mt-5 block text-sm font-bold text-[#20201F]">
                Anything you would like to share? (optional)
                <textarea
                  value={feedbackComment}
                  onChange={(event) => setFeedbackComment(event.target.value)}
                  maxLength={1000}
                  rows={4}
                  className="mt-2 w-full resize-y rounded-xl border border-black/15 p-3 text-sm font-normal outline-none focus:border-[#E85D3F]"
                  placeholder="What made the event memorable?"
                />
              </label>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setFeedbackRegistration(null)}
                  className="rounded-xl border border-black/15 px-4 py-2.5 text-sm font-bold text-[#20201F] hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void submitFeedback()}
                  disabled={feedbackRating === 0 || submittingFeedback}
                  className="rounded-xl bg-[#E85D3F] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#20201F] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingFeedback ? "Saving..." : "Save Feedback"}
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