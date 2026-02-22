import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getAllSupervisors,
  toggleSupervisorStatus,
  deleteSupervisor,
  type SupervisorListItem,
} from '../../services/allAPI';
import Toast from '../shared/Toast';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';

// ─── Helpers ───────────────────────────────────────────────────────────────────

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
];
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const axiosMsg = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const e = err as { response?: { data?: { message?: string } } };
    return e.response?.data?.message ?? 'Something went wrong';
  }
  return 'Something went wrong';
};

type SortKey = 'full_name' | 'building_name' | 'cleaner_count' | 'joining_date';
type SortDir = 'asc' | 'desc';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

// ─── Sort-able th ─────────────────────────────────────────────────────────────

const SortTh: React.FC<{
  label: string;
  col: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (c: SortKey) => void;
  className?: string;
}> = ({ label, col, current, dir, onSort, className = '' }) => (
  <th
    className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer select-none hover:text-slate-600 whitespace-nowrap ${className}`}
    onClick={() => onSort(col)}
  >
    <span className="inline-flex items-center gap-1">
      {label}
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
        {current === col ? (
          dir === 'asc' ? (
            <path d="M8 4l4 6H4l4-6z" />
          ) : (
            <path d="M8 12L4 6h8l-4 6z" />
          )
        ) : (
          <path opacity=".35" d="M8 4l4 6H4l4-6zM8 12L4 6h8l-4 6z" />
        )}
      </svg>
    </span>
  </th>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const Supervisors: React.FC = () => {
  const navigate = useNavigate();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [supervisors, setSupervisors] = useState<SupervisorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('full_name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<SupervisorListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const PER_PAGE = 10;
  const showToast = (message: string, type: ToastState['type']) => setToast({ message, type });

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllSupervisors();
      setSupervisors(data);
    } catch {
      showToast('Failed to load supervisors', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) void fetchData();
  }, [authLoading, isAuthenticated, fetchData]);

  // ── sort ───────────────────────────────────────────────────────────────────

  const handleSort = (col: SortKey) => {
    if (col === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  // ── filtered + sorted + paginated ─────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return supervisors
      .filter((s) => {
        const matchSearch =
          s.full_name.toLowerCase().includes(q) ||
          (s.email ?? '').toLowerCase().includes(q) ||
          (s.building_name ?? '').toLowerCase().includes(q);
        const matchStatus =
          statusFilter === 'all' || (statusFilter === 'active' ? s.is_active : !s.is_active);
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        const av: string | number = a[sortKey] ?? '';
        const bv: string | number = b[sortKey] ?? '';
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [supervisors, search, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── stat counts ────────────────────────────────────────────────────────────

  const totalActive = supervisors.filter((s) => s.is_active).length;
  const totalInactive = supervisors.length - totalActive;
  const totalAssigned = supervisors.filter((s) => s.building_id !== null).length;

  // ── toggle ─────────────────────────────────────────────────────────────────

  const handleToggle = async (sup: SupervisorListItem) => {
    const next = !sup.is_active;
    setTogglingId(sup.supervisor_id);
    try {
      await toggleSupervisorStatus(sup.supervisor_id, next);
      setSupervisors((prev) =>
        prev.map((s) => (s.supervisor_id === sup.supervisor_id ? { ...s, is_active: next } : s))
      );
      showToast(`Supervisor ${next ? 'activated' : 'deactivated'}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSupervisor(deleteTarget.supervisor_id);
      setSupervisors((prev) => prev.filter((s) => s.supervisor_id !== deleteTarget.supervisor_id));
      showToast(`"${deleteTarget.full_name}" deleted`, 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(axiosMsg(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Supervisor"
        message={
          <>
            Permanently delete{' '}
            <span className="font-semibold text-slate-800">
              &ldquo;{deleteTarget?.full_name}&rdquo;
            </span>
            ? Their user account will also be removed. Supervisors with active cleaners cannot be
            deleted — reassign cleaners first.
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className=" mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Admin / People
            </p>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Supervisors</h1>
          </div>
          <Link
            to="/admin/register/supervisor"
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
            Add Supervisor
          </Link>
        </div>
      </div>

      <div className=" mx-auto px-6 py-8 space-y-6">
        {/* ── Stat cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(
            [
              {
                label: 'Total',
                value: supervisors.length,
                sub: 'registered',
                color: 'text-slate-900',
              },
              { label: 'Active', value: totalActive, sub: 'can log in', color: 'text-emerald-600' },
              {
                label: 'Inactive',
                value: totalInactive,
                sub: 'login blocked',
                color: 'text-red-500',
              },
              {
                label: 'Assigned',
                value: totalAssigned,
                sub: 'to a building',
                color: 'text-blue-600',
              },
            ] as const
          ).map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            >
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                {s.label}
              </p>
              <p className="text-xs text-slate-300 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Table card ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-52">
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
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, email or building…"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>

            <div className="flex gap-1.5">
              {(['all', 'active', 'inactive'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setStatusFilter(f);
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    statusFilter === f
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-400 ml-auto whitespace-nowrap">
              {filtered.length} supervisor{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-8 h-8 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading supervisors…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <p className="text-sm text-slate-400">
                {search ? `No results for "${search}"` : 'No supervisors yet'}
              </p>
              {!search && (
                <Link
                  to="/admin/register/supervisor"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl"
                >
                  Add First Supervisor
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <SortTh
                      label="Supervisor"
                      col="full_name"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      className="text-left"
                    />
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-left">
                      Contact
                    </th>
                    <SortTh
                      label="Building"
                      col="building_name"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      className="text-left"
                    />
                    <SortTh
                      label="Cleaners"
                      col="cleaner_count"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      className="text-center"
                    />
                    <SortTh
                      label="Joined"
                      col="joining_date"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      className="text-right"
                    />
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map((sup) => {
                    const isActive = sup.is_active;
                    const busy = togglingId === sup.supervisor_id;

                    return (
                      <tr
                        key={sup.supervisor_id}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        {/* Name + avatar */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {sup.profile_image ? (
                              <img
                                src={sup.profile_image}
                                alt={sup.full_name}
                                className="w-9 h-9 rounded-xl object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                                style={{ background: avatarColor(sup.full_name) }}
                              >
                                {initials(sup.full_name)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p
                                className="font-semibold text-slate-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => navigate(`/admin/supervisor/${sup.supervisor_id}`)}
                              >
                                {sup.full_name}
                              </p>
                              <p className="text-xs text-slate-400">
                                #{sup.supervisor_id.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-4">
                          <p className="text-slate-700 truncate max-w-[180px]">
                            {sup.email ?? '—'}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{sup.phone ?? '—'}</p>
                        </td>

                        {/* Building */}
                        <td className="px-4 py-4">
                          {sup.building_name ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-100 text-sky-700 text-xs font-medium">
                              <svg
                                className="w-3 h-3 shrink-0"
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
                              {sup.building_name}
                            </span>
                          ) : (
                            <span className="text-xs italic text-slate-300">Unassigned</span>
                          )}
                        </td>

                        {/* Cleaner count */}
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm">
                            {sup.cleaner_count}
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-4 text-right text-xs text-slate-400 whitespace-nowrap">
                          {sup.joining_date ? fmtDate(sup.joining_date) : '—'}
                        </td>

                        {/* Status toggle */}
                        <td className="px-4 py-4 text-center">
                          <button
                            disabled={busy}
                            onClick={() => void handleToggle(sup)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all disabled:opacity-60 ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {busy ? (
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                              />
                            )}
                            {isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              title="View details"
                              onClick={() => navigate(`/admin/supervisor/${sup.supervisor_id}`)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
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
                                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                            </button>
                            <button
                              title="Delete supervisor"
                              onClick={() => setDeleteTarget(sup)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-slate-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                      page === n
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Supervisors;
