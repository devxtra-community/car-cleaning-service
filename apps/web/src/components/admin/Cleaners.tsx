import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/commonAPI';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Cleaner {
  cleaner_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  document_id: string;
  age: number;
  nationality: string;
  floor_id?: string;
  total_tasks: number;
  total_earning: number;
  building_name?: string;
  building_id?: string;
  floor_name?: string;
  supervisor_name?: string;
  supervisor_id?: string;
  profile_image?: string;
  base_salary?: number;
}

interface EditForm {
  full_name: string;
  email: string;
  phone: string;
  age: string;
  nationality: string;
  document_id: string;
  base_salary: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

const AVATAR_COLORS = [
  '#3B5BDB',
  '#1971C2',
  '#0C8599',
  '#2F9E44',
  '#E67700',
  '#C2255C',
  '#9C36B5',
  '#5C7CFA',
  '#099268',
  '#D6336C',
];
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ─── API helpers ──────────────────────────────────────────────────────────────

const deleteCleaner = (id: string) => api.delete(`/workers/cleaners/${id}`);

const updateCleaner = (id: string, payload: Partial<EditForm>) =>
  api.patch(`/workers/cleaners/${id}`, payload);

// ─── Toast Component ──────────────────────────────────────────────────────────

const ToastAlert = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border text-sm font-medium animate-slide-in
        ${
          toast.type === 'success'
            ? 'bg-white border-green-200 text-green-800'
            : 'bg-white border-red-200 text-red-800'
        }`}
    >
      <span className={`text-lg ${toast.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
        {toast.type === 'success' ? '✓' : '✕'}
      </span>
      {toast.message}
      <button
        onClick={onClose}
        className="ml-2 text-gray-400 hover:text-gray-600 text-base leading-none"
      >
        ×
      </button>
    </div>
  );
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────

const EditModal = ({
  cleaner,
  onClose,
  onSaved,
}: {
  cleaner: Cleaner;
  onClose: () => void;
  onSaved: (updated: Partial<Cleaner>) => void;
}) => {
  const [form, setForm] = useState<EditForm>({
    full_name: cleaner.full_name ?? '',
    email: cleaner.email ?? '',
    phone: cleaner.phone ?? '',
    age: cleaner.age?.toString() ?? '',
    nationality: cleaner.nationality ?? '',
    document_id: cleaner.document_id ?? '',
    base_salary: cleaner.base_salary?.toString() ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const res = await updateCleaner(cleaner.cleaner_id, form);
      onSaved(res.data.data ?? form);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error?.message ??
            err.response?.data?.message ??
            err.message ??
            'Failed to update cleaner.'
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update cleaner.');
      }
    } finally {
      setSaving(false);
    }
  };

  const fields: { label: string; name: keyof EditForm; type?: string }[] = [
    { label: 'Full Name', name: 'full_name' },
    { label: 'Email', name: 'email', type: 'email' },
    { label: 'Phone', name: 'phone', type: 'tel' },
    { label: 'Age', name: 'age', type: 'number' },
    { label: 'Nationality', name: 'nationality' },
    { label: 'Document ID', name: 'document_id' },
    { label: 'Base Salary', name: 'base_salary', type: 'number' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'modalPop 0.2s ease' }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: avatarColor(cleaner.full_name) }}
            >
              {initials(cleaner.full_name)}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Edit Cleaner</h2>
              <p className="text-xs text-slate-400">#{cleaner.cleaner_id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto">
          {fields.map(({ label, name, type }) => (
            <div
              key={name}
              className={name === 'full_name' || name === 'email' ? 'col-span-2' : ''}
            >
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                {label}
              </label>
              <input
                name={name}
                type={type ?? 'text'}
                value={form[name]}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-slate-50
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {error ? <p className="text-xs text-red-500 flex-1">{error}</p> : <span />}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteModal = ({
  cleaner,
  onClose,
  onDeleted,
}: {
  cleaner: Cleaner;
  onClose: () => void;
  onDeleted: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError('');
      await deleteCleaner(cleaner.cleaner_id);
      onDeleted();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error?.message ??
            err.response?.data?.message ??
            err.message ??
            'Cannot delete cleaner. Please try again.'
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Cannot delete cleaner. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'modalPop 0.2s ease' }}
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-5">
          <svg
            className="w-7 h-7 text-red-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Cleaner?</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-1">
          You're about to permanently delete{' '}
          <span className="font-semibold text-slate-700">{cleaner.full_name}</span>. This action
          cannot be undone.
        </p>
        <p className="text-slate-400 text-xs mb-6">
          Cleaners with active or pending tasks cannot be deleted.
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PER_PAGE = 8;

const Cleaners: React.FC = () => {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<Toast | null>(null);
  const [editTarget, setEditTarget] = useState<Cleaner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cleaner | null>(null);

  const showToast = (message: string, type: Toast['type']) => setToast({ message, type });

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchCleaners = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/auth/cleaners');
      if (res.data.success) setCleaners(res.data.data);
    } catch {
      showToast('Failed to load cleaners', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCleaners();
  }, [fetchCleaners]);

  // ── Filter + Paginate ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cleaners.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.building_name?.toLowerCase().includes(q) ||
        c.document_id?.toLowerCase().includes(q) ||
        c.supervisor_name?.toLowerCase().includes(q)
    );
  }, [cleaners, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleEditSaved = (updated: Partial<Cleaner>) => {
    setCleaners((prev) =>
      prev.map((c) => (c.cleaner_id === editTarget?.cleaner_id ? { ...c, ...updated } : c))
    );
    showToast('Cleaner updated successfully', 'success');
    setEditTarget(null);
  };

  const handleDeleted = () => {
    setCleaners((prev) => prev.filter((c) => c.cleaner_id !== deleteTarget?.cleaner_id));
    showToast('Cleaner deleted', 'success');
    setDeleteTarget(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-9 font-['Plus_Jakarta_Sans',sans-serif]">
      <style>{`
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.25s ease; }
        .row-in { animation: rowIn 0.22s ease both; }
      `}</style>

      {/* Toast */}
      {toast && <ToastAlert toast={toast} onClose={() => setToast(null)} />}

      {/* Edit Modal */}
      {editTarget && (
        <EditModal
          cleaner={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleEditSaved}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          cleaner={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Admin / People
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cleaners</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? '…' : `${filtered.length} cleaner${filtered.length !== 1 ? 's' : ''} total`}
          </p>
        </div>

        <Link
          to="/admin/register/cleaner"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Cleaner
        </Link>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 20 20"
          >
            <circle cx="9" cy="9" r="6" />
            <path strokeLinecap="round" d="M15 15l-3.5-3.5" />
          </svg>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, building…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800
              focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all"
          />
        </div>

        {search && (
          <button
            onClick={() => {
              setSearch('');
              setPage(1);
            }}
            className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Table Card ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-9 h-9 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Loading cleaners…</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg
              className="w-12 h-12 text-slate-300"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
            <p className="text-sm text-slate-400">
              {search ? 'No cleaners match your search' : 'No cleaners yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {[
                    'Cleaner',
                    'Contact',
                    'Building / Supervisor',
                    'Tasks',
                    'Earning',
                    'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400
                        ${h === 'Actions' || h === 'Tasks' || h === 'Earning' ? 'text-center' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((c, idx) => (
                  <tr
                    key={c.cleaner_id}
                    className="row-in border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    style={{ animationDelay: `${idx * 35}ms` }}
                  >
                    {/* Cleaner */}
                    <td className="px-5 py-4">
                      <Link
                        to={`/admin/cleaner/${c.cleaner_id}`}
                        className="flex items-center gap-3 group"
                      >
                        {c.profile_image ? (
                          <img
                            src={c.profile_image}
                            alt={c.full_name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-100 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: avatarColor(c.full_name) }}
                          >
                            {initials(c.full_name)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {c.full_name}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            #{c.document_id || c.cleaner_id.slice(0, 8)}
                          </p>
                        </div>
                      </Link>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4">
                      <p className="text-slate-700 text-sm">{c.email || '—'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.phone || '—'}</p>
                    </td>

                    {/* Building / Supervisor */}
                    <td className="px-5 py-4">
                      {c.building_name ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-700 text-xs font-medium rounded-md">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M9 22V12h6v10M3 9h18" />
                          </svg>
                          {c.building_name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 italic">Unassigned</span>
                      )}
                      {c.supervisor_name && (
                        <p className="text-xs text-slate-400 mt-1">
                          <span className="text-slate-300">↳</span> {c.supervisor_name}
                        </p>
                      )}
                    </td>

                    {/* Tasks */}
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                        {c.total_tasks ?? 0}
                      </span>
                    </td>

                    {/* Earning */}
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm font-semibold text-emerald-600">
                        ₹{Number(c.total_earning ?? 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* View */}
                        <Link
                          to={`/admin/cleaner/${c.cleaner_id}`}
                          title="View details"
                          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500
                            hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 transition-all"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path d="M2 12s3.6-8 10-8 10 8 10 8-3.6 8-10 8-10-8-10-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </Link>

                        {/* Edit */}
                        <button
                          onClick={() => setEditTarget(c)}
                          title="Edit cleaner"
                          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500
                            hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(c)}
                          title="Delete cleaner"
                          className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center text-red-400
                            hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600
              hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ← Previous
          </button>

          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all
                  ${
                    page === n
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
                  }`}
              >
                {n}
              </button>
            ))}
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600
              hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default Cleaners;
