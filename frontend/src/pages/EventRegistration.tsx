import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Send,
  Ticket,
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type FieldType =
  | "TEXT"
  | "NUMBER"
  | "EMAIL"
  | "PHONE"
  | "URL"
  | "DATE"
  | "SELECT"
  | "CHECKBOX"
  | "TEXTAREA";

interface RegistrationField {
  id: string;
  label: string;
  fieldType: FieldType;
  required: boolean;
  placeholder: string | null;
  options: string[] | string | null;
  order: number;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  startTime: string;
  endTime: string;
  status: string;
  type: "PUBLIC" | "PRIVATE";
  registrationMode: "OPEN" | "APPROVAL_REQUIRED";
}

function getOptions(options: RegistrationField["options"]): string[] {
  if (Array.isArray(options)) return options;

  if (typeof options === "string") {
    try {
      const parsed: unknown = JSON.parse(options);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return options.split(",").map((option) => option.trim()).filter(Boolean);
    }
  }

  return [];
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[#20201F] outline-none transition placeholder:text-[#9C968F] focus:border-[#E85D3F] focus:ring-4 focus:ring-[#E85D3F]/10";

export default function EventRegistration() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [answers, setAnswers] = useState<
    Record<string, string | boolean | string[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successStatus, setSuccessStatus] = useState("");

  useEffect(() => {
    let active = true;

    async function loadForm() {
      if (!eventId) {
        setError("Event ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const [eventResponse, fieldsResponse] = await Promise.all([
          api.get(`/events/${eventId}`),
          api.get(`/events/${eventId}/registration-fields`),
        ]);

        if (!active) return;

        const fetchedEvent: EventItem = eventResponse.data.event;
        const fetchedFields: RegistrationField[] = fieldsResponse.data.fields;

        if (fetchedEvent.status !== "APPROVED") {
          setError("Registration is available only for approved events.");
          return;
        }

        if (fetchedEvent.type !== "PUBLIC") {
          setError("This event is not open for public registration.");
          return;
        }

        setEvent(fetchedEvent);
        setFields([...fetchedFields].sort((a, b) => a.order - b.order));
      } catch (err: unknown) {
        if (active) {
          const axiosError = err as {
            response?: { data?: { message?: string } };
          };
          setError(
            axiosError.response?.data?.message ??
              "Unable to load the registration form."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadForm();

    return () => {
      active = false;
    };
  }, [eventId]);

  function updateAnswer(fieldId: string, value: string | boolean | string[]) {
    setAnswers((current) => ({
      ...current,
      [fieldId]: value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!eventId || !event) {
      setError("Event information is unavailable.");
      return;
    }

    for (const field of fields) {
      const value = answers[field.id];

      if (!field.required) continue;

      const isMissing =
        value === undefined ||
        value === "" ||
        value === false ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === "string" && value.trim() === "");

      if (isMissing) {
        setError(`"${field.label}" is a required field.`);
        return;
      }
    }

    const payloadAnswers = fields
      .filter((field) => answers[field.id] !== undefined)
      .map((field) => ({
        fieldId: field.id,
        value: answers[field.id],
      }));

    try {
      setSubmitting(true);

      const response = await api.post("/registrations", {
        eventId,
        answers: payloadAnswers,
      });

      setSuccessStatus(response.data.registration.status);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
      };

      setError(
        axiosError.response?.data?.message ??
          "Registration failed. You might already be registered for this event."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <LoaderCircle className="animate-spin text-[#E85D3F]" size={36} />
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <div className="rounded-2xl border border-red-200 bg-white p-8 max-w-md shadow-sm">
            <h1 className="text-xl font-bold text-[#20201F]">
              Registration unavailable
            </h1>
            <p className="mt-2 text-sm text-[#77736E]">{error}</p>
            <button
              onClick={() => navigate(eventId ? `/events/${eventId}` : "/events")}
              className="mt-6 rounded-xl bg-[#20201F] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#E85D3F] transition"
            >
              Back to Event
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (successStatus) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between">
        <Navbar />
        <div className="flex flex-1 items-center justify-center px-5 py-12">
          <div className="w-full max-w-lg rounded-3xl border border-black/[0.08] bg-white p-8 sm:p-12 text-center shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EBF5E8] text-[#266B22]">
              <CheckCircle2 size={36} />
            </div>

            <span className="inline-block mt-6 rounded-full bg-[#E85D3F]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#C64A30]">
              Confirmed Registration
            </span>

            <h1 className="mt-3 text-3xl font-black text-[#20201F]">
              You're on the list!
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-[#77736E]">
              Your registration for <strong className="text-[#20201F] font-bold">{event?.title}</strong> has been received.
            </p>

            <div className="mt-6 rounded-2xl bg-[#FAF7F2] p-4 border border-black/10 inline-flex items-center gap-3">
              <Ticket size={20} className="text-[#E85D3F]" />
              <span className="text-xs font-bold text-[#20201F]">
                Registration Status:{" "}
                <span className={successStatus === "APPROVED" ? "text-[#266B22]" : "text-[#B45309]"}>
                  {successStatus}
                </span>
              </span>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/my-registrations"
                className="rounded-xl bg-[#E85D3F] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#20201F] transition"
              >
                View My Tickets
              </Link>
              <Link
                to={`/events/${eventId}`}
                className="rounded-xl border border-black/15 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#20201F] hover:bg-[#FAF7F2] transition"
              >
                Return to Event Page
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#20201F] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-2xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          to={`/events/${eventId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#77736E] transition hover:text-[#E85D3F] mb-6"
        >
          <ArrowLeft size={16} />
          Back to Event Details
        </Link>

        {/* Form Container */}
        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 sm:p-10 shadow-sm">
          {/* Header */}
          <div className="border-b border-black/10 pb-6">
            <span className="rounded-full bg-[#E85D3F]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#C64A30]">
              Event Registration
            </span>

            <h1 className="mt-3 text-2xl font-black text-[#20201F] sm:text-3xl">
              {event?.title}
            </h1>

            {event && (
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#77736E]">
                <span className="flex items-center gap-1 font-semibold text-[#20201F]">
                  <CalendarDays size={14} className="text-[#E85D3F]" />
                  {new Date(event.startTime).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>

                <span className="flex items-center gap-1">
                  <Clock3 size={14} />
                  {new Date(event.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-6">
            {fields.length === 0 ? (
              <div className="rounded-2xl bg-[#FAF7F2] p-5 text-center text-xs text-[#77736E] border border-black/10">
                <p className="font-semibold text-[#20201F]">
                  Standard One-Click RSVP
                </p>
                <p className="mt-1">
                  This organizer has not requested additional custom questions.
                  Click below to confirm your spot with your profile.
                </p>
              </div>
            ) : (
              fields.map((field) => {
                const options = getOptions(field.options);
                const currentAnswer = answers[field.id];

                return (
                  <div key={field.id} className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#20201F]">
                      {field.label} {field.required && <span className="text-[#E85D3F]">*</span>}
                    </label>

                    {/* TEXTAREA */}
                    {field.fieldType === "TEXTAREA" && (
                      <textarea
                        rows={3}
                        placeholder={field.placeholder ?? undefined}
                        value={(currentAnswer as string) ?? ""}
                        onChange={(e) => updateAnswer(field.id, e.target.value)}
                        className={inputClass}
                      />
                    )}

                    {/* SELECT */}
                    {field.fieldType === "SELECT" && (
                      <select
                        value={(currentAnswer as string) ?? ""}
                        onChange={(e) => updateAnswer(field.id, e.target.value)}
                        className={inputClass}
                      >
                        <option value="">
                          {field.placeholder || "— Please select an option —"}
                        </option>
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* CHECKBOX */}
                    {field.fieldType === "CHECKBOX" && (
                      <div className="pt-1 space-y-2">
                        {options.map((option) => {
                          const selected = Array.isArray(currentAnswer)
                            ? currentAnswer.includes(option)
                            : false;

                          return (
                            <label
                              key={option}
                              className="flex items-center gap-3 text-sm text-[#20201F] cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(e) => {
                                  const list = Array.isArray(currentAnswer)
                                    ? [...currentAnswer]
                                    : [];
                                  if (e.target.checked) {
                                    list.push(option);
                                  } else {
                                    const index = list.indexOf(option);
                                    if (index > -1) list.splice(index, 1);
                                  }
                                  updateAnswer(field.id, list);
                                }}
                                className="h-4 w-4 rounded accent-[#E85D3F]"
                              />
                              <span>{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* STANDARD INPUTS */}
                    {field.fieldType !== "TEXTAREA" &&
                      field.fieldType !== "SELECT" &&
                      field.fieldType !== "CHECKBOX" && (
                        <input
                          type={
                            field.fieldType === "NUMBER"
                              ? "number"
                              : field.fieldType === "EMAIL"
                              ? "email"
                              : field.fieldType === "PHONE"
                              ? "tel"
                              : field.fieldType === "URL"
                              ? "url"
                              : field.fieldType === "DATE"
                              ? "date"
                              : "text"
                          }
                          placeholder={field.placeholder ?? undefined}
                          value={(currentAnswer as string) ?? ""}
                          onChange={(e) => updateAnswer(field.id, e.target.value)}
                          className={inputClass}
                        />
                      )}
                  </div>
                );
              })
            )}

            <div className="pt-6 border-t border-black/10">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E85D3F] px-6 py-4 text-sm font-bold text-white shadow-md shadow-[#E85D3F]/20 hover:bg-[#20201F] transition disabled:opacity-50 cursor-pointer"
              >
                <Send size={16} />
                {submitting ? "Submitting Registration..." : "Confirm Registration"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
