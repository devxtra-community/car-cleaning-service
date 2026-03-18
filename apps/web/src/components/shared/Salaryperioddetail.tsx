import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getSalaryPeriod,
  calculateSalaries,
  lockSalaryPeriod,
  markSalaryPeriodPaid,
  finalizeSalaryRecord,
  unfinalizeSalaryRecord,
  exportSalaryCSV,
  exportSalaryExcel,
  type SalaryPeriod,
  type SalaryRecord,
} from '../../services/allAPI';
import Toast from '../shared/Toast';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtD = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const errMsg = (e: unknown) => {
  const x = e as { response?: { data?: { message?: string } } };
  return x?.response?.data?.message ?? (e instanceof Error ? e.message : 'Error');
};

const initials = (n: string) =>
  n
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
const COLORS = ['#3B5BDB', '#1971C2', '#0C8599', '#2F9E44', '#E67700', '#C2255C', '#9C36B5'];
const ac = (n: string) => COLORS[n.charCodeAt(0) % COLORS.length];

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  finalized: 'bg-blue-50 text-blue-700',
  locked: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
};
interface TS {
  message: string;
  type: 'success' | 'error';
}

const PeriodBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    active: 'bg-blue-50 text-blue-700',
    locked: 'bg-amber-50 text-amber-700',
    paid: 'bg-emerald-50 text-emerald-700',
  };
  const dots: Record<string, string> = {
    draft: 'bg-slate-400',
    active: 'bg-blue-500',
    locked: 'bg-amber-500',
    paid: 'bg-emerald-500',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${colors[status] ?? 'bg-slate-100 text-slate-600'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] ?? 'bg-slate-400'}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const SalaryPeriodDetail: React.FC = () => {
  const { periodId } = useParams<{ periodId: string }>();
  const navigate = useNavigate();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [period, setPeriod] = useState<SalaryPeriod | null>(null);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterSt, setFilterSt] = useState('all');
  const [toast, setToast] = useState<TS | null>(null);
  const showToast = (m: string, t: TS['type']) => setToast({ message: m, type: t });

  const load = useCallback(async () => {
    if (!periodId) return;
    try {
      setLoading(true);
      const d = await getSalaryPeriod(periodId);
      setPeriod(d.period);
      setRecords(d.records);
    } catch {
      showToast('Failed to load period', 'error');
    } finally {
      setLoading(false);
    }
  }, [periodId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) void load();
  }, [authLoading, isAuthenticated, load]);

  const handleCalculate = async () => {
    if (!periodId) return;
    setBusy('calc');
    try {
      const r = await calculateSalaries(periodId);
      showToast(r.message, 'success');
      void load();
    } catch (e) {
      showToast(errMsg(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  const handleLock = async () => {
    if (!periodId || !confirm('Lock this period? This cannot be undone.')) return;
    setBusy('lock');
    try {
      await lockSalaryPeriod(periodId);
      showToast('Period locked', 'success');
      void load();
    } catch (e) {
      showToast(errMsg(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  const handlePaid = async () => {
    if (!periodId || !confirm('Mark as PAID? This is the final step.')) return;
    setBusy('paid');
    try {
      await markSalaryPeriodPaid(periodId);
      showToast('Marked as paid', 'success');
      void load();
    } catch (e) {
      showToast(errMsg(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  const handleFinalize = async (recordId: string, isFinalized: boolean) => {
    setBusy(recordId);
    try {
      if (isFinalized) await unfinalizeSalaryRecord(recordId);
      else await finalizeSalaryRecord(recordId);
      showToast(isFinalized ? 'Moved back to draft' : 'Record finalized', 'success');
      void load();
    } catch (e) {
      showToast(errMsg(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const ms =
      r.full_name.toLowerCase().includes(q) || (r.building_name ?? '').toLowerCase().includes(q);
    const mf = filterSt === 'all' || r.status === filterSt;
    return ms && mf;
  });

  const totalNet = records.reduce((s, r) => s + Number(r.net_salary), 0);
  const finalizedCnt = records.filter((r) =>
    ['finalized', 'locked', 'paid'].includes(r.status)
  ).length;
  const canLock =
    period?.status === 'active' && finalizedCnt === records.length && records.length > 0;

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-slate-400">Loading…</p>
        </div>
      </div>
    );
  if (!period)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500">Period not found</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* sticky header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/salary')}
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
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900">{period.name}</h1>
                <PeriodBadge status={period.status} />
              </div>
              <p className="text-xs text-slate-400">
                {fmtD(period.start_date)} — {fmtD(period.end_date)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(period.status === 'locked' || period.status === 'paid') && (
              <>
                <button
                  onClick={() => exportSalaryCSV(period.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
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
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                  CSV
                </button>
                <button
                  onClick={() => exportSalaryExcel(period.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors"
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
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                  Excel
                </button>
              </>
            )}
            {period.status === 'draft' && (
              <button
                onClick={() => void handleCalculate()}
                disabled={busy === 'calc'}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {busy === 'calc' ? 'Calculating…' : 'Calculate Salaries'}
              </button>
            )}
            {period.status === 'active' && (
              <button
                onClick={() => void handleCalculate()}
                disabled={busy === 'calc'}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-60 text-slate-700 text-sm font-semibold transition-colors"
              >
                {busy === 'calc' ? 'Recalculating…' : 'Recalculate'}
              </button>
            )}
            {canLock && (
              <button
                onClick={() => void handleLock()}
                disabled={busy === 'lock'}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                🔒 Lock Period
              </button>
            )}
            {period.status === 'locked' && (
              <button
                onClick={() => void handlePaid()}
                disabled={busy === 'paid'}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                Mark as Paid
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">
        {/* summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Cleaners', value: records.length, color: '#3B5BDB' },
            { label: 'Finalized', value: finalizedCnt, color: '#2F9E44' },
            { label: 'Pending', value: records.length - finalizedCnt, color: '#E67700' },
            { label: 'Total Payout', value: `${fmt(totalNet)} AED`, color: '#9C36B5' },
            {
              label: 'Avg Salary',
              value: records.length ? `${fmt(totalNet / records.length)} AED` : '—',
              color: '#0C8599',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
              style={{ borderTop: `3px solid ${s.color}` }}
            >
              <p className="text-xl font-extrabold text-slate-900">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* progress banner */}
        {period.status === 'active' && records.length > 0 && (
          <div
            className={`rounded-2xl border p-4 flex items-center gap-4 ${canLock ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'}`}
          >
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">
                {canLock ? '✅ All records finalized — ready to lock!' : 'Finalization in progress'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {finalizedCnt} of {records.length} cleaner records finalized
              </p>
              <div className="mt-2 h-2 bg-white/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.round((finalizedCnt / records.length) * 100)}%` }}
                />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">
              {Math.round((finalizedCnt / records.length) * 100)}%
            </p>
          </div>
        )}

        {/* table */}
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or building…"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'draft', 'finalized', 'locked', 'paid'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterSt(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${filterSt === f ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {records.length === 0 && !loading ? (
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
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"
                />
              </svg>
              <p className="text-sm text-slate-400">
                No salary records yet — click "Calculate Salaries" to generate them
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {[
                      'Cleaner',
                      'Building / Floor',
                      'Base',
                      'Tasks',
                      'Task Amt',
                      'Incentives',
                      'Penalties',
                      'Adjustments',
                      'Net Salary',
                      'Status',
                      'Actions',
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap ${['Base', 'Tasks', 'Task Amt', 'Incentives', 'Penalties', 'Adjustments', 'Net Salary'].includes(h) ? 'text-right' : h === 'Status' || h === 'Actions' ? 'text-center' : 'text-left'}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const isBusy = busy === r.id;
                    const isFinalized = ['finalized', 'locked', 'paid'].includes(r.status);
                    const isLocked = ['locked', 'paid'].includes(r.status);
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {r.profile_image ? (
                              <img
                                src={r.profile_image}
                                alt={r.full_name}
                                className="w-8 h-8 rounded-xl object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ background: ac(r.full_name) }}
                              >
                                {initials(r.full_name)}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900 text-xs">{r.full_name}</p>
                              {r.finalized_by_name && (
                                <p className="text-[10px] text-slate-400">
                                  by {r.finalized_by_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-700">
                            {r.building_name ?? (
                              <span className="italic text-slate-300">Unassigned</span>
                            )}
                          </p>
                          {r.floor_number != null && (
                            <p className="text-[10px] text-slate-400">F{r.floor_number}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-slate-600 whitespace-nowrap">
                          {fmt(Number(r.base_salary))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                            {r.total_tasks}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-slate-600 whitespace-nowrap">
                          {fmt(Number(r.total_task_amount))}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-emerald-600 font-semibold whitespace-nowrap">
                          +{fmt(Number(r.total_incentives))}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-red-500 font-semibold whitespace-nowrap">
                          -{fmt(Number(r.total_penalties))}
                        </td>
                        <td className="px-4 py-3 text-right text-xs whitespace-nowrap">
                          <span
                            className={
                              Number(r.total_adjustments) >= 0 ? 'text-emerald-600' : 'text-red-500'
                            }
                          >
                            {Number(r.total_adjustments) >= 0 ? '+' : ''}
                            {fmt(Number(r.total_adjustments))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-sm text-slate-900 whitespace-nowrap">
                          {fmt(Number(r.net_salary))}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_STYLE[r.status] ?? 'bg-slate-100 text-slate-600'}`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              title="View breakdown"
                              onClick={() => navigate(`/admin/salary/record/${r.id}`)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
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
                                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                            </button>
                            {!isLocked &&
                              period.status !== 'locked' &&
                              period.status !== 'paid' && (
                                <button
                                  title={isFinalized ? 'Undo finalize' : 'Finalize'}
                                  disabled={isBusy}
                                  onClick={() => void handleFinalize(r.id, isFinalized)}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-60 ${isFinalized ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                >
                                  {isBusy ? (
                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  ) : isFinalized ? (
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
                                        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                                      />
                                    </svg>
                                  ) : (
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
                                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                  )}
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td className="px-4 py-3 text-xs font-bold text-slate-600" colSpan={2}>
                      TOTALS ({filtered.length} cleaners)
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-slate-900">
                      {fmt(filtered.reduce((s, r) => s + Number(r.base_salary), 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-slate-900">
                      {filtered.reduce((s, r) => s + r.total_tasks, 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-slate-900">
                      {fmt(filtered.reduce((s, r) => s + Number(r.total_task_amount), 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-emerald-600">
                      +{fmt(filtered.reduce((s, r) => s + Number(r.total_incentives), 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-red-500">
                      -{fmt(filtered.reduce((s, r) => s + Number(r.total_penalties), 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-slate-900">
                      {fmt(filtered.reduce((s, r) => s + Number(r.total_adjustments), 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-base font-extrabold text-blue-700">
                      {fmt(filtered.reduce((s, r) => s + Number(r.net_salary), 0))} AED
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default SalaryPeriodDetail;
