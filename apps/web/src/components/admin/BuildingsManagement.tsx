import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllBuildingsWithStats, deleteBuilding } from '../../services/allAPI';
import { errMsg } from '../../utils/errorUtils';
import { useAlert } from '../../context/AlertContext';

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

// ─── Main Page ─────────────────────────────────────────────────────────────────
const PER_PAGE = 6;

const BuildingsManagement: React.FC = () => {
  const { showConfirm, showToast } = useAlert();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  // ── Load ────────────────────────────────────────────────────────────────
  const loadBuildings = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await getAllBuildingsWithStats();
      setBuildings(res.data ?? []);
    } catch (err) {
      setError(errMsg(err));
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
  const handleDelete = async (b: Building) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete "${b.building_name}"? This action cannot be undone and will remove all associated floor and employee records.`,
      'Delete Building',
      'Delete'
    );
    if (!confirmed) return;

    try {
      setDeleting(b.id);
      await deleteBuilding(b.id);
      setBuildings((prev) => prev.filter((item) => item.id !== b.id));
      showToast(`"${b.building_name}" deleted successfully`, 'success');
    } catch (err) {
      showToast(errMsg(err), 'error');
    } finally {
      setDeleting(null);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pop     { from { opacity:0; transform:scale(0.94) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
      `}</style>

      {/* standard alerts & toasts handled by AlertContext */}

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Admin / Assets
            </p>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Buildings Management</h1>
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

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          style={{ animation: 'fadeUp 0.3s ease both', animationDelay: '40ms' }}
        >
          {[
            {
              label: 'Total Buildings',
              value: buildings.length,
              sub: 'properties',
              icon: (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
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
                <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
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
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
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
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25H9m6 3H9m3 6l-3-3h1.5a3 3 0 100-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              <div className={`w-9 h-9 ${stat.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                {stat.icon}
              </div>
              <p className={`text-2xl font-extrabold ${stat.numColor} tracking-tight`}>
                {stat.value}
              </p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                {stat.label}
              </p>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-slate-200" />
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ animation: 'fadeUp 0.3s ease both', animationDelay: '80ms' }}>
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or location..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm
                focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all placeholder:text-slate-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400 font-medium animate-pulse">Loading assets...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-center">
              <svg className="w-16 h-16 text-slate-200 mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
              <p className="text-sm text-slate-400 font-medium">{search ? `No buildings match "${search}"` : 'No buildings yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Building</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Location</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Staff</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Floors</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Revenue</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((b) => {
                    const employees = Number(b.total_cleaners ?? 0) + Number(b.total_supervisors ?? 0);
                    const revenue = parseFloat(b.total_revenue?.toString() ?? '0');
                    const floorCount = b.floors?.length ?? 0;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{b.building_name}</div>
                              <div className="text-[11px] font-medium text-slate-400 mt-0.5 uppercase tracking-wide">#{b.id.slice(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            <span className="truncate max-w-[180px] font-medium">{b.location || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md border border-blue-100">{b.total_cleaners} C</span>
                            <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[10px] font-bold rounded-md border border-violet-100">{b.total_supervisors} S</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center font-bold text-slate-600 text-[11px] uppercase">
                            {floorCount} Floors
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-emerald-600">
                            {revenue >= 1000 ? `${(revenue / 1000).toFixed(1)}k` : revenue.toFixed(0)} <span className="text-[10px] text-emerald-500/70 font-bold ml-0.5">AED</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <Link
                              to={`/admin/buildings/${b.id}`}
                              title="View Details"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </Link>

                            <Link
                              to={`/admin/buildings/${b.id}/edit`}
                              title="Edit Building"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                              </svg>
                            </Link>

                            <button
                              onClick={() => handleDelete(b)}
                              disabled={deleting === b.id}
                              title="Delete Building"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                            >
                              {deleting === b.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              )}
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

          {/* ── Pagination ─────────────────────────────────────────────────── */}
          {!loading && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4 bg-slate-50/50">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold
                text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white"
              >
                ← Prev
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all
                    ${page === n
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-100 scale-110'
                      : 'border border-slate-200 text-slate-500 hover:bg-white hover:border-slate-300 bg-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold
                text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuildingsManagement;
