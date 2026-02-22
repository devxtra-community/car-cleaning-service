import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getSupervisorDetails,
  toggleSupervisorStatus,
  updateSupervisor,
  deleteSupervisor,
  getAvailableCleaners,
  assignCleanerToSupervisor,
  removeCleanerFromSupervisor,
  getSupervisorBuildingOptions,
  type Supervisor,
  type AvailableCleaner,
  type BuildingOption,
  type UpdateSupervisorPayload,
  SupervisorCleaner,
} from '../../services/allAPI';
import Toast from '../shared/Toast';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

const COLORS = [
  '#3B5BDB',
  '#1971C2',
  '#0C8599',
  '#2F9E44',
  '#E67700',
  '#C2255C',
  '#9C36B5',
  '#5C7CFA',
];
const avatarColor = (name: string) => COLORS[name.charCodeAt(0) % COLORS.length];

const axiosMsg = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const e = err as { response?: { data?: { message?: string } } };
    return e.response?.data?.message ?? 'Something went wrong';
  }
  return 'Something went wrong';
};

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: string | number;
  subtext?: string;
  accent: string;
  icon: React.ReactNode;
}> = ({ label, value, subtext, accent, icon }) => (
  <div
    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
    style={{ borderTop: `3px solid ${accent}` }}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shrink-0"
      style={{ background: `${accent}18`, color: accent }}
    >
      {icon}
    </div>
    <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</p>
    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">{label}</p>
    {subtext && <p className="text-xs text-slate-300 mt-0.5">{subtext}</p>}
  </div>
);

// ─── Info row ─────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value?: string | number | null; link?: string }> = ({
  label,
  value,
  link,
}) => (
  <div className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-xs text-slate-400 font-medium">{label}</span>
    {link ? (
      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="text-xs font-semibold text-blue-600 hover:underline"
      >
        View ↗
      </a>
    ) : (
      <span className="text-xs font-semibold text-slate-800 text-right max-w-[60%] truncate">
        {value ?? '—'}
      </span>
    )}
  </div>
);

// ─── Edit modal ───────────────────────────────────────────────────────────────

const EditSupervisorModal: React.FC<{
  supervisor: Supervisor;
  buildings: BuildingOption[];
  onClose: () => void;
  onSuccess: (updated: Supervisor) => void;
}> = ({ supervisor, buildings, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'profile' | 'cleaners'>('profile');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [availCleaners, setAvailCleaners] = useState<AvailableCleaner[]>([]);
  const [cleanerSearch, setCleanerSearch] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [localSup, setLocalSup] = useState<Supervisor>(supervisor);

  const showToast = (message: string, type: ToastState['type']) => setToast({ message, type });

  const [form, setForm] = useState({
    full_name: supervisor.full_name,
    email: supervisor.email,
    phone: supervisor.phone,
    age: supervisor.age ? String(supervisor.age) : '',
    nationality: supervisor.nationality ?? '',
    document_id: supervisor.document_id ?? '',
    base_salary: String(supervisor.base_salary),
    building_id: supervisor.building?.id ?? '',
    profile_image: supervisor.profile_image ?? '',
    document: supervisor.document ?? '',
    password: '',
  });

  // Load available cleaners once when switching to cleaners tab
  useEffect(() => {
    if (tab !== 'cleaners') return;
    void (async () => {
      try {
        const data = await getAvailableCleaners(supervisor.id);
        setAvailCleaners(data);
      } catch {
        showToast('Failed to load available cleaners', 'error');
      }
    })();
  }, [tab, supervisor.id]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

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

    const payload: UpdateSupervisorPayload = {
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
    if (form.password) payload.password = form.password;

    setLoading(true);
    try {
      const res = await updateSupervisor(supervisor.id, payload);
      if (res.success) {
        showToast('Supervisor updated', 'success');
        setTimeout(() => onSuccess(res.data), 600);
      } else {
        showToast(res.message ?? 'Update failed', 'error');
      }
    } catch (err) {
      showToast(axiosMsg(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Assign cleaner
  const handleAssign = async (cleanerId: string) => {
    setAssigning(cleanerId);
    try {
      await assignCleanerToSupervisor(supervisor.id, cleanerId);
      // Move cleaner from available list to supervisor's list
      const assigned = availCleaners.find((c) => c.id === cleanerId);
      if (assigned) {
        setLocalSup((prev) => ({
          ...prev,
          cleaners: [
            ...prev.cleaners,
            {
              id: assigned.id,
              full_name: assigned.full_name,
              email: assigned.email,
              total_tasks: 0,
              total_earning: 0,
              base_salary: 0,
              incentive_target: assigned.incentive_target ?? 0,
              floor: assigned.floor_id
                ? { id: assigned.floor_id, floor_number: assigned.floor_number ?? 0 }
                : null,
            } satisfies SupervisorCleaner,
          ],
        }));
        setAvailCleaners((prev) => prev.filter((c) => c.id !== cleanerId));
      }
      showToast('Cleaner assigned successfully', 'success');
    } catch (err) {
      showToast(axiosMsg(err), 'error');
    } finally {
      setAssigning(null);
    }
  };

  // Remove cleaner
  const handleRemoveCleaner = async (cleanerId: string) => {
    setRemovingId(cleanerId);
    try {
      await removeCleanerFromSupervisor(supervisor.id, cleanerId);
      const removed = localSup.cleaners.find((c) => c.id === cleanerId);
      setLocalSup((prev) => ({
        ...prev,
        cleaners: prev.cleaners.filter((c) => c.id !== cleanerId),
      }));
      // Put back in available list (basic info only)
      if (removed) {
        setAvailCleaners((prev) => [
          ...prev,
          {
            id: removed.id,
            full_name: removed.full_name,
            email: removed.email,
            phone: null,
            profile_image: null,
            building_id: null,
            building_name: null,
            floor_id: removed.floor?.id ?? null,
            floor_name: null,
            floor_number: removed.floor?.floor_number ?? null,
            incentive_target: removed.incentive_target ?? 0,
          } satisfies AvailableCleaner,
        ]);
      }
      showToast('Cleaner removed', 'success');
    } catch (err) {
      showToast(axiosMsg(err), 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const filteredAvail = availCleaners.filter(
    (c) =>
      c.full_name.toLowerCase().includes(cleanerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(cleanerSearch.toLowerCase())
  );

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all';
  const labelCls = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5';

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
        style={{ animation: 'fadeIn 0.18s ease' }}
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
          style={{ animation: 'popIn 0.2s ease' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="px-7 pt-6 pb-5 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Edit Supervisor</h2>
              <p className="text-xs text-slate-400 mt-0.5">Updating {supervisor.full_name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shrink-0"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="px-7 pt-4 flex gap-1 border-b border-slate-100 shrink-0">
            {(['profile', 'cleaners'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-t-lg text-xs font-bold uppercase tracking-widest transition-colors ${
                  tab === t ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t === 'profile' ? 'Profile' : `Cleaners (${localSup.cleaners.length})`}
              </button>
            ))}
          </div>

          {/* Body — scrollable */}
          <div className="overflow-y-auto flex-1 px-7 py-6">
            {/* ── Profile tab ─────────────────────────────────────────────── */}
            {tab === 'profile' && (
              <form id="edit-sup-form" onSubmit={handleSubmit} className="space-y-5">
                {/* Personal */}
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"
                    />
                  </svg>
                  Personal Information
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="full_name"
                      type="text"
                      value={form.full_name}
                      onChange={handleChange}
                      required
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      Phone <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Age</label>
                    <input
                      name="age"
                      type="number"
                      value={form.age}
                      onChange={handleChange}
                      min="18"
                      max="100"
                      placeholder="e.g. 32"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Nationality</label>
                    <input
                      name="nationality"
                      type="text"
                      value={form.nationality}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Document ID</label>
                    <input
                      name="document_id"
                      type="text"
                      value={form.document_id}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* Assignment & pay */}
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18"
                    />
                  </svg>
                  Assignment &amp; Compensation
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>
                      Base Salary (AED) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
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
                        className={`${inputCls} pl-12`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Building</label>
                    <div className="relative">
                      <select
                        name="building_id"
                        value={form.building_id}
                        onChange={handleChange}
                        className={`${inputCls} appearance-none pr-9 cursor-pointer`}
                      >
                        <option value="">— No building —</option>
                        {buildings.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.building_name}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* Media & docs */}
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                    />
                  </svg>
                  Media &amp; Documents
                </p>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Profile Image URL</label>
                    <input
                      name="profile_image"
                      type="url"
                      value={form.profile_image}
                      onChange={handleChange}
                      placeholder="https://…"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Document URL</label>
                    <input
                      name="document"
                      type="url"
                      value={form.document}
                      onChange={handleChange}
                      placeholder="https://…"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* Password reset */}
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                  Reset Password (optional)
                </p>
                <div>
                  <label className={labelCls}>New Password</label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Leave blank to keep current password"
                    className={inputCls}
                  />
                </div>
              </form>
            )}

            {/* ── Cleaners tab ─────────────────────────────────────────────── */}
            {tab === 'cleaners' && (
              <div className="space-y-5">
                {/* Current cleaners */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    Assigned Cleaners ({localSup.cleaners.length})
                  </p>
                  {localSup.cleaners.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                      <p className="text-sm text-slate-400">No cleaners assigned yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {localSup.cleaners.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all group"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                            style={{ background: avatarColor(c.full_name) }}
                          >
                            {initials(c.full_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {c.full_name}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{c.email}</p>
                          </div>
                          {c.floor && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold shrink-0">
                              F{c.floor.floor_number}
                            </span>
                          )}
                          <button
                            onClick={() => void handleRemoveCleaner(c.id)}
                            disabled={removingId === c.id}
                            title="Remove from supervisor"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          >
                            {removingId === c.id ? (
                              <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2.5}
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100" />

                {/* Available cleaners to assign */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    Add Cleaners Without a Supervisor ({filteredAvail.length})
                  </p>

                  {availCleaners.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                      <p className="text-sm text-slate-400">
                        All registered cleaners already have supervisors
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Search */}
                      <div className="relative mb-3">
                        <svg
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.8}
                          viewBox="0 0 24 24"
                        >
                          <circle cx="11" cy="11" r="7" />
                          <path strokeLinecap="round" d="M17 17l4 4" />
                        </svg>
                        <input
                          value={cleanerSearch}
                          onChange={(e) => setCleanerSearch(e.target.value)}
                          placeholder="Search cleaners…"
                          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {filteredAvail.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all"
                          >
                            {c.profile_image ? (
                              <img
                                src={c.profile_image}
                                alt={c.full_name}
                                className="w-8 h-8 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                                style={{ background: avatarColor(c.full_name) }}
                              >
                                {initials(c.full_name)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {c.full_name}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {c.building_name ? `${c.building_name}` : 'No building'}
                                {c.floor_number !== null ? ` · F${c.floor_number}` : ''}
                              </p>
                            </div>
                            <button
                              onClick={() => void handleAssign(c.id)}
                              disabled={assigning === c.id}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                            >
                              {assigning === c.id ? (
                                <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              ) : (
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2.5}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 4.5v15m7.5-7.5h-15"
                                  />
                                </svg>
                              )}
                              Assign
                            </button>
                          </div>
                        ))}
                        {filteredAvail.length === 0 && cleanerSearch && (
                          <p className="text-sm text-slate-400 text-center py-4">
                            No results for &ldquo;{cleanerSearch}&rdquo;
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal footer */}
          <div className="px-7 py-5 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            {tab === 'profile' && (
              <button
                type="submit"
                form="edit-sup-form"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const SupervisorDetails: React.FC = () => {
  const navigate = useNavigate();
  const { supervisorId } = useParams<{ supervisorId: string }>();
  const { isAuthenticated } = useAuth();

  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingPage, setDeletingPage] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [cleanerSearch, setCleanerSearch] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: ToastState['type']) => setToast({ message, type });

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchSupervisor = useCallback(async () => {
    if (!supervisorId) return;
    try {
      setLoading(true);
      setPageError(null);
      const res = await getSupervisorDetails(supervisorId);
      console.log(res);

      setSupervisor(res.data);
    } catch (err) {
      setPageError(axiosMsg(err));
    } finally {
      setLoading(false);
    }
  }, [supervisorId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchSupervisor();
    void getSupervisorBuildingOptions()
      .then(setBuildings)
      .catch(() => {});
  }, [supervisorId, isAuthenticated, fetchSupervisor]);

  // ── toggle status ──────────────────────────────────────────────────────────

  const handleToggleStatus = async () => {
    if (!supervisor) return;
    setTogglingStatus(true);
    try {
      const next = !supervisor.is_active;
      await toggleSupervisorStatus(supervisor.id, next);
      setSupervisor((prev) => (prev ? { ...prev, is_active: next } : null));
      showToast(`Supervisor ${next ? 'activated' : 'deactivated'}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setTogglingStatus(false);
    }
  };

  // ── delete page ────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!supervisor) return;
    setDeletingPage(true);
    try {
      await deleteSupervisor(supervisor.id);
      showToast('Supervisor deleted', 'success');
      setTimeout(() => navigate('/admin/supervisors'), 800);
    } catch (err) {
      showToast(axiosMsg(err), 'error');
    } finally {
      setDeletingPage(false);
      setDeleteOpen(false);
    }
  };

  // ─── loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-3">
        <div className="w-9 h-9 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading supervisor…</p>
      </div>
    );
  }

  if (pageError ?? !supervisor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <div className="flex flex-col items-center gap-3 bg-white border border-red-100 rounded-2xl p-10">
          <svg
            className="w-10 h-10 text-red-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm font-semibold text-red-600">
            {pageError ?? 'Supervisor not found'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  // ── derived ────────────────────────────────────────────────────────────────

  const totalTasks = supervisor.cleaners.reduce((a, c) => a + (c.total_tasks || 0), 0);
  const totalEarnings = supervisor.cleaners.reduce((a, c) => a + Number(c.total_earning || 0), 0);
  const totalSalaries = supervisor.cleaners.reduce((a, c) => a + Number(c.base_salary || 0), 0);

  const filteredCleaners = supervisor.cleaners.filter(
    (c) =>
      c.full_name.toLowerCase().includes(cleanerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(cleanerSearch.toLowerCase())
  );

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes popIn  { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {deleteOpen && (
        <DeleteConfirmModal
          isOpen={deleteOpen}
          title="Delete Supervisor?"
          message={
            <>
              Permanently delete{' '}
              <span className="font-semibold text-slate-800">
                &ldquo;{supervisor.full_name}&rdquo;
              </span>
              ? Their user account will be removed. Supervisors with active cleaners cannot be
              deleted — reassign cleaners first.
            </>
          }
          confirmText="Delete"
          cancelText="Cancel"
          loading={deletingPage}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteOpen(false)}
        />
      )}

      {editOpen && supervisor && (
        <EditSupervisorModal
          supervisor={supervisor}
          buildings={buildings}
          onClose={() => setEditOpen(false)}
          onSuccess={(updated) => {
            setSupervisor(updated);
            setEditOpen(false);
            showToast('Supervisor updated', 'success');
          }}
        />
      )}

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/supervisors')}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </button>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Admin / Supervisors
              </p>
              <h1 className="text-base font-extrabold text-slate-900">{supervisor.full_name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle active */}
            <button
              disabled={togglingStatus}
              onClick={() => void handleToggleStatus()}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all disabled:opacity-60 ${
                supervisor.is_active
                  ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {togglingStatus ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : supervisor.is_active ? (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
              {supervisor.is_active ? 'Deactivate' : 'Activate'}
            </button>

            {/* Edit */}
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                />
              </svg>
              Edit Profile
            </button>

            {/* Delete */}
            <button
              onClick={() => setDeleteOpen(true)}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
              title="Delete supervisor"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className=" mx-auto px-6 py-8 space-y-6">
        {/* ── Hero card ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-start gap-5 flex-wrap">
          {supervisor.profile_image ? (
            <img
              src={supervisor.profile_image}
              alt={supervisor.full_name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 shrink-0"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shrink-0"
              style={{ background: avatarColor(supervisor.full_name) }}
            >
              {initials(supervisor.full_name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {supervisor.full_name}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">Supervisor</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {/* Active / Inactive badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  supervisor.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${supervisor.is_active ? 'bg-emerald-500' : 'bg-red-400'}`}
                />
                {supervisor.is_active ? 'Active — can log in' : 'Inactive — login blocked'}
              </span>

              {supervisor.building && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18"
                    />
                  </svg>
                  {supervisor.building.name}
                </span>
              )}

              {supervisor.joining_date && (
                <span className="text-xs text-slate-400">
                  Joined {fmtDate(supervisor.joining_date)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Cleaners"
            value={supervisor.cleaners.length}
            subtext="assigned"
            accent="#3B5BDB"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
            }
          />
          <StatCard
            label="Total Tasks"
            value={totalTasks}
            subtext="completed"
            accent="#0C8599"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            label="Team Earnings"
            value={`${fmt(totalEarnings)} AED`}
            subtext="total"
            accent="#2F9E44"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            label="Base Salary"
            value={`${fmt(supervisor.base_salary)} AED`}
            subtext="supervisor"
            accent="#E67700"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                />
              </svg>
            }
          />
        </div>

        {/* ── Info grid ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Personal */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2 mb-4 pb-3 border-b border-slate-50">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"
                />
              </svg>
              Personal
            </p>
            <InfoRow label="Nationality" value={supervisor.nationality} />
            <InfoRow label="Age" value={supervisor.age} />
            <InfoRow label="Document ID" value={supervisor.document_id} />
            {supervisor.document && <InfoRow label="Document" link={supervisor.document} />}
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-teal-600 flex items-center gap-2 mb-4 pb-3 border-b border-slate-50">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                />
              </svg>
              Contact
            </p>
            <InfoRow label="Email" value={supervisor.email} />
            <InfoRow label="Phone" value={supervisor.phone} />
            <InfoRow label="Building" value={supervisor.building?.name} />
            <InfoRow label="Base Salary" value={`${fmt(supervisor.base_salary)} AED`} />
          </div>

          {/* Team */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-2 mb-4 pb-3 border-b border-slate-50">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
              Team Summary
            </p>
            <InfoRow label="Cleaners" value={supervisor.cleaners.length} />
            <InfoRow label="Tasks Done" value={totalTasks} />
            <InfoRow label="Team Earnings" value={`${fmt(totalEarnings)} AED`} />
            <InfoRow label="Team Salaries" value={`${fmt(totalSalaries)} AED`} />
          </div>
        </div>

        {/* ── Cleaners table ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Assigned Cleaners</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {supervisor.cleaners.length} cleaner{supervisor.cleaners.length !== 1 ? 's' : ''}{' '}
                under this supervisor
              </p>
            </div>
            <div className="flex items-center gap-3">
              {supervisor.cleaners.length > 4 && (
                <div className="relative">
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path strokeLinecap="round" d="M17 17l4 4" />
                  </svg>
                  <input
                    value={cleanerSearch}
                    onChange={(e) => setCleanerSearch(e.target.value)}
                    placeholder="Search cleaners…"
                    className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  />
                </div>
              )}
              <button
                onClick={() => {
                  setEditOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Cleaner
              </button>
            </div>
          </div>

          {supervisor.cleaners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <svg
                className="w-12 h-12 text-slate-200"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
              <p className="text-sm text-slate-400">No cleaners assigned yet</p>
              <button
                onClick={() => setEditOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
              >
                Add Cleaners
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Cleaner', 'Email', 'Floor', 'Tasks', 'Base Salary', 'Earnings'].map((h) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap ${
                          ['Tasks', 'Base Salary', 'Earnings'].includes(h)
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(filteredCleaners.length > 0 ? filteredCleaners : supervisor.cleaners).map(
                    (c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                              style={{ background: avatarColor(c.full_name) }}
                            >
                              {initials(c.full_name)}
                            </div>
                            <span className="font-semibold text-slate-900">{c.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-xs">{c.email}</td>
                        <td className="px-4 py-3.5">
                          {c.floor ? (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                              F{c.floor.floor_number}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                          {c.total_tasks || 0}
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-600">
                          {fmt(Number(c.base_salary || 0))} AED
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-emerald-600">
                          {fmt(Number(c.total_earning || 0))} AED
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupervisorDetails;
