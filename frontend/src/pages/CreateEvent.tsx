import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Send, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Title must contain at least 3 characters"),
    description: z.string().trim().min(10, "Description must contain at least 10 characters"),
    category: z.enum([
      "CONFERENCE",
      "WORKSHOP",
      "SEMINAR",
      "CONCERT",
      "SPORTS",
      "TECHNICAL",
      "OTHER",
    ]),
    type: z.enum(["PUBLIC", "PRIVATE"]),
    registrationMode: z.enum(["OPEN", "APPROVAL_REQUIRED"]),
    startTime: z.string().min(1, "Start date and time are required"),
    endTime: z.string().min(1, "End date and time are required"),
    venueId: z.string().min(1, "Please select a venue"),
    maxParticipants: z.string(),
  })
  .superRefine((data, ctx) => {
    if (
      new Date(data.startTime).getTime() <= Date.now() ||
      Number.isNaN(new Date(data.startTime).getTime())
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Start time must be in the future",
      });
    }

    if (
      Number.isNaN(new Date(data.endTime).getTime()) ||
      new Date(data.endTime).getTime() <= new Date(data.startTime).getTime()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after start time",
      });
    }

    if (data.maxParticipants.trim() !== "") {
      const count = Number(data.maxParticipants);
      if (!Number.isInteger(count) || count <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["maxParticipants"],
          message: "Enter a positive whole number",
        });
      }
    }
  });

type EventFormValues = z.infer<typeof eventSchema>;

interface Venue {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

const inputClass =
  "mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[#20201F] outline-none transition placeholder:text-[#9C968F] focus:border-[#E85D3F] focus:bg-white focus:ring-4 focus:ring-[#E85D3F]/10";

const labelClass = "block text-xs font-bold uppercase tracking-wider text-[#20201F]";

export default function CreateEvent() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const returnPath = isAdmin ? "/admin" : "/dashboard";

  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [venueError, setVenueError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "WORKSHOP",
      type: "PUBLIC",
      registrationMode: "OPEN",
      startTime: "",
      endTime: "",
      venueId: "",
      maxParticipants: "",
    },
  });

  const selectedVenueId = useWatch({
    control,
    name: "venueId",
  });
  const selectedVenue = venues.find((venue) => venue.id === selectedVenueId);

  useEffect(() => {
    let active = true;

    async function fetchVenues() {
      try {
        const response = await api.get("/venues");
        if (active) {
          setVenues(response.data.venues ?? []);
        }
      } catch (error) {
        console.error("Failed to load venues:", error);
        if (active) {
          setVenueError("Unable to load venues. Please refresh and try again.");
        }
      } finally {
        if (active) {
          setVenuesLoading(false);
        }
      }
    }

    void fetchVenues();

    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(values: EventFormValues) {
    setSubmitError("");
    setSuccessMessage("");

    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      type: values.type,
      registrationMode: values.registrationMode,
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
      venueId: values.venueId,
      maxParticipants:
        values.maxParticipants.trim() === ""
          ? null
          : Number(values.maxParticipants),
    };

    try {
      const response = await api.post("/events", payload);

      setSuccessMessage(
        response.data.message || "Event submitted for admin approval!"
      );

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Event creation error:", error);

      const err = error as {
        response?: {
          status?: number;
          data?: { message?: string };
        };
      };

      const message =
        err.response?.data?.message ||
        "Unable to create the event. Please check inputs and try again.";

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      if (message.toLowerCase().includes("capacity")) {
        setError("maxParticipants", {
          type: "server",
          message,
        });
      } else {
        setSubmitError(message);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#20201F] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          to={returnPath}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#77736E] transition hover:text-[#E85D3F] mb-6"
        >
          <ArrowLeft size={16} />
          {isAdmin ? "Back to Admin Dashboard" : "Back to Dashboard"}
        </Link>

        {/* Page Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E85D3F]/30 bg-[#E85D3F]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#C64A30] mb-3">
            <Sparkles size={13} />
            {isAdmin ? "Platform Administration" : "Organizer Suite"}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#20201F] sm:text-4xl">
            {isAdmin ? "Create an Event" : "Host a New Event"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#77736E]">
            Provide event details, reserve an available venue, and submit for review.
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div
            role="status"
            className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 size={22} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-emerald-900 text-base">
                  Event submitted successfully!
                </h2>
                <p className="mt-1 text-sm text-emerald-800">
                  {successMessage}
                </p>
                <p className="mt-2 text-xs text-emerald-700">
                  {isAdmin
                    ? "This event is pending approval. You can review it from the admin dashboard."
                    : "Your event is currently pending administrator verification. Once approved, it will be listed in Explore Events."}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(isAdmin ? "/admin" : "/my-events")}
                    className="rounded-xl bg-[#20201F] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#E85D3F] transition"
                  >
                    {isAdmin ? "Admin Dashboard" : "View My Events"}
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-800 hover:bg-emerald-100 transition"
                  >
                    Create Another
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Error */}
        {submitError && (
          <div
            role="alert"
            className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700 flex items-start gap-3 shadow-sm"
          >
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div>{submitError}</div>
          </div>
        )}

        {/* Main Form Card */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-3xl border border-black/[0.08] bg-white p-6 sm:p-10 shadow-sm space-y-8"
        >
          {/* Section 1: Event Details */}
          <div>
            <h2 className="text-lg font-black text-[#20201F]">
              1. Event Details
            </h2>
            <p className="mt-1 text-xs text-[#77736E]">
              Tell potential attendees what this event is about.
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <label htmlFor="title" className={labelClass}>
                  Event Title *
                </label>
                <input
                  id="title"
                  {...register("title")}
                  placeholder="e.g. Modern Full-Stack AI Masterclass"
                  className={inputClass}
                />
                {errors.title && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="description" className={labelClass}>
                  Description *
                </label>
                <textarea
                  id="description"
                  {...register("description")}
                  rows={4}
                  placeholder="Provide an overview of the event, itinerary, guest speakers, prerequisites, and what attendees will learn..."
                  className={inputClass}
                />
                {errors.description && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="category" className={labelClass}>
                    Category *
                  </label>
                  <select
                    id="category"
                    {...register("category")}
                    className={inputClass}
                  >
                    <option value="WORKSHOP">Workshop</option>
                    <option value="CONFERENCE">Conference</option>
                    <option value="TECHNICAL">Technical</option>
                    <option value="SEMINAR">Seminar</option>
                    <option value="CONCERT">Concert</option>
                    <option value="SPORTS">Sports</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="type" className={labelClass}>
                    Visibility *
                  </label>
                  <select
                    id="type"
                    {...register("type")}
                    className={inputClass}
                  >
                    <option value="PUBLIC">Public (Listed in Explore)</option>
                    <option value="PRIVATE">Private (Direct link only)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Date & Time */}
          <div className="border-t border-black/10 pt-8">
            <h2 className="text-lg font-black text-[#20201F]">
              2. Schedule
            </h2>
            <p className="mt-1 text-xs text-[#77736E]">
              Specify start and finish times in your local timezone.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="startTime" className={labelClass}>
                  Start Date & Time *
                </label>
                <input
                  id="startTime"
                  type="datetime-local"
                  {...register("startTime")}
                  className={inputClass}
                />
                {errors.startTime && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {errors.startTime.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="endTime" className={labelClass}>
                  End Date & Time *
                </label>
                <input
                  id="endTime"
                  type="datetime-local"
                  {...register("endTime")}
                  className={inputClass}
                />
                {errors.endTime && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Venue & Capacity */}
          <div className="border-t border-black/10 pt-8">
            <h2 className="text-lg font-black text-[#20201F] flex items-center gap-2">
              <MapPin size={20} className="text-[#E85D3F]" />
              3. Venue & Capacity
            </h2>
            <p className="mt-1 text-xs text-[#77736E]">
              Select from approved locations registered in Eventra.
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <label htmlFor="venueId" className={labelClass}>
                  Select Venue *
                </label>
                <select
                  id="venueId"
                  {...register("venueId")}
                  disabled={venuesLoading || venues.length === 0}
                  className={inputClass}
                >
                  <option value="">
                    {venuesLoading ? "Loading venues..." : "— Choose a venue —"}
                  </option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name} · {venue.location} (Max capacity: {venue.capacity})
                    </option>
                  ))}
                </select>

                {errors.venueId && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {errors.venueId.message}
                  </p>
                )}

                {venueError && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {venueError}
                  </p>
                )}

                {!venuesLoading && !venueError && venues.length === 0 && (
                  <p className="mt-2 text-xs font-semibold text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    No venues are available in the system yet. Please ask an administrator to add venues.
                  </p>
                )}
              </div>

              {selectedVenue && (
                <div className="rounded-2xl bg-[#FAF7F2] p-4 text-xs space-y-1 border border-black/10">
                  <p className="font-bold text-[#20201F] text-sm">
                    {selectedVenue.name}
                  </p>
                  <p className="text-[#77736E]">{selectedVenue.location}</p>
                  <p className="text-[#77736E]">
                    Maximum venue capacity:{" "}
                    <strong className="text-[#20201F]">{selectedVenue.capacity} people</strong>
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="maxParticipants" className={labelClass}>
                  Attendee Limit (Optional)
                </label>
                <input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  max={selectedVenue?.capacity}
                  {...register("maxParticipants")}
                  placeholder="Leave empty for unlimited (up to venue limit)"
                  className={inputClass}
                />
                {errors.maxParticipants && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {errors.maxParticipants.message}
                  </p>
                )}
                <p className="mt-1.5 text-[11px] text-[#77736E]">
                  {selectedVenue
                    ? `Cannot exceed venue capacity of ${selectedVenue.capacity}.`
                    : "Choose a venue to see limit."}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Registration Mode */}
          <div className="border-t border-black/10 pt-8">
            <h2 className="text-lg font-black text-[#20201F]">
              4. Registration Mode
            </h2>
            <p className="mt-1 text-xs text-[#77736E]">
              Control how attendees join this event.
            </p>

            <div className="mt-5">
              <label htmlFor="registrationMode" className={labelClass}>
                RSVP Approval Policy *
              </label>
              <select
                id="registrationMode"
                {...register("registrationMode")}
                className={inputClass}
              >
                <option value="OPEN">Open Registration (Instant approval)</option>
                <option value="APPROVAL_REQUIRED">
                  Approval Required (Host must review submissions)
                </option>
              </select>
            </div>
          </div>

          {/* Submit Action */}
          <div className="border-t border-black/10 pt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-[#77736E]">
              After submission, you can also customize dynamic sign-up questions under My Events.
            </p>

            <button
              type="submit"
              disabled={isSubmitting || venuesLoading || venues.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E85D3F] px-8 py-4 text-sm font-bold text-white shadow-md shadow-[#E85D3F]/20 transition hover:bg-[#20201F] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send size={16} />
              {isSubmitting ? "Submitting Event..." : "Submit Event for Approval"}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
