import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  Send,
} from "lucide-react";
import api from "../api/axios";

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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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
        const fetchedFields: RegistrationField[] =
          fieldsResponse.data.fields;

        if (fetchedEvent.status !== "APPROVED") {
          setError("Registration is available only for approved events.");
          return;
        }

        if (fetchedEvent.type !== "PUBLIC") {
          setError("This event is not available for public registration.");
          return;
        }

        setEvent(fetchedEvent);
        setFields(
          [...fetchedFields].sort((a, b) => a.order - b.order)
        );
      } catch (err: unknown) {
        if (active) {
          const axiosError = err as {
            response?: {
              data?: { message?: string };
            };
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
    setError(`${field.label} is required.`);
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
        response?: {
          data?: { message?: string };
        };
      };

      setError(
        axiosError.response?.data?.message ??
          "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7fb]">
        <LoaderCircle className="animate-spin text-[#5147a5]" size={30} />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f7fb] px-5 text-center">
        <h1 className="text-2xl font-bold">Registration unavailable</h1>
        <p className="mt-3 text-sm text-gray-500">{error}</p>
        <button
          onClick={() => navigate(eventId ? `/events/${eventId}` : "/events")}
          className="mt-6 rounded-xl bg-[#5147a5] px-5 py-3 text-sm font-semibold text-white"
        >
          Back to Event
        </button>
      </div>
    );
  }

  if (successStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7fb] px-5">
        <div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm sm:p-10">
          <CheckCircle2 className="mx-auto text-green-500" size={54} />

          <h1 className="mt-5 text-2xl font-bold text-[#24243a]">
            Registration successful!
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Your registration for {event?.title} has been submitted.
          </p>

          <p className="mt-5 inline-flex rounded-full bg-[#f0effb] px-4 py-2 text-sm font-semibold text-[#5147a5]">
            Status: {successStatus}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-1 rounded-xl bg-[#5147a5] px-5 py-3 text-sm font-semibold text-white"
            >
              Go to Dashboard
            </button>

            <button
              onClick={() => navigate("/events")}
              className="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Explore More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-[#24243a]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#5147a5]"
          >
            <ArrowLeft size={18} />
            Back to Event
          </button>

          <span className="text-xl font-extrabold text-[#393477]">
            Eventra<span className="text-[#8c83e8]">.</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
          <div className="border-b border-gray-100 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0effb] text-[#5147a5]">
              <CalendarDays size={24} />
            </div>

            <h1 className="mt-5 text-3xl font-extrabold">
              Event Registration
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Complete the form below to register for this event.
            </p>

            {event && (
              <div className="mt-5 rounded-2xl bg-[#faf9ff] p-4">
                <h2 className="font-bold">{event.title}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {formatDate(event.startTime)}
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-6">
            {fields.length === 0 ? (
              <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                No additional information is required. You can submit your
                registration below.
              </p>
            ) : (
              fields.map((field) => {
                const inputClass =
                  "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#5147a5] focus:ring-2 focus:ring-[#5147a5]/10";

                return (
                  <div key={field.id}>
                    <label
                      htmlFor={field.id}
                      className="text-sm font-semibold text-gray-700"
                    >
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </label>

                    {field.fieldType === "TEXTAREA" ? (
                      <textarea
                        id={field.id}
                        required={field.required}
                        placeholder={field.placeholder ?? ""}
                        value={String(answers[field.id] ?? "")}
                        onChange={(e) =>
                          updateAnswer(field.id, e.target.value)
                        }
                        rows={4}
                        className={inputClass}
                      />
                    ) : field.fieldType === "SELECT" ? (
                      <select
                        id={field.id}
                        required={field.required}
                        value={String(answers[field.id] ?? "")}
                        onChange={(e) =>
                          updateAnswer(field.id, e.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="">Select an option</option>
                        {getOptions(field.options).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : field.fieldType === "CHECKBOX" ? (
                    <div className="mt-3 space-y-3">
                        {getOptions(field.options).map((option) => {
                        const selectedOptions = Array.isArray(answers[field.id])
                            ? (answers[field.id] as string[])
                            : [];

                        return (
                            <label
                            key={option}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-[#5147a5] hover:bg-[#faf9ff]"
                            >
                            <input
                                type="checkbox"
                                checked={selectedOptions.includes(option)}
                                onChange={(e) => {
                                const updatedOptions = e.target.checked
                                    ? [...selectedOptions, option]
                                    : selectedOptions.filter((item) => item !== option);

                                updateAnswer(field.id, updatedOptions);
                                }}
                                className="h-4 w-4 accent-[#5147a5]"
                            />

                            <span className="text-sm text-gray-600">{option}</span>
                            </label>
                        );
                        })}
                    </div>
                    ) : (
                      <input
                        id={field.id}
                        type={
                          field.fieldType === "EMAIL"
                            ? "email"
                            : field.fieldType === "NUMBER"
                              ? "number"
                              : field.fieldType === "PHONE"
                                ? "tel"
                                : field.fieldType === "URL"
                                  ? "url"
                                  : field.fieldType === "DATE"
                                    ? "date"
                                    : "text"
                        }
                        required={field.required}
                        placeholder={field.placeholder ?? ""}
                        value={String(answers[field.id] ?? "")}
                        onChange={(e) =>
                          updateAnswer(field.id, e.target.value)
                        }
                        className={inputClass}
                      />
                    )}
                  </div>
                );
              })
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5147a5] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#403687] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit Registration
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

