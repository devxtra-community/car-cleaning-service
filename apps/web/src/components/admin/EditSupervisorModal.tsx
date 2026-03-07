import React, { useState, useEffect, useCallback } from 'react';
import { updateSupervisor } from '../../services/allAPI';
import Toast from '../shared/Toast';

// ─── types ────────────────────────────────────────────────────────────────────

interface Building {
  id: string;
  building_name: string;
}

interface Supervisor {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  base_salary: number;
  nationality: string;
  document_id: string;
  profile_image?: string;
  age?: number;
  document?: string;
  building?: { id: string; name: string };
}

interface EditSupervisorModalProps {
  supervisor: Supervisor;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buildings?: Building[];
}

interface SupervisorUpdatePayload {
  full_name: string;
  email: string;
  phone: string;
  nationality?: string;
  document_id?: string;
  base_salary: number;
  age?: number;
  building_id?: string;
  profile_image?: string;
  document?: string;
}

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

// ─── field wrapper ────────────────────────────────────────────────────────────

const Field = ({
  label,
  required = false,
  children,
  span2 = false,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  span2?: boolean;
}) => (
  <div className={span2 ? 'col-span-2' : ''}>
    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    {children}
  </div>
);

// ─── component ────────────────────────────────────────────────────────────────

const EditSupervisorModal: React.FC<EditSupervisorModalProps> = ({
  supervisor,
  isOpen,
  onClose,
  onSuccess,
  buildings,
}) => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const makeForm = useCallback(
    () => ({
      full_name: supervisor.full_name,
      email: supervisor.email,
      phone: supervisor.phone,
      age: supervisor.age ? String(supervisor.age) : '',
      nationality: supervisor.nationality,
      document_id: supervisor.document_id,
      base_salary: String(supervisor.base_salary),
      building_id: supervisor.building?.id ?? '',
      profile_image: supervisor.profile_image ?? '',
      document: supervisor.document ?? '',
    }),
    [supervisor]
  );

  const [form, setForm] = useState(makeForm);

  useEffect(() => {
    setForm(makeForm());
  }, [makeForm]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      showToast('Full name is required', 'error');
      return;
    }
    if (!form.email.trim()) {
      showToast('Email is required', 'error');
      return;
    }
    if (!form.phone.trim()) {
      showToast('Phone is required', 'error');
      return;
    }

    const payload: SupervisorUpdatePayload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      nationality: form.nationality.trim() || undefined,
      document_id: form.document_id.trim() || undefined,
      base_salary: Number(form.base_salary),
    };

    if (form.age) payload.age = Number(form.age);
    if (form.building_id) payload.building_id = form.building_id;
    if (form.profile_image) payload.profile_image = form.profile_image;
    if (form.document) payload.document = form.document;

    try {
      setLoading(true);
      const res = await updateSupervisor(supervisor.id, payload);
      if (res.success) {
        showToast('Supervisor updated successfully', 'success');
        setTimeout(onSuccess, 800);
      } else {
        showToast(res.message ?? 'Failed to update supervisor', 'error');
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Failed to update supervisor');
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div
        className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center z-200 p-5"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-155 max-h-[92vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Edit Supervisor</h2>
              <p className="text-[13px] text-slate-400 mt-0.5">
                Update {supervisor.full_name}'s profile
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-lg border-[1.5px] border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:text-gray-700 hover:border-slate-300 hover:bg-slate-50 transition-colors shrink-0"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="h-px bg-slate-100" />

          <form onSubmit={handleSubmit} className="p-6 pt-5.5">
            {/* Personal */}
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3.5">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Personal Information
            </p>
            <div className="grid grid-cols-2 gap-x-4.5 gap-y-3.5">
              <Field label="Full Name" required>
                <input
                  name="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                />
              </Field>
              <Field label="Email Address" required>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                />
              </Field>
              <Field label="Phone Number" required>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                />
              </Field>
              <Field label="Age">
                <input
                  name="age"
                  type="number"
                  value={form.age}
                  onChange={handleChange}
                  min="18"
                  max="100"
                  placeholder="e.g. 32"
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                />
              </Field>
              <Field label="Nationality">
                <input
                  name="nationality"
                  type="text"
                  value={form.nationality}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                />
              </Field>
              <Field label="Document ID">
                <input
                  name="document_id"
                  type="text"
                  value={form.document_id}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                />
              </Field>
            </div>

            <div className="h-px bg-slate-100 my-5" />

            {/* Assignment */}
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3.5">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 22V12h6v10M3 9h18" />
              </svg>
              Assignment & Compensation
            </p>
            <div className="grid grid-cols-2 gap-x-4.5 gap-y-3.5">
              <Field label="Base Salary (AED)" required>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                    AED
                  </span>
                  <input
                    name="base_salary"
                    type="number"
                    value={form.base_salary}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full pl-13 pr-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all"
                  />
                </div>
              </Field>
              <Field label="Building">
                {buildings && buildings.length > 0 ? (
                  <select
                    name="building_id"
                    value={form.building_id}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 pr-9 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none cursor-pointer focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width=%2712%27%20height=%278%27%20viewBox=%270%200%2012%208%27%20fill=%27none%27%20xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath%20d=%27M1%201l5%205%205-5%27%20stroke=%27%2394A3B8%27%20stroke-width=%271.5%27%20stroke-linecap=%27round%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_13px_center]"
                  >
                    <option value="">— Select building —</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.building_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name="building_id"
                    type="text"
                    value={form.building_id}
                    onChange={handleChange}
                    placeholder="Building ID"
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                  />
                )}
              </Field>
            </div>

            <div className="h-px bg-slate-100 my-5" />

            {/* Media */}
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3.5">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              Media & Documents
            </p>
            <div className="flex flex-col gap-3.5">
              <Field label="Profile Image URL" span2>
                <input
                  name="profile_image"
                  type="url"
                  value={form.profile_image}
                  onChange={handleChange}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                />
              </Field>
              <Field label="Document URL" span2>
                <input
                  name="document"
                  type="url"
                  value={form.document}
                  onChange={handleChange}
                  placeholder="https://example.com/document.pdf"
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                />
              </Field>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center gap-2.5 mt-7 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5.5 py-2.5 rounded-lg border-[1.5px] border-slate-200 bg-white text-[13.5px] font-medium text-gray-700 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5.5 py-2.5 rounded-lg border-none bg-blue-800 text-white text-[13.5px] font-semibold hover:bg-blue-900 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating…
                  </>
                ) : (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    >
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditSupervisorModal;
