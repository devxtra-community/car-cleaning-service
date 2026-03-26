import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/commonAPI';
import {
  toggleUserStatus,
  resetUserPassword,
} from '../../services/allAPI';
import {
  DeleteCleanerModal,
  EditCleanerModal,
} from '../shared/ManageCleanerModals';
import { useAlert } from '../../context/AlertContext';
import { errMsg } from '../../utils/errorUtils';

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
  average_rating?: number;
  total_reviews?: number;
  supervisor_id?: string;
  profile_image?: string;
  base_salary?: number;
  is_active: boolean;
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

// Handlers are imported from allAPI

// ─── Main Component ───────────────────────────────────────────────────────────

const PER_PAGE = 8;

const Cleaners: React.FC = () => {
  const { showAlert, showConfirm, showPrompt, showToast } = useAlert();
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Cleaner | null>(null);
  const [editTarget, setEditTarget] = useState<Cleaner | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchCleaners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/auth/cleaners');
      if (res.data.success) setCleaners(res.data.data);
    } catch {
      showToast('Failed to load cleaners', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

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

  const handleDeleted = () => {
    if (!deleteTarget) return;
    setCleaners((prev) => prev.filter((c) => c.cleaner_id !== deleteTarget.cleaner_id));
    setDeleteTarget(null);
  };

  const handleToggleStatus = async (cleaner: Cleaner) => {
    try {
      const newStatus = !cleaner.is_active;
      const confirmed = await showConfirm(
        `Are you sure you want to ${newStatus ? 'enable' : 'disable'} this user?`,
        'User Status'
      );
      if (!confirmed) return;

      await toggleUserStatus(cleaner.user_id, newStatus);
      setCleaners((prev) =>
        prev.map((c) => (c.user_id === cleaner.user_id ? { ...c, is_active: newStatus } : c))
      );
      showToast(`User ${newStatus ? 'enabled' : 'disabled'}`, 'success');
    } catch (err) {
      showToast(errMsg(err), 'error');
    }
  };

  const handleResetPassword = async (cleaner: Cleaner) => {
    const newPass = await showPrompt(
      `Enter new password for ${cleaner.full_name}:`,
      'Reset Password',
      '',
      'password'
    );
    if (!newPass) return;
    if (newPass.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    try {
      await resetUserPassword(cleaner.user_id, newPass);
      showToast('Password reset successfully', 'success');
    } catch (err) {
      showToast(errMsg(err), 'error');
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen font-['Plus_Jakarta_Sans',sans-serif]">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pop {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-toast {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-up { animation: fadeUp 0.4s ease-out forwards; }
        .animate-slide-in { animation: slideIn 0.4s ease-out forwards; }
        .animate-pop { animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-toast { animation: slide-in-toast 0.25s ease; }
        .row-in { animation: rowIn 0.22s ease both; }
      `}</style>

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteCleanerModal
          cleaner={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}

      {/* Edit Modal */}
      {editTarget && (
        <EditCleanerModal
          cleaner={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => {
            setCleaners((prev) =>
              prev.map((c) => (c.cleaner_id === editTarget.cleaner_id ? { ...c, ...updated } : c))
            );
            setEditTarget(null);
            showToast('Cleaner updated successfully', 'success');
          }}
        />
      )}

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Admin / People
            </p>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Cleaners</h1>
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
      </div>

      <div className="mx-auto px-6 py-8 space-y-6">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Cleaners',
              value: cleaners.length,
              sub: 'registered',
              color: 'text-slate-900',
              bg: 'bg-blue-50',
              icon: (
                <path d="M15 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm-9-4V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
              ),
            },
            {
              label: 'Active',
              value: cleaners.filter((c) => c.is_active !== false).length,
              sub: 'online now',
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              icon: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />,
            },
            {
              label: 'Total Earning',
              value: `₹${cleaners.reduce((acc, curr) => acc + (curr.total_earning || 0), 0).toLocaleString()}`,
              sub: 'all cleaners',
              color: 'text-amber-600',
              bg: 'bg-amber-50',
              icon: <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />,
            },
            {
              label: 'Total Tasks',
              value: cleaners.reduce((acc, curr) => acc + (curr.total_tasks || 0), 0),
              sub: 'completed',
              color: 'text-blue-600',
              bg: 'bg-indigo-50',
              icon: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />,
            },
          ].map((s, i) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-pop"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                    {s.label}
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">{s.sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${s.bg}`}>
                  <svg className={`w-5 h-5 ${s.color}`} fill="currentColor" viewBox="0 0 24 24">
                    {s.icon}
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-5 flex-wrap animate-fade-up" style={{ animationDelay: '400ms' }}>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '500ms' }}>
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
                      'Rating',
                      'Earning',
                      'Status',
                      'Actions',
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400
                        ${h === 'Actions' || h === 'Tasks' || h === 'Earning' || h === 'Rating' || h === 'Status' ? 'text-center' : 'text-left'}`}
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

                      {/* Rating */}
                      <td className="px-5 py-4 text-center">
                        <span className="flex items-center justify-center gap-1">
                          <span className="text-yellow-500">★</span>
                          {c.average_rating ? Number(c.average_rating).toFixed(1) : '0.0'}
                          <span className="text-xs text-slate-400">({c.total_reviews || 0})</span>
                        </span>
                      </td>
                      {/* Earning */}
                      <td className="px-5 py-4 text-center">
                        <span className="font-bold text-slate-700">
                          ₹{Number(c.total_earning || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all
                          ${c.is_active !== false
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                        >
                          {c.is_active !== false ? 'Active' : 'Disabled'}
                        </button>
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

                          {/* Reset Password */}
                          <button
                            onClick={() => handleResetPassword(c)}
                            title="Reset Password"
                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500
                            hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-all"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
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
                  ${page === n
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
    </div>
  );
};

export default Cleaners;
