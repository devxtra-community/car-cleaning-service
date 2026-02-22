import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getAllCleaners,
  toggleCleanerStatus,
  deleteCleaner,
  type CleanerListItem,
} from '../../services/allAPI';
import Toast from '../shared/Toast';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';

const initials = (n: string) =>
  n
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
const ac = (n: string) => COLORS[n.charCodeAt(0) % COLORS.length];
const fmt = (n: number) =>
  new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtD = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const errMsg = (e: unknown) => {
  if (e instanceof Error) return e.message;
  const x = e as { response?: { data?: { message?: string } } };
  return x?.response?.data?.message ?? 'Something went wrong';
};

type SortKey = 'full_name' | 'building_name' | 'total_tasks' | 'total_earning' | 'joining_date';
type SortDir = 'asc' | 'desc';
interface TS {
  message: string;
  type: 'success' | 'error';
}

const PER_PAGE = 10;
const ROW_H = 68; // must match the style={{ height: ROW_H }} on every <tr>
const BODY_H = ROW_H * PER_PAGE; // fixed tbody height so pagination never moves

const SortTh: React.FC<{
  label: string;
  col: SortKey;
  cur: SortKey;
  dir: SortDir;
  onSort: (c: SortKey) => void;
  cls?: string;
}> = ({ label, col, cur, dir, onSort, cls = '' }) => (
  <th
    className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer select-none hover:text-slate-600 whitespace-nowrap ${cls}`}
    onClick={() => onSort(col)}
  >
    <span className="inline-flex items-center gap-1">
      {label}
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
        {cur === col ? (
          dir === 'asc' ? (
            <path d="M8 4l4 6H4z" />
          ) : (
            <path d="M8 12L4 6h8z" />
          )
        ) : (
          <path opacity=".3" d="M8 4l4 6H4zM8 12L4 6h8z" />
        )}
      </svg>
    </span>
  </th>
);

const Cleaners: React.FC = () => {
  const navigate = useNavigate();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [cleaners, setCleaners] = useState<CleanerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('full_name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [delTarget, setDelTarget] = useState<CleanerListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [toast, setToast] = useState<TS | null>(null);

  const showToast = (m: string, t: TS['type']) => setToast({ message: m, type: t });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setCleaners(await getAllCleaners());
    } catch {
      showToast('Failed to load cleaners', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) void fetchData();
  }, [authLoading, isAuthenticated, fetchData]);

  const handleSort = (col: SortKey) => {
    if (col === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cleaners
      .filter((c) => {
        const ms =
          c.full_name.toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q) ||
          (c.building_name ?? '').toLowerCase().includes(q) ||
          (c.supervisor_name ?? '').toLowerCase().includes(q) ||
          (c.document_id ?? '').toLowerCase().includes(q);
        const mf = statusF === 'all' || (statusF === 'active' ? c.is_active : !c.is_active);
        return ms && mf;
      })
      .sort((a, b) => {
        const av = a[sortKey] ?? '';
        const bv = b[sortKey] ?? '';
        return av < bv ? (sortDir === 'asc' ? -1 : 1) : av > bv ? (sortDir === 'asc' ? 1 : -1) : 0;
      });
  }, [cleaners, search, statusF, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const ghostCount = Math.max(0, PER_PAGE - paginated.length);

  const totalActive = cleaners.filter((c) => c.is_active).length;
  const totalInactive = cleaners.length - totalActive;
  const totalAssigned = cleaners.filter((c) => c.building_id !== null).length;

  const handleToggle = async (c: CleanerListItem) => {
    const next = !c.is_active;
    setToggling(c.cleaner_id);
    try {
      await toggleCleanerStatus(c.cleaner_id, next);
      setCleaners((p) =>
        p.map((x) => (x.cleaner_id === c.cleaner_id ? { ...x, is_active: next } : x))
      );
      showToast(`Cleaner ${next ? 'activated' : 'deactivated'}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setToggling(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await deleteCleaner(delTarget.cleaner_id);
      setCleaners((p) => p.filter((c) => c.cleaner_id !== delTarget.cleaner_id));
      showToast(`"${delTarget.full_name}" deleted`, 'success');
      setDelTarget(null);
    } catch (err) {
      showToast(errMsg(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {delTarget && (
        <DeleteConfirmModal
          isOpen={!!delTarget}
          title="Delete Cleaner?"
          message={
            <>
              Permanently delete{' '}
              <span className="font-semibold">&ldquo;{delTarget?.full_name}&rdquo;</span>? Cleaners
              with active or pending tasks cannot be deleted.
            </>
          }
          confirmText="Delete"
          cancelText="Cancel"
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDelTarget(null)}
        />
      )}

      {/* top bar */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
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

      <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">
        {/* stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(
            [
              {
                label: 'Total',
                value: cleaners.length,
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

        {/* table card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* toolbar */}
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
                placeholder="Search name, email, building, supervisor…"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'active', 'inactive'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setStatusF(f);
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${statusF === f ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 ml-auto whitespace-nowrap">
              {filtered.length} cleaner{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* FIXED-HEIGHT body */}
          {loading ? (
            <div
              style={{ height: BODY_H }}
              className="flex flex-col items-center justify-center gap-3"
            >
              <div className="w-8 h-8 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading cleaners…</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <SortTh
                      label="Cleaner"
                      col="full_name"
                      cur={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      cls="text-left"
                    />
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-left">
                      Contact
                    </th>
                    <SortTh
                      label="Building"
                      col="building_name"
                      cur={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      cls="text-left"
                    />
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-left">
                      Floor / Supervisor
                    </th>
                    <SortTh
                      label="Tasks"
                      col="total_tasks"
                      cur={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      cls="text-center"
                    />
                    <SortTh
                      label="Earning"
                      col="total_earning"
                      cur={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      cls="text-right"
                    />
                    <SortTh
                      label="Joined"
                      col="joining_date"
                      cur={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      cls="text-right"
                    />
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <div
                          style={{ height: BODY_H }}
                          className="flex flex-col items-center justify-center gap-3"
                        >
                          <svg
                            className="w-10 h-10 text-slate-200"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"
                            />
                          </svg>
                          <p className="text-sm text-slate-400">
                            {search ? `No results for "${search}"` : 'No cleaners yet'}
                          </p>
                          {!search && (
                            <Link
                              to="/admin/register/cleaner"
                              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
                            >
                              Add First Cleaner
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {paginated.map((c) => {
                        const busy = toggling === c.cleaner_id;
                        return (
                          <tr
                            key={c.cleaner_id}
                            style={{ height: ROW_H }}
                            className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                          >
                            {/* name */}
                            <td className="px-4">
                              <div className="flex items-center gap-3">
                                {c.profile_image ? (
                                  <img
                                    src={c.profile_image}
                                    alt={c.full_name}
                                    className="w-8 h-8 rounded-xl object-cover shrink-0"
                                  />
                                ) : (
                                  <div
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                                    style={{ background: ac(c.full_name) }}
                                  >
                                    {initials(c.full_name)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p
                                    className="font-semibold text-slate-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => navigate(`/admin/cleaner/${c.cleaner_id}`)}
                                  >
                                    {c.full_name}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    #{c.document_id ?? c.cleaner_id.slice(0, 8)}
                                  </p>
                                </div>
                              </div>
                            </td>
                            {/* contact */}
                            <td className="px-4">
                              <p className="text-xs text-slate-700 truncate max-w-[160px]">
                                {c.email}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">{c.phone ?? '—'}</p>
                            </td>
                            {/* building */}
                            <td className="px-4">
                              {c.building_name ? (
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
                                  {c.building_name}
                                </span>
                              ) : (
                                <span className="text-xs italic text-slate-300">Unassigned</span>
                              )}
                            </td>
                            {/* floor/sup */}
                            <td className="px-4">
                              {c.floor_number !== null && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                                  F{c.floor_number}
                                  {c.floor_name ? ` · ${c.floor_name}` : ''}
                                </span>
                              )}
                              <p className="text-xs text-slate-400 mt-0.5">
                                {c.supervisor_name ?? (
                                  <span className="italic text-slate-300">No supervisor</span>
                                )}
                              </p>
                            </td>
                            {/* tasks */}
                            <td className="px-4 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm">
                                {c.total_tasks ?? 0}
                              </span>
                            </td>
                            {/* earning */}
                            <td className="px-4 text-right font-semibold text-emerald-600 text-sm whitespace-nowrap">
                              {fmt(Number(c.total_earning ?? 0))} AED
                            </td>
                            {/* joined */}
                            <td className="px-4 text-right text-xs text-slate-400 whitespace-nowrap">
                              {c.joining_date ? fmtD(c.joining_date) : '—'}
                            </td>
                            {/* status */}
                            <td className="px-4 text-center">
                              <button
                                disabled={busy}
                                onClick={() => void handleToggle(c)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all disabled:opacity-60 ${c.is_active ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                              >
                                {busy ? (
                                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}
                                  />
                                )}
                                {c.is_active ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            {/* actions */}
                            <td className="px-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  title="View"
                                  onClick={() => navigate(`/admin/cleaner/${c.cleaner_id}`)}
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
                                  title="Edit"
                                  onClick={() => navigate(`/admin/cleaner/${c.cleaner_id}/edit`)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
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
                                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  title="Delete"
                                  onClick={() => setDelTarget(c)}
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
                      {/* ghost rows keep table height fixed */}
                      {Array.from({ length: ghostCount }).map((_, i) => (
                        <tr
                          key={`g${i}`}
                          style={{ height: ROW_H }}
                          className="border-b border-slate-50/40"
                        >
                          <td colSpan={9} />
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* pagination — always in same position */}
          <div
            className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap"
            style={{ minHeight: 64 }}
          >
            {totalPages > 1 ? (
              <>
                <p className="text-xs text-slate-400">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-1.5 flex-wrap">
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
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${page === n ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
              </>
            ) : (
              <p className="text-xs text-slate-300">
                {!loading && `${filtered.length} of ${cleaners.length} cleaners`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cleaners;
