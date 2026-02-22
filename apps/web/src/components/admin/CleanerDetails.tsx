import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getCleanerDetail,
  toggleCleanerStatus,
  deleteCleaner,
  type CleanerDetail,
  type CleanerTask,
  type CleanerIncentive,
  type CleanerPenalty,
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
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtShort = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const errMsg = (e: unknown) => {
  if (e instanceof Error) return e.message;
  const x = e as { response?: { data?: { message?: string } } };
  return x?.response?.data?.message ?? 'Something went wrong';
};

type Tab = 'overview' | 'tasks' | 'incentives' | 'penalties';
interface TS {
  message: string;
  type: 'success' | 'error';
}

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  icon: React.ReactNode;
}> = ({ label, value, sub, accent, icon }) => (
  <div
    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
    style={{ borderTop: `3px solid ${accent}` }}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
      style={{ background: `${accent}18`, color: accent }}
    >
      {icon}
    </div>
    <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</p>
    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">{label}</p>
    {sub && <p className="text-xs text-slate-300 mt-0.5">{sub}</p>}
  </div>
);

// ─── Info row ─────────────────────────────────────────────────────────────────
const InfoRow: React.FC<{ label: string; value?: string | number | null; link?: string }> = ({
  label,
  value,
  link,
}) => (
  <div className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-xs text-slate-400 font-medium">{label}</span>
    {link ? (
      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="text-xs font-semibold text-blue-600 hover:underline"
      >
        View ↗
      </a>
    ) : (
      <span className="text-xs font-semibold text-slate-800 text-right max-w-[60%] truncate">
        {value ?? '—'}
      </span>
    )}
  </div>
);

// ─── Status badge ─────────────────────────────────────────────────────────────
const SBadge: React.FC<{ status: string }> = ({ status }) => {
  const m: Record<string, string> = {
    completed: 'bg-emerald-50 text-emerald-700',
    'in-progress': 'bg-blue-50 text-blue-700',
    pending: 'bg-amber-50 text-amber-700',
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${m[status] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {status}
    </span>
  );
};

// ─── Image placeholder ────────────────────────────────────────────────────────
const NoImagePlaceholder: React.FC = () => (
  <div className="w-full h-72 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2">
    <svg
      className="w-10 h-10 text-slate-300"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
    <p className="text-sm text-slate-400">No image available</p>
  </div>
);
// ─── Image verification modal ─────────────────────────────────────────────────
const ImageModal: React.FC<{ task: CleanerTask; onClose: () => void }> = ({ task, onClose }) => {
  const before = task.before_photo_url ?? task.car_image_url;
  const after = task.after_photo_url ?? task.after_wash_image_url;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);
  <NoImagePlaceholder />;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Task Image Verification</h2>
            <p className="text-blue-200 text-xs mt-0.5">
              {task.car_type ?? task.vehicle_type ?? 'Vehicle'} · {task.car_number ?? '—'} ·{' '}
              {fmtShort(task.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-4 gap-4 shrink-0">
          {[
            ['Car Type', task.car_type ?? '—'],
            ['Plate', task.car_number ?? '—'],
            ['Owner', task.owner_name ?? '—'],
            ['Amount', `${fmt(Number(task.final_price ?? task.task_amount ?? 0))} AED`],
          ].map(([l, v]) => (
            <div key={l}>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{l}</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{v}</p>
            </div>
          ))}
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-bold text-slate-700 mb-3">Before Cleaning</p>
              {before ? (
                <img
                  src={before}
                  alt="Before"
                  className="w-full h-72 object-cover rounded-xl border border-slate-200"
                />
              ) : (
                <Ph />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 mb-3">After Cleaning</p>
              {after ? (
                <img
                  src={after}
                  alt="After"
                  className="w-full h-72 object-cover rounded-xl border border-slate-200"
                />
              ) : (
                <Ph />
              )}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-white shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Overview tab ─────────────────────────────────────────────────────────────
const OverviewTab: React.FC<{ data: CleanerDetail }> = ({ data }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-4 pb-3 border-b border-slate-50">
        Personal
      </p>
      <InfoRow label="Nationality" value={data.nationality} />
      <InfoRow label="Age" value={data.age} />
      <InfoRow label="Document ID" value={data.documentId} />
      {data.document && <InfoRow label="Document" link={data.document} />}
    </div>
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-teal-600 mb-4 pb-3 border-b border-slate-50">
        Contact
      </p>
      <InfoRow label="Email" value={data.email} />
      <InfoRow label="Phone" value={data.phone} />
      <InfoRow label="Base Salary" value={data.baseSalary ? `${fmt(data.baseSalary)} AED` : null} />
      <InfoRow label="Joined" value={data.joiningDate ? fmtDate(data.joiningDate) : null} />
    </div>
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-4 pb-3 border-b border-slate-50">
        Assignment
      </p>
      <InfoRow label="Building" value={data.building?.name} />
      <InfoRow label="Location" value={data.building?.location} />
      <InfoRow
        label="Floor"
        value={data.floor ? `F${data.floor.number} · ${data.floor.name}` : null}
      />
      <InfoRow label="Supervisor" value={data.supervisor?.name} />
    </div>
  </div>
);

// ─── Tasks tab ────────────────────────────────────────────────────────────────
const TasksTab: React.FC<{ tasks: CleanerTask[]; onViewImages: (t: CleanerTask) => void }> = ({
  tasks,
  onViewImages,
}) => {
  if (!tasks.length)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <svg
          className="w-12 h-12 text-slate-200"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm text-slate-400">No tasks found for this period</p>
      </div>
    );
  return (
    <div className="space-y-4">
      {tasks.map((t) => {
        const hasBefore = !!(t.before_photo_url ?? t.car_image_url);
        const hasAfter = !!(t.after_photo_url ?? t.after_wash_image_url);
        return (
          <div
            key={t.id}
            className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow"
          >
            <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <SBadge status={t.status} />
                <span className="text-xs text-slate-400">{fmtShort(t.created_at)}</span>
                {t.car_number && (
                  <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {t.car_number}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Amount</p>
                  <p className="text-base font-extrabold text-blue-600">
                    {fmt(Number(t.final_price ?? t.task_amount ?? 0))} AED
                  </p>
                </div>
                {(hasBefore || hasAfter) && (
                  <button
                    onClick={() => onViewImages(t)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"
                      />
                    </svg>
                    Verify Images
                  </button>
                )}
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Vehicle
                </p>
                {[
                  ['Type', t.car_type ?? t.vehicle_type],
                  ['Model', t.car_model],
                  ['Color', t.car_color],
                  ['Plate', t.car_number],
                ].map(([l, v]) => (
                  <div key={l} className="mb-2">
                    <p className="text-[10px] text-slate-400">{l}</p>
                    <p className="text-xs font-semibold text-slate-900">{v ?? '—'}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Owner
                </p>
                {[
                  ['Name', t.owner_name],
                  ['Phone', t.owner_phone],
                  ['Payment', t.payment_method],
                ].map(([l, v]) => (
                  <div key={l} className="mb-2">
                    <p className="text-[10px] text-slate-400">{l}</p>
                    <p className="text-xs font-semibold text-slate-900">{v ?? '—'}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Location & Time
                </p>
                {[
                  ['Building', t.building_name],
                  ['Floor', t.floor_name],
                  ['Completed', t.completed_at ? new Date(t.completed_at).toLocaleString() : null],
                ].map(([l, v]) => (
                  <div key={l} className="mb-2">
                    <p className="text-[10px] text-slate-400">{l}</p>
                    <p className="text-xs font-semibold text-slate-900">{v ?? '—'}</p>
                  </div>
                ))}
              </div>
            </div>
            {t.rating && (
              <div className="px-5 pb-5 pt-0 border-t border-slate-50">
                <div className="flex items-center gap-3 pt-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < t.rating! ? 'text-amber-400' : 'text-slate-200'}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{t.rating}/5</span>
                  {t.comment && (
                    <p className="text-xs text-slate-400 italic">&ldquo;{t.comment}&rdquo;</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Incentives tab ───────────────────────────────────────────────────────────
const IncentivesTab: React.FC<{ incentives: CleanerIncentive[] }> = ({ incentives }) => {
  if (!incentives.length)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <svg
          className="w-12 h-12 text-slate-200"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
          />
        </svg>
        <p className="text-sm text-slate-400">No incentives found</p>
      </div>
    );
  return (
    <div className="space-y-3">
      {incentives.map((x) => (
        <div
          key={x.id}
          className="flex items-center justify-between p-5 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100/60 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
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
                  d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{x.reason || 'Incentive'}</p>
              <p className="text-xs text-slate-500 mt-0.5">{fmtShort(x.created_at)}</p>
            </div>
          </div>
          <p className="text-xl font-extrabold text-emerald-600">+{fmt(x.amount)} AED</p>
        </div>
      ))}
    </div>
  );
};

// ─── Penalties tab ────────────────────────────────────────────────────────────
const PenaltiesTab: React.FC<{ penalties: CleanerPenalty[] }> = ({ penalties }) => {
  if (!penalties.length)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <svg
          className="w-12 h-12 text-slate-200"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181"
          />
        </svg>
        <p className="text-sm text-slate-400">No penalties found</p>
      </div>
    );
  return (
    <div className="space-y-3">
      {penalties.map((x) => (
        <div
          key={x.id}
          className="flex items-center justify-between p-5 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100/60 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{x.reason || 'Penalty'}</p>
              <p className="text-xs text-slate-500 mt-0.5">{fmtShort(x.created_at)}</p>
            </div>
          </div>
          <p className="text-xl font-extrabold text-red-500">-{fmt(x.amount)} AED</p>
        </div>
      ))}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const CleanerDetails: React.FC = () => {
  const { cleanerId } = useParams<{ cleanerId: string }>();
  const navigate = useNavigate();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [data, setData] = useState<CleanerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selDate, setSelDate] = useState('');
  const [imgTask, setImgTask] = useState<CleanerTask | null>(null);
  const [toggling, setToggling] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<TS | null>(null);

  const showToast = (m: string, t: TS['type']) => setToast({ message: m, type: t });

  const fetchData = useCallback(
    async (date?: string) => {
      if (!cleanerId) return;
      try {
        setLoading(true);
        const r = await getCleanerDetail(cleanerId, date);
        setData(r.data);
      } catch (e) {
        showToast(errMsg(e), 'error');
      } finally {
        setLoading(false);
      }
    },
    [cleanerId]
  );

  useEffect(() => {
    if (!authLoading && isAuthenticated) void fetchData();
  }, [authLoading, isAuthenticated, fetchData]);

  const handleApplyDate = () => void fetchData(selDate || undefined);
  const handleClearDate = () => {
    setSelDate('');
    void fetchData(undefined);
  };

  const handleToggle = async () => {
    if (!data) return;
    setToggling(true);
    try {
      const next = !data.isActive;
      await toggleCleanerStatus(data.cleanerId, next);
      setData((d) => (d ? { ...d, isActive: next } : d));
      showToast(`Cleaner ${next ? 'activated' : 'deactivated'}`, 'success');
    } catch (e) {
      showToast(errMsg(e), 'error');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!data) return;
    setDeleting(true);
    try {
      await deleteCleaner(data.cleanerId);
      showToast('Cleaner deleted', 'success');
      navigate('/admin/cleaners');
    } catch (e) {
      showToast(errMsg(e), 'error');
      setShowDel(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-slate-400">Loading cleaner details…</p>
        </div>
      </div>
    );
  if (!data)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <svg
            className="w-16 h-16 text-slate-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-slate-500">Cleaner not found</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {imgTask && <ImageModal task={imgTask} onClose={() => setImgTask(null)} />}
      {showDel && (
        <DeleteConfirmModal
          isOpen={showDel}
          title="Delete Cleaner?"
          message={
            <>
              Permanently delete{' '}
              <span className="font-semibold">&ldquo;{data?.fullName}&rdquo;</span>? Cleaners with
              active or pending tasks cannot be deleted.
            </>
          }
          confirmText="Delete"
          cancelText="Cancel"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDel(false)}
        />
      )}

      {/* sticky top bar */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/cleaners')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
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
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </button>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Admin / Cleaners
              </p>
              <p className="text-sm font-bold text-slate-900">{data.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={toggling}
              onClick={() => void handleToggle()}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${data.isActive ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
            >
              {toggling && (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {data.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => navigate(`/admin/cleaner/${data.cleanerId}/edit`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
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
              Edit Profile
            </button>
            <button
              onClick={() => setShowDel(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold transition-colors"
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
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">
        {/* hero card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-6 flex-wrap">
          <div className="relative shrink-0">
            {data.profileImage ? (
              <img
                src={data.profileImage}
                alt={data.fullName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold border-2 border-slate-100"
                style={{ background: ac(data.fullName) }}
              >
                {initials(data.fullName)}
              </div>
            )}
            <span
              className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-white ${data.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-slate-900">{data.fullName}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Cleaner · #{data.documentId ?? data.cleanerId.slice(0, 8)}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${data.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${data.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}
                />
                {data.isActive ? 'Active — can log in' : 'Inactive — login blocked'}
              </span>
              {data.building && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700">
                  {data.building.name}
                </span>
              )}
              {data.floor && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                  F{data.floor.number} · {data.floor.name}
                </span>
              )}
              {data.joiningDate && (
                <span className="text-xs text-slate-400">{fmtDate(data.joiningDate)}</span>
              )}
            </div>
          </div>
          {/* date filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex-wrap">
            <svg
              className="w-4 h-4 text-slate-400 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"
              />
            </svg>
            <input
              type="date"
              value={selDate}
              onChange={(e) => setSelDate(e.target.value)}
              className="border-0 bg-transparent text-sm text-slate-700 focus:outline-none w-36"
            />
            <button
              onClick={handleApplyDate}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Apply
            </button>
            {selDate && (
              <button
                onClick={handleClearDate}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-semibold rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            label="Total Tasks"
            value={data.summary.totalTasks}
            accent="#3B5BDB"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            label="Task Amount"
            value={`${fmt(data.summary.totalTaskAmount)} AED`}
            accent="#2F9E44"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            label="Incentives"
            value={`${fmt(data.summary.totalIncentives)} AED`}
            accent="#0C8599"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22"
                />
              </svg>
            }
          />
          <StatCard
            label="Penalties"
            value={`${fmt(data.summary.totalPenalties)} AED`}
            accent="#E03131"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898"
                />
              </svg>
            }
          />
          <StatCard
            label="Net Earning"
            value={`${fmt(data.summary.netEarning)} AED`}
            sub={data.summary.netEarning >= 0 ? 'positive' : 'negative'}
            accent={data.summary.netEarning >= 0 ? '#9C36B5' : '#E03131'}
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"
                />
              </svg>
            }
          />
        </div>

        {/* tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100 bg-slate-50 overflow-x-auto">
            {(
              [
                ['overview', 'Overview'],
                ['tasks', `Tasks (${data.tasks.length})`],
                ['incentives', `Incentives (${data.incentives.length})`],
                ['penalties', `Penalties (${data.penalties.length})`],
              ] as [Tab, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-4 text-sm font-semibold whitespace-nowrap relative transition-colors ${activeTab === key ? 'text-blue-600 bg-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'}`}
              >
                {label}
                {activeTab === key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab data={data} />}
            {activeTab === 'tasks' && <TasksTab tasks={data.tasks} onViewImages={setImgTask} />}
            {activeTab === 'incentives' && <IncentivesTab incentives={data.incentives} />}
            {activeTab === 'penalties' && <PenaltiesTab penalties={data.penalties} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleanerDetails;
