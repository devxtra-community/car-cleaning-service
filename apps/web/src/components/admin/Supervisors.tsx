import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getAllSupervisors,
  toggleSupervisorStatus,
  deleteSupervisor,
  getAllBuildings,
  type SupervisorListItem,
} from '../../services/allAPI';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { errMsg } from '../../utils/errorUtils';
import EditSupervisorModal from './EditSupervisorModal';

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

const Supervisors: React.FC = () => {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { showConfirm, showToast } = useAlert();

  const [supervisors, setSupervisors] = useState<SupervisorListItem[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const PER_PAGE = 8;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [supData, bldData] = await Promise.all([
        getAllSupervisors(),
        getAllBuildings()
      ]);
      setSupervisors(supData);
      setBuildings(bldData.data || []);
    } catch (err) {
      showToast(errMsg(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) fetchData();
  }, [authLoading, isAuthenticated, fetchData]);

  const filtered = useMemo(() => {
    return supervisors.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        s.full_name.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.building_name?.toLowerCase().includes(q);

      const matchFilter =
        filterActive === 'all' ||
        (filterActive === 'active' ? s.is_active !== false : s.is_active === false);

      return matchSearch && matchFilter;
    });
  }, [supervisors, search, filterActive]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleToggleStatus = async (id: string, current: boolean) => {
    try {
      setActionLoading(id);
      await toggleSupervisorStatus(id, !current);
      setSupervisors((prev) =>
        prev.map((s) => (s.supervisor_id === id ? { ...s, is_active: !current } : s))
      );
      showToast(`Supervisor ${!current ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) {
      showToast(errMsg(err), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      'Are you sure you want to delete this supervisor? This action cannot be undone and will fail if the supervisor has assigned cleaners.',
      'Delete Supervisor',
      'Delete'
    );
    if (!confirmed) return;

    try {
      setActionLoading(id);
      await deleteSupervisor(id);
      setSupervisors((prev) => prev.filter((s) => s.supervisor_id !== id));
      showToast('Supervisor deleted', 'success');
    } catch (err: unknown) {
      showToast(errMsg(err), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditSuccess = () => {
    setEditTarget(null);
    fetchData();
  };

  return (
    <div className="min-h-screen">

      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
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

      <div className="mx-auto px-6 py-8 space-y-6">
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
          .animate-fade-up { animation: fadeUp 0.4s ease-out forwards; }
          .animate-slide-in { animation: slideIn 0.4s ease-out forwards; }
          .animate-pop { animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        `}</style>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total',
              value: supervisors.length,
              sub: 'registered',
              color: 'text-slate-900',
              bg: 'bg-blue-50',
              icon: (
                <path d="M15 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm-9-4V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
              ),
            },
            {
              label: 'Active',
              value: supervisors.filter((s) => s.is_active !== false).length,
              sub: 'can log in',
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              icon: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />,
            },
            {
              label: 'Inactive',
              value: supervisors.filter((s) => s.is_active === false).length,
              sub: 'login blocked',
              color: 'text-rose-500',
              bg: 'bg-rose-50',
              icon: <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />,
            },
            {
              label: 'Assigned',
              value: supervisors.filter((s) => s.building_id).length,
              sub: 'to building',
              color: 'text-blue-600',
              bg: 'bg-indigo-50',
              icon: <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />,
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

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5 animate-fade-up" style={{ animationDelay: '400ms' }}>
          <div className="relative flex-1 max-w-sm">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email or building…"
              className="w-full pl-4 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-200/40 outline-none text-sm"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilterActive(f);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-md text-sm border transition ${filterActive === f
                  ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '500ms' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-800 rounded-full animate-spin" />
              <p className="text-slate-400 mt-4">Loading supervisors…</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              No supervisors found
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
                  <th className="text-left px-6 py-3">Supervisor</th>
                  <th className="text-left px-6 py-3">Contact</th>
                  <th className="text-left px-6 py-3">Building</th>
                  <th className="text-center px-6 py-3">Status</th>
                  <th className="text-center px-6 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginated.map((sup) => {
                  const isActive = sup.is_active !== false;
                  const busy = actionLoading === sup.supervisor_id;

                  return (
                    <tr key={sup.supervisor_id} className="border-t hover:bg-slate-50 transition">
                      {/* Supervisor */}
                      <td className="px-6 py-4">
                        <Link
                          to={`/admin/supervisor/${sup.supervisor_id}`}
                          className="flex items-center gap-3"
                        >
                          {sup.profile_image ? (
                            <img
                              src={sup.profile_image}
                              className="w-10 h-10 rounded-full object-cover border"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{
                                background: avatarColor(sup.full_name),
                              }}
                            >
                              {initials(sup.full_name)}
                            </div>
                          )}

                          <div>
                            <p className="font-semibold text-slate-800">{sup.full_name}</p>
                            <p className="text-xs text-slate-400">#{sup.supervisor_id.slice(0, 8)}</p>
                          </div>
                        </Link>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <p className="text-slate-700">{sup.email ?? '—'}</p>
                        <p className="text-xs text-slate-400 mt-1">{sup.phone ?? '—'}</p>
                      </td>

                      {/* Building */}
                      <td className="px-6 py-4">
                        {sup.building_name ? (
                          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 text-xs font-medium">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <path d="M9 22V12h6v10M3 9h18" />
                            </svg>
                            {sup.building_name}
                          </span>
                        ) : (
                          <span className="italic text-slate-300">Unassigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <button
                          disabled={busy}
                          onClick={() => handleToggleStatus(sup.supervisor_id, isActive)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                            }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate-400'
                              }`}
                          />
                          {isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1.5">
                          <Link
                            to={`/admin/supervisor/${sup.supervisor_id}`}
                            title="View Details"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </Link>

                          <button
                            onClick={() => setEditTarget({
                              id: sup.supervisor_id,
                              full_name: sup.full_name,
                              email: sup.email || '',
                              phone: sup.phone || '',
                              base_salary: 0, // Will be fetched by modal or updated if available
                              nationality: '',
                              document_id: '',
                              building: sup.building_id ? { id: sup.building_id, name: sup.building_name || '' } : undefined
                            })}
                            title="Edit Supervisor"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => handleDelete(sup.supervisor_id)}
                            disabled={busy}
                            title="Delete Supervisor"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        {!loading && totalPages > 1 && (
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
        )}
      </div>

      {editTarget && (
        <EditSupervisorModal
          isOpen={!!editTarget}
          supervisor={editTarget}
          buildings={buildings}
          onClose={() => setEditTarget(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default Supervisors;
