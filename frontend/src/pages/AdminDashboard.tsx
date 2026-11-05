import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldCheck,
  MapPin,
  Plus,
  Trash2,
  Pencil,
  History,
  X,
  Building,
  ChevronDown,
  Check,
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

interface EventItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  startTime: string;
  endTime: string;
  organizer?: {
    name: string;
    email: string;
  };
}

interface Venue {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

interface ChangeRequest {
  id: string;
  eventId: string;
  requestedStartTime: string;
  requestedEndTime: string;
  requestedVenueId: string;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  event: EventItem;
  requestedBy: {
    id: string;
    name: string;
    email: string;
  };
  requestedVenue: Venue;
}

const statusBadgeStyles: Record<string, string> = {
  APPROVED: "bg-[#EBF5E8] text-[#266B22] border border-[#C7E6C0]",
  PENDING: "bg-[#FEF5E7] text-[#B45309] border border-[#FADFA8]",
  REJECTED: "bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4]",
  CANCELLED: "bg-[#F1EFEB] text-[#6B6862] border border-[#DFDAD0]",
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"EVENTS" | "VENUES" | "CHANGE_REQUESTS">("EVENTS");

  // Events State
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
  >("PENDING");
  const [eventFilterOpen, setEventFilterOpen] = useState(false);
  const eventFilterRef = useRef<HTMLDivElement>(null);
  const [processingEventId, setProcessingEventId] = useState<string | null>(null);

  // Venues State
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [venueModalOpen, setVenueModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [venueForm, setVenueForm] = useState({ name: "", location: "", capacity: "" });
  const [venueSaving, setVenueSaving] = useState(false);

  // Change Requests State
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Load Events
  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setActionError("");

    try {
      const response = await api.get("/events/admin");
      const data = response.data;
      const list = Array.isArray(data) ? data : data.events ?? [];
      setEvents(list);
    } catch (err: unknown) {
      console.error(err);
      setActionError("Unable to load events.");
    } finally {
      setEventsLoading(false);
    }
  }, []);

  // Load Venues
  const loadVenues = useCallback(async () => {
    setVenuesLoading(true);
    try {
      const res = await api.get("/venues");
      setVenues(res.data.venues ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setVenuesLoading(false);
    }
  }, []);

  // Load Change Requests
  const loadChangeRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const res = await api.get("/events/admin/change-requests");
      setChangeRequests(res.data.requests ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    // Verify admin
    api.get("/auth/me")
      .then((res) => {
        if (res.data.user?.role !== "ADMIN") {
          navigate("/dashboard", { replace: true });
          return;
        }
        void loadEvents();
        void loadVenues();
        void loadChangeRequests();
      })
      .catch(() => {
        navigate("/login", { replace: true });
      });
  }, [navigate, loadEvents, loadVenues, loadChangeRequests]);

  useEffect(() => {
    if (!eventFilterOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        !eventFilterRef.current?.contains(event.target)
      ) {
        setEventFilterOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setEventFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [eventFilterOpen]);

  // Event Approve / Reject
  async function updateEvent(eventId: string, action: "approve" | "reject") {
    setProcessingEventId(eventId);
    setActionError("");
    setActionSuccess("");

    try {
      await api.patch(`/events/${eventId}/${action}`);
      setActionSuccess(`Event ${action}d successfully.`);
      await loadEvents();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setActionError(axiosError.response?.data?.message || `Unable to ${action} event.`);
    } finally {
      setProcessingEventId(null);
    }
  }

  // Venue Create / Update
  function openCreateVenue() {
    setEditingVenue(null);
    setVenueForm({ name: "", location: "", capacity: "" });
    setActionError("");
    setVenueModalOpen(true);
  }

  function openEditVenue(venue: Venue) {
    setEditingVenue(venue);
    setVenueForm({
      name: venue.name,
      location: venue.location,
      capacity: String(venue.capacity),
    });
    setActionError("");
    setVenueModalOpen(true);
  }

  async function handleVenueSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");

    const capacityNum = Number(venueForm.capacity);
    if (!Number.isInteger(capacityNum) || capacityNum <= 0) {
      setActionError("Capacity must be a positive whole number.");
      return;
    }

    setVenueSaving(true);
    try {
      if (editingVenue) {
        await api.patch(`/venues/${editingVenue.id}`, {
          name: venueForm.name.trim(),
          location: venueForm.location.trim(),
          capacity: capacityNum,
        });
        setActionSuccess("Venue updated successfully.");
      } else {
        await api.post("/venues", {
          name: venueForm.name.trim(),
          location: venueForm.location.trim(),
          capacity: capacityNum,
        });
        setActionSuccess("Venue created successfully.");
      }

      setVenueModalOpen(false);
      await loadVenues();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setActionError(axiosError.response?.data?.message || "Failed to save venue.");
    } finally {
      setVenueSaving(false);
    }
  }

  async function handleDeleteVenue(venue: Venue) {
    const confirmed = window.confirm(
      `Are you sure you want to delete venue "${venue.name}"? If it has existing bookings, deletion may be blocked.`
    );
    if (!confirmed) return;

    setActionError("");
    try {
      await api.delete(`/venues/${venue.id}`);
      setActionSuccess("Venue deleted successfully.");
      await loadVenues();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setActionError(axiosError.response?.data?.message || "Unable to delete venue.");
    }
  }

  // Change Request Approve / Reject
  async function handleChangeRequestAction(requestId: string, action: "approve" | "reject") {
    setProcessingRequestId(requestId);
    setActionError("");
    setActionSuccess("");

    try {
      await api.patch(`/events/admin/change-requests/${requestId}/${action}`);
      setActionSuccess(`Change request ${action}d successfully.`);
      await loadChangeRequests();
      await loadEvents();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setActionError(axiosError.response?.data?.message || `Failed to ${action} change request.`);
    } finally {
      setProcessingRequestId(null);
    }
  }

  const pendingEventsCount = events.filter((e) => e.status === "PENDING").length;
  const approvedEventsCount = events.filter((e) => e.status === "APPROVED").length;

  const filteredEvents = events.filter(
    (e) => eventFilter === "ALL" || e.status === eventFilter
  );
  const eventFilterOptions = [
    { value: "ALL", label: "All Events", count: events.length },
    { value: "PENDING", label: "Pending Approval", count: pendingEventsCount },
    { value: "APPROVED", label: "Approved", count: approvedEventsCount },
    { value: "REJECTED", label: "Rejected" },
    { value: "CANCELLED", label: "Cancelled" },
  ] as const;
  const selectedEventFilter = eventFilterOptions.find(
    (option) => option.value === eventFilter
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#20201F] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-black/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E85D3F]/30 bg-[#E85D3F]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#C64A30] mb-3">
              <ShieldCheck size={14} />
              Platform Administration
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#20201F] sm:text-4xl">
              Admin Control Center
            </h1>
            <p className="mt-2 text-sm text-[#77736E]">
              Review submitted events, manage venues, and approve organizer reschedule requests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                void loadEvents();
                void loadVenues();
                void loadChangeRequests();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-black/15 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#20201F] hover:bg-[#FAF7F2] transition"
            >
              <RefreshCw size={14} />
              Sync Data
            </button>
          </div>
        </div>

        {/* Global Feedback Banners */}
        {actionSuccess && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {actionError}
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#77736E]">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Events</span>
              <Clock3 size={18} className="text-[#B45309]" />
            </div>
            <p className="mt-3 text-3xl font-black text-[#B45309]">{pendingEventsCount}</p>
          </div>

          <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#77736E]">
              <span className="text-xs font-bold uppercase tracking-wider">Approved Events</span>
              <CheckCircle2 size={18} className="text-[#266B22]" />
            </div>
            <p className="mt-3 text-3xl font-black text-[#266B22]">{approvedEventsCount}</p>
          </div>

          <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#77736E]">
              <span className="text-xs font-bold uppercase tracking-wider">Active Venues</span>
              <Building size={18} className="text-[#E85D3F]" />
            </div>
            <p className="mt-3 text-3xl font-black text-[#20201F]">{venues.length}</p>
          </div>

          <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#77736E]">
              <span className="text-xs font-bold uppercase tracking-wider">Change Requests</span>
              <History size={18} className="text-purple-700" />
            </div>
            <p className="mt-3 text-3xl font-black text-purple-700">{changeRequests.length}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-10 flex border-b border-black/10">
          <button
            onClick={() => setActiveTab("EVENTS")}
            className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === "EVENTS"
                ? "border-[#E85D3F] text-[#E85D3F]"
                : "border-transparent text-[#77736E] hover:text-[#20201F]"
            }`}
          >
            Events Review ({pendingEventsCount} Pending)
          </button>

          <button
            onClick={() => setActiveTab("VENUES")}
            className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === "VENUES"
                ? "border-[#E85D3F] text-[#E85D3F]"
                : "border-transparent text-[#77736E] hover:text-[#20201F]"
            }`}
          >
            Venues Management ({venues.length})
          </button>

          <button
            onClick={() => setActiveTab("CHANGE_REQUESTS")}
            className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === "CHANGE_REQUESTS"
                ? "border-[#E85D3F] text-[#E85D3F]"
                : "border-transparent text-[#77736E] hover:text-[#20201F]"
            }`}
          >
            Change Requests ({changeRequests.length})
          </button>
        </div>

        {/* TAB 1: Events Management */}
        {activeTab === "EVENTS" && (
          <section className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#20201F]">Submitted Events</h2>
                <p className="text-xs text-[#77736E]">
                  Verify dates, venue bookings, and descriptions before publishing live.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77736E]">
                  Status:
                </span>
                <div ref={eventFilterRef} className="relative w-52">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={eventFilterOpen}
                    onClick={() => setEventFilterOpen((open) => !open)}
                    className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-left text-xs font-bold text-[#20201F] shadow-sm outline-none transition ${
                      eventFilterOpen
                        ? "border-[#E85D3F] ring-4 ring-[#E85D3F]/10"
                        : "border-black/10 hover:border-black/20"
                    }`}
                  >
                    <span>
                      {selectedEventFilter?.label}
                      {selectedEventFilter && "count" in selectedEventFilter &&
                        ` (${selectedEventFilter.count})`}
                    </span>
                    <ChevronDown
                      size={15}
                      className={`ml-3 shrink-0 text-[#77736E] transition-transform ${
                        eventFilterOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {eventFilterOpen && (
                    <div
                      role="listbox"
                      aria-label="Filter events by status"
                      className="absolute right-0 z-30 mt-2 w-full overflow-hidden rounded-xl border border-black/10 bg-white p-1.5 shadow-xl shadow-black/10"
                    >
                      {eventFilterOptions.map((option) => {
                        const selected = eventFilter === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => {
                              setEventFilter(option.value);
                              setEventFilterOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition ${
                              selected
                                ? "bg-[#FBE6DF] text-[#C64A30]"
                                : "text-[#55514C] hover:bg-[#FAF7F2] hover:text-[#20201F]"
                            }`}
                          >
                            <span>
                              {option.label}
                              {"count" in option && ` (${option.count})`}
                            </span>
                            {selected && (
                              <Check size={14} className="text-[#E85D3F]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {eventsLoading ? (
              <div className="flex min-h-[30vh] flex-col items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E85D3F]/20 border-t-[#E85D3F]" />
                <p className="mt-4 text-sm font-semibold text-[#77736E]">Loading events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-black/15 bg-white p-14 text-center">
                <CalendarDays size={42} className="mx-auto text-[#77736E]" />
                <h3 className="mt-4 font-bold text-base text-[#20201F]">No events found</h3>
                <p className="mt-1 text-xs text-[#77736E]">
                  There are no events matching the selected filter.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm transition hover:shadow-md flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
                  >
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="rounded-full bg-[#E85D3F]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#C64A30]">
                          {event.category}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                            statusBadgeStyles[event.status] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {event.status}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-[#20201F]">
                        {event.title}
                      </h3>

                      <p className="line-clamp-2 text-sm leading-relaxed text-[#77736E] max-w-3xl">
                        {event.description || "No description provided."}
                      </p>

                      <div className="flex flex-wrap gap-4 text-xs text-[#77736E] pt-2">
                        <span className="flex items-center gap-1 font-semibold text-[#20201F]">
                          <CalendarDays size={14} className="text-[#E85D3F]" />
                          {new Date(event.startTime).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                        <span>
                          Ends: {new Date(event.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
                      <Link
                        to={`/events/${event.id}`}
                        className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#20201F] hover:bg-[#FAF7F2] transition"
                      >
                        Inspect Event
                      </Link>

                      {event.status === "PENDING" && (
                        <>
                          <button
                            disabled={processingEventId === event.id}
                            onClick={() => void updateEvent(event.id, "approve")}
                            className="rounded-xl bg-[#266B22] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#1E541B] transition shadow-sm disabled:opacity-50"
                          >
                            {processingEventId === event.id ? "..." : "Approve"}
                          </button>

                          <button
                            disabled={processingEventId === event.id}
                            onClick={() => void updateEvent(event.id, "reject")}
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: Venues Management */}
        {activeTab === "VENUES" && (
          <section className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#20201F]">Physical Venues</h2>
                <p className="text-xs text-[#77736E]">
                  Define approved venues, locations, and seating capacities for organizers to book.
                </p>
              </div>

              <button
                onClick={openCreateVenue}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E85D3F] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#20201F] transition self-start sm:self-auto"
              >
                <Plus size={16} />
                Create New Venue
              </button>
            </div>

            {venuesLoading ? (
              <div className="flex min-h-[30vh] flex-col items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E85D3F]/20 border-t-[#E85D3F]" />
                <p className="mt-4 text-sm font-semibold text-[#77736E]">Loading venues...</p>
              </div>
            ) : venues.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-black/15 bg-white p-14 text-center">
                <Building size={42} className="mx-auto text-[#77736E]" />
                <h3 className="mt-4 font-bold text-base text-[#20201F]">No venues exist</h3>
                <p className="mt-1 text-xs text-[#77736E] max-w-sm mx-auto">
                  Add at least one venue so organizers can book rooms and create events!
                </p>
                <button
                  onClick={openCreateVenue}
                  className="mt-5 rounded-xl bg-[#E85D3F] px-5 py-2.5 text-xs font-bold uppercase text-white hover:bg-[#20201F]"
                >
                  Create First Venue
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {venues.map((venue) => (
                  <div
                    key={venue.id}
                    className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#E85D3F]">
                          <Building size={18} />
                        </span>
                        <span className="rounded-full bg-[#FAF7F2] border border-black/10 px-2.5 py-0.5 text-[11px] font-bold text-[#20201F]">
                          Cap: {venue.capacity}
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-bold text-[#20201F]">{venue.name}</h3>

                      <p className="mt-1 text-xs text-[#77736E] flex items-center gap-1.5">
                        <MapPin size={13} className="text-[#E85D3F] shrink-0" />
                        <span>{venue.location}</span>
                      </p>
                    </div>

                    <div className="mt-6 border-t border-black/10 pt-4 flex gap-2">
                      <button
                        onClick={() => openEditVenue(venue)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-black/15 bg-white py-2 text-xs font-bold uppercase tracking-wider text-[#20201F] hover:bg-[#FAF7F2] transition"
                      >
                        <Pencil size={12} />
                        Edit
                      </button>

                      <button
                        onClick={() => void handleDeleteVenue(venue)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-red-700 hover:bg-red-100 transition"
                        title="Delete venue"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: Change Requests Management */}
        {activeTab === "CHANGE_REQUESTS" && (
          <section className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#20201F]">Pending Change Requests</h2>
                <p className="text-xs text-[#77736E]">
                  Organizers requesting new dates or venues for approved events.
                </p>
              </div>
            </div>

            {requestsLoading ? (
              <div className="flex min-h-[30vh] flex-col items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E85D3F]/20 border-t-[#E85D3F]" />
                <p className="mt-4 text-sm font-semibold text-[#77736E]">Loading requests...</p>
              </div>
            ) : changeRequests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-black/15 bg-white p-14 text-center">
                <History size={42} className="mx-auto text-[#77736E]" />
                <h3 className="mt-4 font-bold text-base text-[#20201F]">No pending change requests</h3>
                <p className="mt-1 text-xs text-[#77736E]">
                  When organizers request to reschedule an approved event, requests will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {changeRequests.map((req) => (
                  <article
                    key={req.id}
                    className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
                          Reschedule Request
                        </span>
                        <span className="text-xs text-[#77736E]">
                          Requested by {req.requestedBy.name} ({req.requestedBy.email})
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-[#20201F]">
                        {req.event.title}
                      </h3>

                      <div className="rounded-xl bg-[#FAF7F2] p-4 text-xs space-y-1.5 border border-black/10">
                        <p className="font-semibold text-[#20201F]">
                          Requested Start:{" "}
                          <span className="font-normal">
                            {new Date(req.requestedStartTime).toLocaleString()}
                          </span>
                        </p>
                        <p className="font-semibold text-[#20201F]">
                          Requested End:{" "}
                          <span className="font-normal">
                            {new Date(req.requestedEndTime).toLocaleString()}
                          </span>
                        </p>
                        <p className="font-semibold text-[#20201F]">
                          Requested Venue:{" "}
                          <span className="font-normal">
                            {req.requestedVenue.name} ({req.requestedVenue.location}, cap {req.requestedVenue.capacity})
                          </span>
                        </p>
                        {req.reason && (
                          <p className="text-[#77736E] italic pt-1">
                            Reason: "{req.reason}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
                      <button
                        disabled={processingRequestId === req.id}
                        onClick={() => void handleChangeRequestAction(req.id, "approve")}
                        className="rounded-xl bg-[#266B22] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#1E541B] transition shadow-sm disabled:opacity-50"
                      >
                        {processingRequestId === req.id ? "..." : "Approve Changes"}
                      </button>

                      <button
                        disabled={processingRequestId === req.id}
                        onClick={() => void handleChangeRequestAction(req.id, "reject")}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Modal: Create or Edit Venue */}
        {venueModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-black/10">
              <div className="flex items-center justify-between pb-4 border-b border-black/10">
                <h2 className="text-xl font-black text-[#20201F]">
                  {editingVenue ? "Edit Venue" : "Create New Venue"}
                </h2>
                <button
                  onClick={() => setVenueModalOpen(false)}
                  className="rounded-full p-1.5 text-[#77736E] hover:bg-black/5"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleVenueSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#20201F]">
                    Venue Name *
                  </label>
                  <input
                    required
                    value={venueForm.name}
                    onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                    placeholder="e.g. Grand Auditorium Hall"
                    className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#E85D3F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#20201F]">
                    Location / Address *
                  </label>
                  <input
                    required
                    value={venueForm.location}
                    onChange={(e) => setVenueForm({ ...venueForm, location: e.target.value })}
                    placeholder="e.g. Block B, Silicon Campus, Bangalore"
                    className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#E85D3F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#20201F]">
                    Seating Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={venueForm.capacity}
                    onChange={(e) => setVenueForm({ ...venueForm, capacity: e.target.value })}
                    placeholder="e.g. 250"
                    className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#E85D3F]"
                  />
                </div>

                <div className="flex gap-3 pt-5 border-t border-black/10">
                  <button
                    type="button"
                    onClick={() => setVenueModalOpen(false)}
                    disabled={venueSaving}
                    className="flex-1 rounded-xl border border-black/15 px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#20201F] hover:bg-[#FAF7F2]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={venueSaving}
                    className="flex-1 rounded-xl bg-[#E85D3F] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#20201F] disabled:opacity-50"
                  >
                    {venueSaving ? "Saving..." : editingVenue ? "Update Venue" : "Create Venue"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}