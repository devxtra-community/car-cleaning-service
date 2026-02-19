import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
        ${
          toast.type === 'success'
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

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

const DeleteModal = ({
  building,
  onClose,
  onConfirm,
  loading,
}: {
  building: Building;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
      onClick={(e) => e.stopPropagation()}
      style={{ animation: 'pop 0.2s ease' }}
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
      <p className="text-slate-500 text-sm leading-relaxed mb-1">
        You're about to permanently delete{' '}
        <span className="font-semibold text-slate-800">"{building.building_name}"</span>.
      </p>
      <div className="mt-3 mb-6 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
        {[
          `${building.floors?.length ?? 0} floor${building.floors?.length !== 1 ? 's' : ''}`,
          `${Number(building.total_cleaners ?? 0) + Number(building.total_supervisors ?? 0)} employee records`,
          'All associated revenue data',
        ].map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            {item} will be permanently removed
          </div>
        ))}
      </div>

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
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{' '}
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

// ─── Building Card ─────────────────────────────────────────────────────────────

const BuildingCard = ({
  building,
  index,
  onDelete,
}: {
  building: Building;
  index: number;
  onDelete: (b: Building) => void;
}) => {
  const employees = Number(building.total_cleaners ?? 0) + Number(building.total_supervisors ?? 0);
  const revenue = parseFloat(building.total_revenue?.toString() ?? '0');
  const floorCount = building.floors?.length ?? 0;

  // Unique color accent per building based on name
  const accents = [
    {
      bg: 'from-blue-500 to-indigo-600',
      light: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-100',
    },
    {
      bg: 'from-emerald-500 to-teal-600',
      light: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
    },
    {
      bg: 'from-violet-500 to-purple-600',
      light: 'bg-violet-50',
      text: 'text-violet-700',
      border: 'border-violet-100',
    },
    {
      bg: 'from-amber-500 to-orange-500',
      light: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
    },
    {
      bg: 'from-rose-500 to-pink-600',
      light: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-100',
    },
    {
      bg: 'from-cyan-500 to-sky-600',
      light: 'bg-cyan-50',
      text: 'text-cyan-700',
      border: 'border-cyan-100',
    },
  ];
  const accent = accents[(building.building_name?.charCodeAt(0) ?? 0) % accents.length];

  return (
    <div
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden
        hover:shadow-xl hover:border-slate-300 transition-all duration-300"
      style={{ animation: 'fadeUp 0.3s ease both', animationDelay: `${index * 50}ms` }}
    >
      {/* Color bar top */}
      <div className={`h-1.5 w-full bg-linear-to-r ${accent.bg}`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div
            className={`w-12 h-12 rounded-xl bg-linear-to-br ${accent.bg} flex items-center justify-center shadow-md shrink-0`}
          >
            <svg
              className="w-6 h-6 text-white"
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
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
              {building.building_name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <svg
                className="w-3.5 h-3.5 text-slate-400 shrink-0"
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
              <p className="text-xs text-slate-400 truncate">
                {building.location || 'No location set'}
              </p>
            </div>
          </div>

          {building.created_at && (
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider shrink-0">
              {new Date(building.created_at).getFullYear()}
            </span>
          )}
        </div>

        {/* Stat chips */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className={`${accent.light} ${accent.border} border rounded-xl p-3 text-center`}>
            <p className="text-xl font-extrabold text-slate-900">{floorCount}</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${accent.text}`}>
              Floors
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
            <p className="text-xl font-extrabold text-slate-900">{employees}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5 text-slate-400">
              Staff
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
            <p className="text-xl font-extrabold text-slate-900">
              ₹{revenue >= 1000 ? `${(revenue / 1000).toFixed(1)}k` : revenue.toFixed(0)}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5 text-emerald-600">
              Revenue
            </p>
          </div>
        </div>

        {/* Floors preview */}
        {floorCount > 0 && (
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-2">
              Floors
            </p>
            <div className="flex flex-wrap gap-1.5">
              {building.floors.slice(0, 6).map((f) => (
                <span
                  key={f.id}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-medium text-slate-600"
                >
                  {f.floor_name}
                </span>
              ))}
              {floorCount > 6 && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-400">
                  +{floorCount - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Staff breakdown */}
        <div className="flex items-center gap-3 mb-5 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <svg
              className="w-3.5 h-3.5 text-blue-400"
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
            <span className="font-semibold text-slate-700">{building.total_cleaners}</span> cleaners
          </div>
          <span className="w-px h-3 bg-slate-200" />
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <svg
              className="w-3.5 h-3.5 text-violet-400"
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
            <span className="font-semibold text-slate-700">{building.total_supervisors}</span>{' '}
            supervisors
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
          <Link
            to={`/admin/buildings/${building.id}`}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
              bg-linear-to-r ${accent.bg} text-white text-sm font-semibold
              hover:opacity-90 transition-opacity shadow-sm`}
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
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            View Details
          </Link>
          <button
            onClick={() => onDelete(building)}
            className="w-10 h-10 rounded-xl border border-red-100 bg-red-50 flex items-center justify-center
              text-red-400 hover:bg-red-100 hover:text-red-600 hover:border-red-200 transition-all"
            title="Delete building"
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
  );
};

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
    <div className="min-h-screen bg-slate-50 px-6 py-9">
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pop     { from { opacity:0; transform:scale(0.94) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
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

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div
        className="flex items-start justify-between mb-8 flex-wrap gap-4"
        style={{ animation: 'fadeUp 0.25s ease' }}
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Admin / Properties
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Buildings</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? '…' : `${filtered.length} building${filtered.length !== 1 ? 's' : ''}`}
            {search && ` matching "${search}"`}
          </p>
        </div>

        <Link
          to="/admin/buildings/add"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700
            text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
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

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        style={{ animation: 'fadeUp 0.3s ease both', animationDelay: '40ms' }}
      >
        {[
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
            value: `₹${totalRevenue >= 1000 ? `${(totalRevenue / 1000).toFixed(1)}k` : totalRevenue.toFixed(0)}`,
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
        ))}
      </div>

      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <div
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
        <p className="text-xs text-slate-400 ml-auto">
          Showing {paginated.length} of {filtered.length}
        </p>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {loading ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginated.map((b, i) => (
            <BuildingCard key={b.id} building={b} index={i} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

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
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium
              text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default BuildingsManagement;
