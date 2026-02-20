import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getAllSupervisors,
  toggleSupervisorStatus,
  deleteSupervisor,
  type SupervisorListItem,
} from '../../services/allAPI';
import Toast from '../shared/Toast';

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

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const Supervisors: React.FC = () => {
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [supervisors, setSupervisors] = useState<SupervisorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const PER_PAGE = 8;

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

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

  // const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleToggleStatus = async (id: string, current: boolean) => {
    try {
      setActionLoading(id);
      await toggleSupervisorStatus(id, !current);
      setSupervisors((prev) =>
        prev.map((s) => (s.supervisor_id === id ? { ...s, is_active: !current } : s))
      );
      showToast(`Supervisor ${!current ? 'activated' : 'deactivated'}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionLoading(id);
      await deleteSupervisor(id);
      setSupervisors((prev) => prev.filter((s) => s.supervisor_id !== id));
      showToast('Supervisor deleted', 'success');
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Cannot delete: supervisor has assigned cleaners');
      showToast(errorMsg, 'error');
    } finally {
      setActionLoading(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-10 py-9 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex justify-between items-start mb-7">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Admin / People</p>
          <h1 className="text-2xl font-bold text-slate-900">Supervisors</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? '…' : `${filtered.length} supervisor${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <Link
          to="/admin/register/supervisor"
          className="inline-flex items-center gap-2 bg-[#2151E7] hover:bg-[#0a3ac9] text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm transition"
        >
          <span className="text-lg leading-none">+</span>
          Add Supervisor
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
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
              className={`px-4 py-1.5 rounded-md text-sm border transition ${
                filterActive === f
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition ${
                          isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isActive ? 'bg-green-500' : 'bg-slate-400'
                          }`}
                        />
                        {isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <Link
                          to={`/admin/supervisor/${sup.supervisor_id}`}
                          className="px-3 py-1.5 text-sm shadow rounded-md text-slate-600 hover:bg-slate-50"
                        >
                          View
                        </Link>

                        <button
                          onClick={() => handleDelete(sup.supervisor_id)}
                          disabled={busy}
                          className="px-3 py-1.5 text-sm shadow bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition"
                        >
                          {busy ? (
                            <span className="animate-spin w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full inline-block" />
                          ) : (
                            'Delete'
                          )}
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
      {confirmDelete}
    </div>
  );
};

export default Supervisors;
