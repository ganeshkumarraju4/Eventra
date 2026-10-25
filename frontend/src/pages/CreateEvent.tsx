import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, MapPin, Send } from "lucide-react";
import { useForm, useWatch} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../api/axios";

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
"mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#20253b] outline-none transition placeholder:text-gray-400 focus:border-[#303b76] focus:ring-2 focus:ring-[#303b76]/10";

const labelClass = "block text-sm font-semibold text-gray-700";

export default function CreateEvent() {
const navigate = useNavigate();

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
    "Unable to create the event. Please try again.";

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

return ( <div className="min-h-screen bg-[#faf8f4] text-[#20253b]"> <header className="border-b border-gray-200 bg-white"> <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
<button
onClick={() => navigate("/dashboard")}
className="flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-[#303b76]"
> <ArrowLeft size={18} />
Back to dashboard </button>


      <span className="text-xl font-bold text-[#303b76]">Eventra</span>
    </div>
  </header>

  <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
    <div className="mb-8">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#303b76] text-white">
        <CalendarDays size={24} />
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d96d59]">
        Bring people together
      </p>

      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
        Create an event
      </h1>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
        Share your idea, choose a venue, and submit your event for admin
        approval.
      </p>
    </div>

    {successMessage && (
      <div
        role="status"
        className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5"
      >
        <h2 className="font-bold text-green-800">
          Event submitted successfully!
        </h2>

        <p className="mt-1 text-sm text-green-700">{successMessage}</p>

        <p className="mt-2 text-sm text-green-700">
          Your event is awaiting admin approval.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-xl bg-[#303b76] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#252e60]"
          >
            Return to dashboard
          </button>

          <button
            onClick={() => window.location.reload()}
            className="rounded-xl border border-green-300 px-4 py-2.5 text-sm font-semibold text-green-800 hover:bg-green-100"
          >
            Create another event
          </button>
        </div>
      </div>
    )}

    {submitError && (
      <div
        role="alert"
        className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        {submitError}
      </div>
    )}

    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-8"
    >
      <section>
        <h2 className="text-lg font-bold">Event information</h2>

        <p className="mt-1 text-sm text-gray-500">
          Tell attendees what your event is about.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="title" className={labelClass}>
              Event title *
            </label>

            <input
              id="title"
              {...register("title")}
              placeholder="e.g. Web Development Workshop"
              className={inputClass}
            />

            {errors.title && (
              <p className="mt-1 text-sm text-red-600">
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
              placeholder="Describe the event, its purpose, and what attendees can expect..."
              className={inputClass}
            />

            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
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
                <option value="CONFERENCE">Conference</option>
                <option value="WORKSHOP">Workshop</option>
                <option value="SEMINAR">Seminar</option>
                <option value="CONCERT">Concert</option>
                <option value="SPORTS">Sports</option>
                <option value="TECHNICAL">Technical</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="type" className={labelClass}>
                Event visibility *
              </label>

              <select
                id="type"
                {...register("type")}
                className={inputClass}
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>

              <p className="mt-1 text-xs text-gray-500">
                Public events can appear in Explore Events after approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 pt-7">
        <h2 className="text-lg font-bold">Date and time</h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="startTime" className={labelClass}>
              Start date and time *
            </label>

            <input
              id="startTime"
              type="datetime-local"
              {...register("startTime")}
              className={inputClass}
            />

            {errors.startTime && (
              <p className="mt-1 text-sm text-red-600">
                {errors.startTime.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="endTime" className={labelClass}>
              End date and time *
            </label>

            <input
              id="endTime"
              type="datetime-local"
              {...register("endTime")}
              className={inputClass}
            />

            {errors.endTime && (
              <p className="mt-1 text-sm text-red-600">
                {errors.endTime.message}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 pt-7">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <MapPin size={20} />
          Venue and capacity
        </h2>

        <div className="mt-5 space-y-5">
          <div>
            <label htmlFor="venueId" className={labelClass}>
              Select venue *
            </label>

            <select
              id="venueId"
              {...register("venueId")}
              disabled={venuesLoading || venues.length === 0}
              className={inputClass}
            >
              <option value="">
                {venuesLoading
                  ? "Loading venues..."
                  : "Choose a venue"}
              </option>

              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name} · {venue.location} · Capacity {venue.capacity}
                </option>
              ))}
            </select>

            {errors.venueId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.venueId.message}
              </p>
            )}

            {venueError && (
              <p role="alert" className="mt-1 text-sm text-red-600">
                {venueError}
              </p>
            )}

            {!venuesLoading && !venueError && venues.length === 0 && (
              <p className="mt-1 text-sm text-amber-700">
                No venues are available. An administrator must create a
                venue before you can submit an event.
              </p>
            )}
          </div>

          {selectedVenue && (
            <div className="rounded-xl bg-[#f5f4fb] p-4 text-sm">
              <p className="font-semibold">{selectedVenue.name}</p>
              <p className="mt-1 text-gray-600">
                {selectedVenue.location}
              </p>
              <p className="mt-1 text-gray-600">
                Maximum venue capacity: {selectedVenue.capacity}
              </p>
            </div>
          )}

          <div>
            <label htmlFor="maxParticipants" className={labelClass}>
              Maximum participants
            </label>

            <input
              id="maxParticipants"
              type="number"
              min="1"
              max={selectedVenue?.capacity}
              {...register("maxParticipants")}
              placeholder="Leave blank for unlimited"
              className={inputClass}
            />

            {errors.maxParticipants && (
              <p className="mt-1 text-sm text-red-600">
                {errors.maxParticipants.message}
              </p>
            )}

            <p className="mt-1 text-xs text-gray-500">
              {selectedVenue
                ? `Must not exceed venue capacity (${selectedVenue.capacity}).`
                : "Choose a venue to see its capacity limit."}
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 pt-7">
        <h2 className="text-lg font-bold">Registration settings</h2>

        <div className="mt-5">
          <label htmlFor="registrationMode" className={labelClass}>
            Who can register? *
          </label>

          <select
            id="registrationMode"
            {...register("registrationMode")}
            className={inputClass}
          >
            <option value="OPEN">Open registration</option>
            <option value="APPROVAL_REQUIRED">
              Registration requires approval
            </option>
          </select>

          <p className="mt-1 text-xs text-gray-500">
            Choose whether registrations are open or require approval.
          </p>
        </div>
      </section>

      <div className="border-t border-gray-100 pt-6">
        <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs leading-5 text-gray-500">
            Your event will remain pending until an admin reviews it.
          </p>

          <button
            type="submit"
            disabled={isSubmitting || venuesLoading || venues.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#303b76] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#252e60] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={17} />
            {isSubmitting ? "Submitting..." : "Submit event"}
          </button>
        </div>
      </div>
    </form>
  </main>
</div>


);
}
