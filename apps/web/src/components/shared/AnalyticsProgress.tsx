import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/commonAPI';

/* =========================
   Types
   ========================= */
type ViewMode = 'daily' | 'weekly' | 'monthly';

interface AnalyticsRow {
  cleaner_id: string;
  cleaner_name: string;
  cleaner_email: string;
  supervisor_name: string | null;

  total_tasks: number;
  total_incentives: number;
  total_penalties: number;
  total_earnings: number;

  date?: string;
  week_start?: string;
  month?: string;
}

/* =========================
   Component
   ========================= */
const AnalyticsProgress: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* =========================
     Fetch analytics data
     ========================= */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics/${viewMode}`);
      setRows(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  /* =========================
     Summary calculations
     ========================= */
  const totalTasks = rows.reduce((s, r) => s + Number(r.total_tasks || 0), 0);
  const totalIncentives = rows.reduce((s, r) => s + Number(r.total_incentives || 0), 0);
  const totalPenalties = rows.reduce((s, r) => s + Number(r.total_penalties || 0), 0);
  const totalEarnings = rows.reduce((s, r) => s + Number(r.total_earnings || 0), 0);

  /* =========================
     Render
     ========================= */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Progress Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">
            Daily, weekly and monthly performance overview
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 hover:bg-gray-100'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat title="TASKS DONE" value={totalTasks.toString()} color="blue" />
        <Stat
          title="INCENTIVES"
          value={`₹${totalIncentives.toLocaleString('en-IN')}`}
          color="green"
        />
        <Stat title="PENALTIES" value={`₹${totalPenalties.toLocaleString('en-IN')}`} color="red" />
        <Stat
          title="TOTAL EARNINGS"
          value={`₹${totalEarnings.toLocaleString('en-IN')}`}
          color="purple"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-left">Cleaner</th>
              <th className="p-4 text-left">Supervisor</th>
              <th className="p-4 text-right">Tasks</th>
              <th className="p-4 text-right">Incentives</th>
              <th className="p-4 text-right">Penalties</th>
              <th className="p-4 text-right">Earnings</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-500">
                  Loading analytics...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-medium text-gray-800">{row.cleaner_name}</p>
                    <p className="text-xs text-gray-500">{row.cleaner_email}</p>
                  </td>
                  <td className="p-4 text-gray-700">{row.supervisor_name || '-'}</td>
                  <td className="p-4 text-right">{row.total_tasks}</td>
                  <td className="p-4 text-right text-green-700">₹{row.total_incentives}</td>
                  <td className="p-4 text-right text-red-700">₹{row.total_penalties}</td>
                  <td className="p-4 text-right font-semibold text-blue-700">
                    ₹{row.total_earnings}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsProgress;

/* =========================
   Stat Component
   ========================= */
function Stat({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: 'blue' | 'green' | 'red' | 'purple';
}) {
  const map = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
  };

  return (
    <div className={`border rounded-lg p-5 ${map[color]}`}>
      <p className="text-xs font-semibold uppercase text-gray-600">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}
