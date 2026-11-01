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
  Pencil,
  XCircle,
  CalendarClock,
  History,
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
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
const [venuesLoading, setVenuesLoading] = useState(false);

const [requestingEvent, setRequestingEvent] =
  useState<EventItem | null>(null);

const [requestForm, setRequestForm] = useState({
  startTime: "",
  endTime: "",
  venueId: "",
  reason: "",
});

const [submittingRequest, setSubmittingRequest] = useState(false);

const [viewingRequestsEvent, setViewingRequestsEvent] =
  useState<EventItem | null>(null);

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
      title: editForm.title,
      description: editForm.description,
      category: editForm.category,
      maxParticipants,
    });

    setEditingEvent(null);
    await loadEvents();
  } catch (err: unknown) {
    const error = err as {
      response?: { data?: { message?: string } };
    };

    setActionError(
      error.response?.data?.message || "Unable to update event."
    );
  } finally {
    setSaving(false);
  }
};

const handleCancelEvent = async (event: EventItem) => {
  const confirmed = window.confirm(
    `Are you sure you want to cancel "${event.title}"? This will also cancel its registrations and release the venue booking.`
  );

  if (!confirmed) return;

  setCancellingEventId(event.id);
  setActionError("");

  try {
    await api.patch(`/events/${event.id}/cancel`);
    await loadEvents();
  } catch (err: unknown) {
    const error = err as {
      response?: { data?: { message?: string } };
    };

    setActionError(
      error.response?.data?.message || "Unable to cancel event."
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
    await api.post(
      `/events/${requestingEvent.id}/change-requests`,
      {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        venueId: requestForm.venueId,
        reason: requestForm.reason.trim() || null,
      }
    );

    setRequestingEvent(null);
    alert("Change request submitted successfully!");
  } catch (err: unknown) {
    const error = err as {
      response?: { data?: { message?: string } };
    };

    setActionError(
      error.response?.data?.message ||
        "Unable to submit change request."
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
    const response = await api.get(
      `/events/${event.id}/change-requests`
    );

    setChangeRequests(response.data.requests ?? []);
  } catch (err: unknown) {
    const error = err as {
      response?: { data?: { message?: string } };
    };

    setActionError(
      error.response?.data?.message ||
        "Unable to fetch change requests."
    );
  } finally {
    setRequestsLoading(false);
  }
};

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

                    {/* View Event */}
                    <button
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      View Details
                    </button>
                    {/* Edit Event */}
{event.status !== "REJECTED" &&
  event.status !== "CANCELLED" && (
    <button
      onClick={() => handleEdit(event)}
      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
    >
      <Pencil size={15} />
      Edit
    </button>
  )}

{/* Cancel Event */}
{event.status !== "REJECTED" &&
  event.status !== "CANCELLED" && (
    <button
      onClick={() => void handleCancelEvent(event)}
      disabled={cancellingEventId === event.id}
      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
    >
      <XCircle size={15} />
      {cancellingEventId === event.id ? "Cancelling..." : "Cancel"}
    </button>
  )}
                    {/* Manage Registration Form */}
                    {event.status !== "REJECTED" &&
                      event.status !== "CANCELLED" && (
                        <button
                          onClick={() =>
                            navigate(`/events/${event.id}/registration-fields`)
                          }
                          className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                        >
                          Manage Form
                        </button>
                      )}

                    {/* Manage Registrations */}
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
                    {/* Request Changes */}
{event.status === "APPROVED" && (
  <>
    <button
      onClick={() => void openChangeRequest(event)}
      className="flex-1 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-700 hover:bg-purple-100"
    >
      <CalendarClock size={15} className="mr-1 inline" />
      Request Changes
    </button>

    <button
      onClick={() => void handleViewChangeRequests(event)}
      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
    >
      <History size={15} className="mr-1 inline" />
      View Requests
    </button>
  </>
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
      {editingEvent && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
      <h2 className="text-xl font-bold text-slate-900">
        Edit Event
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Update your event information.
      </p>

      {actionError && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <form onSubmit={handleUpdateEvent} className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Event Title
          </label>
          <input
            required
            value={editForm.title}
            onChange={(e) =>
              setEditForm({ ...editForm, title: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            required
            rows={4}
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            value={editForm.category}
            onChange={(e) =>
              setEditForm({ ...editForm, category: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
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
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Maximum Participants
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
            placeholder="Leave empty for unlimited"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setEditingEvent(null);
              setActionError("");
            }}
            disabled={saving}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
{requestingEvent && (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
    <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
      <h2 className="text-xl font-bold text-slate-900">
        Request Event Changes
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Request a new date, time, or venue for {requestingEvent.title}.
      </p>

      {actionError && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {venuesLoading ? (
        <p className="py-8 text-center text-slate-500">
          Loading venues...
        </p>
      ) : (
        <form onSubmit={handleSubmitChangeRequest} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              New Start Date and Time
            </label>
            <input
              required
              type="datetime-local"
              value={requestForm.startTime}
              onChange={(e) =>
                setRequestForm({ ...requestForm, startTime: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              New End Date and Time
            </label>
            <input
              required
              type="datetime-local"
              value={requestForm.endTime}
              onChange={(e) =>
                setRequestForm({ ...requestForm, endTime: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Requested Venue
            </label>
            <select
              required
              value={requestForm.venueId}
              onChange={(e) =>
                setRequestForm({ ...requestForm, venueId: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="">Select venue</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name} | {venue.location} | Capacity {venue.capacity}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Reason for Change (Optional)
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={requestForm.reason}
              onChange={(e) =>
                setRequestForm({ ...requestForm, reason: e.target.value })
              }
              placeholder="Explain why you need these changes..."
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setRequestingEvent(null);
                setActionError("");
              }}
              disabled={submittingRequest}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold"
            >
              Close
            </button>

            <button
              type="submit"
              disabled={submittingRequest || venues.length === 0}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {submittingRequest ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      )}
    </div>
  </div>
)}
{viewingRequestsEvent && (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
    <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
      <h2 className="text-xl font-bold text-slate-900">
        Change Request History
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {viewingRequestsEvent.title}
      </p>

      {actionError && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {requestsLoading ? (
        <p className="py-8 text-center text-slate-500">
          Loading requests...
        </p>
      ) : changeRequests.length === 0 ? (
        <p className="py-8 text-center text-slate-500">
          No change requests submitted yet.
        </p>
      ) : (
        <div className="mt-5 max-h-[60vh] space-y-4 overflow-y-auto">
          {changeRequests.map((request) => (
            <div
              key={request.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-800">
                  {request.requestedVenue?.name || "Requested venue"}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    request.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-700"
                      : request.status === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {request.status}
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-600">
                Start: {new Date(request.requestedStartTime).toLocaleString("en-IN")}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                End: {new Date(request.requestedEndTime).toLocaleString("en-IN")}
              </p>

              {request.reason && (
                <p className="mt-3 text-sm text-slate-600">
                  <strong>Reason:</strong> {request.reason}
                </p>
              )}

              {request.reviewComment && (
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  <strong>Admin comment:</strong> {request.reviewComment}
                </p>
              )}

              <p className="mt-3 text-xs text-slate-400">
                Submitted: {new Date(request.createdAt).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => {
          setViewingRequestsEvent(null);
          setActionError("");
        }}
        className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
      >
        Close
      </button>
    </div>
  </div>
)}
    </div>
  );
}