import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  Ticket,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "PUBLIC" | "PRIVATE";
  registrationMode: "OPEN" | "APPROVAL_REQUIRED";
  startTime: string;
  endTime: string;
  maxParticipants: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  isRegistered?: boolean;
  venue?: {
    name: string;
    location: string;
    capacity: number;
  } | null;
  organizerId?: string;
  organizer?: {
    name: string;
    email: string;
  };
}

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [registrationCheck, setRegistrationCheck] = useState<{
    eventId: string;
    userId: string;
    isRegistered: boolean;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchEventDetails() {
      if (!eventId) {
        setError("Event ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/events/${eventId}`);
        const fetchedEvent: EventItem = response.data.event;

        if (!active) return;
        setEvent(fetchedEvent);
      } catch (err: unknown) {
        if (active) {
          const axiosError = err as {
            response?: {
              status?: number;
              data?: { message?: string };
            };
          };

          setError(
            axiosError.response?.data?.message ??
              "Unable to load event details. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchEventDetails();

    return () => {
      active = false;
    };
  }, [eventId]);

  useEffect(() => {
    let active = true;

    async function checkRegistration() {
      if (!eventId || !isAuthenticated || !user?.id) return;

      try {
        const response = await api.get("/registrations/my");
        const registrations = response.data.registrations;
        const hasRegistration =
          Array.isArray(registrations) &&
          registrations.some(
            (registration: { eventId: string }) =>
              registration.eventId === eventId
          );

        if (active) {
          setRegistrationCheck({
            eventId,
            userId: user.id,
            isRegistered: hasRegistration,
          });
        }
      } catch (err) {
        console.warn("Could not check event registration status:", err);
      }
    }

    void checkRegistration();

    return () => {
      active = false;
    };
  }, [eventId, isAuthenticated, user?.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#20201F] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#77736E] transition hover:text-[#E85D3F] mb-6"
        >
          <ArrowLeft size={16} />
          Back to all events
        </Link>

        {loading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E85D3F]/20 border-t-[#E85D3F]" />
            <p className="mt-4 text-sm font-semibold text-[#77736E]">
              Loading event details...
            </p>
          </div>
        ) : error || !event ? (
          <div className="rounded-2xl border border-red-200 bg-white p-10 text-center max-w-lg mx-auto shadow-sm">
            <ShieldAlert size={36} className="mx-auto text-red-600 mb-3" />
            <h1 className="text-xl font-bold text-[#20201F]">
              Event unavailable
            </h1>
            <p className="mt-2 text-sm text-[#77736E]">
              {error || "We couldn't locate this event."}
            </p>
            <button
              onClick={() => navigate("/events")}
              className="mt-6 rounded-xl bg-[#20201F] px-6 py-3 text-sm font-bold text-white hover:bg-[#E85D3F] transition"
            >
              Explore Other Events
            </button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Left Column: Event Details */}
            <div className="space-y-8">
              {/* Event Header Banner Card */}
              <div className="overflow-hidden rounded-3xl border border-black/[0.08] bg-white p-6 sm:p-10 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-[#E85D3F]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#C64A30]">
                    {event.category}
                  </span>

                  <span className="rounded-full border border-black/10 bg-[#FAF7F2] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#77736E]">
                    {event.type}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      event.status === "APPROVED"
                        ? "bg-[#EBF5E8] text-[#266B22] border border-[#C7E6C0]"
                        : "bg-[#FEF5E7] text-[#B45309] border border-[#FADFA8]"
                    }`}
                  >
                    {event.status}
                  </span>
                </div>

                <h1 className="mt-6 text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl">
                  {event.title}
                </h1>

                {/* Key Meta row */}
                <div className="mt-8 grid gap-4 sm:grid-cols-2 border-t border-black/10 pt-6">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FBE6DF] text-[#E85D3F]">
                      <CalendarDays size={20} />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#77736E]">
                        Date & Time
                      </p>
                      <p className="mt-1 font-bold text-[#20201F]">
                        {formatDate(event.startTime)}
                      </p>
                      <p className="text-xs text-[#77736E]">
                        {formatTime(event.startTime)} – {formatTime(event.endTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FBE6DF] text-[#E85D3F]">
                      <MapPin size={20} />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#77736E]">
                        Location
                      </p>
                      <p className="mt-1 font-bold text-[#20201F]">
                        {event.venue?.name ?? "Venue confirmed upon registration"}
                      </p>
                      <p className="text-xs text-[#77736E]">
                        {event.venue?.location ?? "Location pending"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Description Section */}
              <div className="rounded-3xl border border-black/[0.08] bg-white p-6 sm:p-10 shadow-sm">
                <h2 className="text-xl font-bold tracking-tight text-[#20201F]">
                  About this experience
                </h2>

                <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#77736E] sm:text-base">
                  {event.description}
                </div>

                {/* Additional Venue & Capacity Info */}
                <div className="mt-8 grid gap-4 sm:grid-cols-2 border-t border-black/10 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#20201F]">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-[#77736E]">Capacity</p>
                      <p className="text-sm font-bold text-[#20201F]">
                        {event.maxParticipants
                          ? `Up to ${event.maxParticipants} attendees`
                          : event.venue?.capacity
                          ? `${event.venue.capacity} venue limit`
                          : "Open attendance"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#20201F]">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-[#77736E]">Admission</p>
                      <p className="text-sm font-bold text-[#20201F]">
                        {event.registrationMode === "APPROVAL_REQUIRED"
                          ? "Application Required"
                          : "Free & Open RSVP"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky RSVP Action Card */}
            <div className="h-fit lg:sticky lg:top-24 space-y-4">
              <div className="rounded-3xl border border-black/[0.08] bg-white p-7 shadow-lg">
                <div className="flex items-center justify-between pb-5 border-b border-black/10">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#E85D3F]">
                      Join Event
                    </p>
                    <p className="mt-1 text-2xl font-black text-[#20201F]">
                      Free Registration
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBE6DF] text-[#E85D3F]">
                    <Ticket size={24} />
                  </div>
                </div>

                <div className="py-5 space-y-3 text-xs text-[#77736E]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#266B22]" />
                    <span>Instant confirmation sent to your profile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#266B22]" />
                    <span>
                      {event.registrationMode === "APPROVAL_REQUIRED"
                        ? "Host will review your answers"
                        : "Direct entry upon registration"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#266B22]" />
                    <span>Cancel or update anytime from your dashboard</span>
                  </div>
                </div>

                {event.isRegistered ||
                (registrationCheck?.eventId === event.id &&
                  registrationCheck.userId === user?.id &&
                  registrationCheck.isRegistered) ? (
                  <div
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#C7E6C0] bg-[#EBF5E8] px-5 py-4 text-sm font-bold text-[#266B22]"
                    role="status"
                  >
                    <CheckCircle2 size={18} />
                    Registered
                  </div>
                ) : isAuthenticated &&
                  (!registrationCheck ||
                    registrationCheck.eventId !== event.id ||
                    registrationCheck.userId !== user?.id) ? (
                  <div
                    className="flex w-full items-center justify-center rounded-xl border border-black/10 bg-[#FAF7F2] px-5 py-4 text-sm font-semibold text-[#77736E]"
                    role="status"
                  >
                    Checking registration...
                  </div>
                ) : event.status === "APPROVED" ? (
                  <button
                    onClick={() => {
                      const registrationPath = `/events/${event.id}/register`;
                      navigate(
                        isAuthenticated
                          ? registrationPath
                          : "/login",
                        isAuthenticated
                          ? undefined
                          : { state: { redirectTo: registrationPath } }
                      );
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E85D3F] px-5 py-4 text-sm font-bold text-white shadow-md shadow-[#E85D3F]/20 transition hover:bg-[#20201F] hover:shadow-none cursor-pointer"
                  >
                    <Ticket size={18} />
                    Register for Event
                  </button>
                ) : (
                  <div className="rounded-xl bg-[#FEF5E7] p-4 text-center text-xs font-bold text-[#B45309]">
                    Registration is unavailable because this event is currently {event.status.toLowerCase()}.
                  </div>
                )}

                <p className="mt-4 text-center text-[11px] text-[#77736E]">
                  Safe & verified event hosted on Eventra.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
