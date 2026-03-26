import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { errMsg } from '../../utils/errorUtils';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../context/AlertContext';
import {
  getMonthlyReport,
  getCleanerSalaryHistory,
  exportSalaryCSV,
  exportSalaryExcel,
  type MonthlyReportRow,
  type CleanerSalaryHistoryRow,
} from '../../services/allAPI';

const fmt = (n: number | string) =>
  new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(n)
  );
const fmtD = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-500',
  active: 'bg-blue-50 text-blue-700',
  locked: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => THIS_YEAR - i);

type View = 'monthly' | 'cleaner';

const SalaryReports: React.FC = () => {
  const navigate = useNavigate();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [view, setView] = useState<View>('monthly');
  const [year, setYear] = useState(THIS_YEAR);
  const [month, setMonth] = useState<number | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyReportRow[]>([]);
  const [cleanerId, setCleanerId] = useState('');
  const [historyData, setHistoryData] = useState<CleanerSalaryHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useAlert();

  const loadMonthly = useCallback(async () => {
    setLoading(true);
    try {
      setMonthlyData(await getMonthlyReport({ year, month: month ?? undefined }));
    } catch (e) {
      showToast(errMsg(e), 'error');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && view === 'monthly') void loadMonthly();
  }, [authLoading, isAuthenticated, view, loadMonthly]);

  const loadCleanerHistory = async () => {
    if (!cleanerId.trim()) {
      showToast('Enter a cleaner ID', 'error');
      return;
    }
    setLoading(true);
    try {
      setHistoryData(await getCleanerSalaryHistory(cleanerId.trim()));
    } catch (e) {
      showToast(errMsg(e), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Totals
  const totals = {
    cleaners: monthlyData.reduce((s, r) => s + r.total_cleaners, 0),
    base: monthlyData.reduce((s, r) => s + Number(r.total_base), 0),
    task: monthlyData.reduce((s, r) => s + Number(r.total_task_amount), 0),
    inc: monthlyData.reduce((s, r) => s + Number(r.total_incentives), 0),
    pen: monthlyData.reduce((s, r) => s + Number(r.total_penalties), 0),
    adj: monthlyData.reduce((s, r) => s + Number(r.total_adjustments), 0),
    net: monthlyData.reduce((s, r) => s + Number(r.total_net), 0),
  };

  return (
    <div className="min-h-screen">

      {/* top bar */}
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
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Finance
              </p>
              <h1 className="text-base font-extrabold text-slate-900">Salary Reports</h1>
            </div>
          </div>
          {/* view toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(['monthly', 'cleaner'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${view === v ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {v === 'monthly' ? '📅 Monthly Overview' : '👤 Cleaner History'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">
        {/* ── MONTHLY VIEW ───────────────────────────────────────────────────── */}
        {view === 'monthly' && (
          <>
            {/* filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 flex-wrap">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => {
                    setYear(Number(e.target.value));
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Month
                </label>
                <select
                  value={month ?? ''}
                  onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value="">All months</option>
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => void loadMonthly()}
                className="mt-5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                Apply
              </button>
            </div>

            {/* summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Periods', value: monthlyData.length, color: 'text-slate-900' },
                {
                  label: 'Total Task Amt',
                  value: `${fmt(totals.task)} AED`,
                  color: 'text-blue-700',
                },
                {
                  label: 'Total Incentives',
                  value: `${fmt(totals.inc)} AED`,
                  color: 'text-emerald-600',
                },
                {
                  label: 'Total Payout',
                  value: `${fmt(totals.net)} AED`,
                  color: 'text-indigo-700',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
                >
                  <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-10 h-10 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : monthlyData.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-slate-400 text-sm">
                    No salary periods found for {year}
                    {month ? ` – ${MONTHS[month - 1]}` : ''}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        {[
                          'Period',
                          'Date Range',
                          'Cleaners',
                          'Base (AED)',
                          'Task Amt (AED)',
                          'Incentives (AED)',
                          'Penalties (AED)',
                          'Adjustments (AED)',
                          'Net Payout (AED)',
                          'Status',
                          'Export',
                        ].map((h) => (
                          <th
                            key={h}
                            className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap
                            ${['Base (AED)', 'Task Amt (AED)', 'Incentives (AED)', 'Penalties (AED)', 'Adjustments (AED)', 'Net Payout (AED)'].includes(h) ? 'text-right' : h === 'Status' || h === 'Export' ? 'text-center' : 'text-left'}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((row) => (
                        <tr
                          key={row.period_id}
                          className="border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer transition-colors"
                          onClick={() => navigate(`/admin/salary/${row.period_id}`)}
                        >
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {row.period_name}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                            {fmtD(row.start_date)} — {fmtD(row.end_date)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                              {row.total_cleaners}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-slate-700">
                            {fmt(row.total_base)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-blue-700 font-semibold">
                            {fmt(row.total_task_amount)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-emerald-600 font-semibold">
                            +{fmt(row.total_incentives)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-red-500 font-semibold">
                            −{fmt(row.total_penalties)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-semibold">
                            <span
                              className={
                                Number(row.total_adjustments) >= 0
                                  ? 'text-emerald-600'
                                  : 'text-red-500'
                              }
                            >
                              {Number(row.total_adjustments) >= 0 ? '+' : '−'}
                              {fmt(Math.abs(Number(row.total_adjustments)))}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-extrabold text-indigo-700">
                            {fmt(row.total_net)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_STYLE[row.period_status] ?? 'bg-slate-100 text-slate-500'}`}
                            >
                              {row.period_status}
                            </span>
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => exportSalaryCSV(row.period_id)}
                                title="Export CSV"
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold transition-colors"
                              >
                                CSV
                              </button>
                              <button
                                onClick={() => exportSalaryExcel(row.period_id)}
                                title="Export Excel"
                                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold transition-colors"
                              >
                                XLS
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                      <tr>
                        <td className="px-4 py-3 font-bold text-slate-700 text-xs" colSpan={2}>
                          YEAR TOTALS ({year})
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-bold text-slate-900">
                          {totals.cleaners}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-slate-900">
                          {fmt(totals.base)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-blue-700">
                          {fmt(totals.task)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-emerald-600">
                          +{fmt(totals.inc)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-red-500">
                          −{fmt(totals.pen)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-slate-900">
                          {fmt(totals.adj)}
                        </td>
                        <td className="px-4 py-3 text-right text-base font-extrabold text-indigo-700">
                          {fmt(totals.net)} AED
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── CLEANER HISTORY VIEW ────────────────────────────────────────── */}
        {view === 'cleaner' && (
          <>
            {/* search bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-60">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Cleaner UUID
                </label>
                <input
                  value={cleanerId}
                  onChange={(e) => setCleanerId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void loadCleanerHistory()}
                  placeholder="Paste the cleaner UUID here…"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <button
                onClick={() => void loadCleanerHistory()}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {loading ? 'Loading…' : 'Load History'}
              </button>
            </div>

            {historyData.length > 0 && (
              <>
                {/* cleaner summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Periods', value: historyData.length, color: 'text-slate-900' },
                    {
                      label: 'Total Tasks',
                      value: historyData.reduce((s, r) => s + r.total_tasks, 0),
                      color: 'text-blue-700',
                    },
                    {
                      label: 'Total Earned',
                      value: `${fmt(historyData.reduce((s, r) => s + Number(r.net_salary), 0))} AED`,
                      color: 'text-emerald-600',
                    },
                    {
                      label: 'Avg/Period',
                      value: `${fmt(historyData.reduce((s, r) => s + Number(r.net_salary), 0) / historyData.length)} AED`,
                      color: 'text-indigo-700',
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
                    >
                      <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* history table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          {[
                            'Period',
                            'Date Range',
                            'Base',
                            'Tasks',
                            'Task Amt',
                            'Incentives',
                            'Penalties',
                            'Adjustments',
                            'Net Salary',
                            'Status',
                          ].map((h) => (
                            <th
                              key={h}
                              className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap
                              ${['Base', 'Task Amt', 'Incentives', 'Penalties', 'Adjustments', 'Net Salary'].includes(h) ? 'text-right' : h === 'Status' ? 'text-center' : 'text-left'}`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {historyData.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer transition-colors"
                            onClick={() => navigate(`/admin/salary/record/${row.id}`)}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {row.period_name}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                              {fmtD(row.start_date)} — {fmtD(row.end_date)}
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-slate-700">
                              {fmt(row.base_salary)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                                {row.total_tasks}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-blue-700 font-semibold">
                              {fmt(row.total_task_amount)}
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-emerald-600 font-semibold">
                              +{fmt(row.total_incentives)}
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-red-500 font-semibold">
                              −{fmt(row.total_penalties)}
                            </td>
                            <td className="px-4 py-3 text-right text-xs font-semibold">
                              <span
                                className={
                                  Number(row.total_adjustments) >= 0
                                    ? 'text-emerald-600'
                                    : 'text-red-500'
                                }
                              >
                                {Number(row.total_adjustments) >= 0 ? '+' : '−'}
                                {fmt(Math.abs(Number(row.total_adjustments)))}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-extrabold text-indigo-700">
                              {fmt(row.net_salary)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_STYLE[row.status] ?? 'bg-slate-100 text-slate-500'}`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                          <td className="px-4 py-3 font-bold text-slate-700 text-xs" colSpan={2}>
                            ALL PERIODS TOTAL
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-slate-900">
                            {fmt(historyData.reduce((s, r) => s + Number(r.base_salary), 0))}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-slate-900">
                            {historyData.reduce((s, r) => s + r.total_tasks, 0)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-blue-700">
                            {fmt(historyData.reduce((s, r) => s + Number(r.total_task_amount), 0))}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-emerald-600">
                            +{fmt(historyData.reduce((s, r) => s + Number(r.total_incentives), 0))}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-red-500">
                            −{fmt(historyData.reduce((s, r) => s + Number(r.total_penalties), 0))}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-slate-900">
                            {fmt(historyData.reduce((s, r) => s + Number(r.total_adjustments), 0))}
                          </td>
                          <td className="px-4 py-3 text-right text-base font-extrabold text-indigo-700">
                            {fmt(historyData.reduce((s, r) => s + Number(r.net_salary), 0))} AED
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
            )}

            {!loading && historyData.length === 0 && cleanerId && (
              <div className="text-center py-16">
                <p className="text-slate-400 text-sm">No salary records found for this cleaner</p>
              </div>
            )}
            {!cleanerId && (
              <div className="text-center py-16">
                <svg
                  className="w-14 h-14 text-slate-200 mx-auto mb-3"
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
                  Enter a cleaner UUID above to view their salary history
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  You can get the ID from the Cleaners page
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default SalaryReports;
