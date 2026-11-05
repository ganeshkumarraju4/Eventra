import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ClipboardList,
  X,
  CheckCircle2,
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
  { value: "TEXT", label: "Short Text" },
  { value: "NUMBER", label: "Number" },
  { value: "EMAIL", label: "Email Address" },
  { value: "PHONE", label: "Phone Number" },
  { value: "URL", label: "Website / URL" },
  { value: "DATE", label: "Date" },
  { value: "SELECT", label: "Dropdown Select" },
  { value: "CHECKBOX", label: "Multi Checkbox" },
  { value: "TEXTAREA", label: "Long Text / Notes" },
];

const initialForm: FieldForm = {
  label: "",
  fieldType: "TEXT",
  required: false,
  placeholder: "",
  options: "",
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[#20201F] outline-none transition placeholder:text-[#9C968F] focus:border-[#E85D3F] focus:ring-4 focus:ring-[#E85D3F]/10";

export default function ManageRegistrationFields() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<RegistrationField | null>(null);

  const [form, setForm] = useState<FieldForm>(initialForm);
  const [saving, setSaving] = useState(false);

  const needsOptions =
    form.fieldType === "SELECT" || form.fieldType === "CHECKBOX";

  const loadFields = useCallback(async () => {
    if (!eventId) return;

    try {
      const response = await api.get(`/events/${eventId}/registration-fields`);
      setFields(response.data.fields ?? []);
      setError("");
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
          "Unable to load registration fields."
      );
    } finally {
      setLoading(false);
    }
  }, [eventId, navigate]);

  useEffect(() => {
    void loadFields();
  }, [loadFields]);

  function openCreateModal() {
    setEditingField(null);
    setForm(initialForm);
    setError("");
    setModalOpen(true);
  }

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
      setError("Please provide at least one option (one per line).");
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
        await api.post(`/events/${eventId}/registration-fields`, {
          ...payload,
          fieldType: form.fieldType,
        });
        setSuccess("Registration field created successfully.");
      }

      setModalOpen(false);
      setEditingField(null);
      setForm(initialForm);

      await loadFields();
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
      };
      setError(
        axiosError.response?.data?.message || "Unable to save registration field."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(field: RegistrationField) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the question "${field.label}"?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/events/${eventId}/registration-fields/${field.id}`);
      setSuccess("Field deleted successfully.");
      await loadFields();
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
      };
      setError(
        axiosError.response?.data?.message || "Unable to delete field."
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#20201F] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          to="/my-events"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#77736E] transition hover:text-[#E85D3F] mb-6"
        >
          <ArrowLeft size={16} />
          Back to My Events
        </Link>

        {/* Page Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-black/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E85D3F]/30 bg-[#E85D3F]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#C64A30] mb-3">
              <ClipboardList size={13} />
              Form Builder
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#20201F] sm:text-4xl">
              Registration Questions
            </h1>
            <p className="mt-2 text-sm text-[#77736E]">
              Customize the information attendees must provide when reserving a spot.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#E85D3F] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#20201F] transition cursor-pointer"
            >
              <Plus size={16} />
              Add Question
            </button>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {success && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && !modalOpen && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Form Fields List */}
        {loading ? (
          <div className="flex min-h-[35vh] flex-col items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E85D3F]/20 border-t-[#E85D3F]" />
            <p className="mt-4 text-sm font-semibold text-[#77736E]">
              Loading custom questions...
            </p>
          </div>
        ) : fields.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-black/15 bg-white p-14 text-center">
            <ClipboardList size={42} className="mx-auto text-[#77736E]" />
            <h2 className="mt-4 text-lg font-bold text-[#20201F]">
              No custom questions yet
            </h2>
            <p className="mt-1 text-sm text-[#77736E] max-w-md mx-auto">
              By default, attendees will register using their Eventra account name and email.
              Add questions if you need dietary preferences, phone numbers, or job titles.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#E85D3F] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#20201F] transition cursor-pointer"
            >
              <Plus size={16} />
              Add First Question
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm transition hover:shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FAF7F2] text-[11px] font-bold text-[#77736E] border border-black/10">
                      {index + 1}
                    </span>

                    <span className="rounded-full bg-[#E85D3F]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#C64A30]">
                      {field.fieldType}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        field.required
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {field.required ? "Required" : "Optional"}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#20201F]">
                    {field.label}
                  </h3>

                  {field.placeholder && (
                    <p className="text-xs text-[#77736E] italic">
                      Placeholder: "{field.placeholder}"
                    </p>
                  )}

                  {field.options && field.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {field.options.map((opt) => (
                        <span
                          key={opt}
                          className="rounded-lg bg-[#FAF7F2] border border-black/10 px-2 py-0.5 text-[11px] text-[#77736E]"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => openEditModal(field)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/15 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-[#20201F] hover:bg-[#FAF7F2] transition"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>

                  <button
                    onClick={() => void handleDelete(field)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-red-700 hover:bg-red-100 transition"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create or Edit Question */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="my-8 w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-black/10">
              <div className="flex items-center justify-between pb-4 border-b border-black/10">
                <h2 className="text-xl font-black text-[#20201F]">
                  {editingField ? "Edit Question" : "Add Custom Question"}
                </h2>
                <button
                  onClick={closeModal}
                  className="rounded-full p-1.5 text-[#77736E] hover:bg-black/5"
                >
                  <X size={18} />
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#20201F]">
                    Question Label *
                  </label>
                  <input
                    required
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="e.g. Dietary Restrictions or T-shirt Size"
                    className={inputClass}
                  />
                </div>

                {!editingField && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#20201F]">
                      Input Type *
                    </label>
                    <select
                      value={form.fieldType}
                      onChange={(e) =>
                        setForm({ ...form, fieldType: e.target.value as FieldType })
                      }
                      className={inputClass}
                    >
                      {fieldTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#20201F]">
                    Help / Placeholder Text (Optional)
                  </label>
                  <input
                    value={form.placeholder}
                    onChange={(e) =>
                      setForm({ ...form, placeholder: e.target.value })
                    }
                    placeholder="e.g. Vegetarian, Vegan, Gluten-free"
                    className={inputClass}
                  />
                </div>

                {needsOptions && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#20201F]">
                      Options (One per line) *
                    </label>
                    <textarea
                      rows={4}
                      value={form.options}
                      onChange={(e) =>
                        setForm({ ...form, options: e.target.value })
                      }
                      placeholder={"Option 1\nOption 2\nOption 3"}
                      className={inputClass}
                    />
                  </div>
                )}

                <div className="pt-2">
                  <label className="flex items-center gap-3 text-sm font-semibold text-[#20201F] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.required}
                      onChange={(e) =>
                        setForm({ ...form, required: e.target.checked })
                      }
                      className="h-4 w-4 rounded accent-[#E85D3F]"
                    />
                    <span>Make this question required for registration</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-5 border-t border-black/10">
                  <button
                    type="button"
                    onClick={closeModal}
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
                    {saving ? "Saving..." : editingField ? "Update Question" : "Create Question"}
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