import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ClipboardList,
  X,
  Save,
  RefreshCw,
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
  options: string[] | null;
  order: number;
}

interface FieldForm {
  label: string;
  fieldType: FieldType;
  required: boolean;
  placeholder: string;
  options: string;
}

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: "TEXT", label: "Text" },
  { value: "NUMBER", label: "Number" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "URL", label: "URL" },
  { value: "DATE", label: "Date" },
  { value: "SELECT", label: "Dropdown" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "TEXTAREA", label: "Long Text" },
];

const initialForm: FieldForm = {
  label: "",
  fieldType: "TEXT",
  required: false,
  placeholder: "",
  options: "",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function ManageRegistrationFields() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] =
    useState<RegistrationField | null>(null);

  const [form, setForm] = useState<FieldForm>(initialForm);
  const [saving, setSaving] = useState(false);

  const needsOptions =
    form.fieldType === "SELECT" || form.fieldType === "CHECKBOX";

  // Fetch existing registration fields
 const loadFields = useCallback(async () => {
  if (!eventId) return;

  try {
    const response = await api.get(
      `/events/${eventId}/registration-fields`
    );

    setFields(response.data.fields ?? []);
    setError("");

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
      localStorage.removeItem("user");

      navigate("/login", { replace: true });
      return;
    }

    setError(
      error.response?.data?.message ||
        "Unable to load registration fields."
    );

  } finally {
    setLoading(false);
  }
}, [eventId, navigate]);

  useEffect(() => {
  let active = true;

  if (!eventId) {
    return;
  }

  api
    .get(`/events/${eventId}/registration-fields`)
    .then((response) => {
      if (active) {
        setFields(response.data.fields ?? []);
      }
    })
    .catch((err: unknown) => {
      if (!active) return;

      const error = err as {
        response?: {
          status?: number;
          data?: { message?: string };
        };
      };

      if (error.response?.status === 401 ||
          error.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to load registration fields."
      );
    })
    .finally(() => {
      if (active) {
        setLoading(false);
      }
    });

  return () => {
    active = false;
  };
}, [eventId, navigate]);

  // Open modal for creating a field
  function openCreateModal() {
    setEditingField(null);
    setForm(initialForm);
    setError("");
    setModalOpen(true);
  }

  // Open modal for editing a field
  function openEditModal(field: RegistrationField) {
    setEditingField(field);

    setForm({
      label: field.label,
      fieldType: field.fieldType,
      required: field.required,
      placeholder: field.placeholder ?? "",
      options: field.options?.join("\n") ?? "",
    });

    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingField(null);
    setForm(initialForm);
  }

  // Handle form submission
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const label = form.label.trim();

    if (!label) {
      setError("Please enter a question label.");
      return;
    }

    const options = form.options
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);

    if (needsOptions && options.length === 0) {
      setError("Please provide at least one option.");
      return;
    }

    const payload = {
      label,
      required: form.required,
      placeholder: form.placeholder.trim() || null,
      ...(needsOptions ? { options } : {}),
    };

    setSaving(true);

    try {
      if (editingField) {
        await api.patch(
          `/events/${eventId}/registration-fields/${editingField.id}`,
          payload
        );

        setSuccess("Registration field updated successfully.");
      } else {
        await api.post(
          `/events/${eventId}/registration-fields`,
          {
            ...payload,
            fieldType: form.fieldType,
          }
        );

        setSuccess("Registration field created successfully.");
      }

      setModalOpen(false);
      setEditingField(null);
      setForm(initialForm);

      await loadFields();
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: { message?: string };
        };
      };

      setError(
        error.response?.data?.message ||
          "Unable to save registration field."
      );
    } finally {
      setSaving(false);
    }
  }

  // Delete a registration field
  async function handleDelete(field: RegistrationField) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${field.label}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(
        `/events/${eventId}/registration-fields/${field.id}`
      );

      setSuccess("Registration field deleted successfully.");

      await loadFields();
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: { message?: string };
        };
      };

      setError(
        error.response?.data?.message ||
          "Unable to delete registration field."
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <button
              onClick={() => navigate("/my-events")}
              className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
            >
              <ArrowLeft size={17} />
              Back to My Events
            </button>

            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Organizer Workspace
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Registration Form Builder
            </h1>

            <p className="mt-2 text-slate-500">
              Create custom questions for people registering
              for your event.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            <Plus size={18} />
            Add Question
          </button>
        </div>

        {/* Success message */}
        {success && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Field count */}
        {!loading && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              Total registration questions
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {fields.length}
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20">
            <RefreshCw
              size={32}
              className="animate-spin text-indigo-600"
            />

            <p className="mt-4 text-slate-600">
              Loading registration fields...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && fields.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

            <ClipboardList
              size={42}
              className="mx-auto text-indigo-500"
            />

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No registration questions yet
            </h2>

            <p className="mt-2 text-slate-500">
              Start building your registration form by adding
              your first question.
            </p>

            <button
              onClick={openCreateModal}
              className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Add First Question
            </button>
          </div>
        )}

        {/* Registration fields */}
        {!loading && fields.length > 0 && (
          <div className="space-y-4">

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
              >

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                  <div className="flex gap-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
                      {index + 1}
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {field.label}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-2">

                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {field.fieldType}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            field.required
                              ? "bg-red-50 text-red-600"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {field.required ? "Required" : "Optional"}
                        </span>
                      </div>

                      {field.placeholder && (
                        <p className="mt-2 text-sm text-slate-500">
                          Placeholder: {field.placeholder}
                        </p>
                      )}

                      {field.options && field.options.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {field.options.map((option, i) => (
                            <span
                              key={i}
                              className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-600"
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 sm:shrink-0">

                    <button
                      onClick={() => openEditModal(field)}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      onClick={() => void handleDelete(field)}
                      className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-8">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingField ? "Edit Question" : "Add Question"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Configure your registration question.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Question label */}
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Question Label *
                </label>

                <input
                  type="text"
                  value={form.label}
                  onChange={(e) =>
                    setForm({ ...form, label: e.target.value })
                  }
                  placeholder="e.g. College Name"
                  className={inputClass}
                  required
                />
              </div>

              {/* Field type */}
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Field Type *
                </label>

                <select
                  value={form.fieldType}
                  disabled={!!editingField}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fieldType: e.target.value as FieldType,
                      options: "",
                    })
                  }
                  className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100`}
                >
                  {fieldTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                {editingField && (
                  <p className="mt-1 text-xs text-slate-500">
                    Field type cannot be changed after creation.
                  </p>
                )}
              </div>

              {/* Placeholder */}
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Placeholder
                </label>

                <input
                  type="text"
                  value={form.placeholder}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      placeholder: e.target.value,
                    })
                  }
                  placeholder="Enter a helpful hint"
                  className={inputClass}
                />
              </div>

              {/* Options */}
              {needsOptions && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Options *
                  </label>

                  <textarea
                    rows={4}
                    value={form.options}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        options: e.target.value,
                      })
                    }
                    placeholder={"Option 1\nOption 2\nOption 3"}
                    className={inputClass}
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    Enter one option per line.
                  </p>
                </div>
              )}

              {/* Required */}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-4">

                <input
                  type="checkbox"
                  checked={form.required}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      required: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-indigo-600"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Required question
                  </p>

                  <p className="text-xs text-slate-500">
                    Participants must answer this question.
                  </p>
                </div>
              </label>

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save size={17} />

                  {saving
                    ? "Saving..."
                    : editingField
                      ? "Update Question"
                      : "Create Question"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}