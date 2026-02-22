import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllBuildingsWithStats, deleteBuilding } from '../../services/allAPI';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Floor {
  id: string;
  floor_number: number;
  floor_name: string;
}

interface Building {
  id: string;
  building_name: string;
  location: string;
  latitude: number;
  longitude: number;
  radius: number;
  floors: Floor[];
  total_cleaners: number;
  total_supervisors: number;
  active_supervisors: number;
  total_revenue: number;
  created_at: string;
}

type SortKey =
  | 'building_name'
  | 'total_cleaners'
  | 'total_supervisors'
  | 'total_revenue'
  | 'created_at';
type SortDir = 'asc' | 'desc';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr.response?.data?.message ?? 'An error occurred';
  }
  return 'An error occurred';
};

const fmtRevenue = (v: number) =>
  v >= 1_000_000
    ? `AED ${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
      ? `AED ${(v / 1_000).toFixed(1)}k`
      : `AED ${v.toFixed(0)}`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Toast ─────────────────────────────────────────────────────────────────────

interface Toast {
  message: string;
  type: 'success' | 'error';
}

const ToastBanner: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium animate-slide-in
      ${toast.type === 'success' ? 'bg-white border-emerald-200 text-emerald-800' : 'bg-white border-red-200 text-red-700'}`}
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0
        ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}
      >
        {toast.type === 'success' ? '✓' : '✕'}
      </span>
      {toast.message}
      <button
        onClick={onClose}
        className="ml-2 text-slate-400 hover:text-slate-600 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
};

// ─── Delete Modal ──────────────────────────────────────────────────────────────

const DeleteModal: React.FC<{
  building: Building;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}> = ({ building, onClose, onConfirm, loading }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-pop"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
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
      <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Building?</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-4">
        Permanently delete{' '}
        <span className="font-semibold text-slate-800">"{building.building_name}"</span>? All
        floors, assignments, and revenue data will be removed.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Deleting…
            </>
          ) : (
            'Delete Building'
          )}
        </button>
      </div>
    </div>
  </div>
);

// ─── Sort Header Cell ──────────────────────────────────────────────────────────

const SortTh: React.FC<{
  label: string;
  col: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (c: SortKey) => void;
  align?: string;
}> = ({ label, col, current, dir, onSort, align = 'text-left' }) => (
  <th
    className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer select-none hover:text-slate-600 whitespace-nowrap ${align}`}
    onClick={() => onSort(col)}
  >
    <span className="inline-flex items-center gap-1">
      {label}
      {current === col ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
          {dir === 'asc' ? <path d="M8 4l4 6H4l4-6z" /> : <path d="M8 12L4 6h8l-4 6z" />}
        </svg>
      ) : (
        <svg className="w-3 h-3 opacity-30" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 4l4 6H4l4-6zM8 12L4 6h8l-4 6z" />
        </svg>
      )}
    </span>
  </th>
);

// ─── Status Badge ──────────────────────────────────────────────────────────────

const SupervisorBadge: React.FC<{ active: number; total: number }> = ({ active, total }) => {
  if (total === 0)
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-400">
        No supervisors
      </span>
    );
  if (active === 0)
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">
        {total} inactive
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      {active} active{total > active ? ` / ${total}` : ''}
    </span>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const BuildingsManagement: React.FC = () => {
  const navigate = useNavigate();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Building | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const PER_PAGE = 10;

  const showToast = (message: string, type: Toast['type']) => setToast({ message, type });

  // ── Load ────────────────────────────────────────────────────────────────────

  const loadBuildings = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await getAllBuildingsWithStats();
      setBuildings(res.data ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuildings();
  }, []);

  // ── Sort handler ────────────────────────────────────────────────────────────

  const handleSort = (col: SortKey) => {
    if (col === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  // ── Filter + sort + paginate ────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return buildings
      .filter(
        (b) => b.building_name?.toLowerCase().includes(q) || b.location?.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        let av: number | string = a[sortKey] ?? '';
        let bv: number | string = b[sortKey] ?? '';
        if (sortKey === 'total_revenue') {
          av = parseFloat(av as string);
          bv = parseFloat(bv as string);
        }
        if (sortKey === 'total_cleaners' || sortKey === 'total_supervisors') {
          av = Number(av);
          bv = Number(bv);
        }
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [buildings, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Summary stats ───────────────────────────────────────────────────────────

  const totalStaff = buildings.reduce(
    (s, b) => s + Number(b.total_cleaners ?? 0) + Number(b.total_supervisors ?? 0),
    0
  );
  const totalFloors = buildings.reduce((s, b) => s + (b.floors?.length ?? 0), 0);
  const totalSups = buildings.reduce((s, b) => s + Number(b.active_supervisors ?? 0), 0);

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteBuilding(deleteTarget.id);
      setBuildings((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      showToast(`"${deleteTarget.building_name}" deleted`, 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pop { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .animate-slide-in { animation: slideIn 0.25s ease; }
        .animate-pop { animation: pop 0.2s ease; }
        .animate-fade-up { animation: fadeUp 0.3s ease; }
      `}</style>

      {toast && <ToastBanner toast={toast} onClose={() => setToast(null)} />}
      {deleteTarget && (
        <DeleteModal
          building={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleting}
        />
      )}

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className=" mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Admin / Properties
            </p>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Buildings</h1>
          </div>
          <Link
            to="/admin/buildings/add"
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
            Add Building
          </Link>
        </div>
      </div>

      <div className=" mx-auto px-6 py-8 space-y-6">
        {/* ── Stat cards ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
          {[
            {
              label: 'Buildings',
              value: buildings.length,
              sub: 'total properties',
              color: 'bg-blue-50 text-blue-600',
            },
            {
              label: 'Floors',
              value: totalFloors,
              sub: 'across all buildings',
              color: 'bg-violet-50 text-violet-600',
            },
            {
              label: 'Active Supervisors',
              value: totalSups,
              sub: 'currently assigned',
              color: 'bg-emerald-50 text-emerald-600',
            },
            {
              label: 'Total Staff',
              value: totalStaff,
              sub: 'cleaners + supervisors',
              color: 'bg-amber-50 text-amber-600',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            >
              <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                {s.label}
              </p>
              <p className="text-xs text-slate-300 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Table card ───────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-up">
          {/* Search + count */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-52">
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
                placeholder="Search buildings or locations…"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Clear
              </button>
            )}
            <p className="text-xs text-slate-400 ml-auto whitespace-nowrap">
              {filtered.length} building{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* ── Table ────────────────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-8 h-8 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading buildings…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={loadBuildings}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <p className="text-sm text-slate-400">
                {search ? `No buildings match "${search}"` : 'No buildings yet'}
              </p>
              {!search && (
                <Link
                  to="/admin/buildings/add"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl"
                >
                  Add First Building
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <SortTh
                      label="Building"
                      col="building_name"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-left">
                      Floors
                    </th>
                    <SortTh
                      label="Cleaners"
                      col="total_cleaners"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      align="text-center"
                    />
                    <SortTh
                      label="Supervisors"
                      col="total_supervisors"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      align="text-center"
                    />
                    <SortTh
                      label="Revenue"
                      col="total_revenue"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      align="text-right"
                    />
                    <SortTh
                      label="Added"
                      col="created_at"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      align="text-right"
                    />
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Building name + location */}
                      <td className="px-4 py-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                            {b.building_name?.[0]?.toUpperCase() ?? 'B'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                              {b.building_name}
                            </p>
                            {b.location && (
                              <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
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
                                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                                  />
                                </svg>
                                {b.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Floors */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {(b.floors ?? []).slice(0, 3).map((f) => (
                            <span
                              key={f.id}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium"
                            >
                              {f.floor_name}
                            </span>
                          ))}
                          {(b.floors?.length ?? 0) > 3 && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-xs font-medium">
                              +{(b.floors?.length ?? 0) - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cleaners */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm">
                          {Number(b.total_cleaners ?? 0)}
                        </span>
                      </td>

                      {/* Supervisors with active/total badge */}
                      <td className="px-4 py-4 text-center">
                        <SupervisorBadge
                          active={Number(b.active_supervisors ?? 0)}
                          total={Number(b.total_supervisors ?? 0)}
                        />
                      </td>

                      {/* Revenue */}
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-emerald-700 text-sm">
                          {fmtRevenue(parseFloat(b.total_revenue?.toString() ?? '0'))}
                        </span>
                      </td>

                      {/* Date added */}
                      <td className="px-4 py-4 text-right text-xs text-slate-400 whitespace-nowrap">
                        {b.created_at ? fmtDate(b.created_at) : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View */}
                          <button
                            onClick={() => navigate(`/admin/buildings/${b.id}`)}
                            title="View details"
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

                          {/* Edit */}
                          <button
                            onClick={() => navigate(`/admin/buildings/${b.id}/edit`)}
                            title="Edit building"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-all"
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

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget(b)}
                            title="Delete building"
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
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-slate-400">
                Page {page} of {totalPages} — {filtered.length} results
              </p>
              <div className="flex gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all
                      ${page === n ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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

export default BuildingsManagement;
