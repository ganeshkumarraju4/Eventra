import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Plus,
  RefreshCw,
  Users,
  Pencil,
  XCircle,
  CalendarClock,
  History,
  Layers,
  X,
  FileText,
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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

interface ChangeRequest {
  id: string;
  requestedStartTime: string;
  requestedEndTime: string;
  requestedVenueId: string;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewComment: string | null;
  createdAt: string;
  requestedVenue?: Venue;
}

const statusBadgeStyles: Record<string, string> = {
  APPROVED: "bg-[#EBF5E8] text-[#266B22] border border-[#C7E6C0]",
  PENDING: "bg-[#FEF5E7] text-[#B45309] border border-[#FADFA8]",
  REJECTED: "bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4]",
  CANCELLED: "bg-[#F1EFEB] text-[#6B6862] border border-[#DFDAD0]",
};

export default function MyEvents() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);

  const [requestingEvent, setRequestingEvent] = useState<EventItem | null>(null);
  const [requestForm, setRequestForm] = useState({
    startTime: "",
    endTime: "",
    venueId: "",
    reason: "",
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const [viewingRequestsEvent, setViewingRequestsEvent] = useState<EventItem | null>(null);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    maxParticipants: "",
  });

  const [saving, setSaving] = useState(false);
  const [cancellingEventId, setCancellingEventId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/events/my");
      setEvents(response.data.events ?? []);
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
        axiosError.response?.data?.message ||
          "Unable to load your events. Please try again."
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

  const timer = setTimeout(() => {
    void loadEvents();
  }, 0);

  return () => clearTimeout(timer);
}, [navigate, loadEvents]);

  const handleEdit = (event: EventItem) => {
    setActionError("");
    setEditingEvent(event);
    setEditForm({
      title: event.title,
      description: event.description,
      category: event.category,
      maxParticipants: event.maxParticipants?.toString() ?? "",
    });
  };

  const handleUpdateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEvent) return;

    const maxParticipants =
      editForm.maxParticipants.trim() === ""
        ? null
        : Number(editForm.maxParticipants);

    if (
      maxParticipants !== null &&
      (!Number.isSafeInteger(maxParticipants) || maxParticipants < 1)
    ) {
      setActionError("Maximum participants must be a positive integer.");
      return;
    }

    setSaving(true);
    setActionError("");

    try {
      await api.patch(`/events/${editingEvent.id}`, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        maxParticipants,
      });

      setEditingEvent(null);
      await loadEvents();
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
      };
      setActionError(
        axiosError.response?.data?.message || "Unable to update event."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEvent = async (event: EventItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel "${event.title}"? This will cancel all attendee registrations and release the venue reservation.`
    );

    if (!confirmed) return;

    setCancellingEventId(event.id);
    setActionError("");

    try {
      await api.patch(`/events/${event.id}/cancel`);
      await loadEvents();
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
      };
      setActionError(
        axiosError.response?.data?.message || "Unable to cancel event."
      );
    } finally {
      setCancellingEventId(null);
    }
  };

  const openChangeRequest = async (event: EventItem) => {
    setActionError("");
    setRequestingEvent(event);
    setVenuesLoading(true);

    try {
      const response = await api.get("/venues");
      setVenues(response.data.venues ?? []);

      setRequestForm({
        startTime: "",
        endTime: "",
        venueId: event.booking?.venue.id ?? "",
        reason: "",
      });
    } catch {
      setActionError("Unable to load venues.");
      setRequestingEvent(null);
    } finally {
      setVenuesLoading(false);
    }
  };

  const handleSubmitChangeRequest = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!requestingEvent) return;

    const start = new Date(requestForm.startTime);
    const end = new Date(requestForm.endTime);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      setActionError("End time must be after start time.");
      return;
    }

    setSubmittingRequest(true);
    setActionError("");

    try {
      await api.post(`/events/${requestingEvent.id}/change-requests`, {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        venueId: requestForm.venueId,
        reason: requestForm.reason.trim() || null,
      });

      setRequestingEvent(null);
      alert("Change request submitted for admin review!");
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
      };
      setActionError(
        axiosError.response?.data?.message || "Unable to submit change request."
      );
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleViewChangeRequests = async (event: EventItem) => {
    setViewingRequestsEvent(event);
    setRequestsLoading(true);
    setChangeRequests([]);
    setActionError("");

    try {
      const response = await api.get(`/events/${event.id}/change-requests`);
      setChangeRequests(response.data.requests ?? []);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
      };
      setActionError(
        axiosError.response?.data?.message || "Unable to fetch change requests."
      );
    } finally {
      setRequestsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#20201F] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-black/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E85D3F]/30 bg-[#E85D3F]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#C64A30] mb-3">
              <Layers size={13} />
              Host Workspace
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#20201F] sm:text-4xl">
              My Organized Events
            </h1>
            <p className="mt-2 text-sm text-[#77736E]">
              Track approvals, manage custom registration questions, and review attendees.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void loadEvents()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-black/15 bg-white px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#20201F] hover:bg-[#FAF7F2] transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <Link
              to="/create-event"
              className="inline-flex items-center gap-2 rounded-xl bg-[#E85D3F] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#20201F] transition"
            >
              <Plus size={16} />
              Create Event
            </Link>
          </div>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {actionError}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E85D3F]/20 border-t-[#E85D3F]" />
            <p className="mt-4 text-sm font-semibold text-[#77736E]">
              Loading your events...
            </p>
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-10 text-center max-w-lg mx-auto shadow-sm">
            <p className="font-bold text-red-700">{error}</p>
            <button
              onClick={() => void loadEvents()}
              className="mt-5 rounded-xl bg-[#20201F] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#E85D3F] transition"
            >
              Try again
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-black/15 bg-white p-16 text-center">
            <CalendarDays size={42} className="mx-auto text-[#77736E]" />
            <h2 className="mt-5 text-xl font-bold text-[#20201F]">
              You haven't hosted any events yet
            </h2>
            <p className="mt-1 text-sm text-[#77736E] max-w-md mx-auto">
              Create an event, pick a venue, and start welcoming registrations from the community.
            </p>
            <Link
              to="/create-event"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#E85D3F] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#20201F] transition"
            >
              <Plus size={16} />
              Host Your First Event
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {events.map((event) => {
              const venue = event.booking?.venue;

              return (
                <article
                  key={event.id}
                  className="rounded-3xl border border-black/[0.08] bg-white p-6 sm:p-7 shadow-sm transition hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    {/* Status & Category */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-[#E85D3F]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#C64A30]">
                        {event.category.replace(/_/g, " ")}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                          statusBadgeStyles[event.status] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>

                    <h2 className="mt-4 text-2xl font-bold text-[#20201F]">
                      {event.title}
                    </h2>

                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#77736E]">
                      {event.description || "No description provided."}
                    </p>

                    {/* Metadata */}
                    <div className="mt-6 space-y-2.5 border-t border-black/5 pt-5 text-xs text-[#77736E]">
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

                      {venue && (
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="shrink-0 mt-0.5 text-[#E85D3F]" />
                          <span>
                            <strong className="text-[#20201F] font-semibold">{venue.name}</strong> ·{" "}
                            {venue.location}
                          </span>
                        </div>
                      )}

                      {event.maxParticipants && (
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>Limit: {event.maxParticipants} attendees</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="mt-8 border-t border-black/10 pt-5 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={`/events/${event.id}`}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-[#FAF7F2] py-2.5 text-xs font-bold uppercase tracking-wider text-[#20201F] hover:bg-[#E85D3F] hover:text-white transition"
                      >
                        Public Page
                      </Link>

                      {event.status !== "REJECTED" && event.status !== "CANCELLED" && (
                        <button
                          onClick={() => handleEdit(event)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-800 hover:bg-amber-100 transition"
                        >
                          <Pencil size={13} />
                          Edit Info
                        </button>
                      )}
                    </div>

                    {event.status !== "REJECTED" && event.status !== "CANCELLED" && (
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          to={`/events/${event.id}/registration-fields`}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-black/15 bg-white py-2.5 text-xs font-bold uppercase tracking-wider text-[#20201F] hover:bg-[#FAF7F2] transition"
                        >
                          <FileText size={13} />
                          Custom Form
                        </Link>

                        {event.status === "APPROVED" ? (
                          <Link
                            to={`/events/${event.id}/registrations`}
                            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#20201F] py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#E85D3F] transition"
                          >
                            <Users size={13} />
                            Attendees
                          </Link>
                        ) : (
                          <div className="flex items-center justify-center py-2.5 text-xs text-[#77736E] italic bg-[#FAF7F2] rounded-xl">
                            Pending Review
                          </div>
                        )}
                      </div>
                    )}

                    {event.status === "APPROVED" && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => void openChangeRequest(event)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 py-2.5 text-xs font-bold uppercase tracking-wider text-purple-800 hover:bg-purple-100 transition"
                        >
                          <CalendarClock size={13} />
                          Reschedule
                        </button>

                        <button
                          onClick={() => void handleViewChangeRequests(event)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-[#FAF7F2] py-2.5 text-xs font-bold uppercase tracking-wider text-[#77736E] hover:text-[#20201F] transition"
                        >
                          <History size={13} />
                          Requests
                        </button>
                      </div>
                    )}

                    {event.status !== "REJECTED" && event.status !== "CANCELLED" && (
                      <button
                        onClick={() => void handleCancelEvent(event)}
                        disabled={cancellingEventId === event.id}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold uppercase tracking-wider text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        {cancellingEventId === event.id ? "Cancelling..." : "Cancel Event"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Modal: Edit Event */}
        {editingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-black/10">
              <div className="flex items-center justify-between pb-4 border-b border-black/10">
                <h2 className="text-xl font-black text-[#20201F]">
                  Edit Event Details
                </h2>
                <button
                  onClick={() => setEditingEvent(null)}
                  className="rounded-full p-1.5 text-[#77736E] hover:bg-black/5"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateEvent} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#20201F]">
                    Event Title *
                  </label>
                  <input
                    required
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#E85D3F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#20201F]">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#E85D3F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#20201F]">
                      Category
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm outline-none focus:border-[#E85D3F]"
                    >
                      {[
                        "CONFERENCE",
                        "WORKSHOP",
                        "SEMINAR",
                        "CONCERT",
                        "SPORTS",
                        "TECHNICAL",
                        "OTHER",
                      ].map((category) => (
                        <option key={category} value={category}>
                          {category.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#20201F]">
                      Attendee Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.maxParticipants}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          maxParticipants: e.target.value,
                        })
                      }
                      placeholder="Empty = unlimited"
                      className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm outline-none focus:border-[#E85D3F]"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-black/10">
                  <button
                    type="button"
                    onClick={() => setEditingEvent(null)}
                    disabled={saving}
                    className="flex-1 rounded-xl border border-black/15 px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#20201F] hover:bg-[#FAF7F2]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-[#E85D3F] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#20201F] disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Request Changes */}
        {requestingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="my-8 w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-black/10">
              <div className="flex items-center justify-between pb-4 border-b border-black/10">
                <div>
                  <h2 className="text-xl font-black text-[#20201F]">
                    Request Reschedule
                  </h2>
                  <p className="text-xs text-[#77736E]">
                    Request updated schedule or venue for {requestingEvent.title}
                  </p>
                </div>
                <button
                  onClick={() => setRequestingEvent(null)}
                  className="rounded-full p-1.5 text-[#77736E] hover:bg-black/5"
                >
                  <X size={18} />
                </button>
              </div>

              {venuesLoading ? (
                <div className="py-8 text-center text-sm text-[#77736E]">
                  Loading venues...
                </div>
              ) : (
                <form onSubmit={handleSubmitChangeRequest} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#20201F]">
                      New Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={requestForm.startTime}
                      onChange={(e) =>
                        setRequestForm({ ...requestForm, startTime: e.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#E85D3F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#20201F]">
                      New End Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={requestForm.endTime}
                      onChange={(e) =>
                        setRequestForm({ ...requestForm, endTime: e.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#E85D3F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#20201F]">
                      Preferred Venue *
                    </label>
                    <select
                      required
                      value={requestForm.venueId}
                      onChange={(e) =>
                        setRequestForm({ ...requestForm, venueId: e.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#E85D3F]"
                    >
                      <option value="">— Select Venue —</option>
                      {venues.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} · {v.location} (Capacity: {v.capacity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#20201F]">
                      Reason for Reschedule
                    </label>
                    <textarea
                      rows={3}
                      value={requestForm.reason}
                      onChange={(e) =>
                        setRequestForm({ ...requestForm, reason: e.target.value })
                      }
                      placeholder="Explain why you need this change (venue conflict, speaker availability, etc.)..."
                      className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#E85D3F]"
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-black/10">
                    <button
                      type="button"
                      onClick={() => setRequestingEvent(null)}
                      disabled={submittingRequest}
                      className="flex-1 rounded-xl border border-black/15 px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#20201F] hover:bg-[#FAF7F2]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingRequest}
                      className="flex-1 rounded-xl bg-[#E85D3F] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#20201F] disabled:opacity-50"
                    >
                      {submittingRequest ? "Submitting..." : "Submit Request"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: View Change Requests History */}
        {viewingRequestsEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="my-8 w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-black/10">
              <div className="flex items-center justify-between pb-4 border-b border-black/10">
                <div>
                  <h2 className="text-xl font-black text-[#20201F]">
                    Change Requests History
                  </h2>
                  <p className="text-xs text-[#77736E]">
                    {viewingRequestsEvent.title}
                  </p>
                </div>
                <button
                  onClick={() => setViewingRequestsEvent(null)}
                  className="rounded-full p-1.5 text-[#77736E] hover:bg-black/5"
                >
                  <X size={18} />
                </button>
              </div>

              {requestsLoading ? (
                <div className="py-8 text-center text-sm text-[#77736E]">
                  Loading change requests...
                </div>
              ) : changeRequests.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#77736E]">
                  No change requests have been submitted for this event yet.
                </div>
              ) : (
                <div className="mt-5 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {changeRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-2xl border border-black/10 bg-[#FAF7F2] p-4 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            statusBadgeStyles[req.status] ?? "bg-gray-100"
                          }`}
                        >
                          {req.status}
                        </span>
                        <span className="text-[#77736E]">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="font-semibold text-[#20201F]">
                        Requested Start:{" "}
                        {new Date(req.requestedStartTime).toLocaleString()}
                      </p>
                      <p className="font-semibold text-[#20201F]">
                        Requested End:{" "}
                        {new Date(req.requestedEndTime).toLocaleString()}
                      </p>

                      {req.requestedVenue && (
                        <p className="text-[#77736E]">
                          Requested Venue: {req.requestedVenue.name}
                        </p>
                      )}

                      {req.reason && (
                        <p className="text-[#77736E] italic">
                          Reason: "{req.reason}"
                        </p>
                      )}

                      {req.reviewComment && (
                        <p className="text-purple-800 font-semibold border-t border-black/5 pt-2">
                          Admin Review Comment: {req.reviewComment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-5 border-t border-black/10 mt-5">
                <button
                  onClick={() => setViewingRequestsEvent(null)}
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