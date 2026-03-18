import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllBuildingsWithStats, deleteBuilding } from '../../services/allAPI';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';

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
  total_revenue: number;
  created_at?: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

// ─── Toast ─────────────────────────────────────────────────────────────────────

const ToastBanner = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 right-5 z-200 flex items-center gap-3 px-5 py-3.5 rounded-xl
        shadow-xl border text-sm font-medium
        ${toast.type === 'success'
          ? 'bg-white border-emerald-200 text-emerald-800'
          : 'bg-white border-red-200 text-red-700'
        }`}
      style={{ animation: 'slideIn 0.25s ease' }}
    >
      <span className={`text-lg ${toast.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
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

// Local DeleteModal removed in favor of shared component

// ─── Main Page ─────────────────────────────────────────────────────────────────
const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const axiosError = err as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message ?? 'An error occurred';
  }
  return 'An error occurred';
};
const PER_PAGE = 6;

const BuildingsManagement: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Building | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: Toast['type']) => setToast({ message, type });

  // ── Load ────────────────────────────────────────────────────────────────
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

  // ── Filter + paginate ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return buildings.filter(
      (b) => b.building_name?.toLowerCase().includes(q) || b.location?.toLowerCase().includes(q)
    );
  }, [buildings, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Summary stats ────────────────────────────────────────────────────────
  const totalRevenue = buildings.reduce(
    (s, b) => s + parseFloat(b.total_revenue?.toString() ?? '0'),
    0
  );
  const totalEmployees = buildings.reduce(
    (s, b) => s + Number(b.total_cleaners ?? 0) + Number(b.total_supervisors ?? 0),
    0
  );
  const totalFloors = buildings.reduce((s, b) => s + (b.floors?.length ?? 0), 0);

  // ── Delete handler ───────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteBuilding(deleteTarget.id);
      setBuildings((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      showToast(`"${deleteTarget.building_name}" deleted successfully`, 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pop     { from { opacity:0; transform:scale(0.94) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
      `}</style>

      {toast && <ToastBanner toast={toast} onClose={() => setToast(null)} />}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Building?"
        message={
          <>
            You're about to permanently delete{' '}
            <span className="font-semibold">&ldquo;{deleteTarget?.building_name}&rdquo;</span>.
            <div className="mt-3 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-red-400" />
                {deleteTarget?.floors?.length ?? 0} floors and records will be removed
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-red-400" />
                All associated employee and revenue data will be lost
              </p>
            </div>
          </>
        }
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Admin / Assets
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

      <div className="mx-auto px-6 py-8 space-y-6">

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        < div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          style={{ animation: 'fadeUp 0.3s ease both', animationDelay: '40ms' }}
        >
          {
            [
              {
                label: 'Total Buildings',
                value: buildings.length,
                sub: 'properties',
                icon: (
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                    />
                  </svg>
                ),
                iconBg: 'bg-blue-50',
                numColor: 'text-slate-900',
              },
              {
                label: 'Total Floors',
                value: totalFloors,
                sub: 'across all buildings',
                icon: (
                  <svg
                    className="w-5 h-5 text-violet-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122"
                    />
                  </svg>
                ),
                iconBg: 'bg-violet-50',
                numColor: 'text-slate-900',
              },
              {
                label: 'Total Staff',
                value: totalEmployees,
                sub: 'cleaners + supervisors',
                icon: (
                  <svg
                    className="w-5 h-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                ),
                iconBg: 'bg-emerald-50',
                numColor: 'text-slate-900',
              },
              {
                label: 'Total Revenue',
                value: `${totalRevenue >= 1000 ? `${(totalRevenue / 1000).toFixed(1)}k` : totalRevenue.toFixed(0)} AED`,
                sub: 'all time earnings',
                icon: (
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 8.25H9m6 3H9m3 6l-3-3h1.5a3 3 0 100-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
                iconBg: 'bg-amber-50',
                numColor: 'text-emerald-600',
              },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div
                  className={`w-9 h-9 ${stat.iconBg} rounded-xl flex items-center justify-center mb-3`}
                >
                  {stat.icon}
                </div>
                <p className={`text-2xl font-extrabold ${stat.numColor} tracking-tight`}>
                  {stat.value}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                  {stat.label}
                </p>
                <p className="text-xs text-slate-300 mt-0.5">{stat.sub}</p>
              </div>
            ))
          }
        </div >

        {/* ── Search bar ──────────────────────────────────────────────────── */}
        < div
          className="flex items-center gap-3 mb-6 flex-wrap"
          style={{ animation: 'fadeUp 0.3s ease both', animationDelay: '80ms' }}
        >
          <div className="relative flex-1 min-w-60 max-w-md">
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
              placeholder="Search by building name or location…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
          {
            search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Clear
              </button>
            )
          }
          <p className="text-xs text-slate-400 ml-auto">
            Showing {paginated.length} of {filtered.length}
          </p>
        </div >

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {
          loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-400 font-medium">Loading buildings…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
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
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <p className="text-sm text-slate-600 font-medium">{error}</p>
              <button
                onClick={loadBuildings}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <svg
                className="w-14 h-14 text-slate-200"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                />
              </svg>
              <p className="text-sm text-slate-400 font-medium">
                {search ? `No buildings match "${search}"` : 'No buildings yet'}
              </p>
              {!search && (
                <Link
                  to="/admin/buildings/add"
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
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
                  Add First Building
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm" style={{ animation: 'fadeUp 0.3s ease both', animationDelay: '120ms' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-600">Building</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">Location</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">Staff</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">Floors</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">Revenue</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.map((b, i) => {
                      const employees = Number(b.total_cleaners ?? 0) + Number(b.total_supervisors ?? 0);
                      const revenue = parseFloat(b.total_revenue?.toString() ?? '0');
                      const floorCount = b.floors?.length ?? 0;

                      return (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                                </svg>
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{b.building_name}</div>
                                {b.created_at && (
                                  <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                                    Added {new Date(b.created_at).getFullYear()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                              </svg>
                              <span className="truncate max-w-[200px]">{b.location || <span className="text-slate-300 italic">No location</span>}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-100 min-w-[50px]">
                                {b.total_cleaners} C
                              </span>
                              <span className="inline-flex items-center justify-center px-2 py-1 bg-violet-50 text-violet-700 text-xs font-semibold rounded-lg border border-violet-100 min-w-[50px]">
                                {b.total_supervisors} S
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                              {floorCount} Floors
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-emerald-600">
                            {revenue >= 1000 ? `${(revenue / 1000).toFixed(1)}k` : revenue.toFixed(0)} AED
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                to={`/admin/buildings/${b.id}`}
                                className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                              >
                                View
                              </Link>
                              <button
                                onClick={() => setDeleteTarget(b)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                                title="Delete building"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        {
          !loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 flex-wrap gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium
              text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ← Previous
              </button>

              <div className="flex gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium
              text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
          )
        }
      </div>
    </div>
  );
};

export default BuildingsManagement;
