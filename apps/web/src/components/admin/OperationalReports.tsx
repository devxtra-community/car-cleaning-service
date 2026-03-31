import React, { useEffect, useState } from 'react';
import { api } from '../../services/commonAPI';
import * as XLSX from 'xlsx';
import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface AnalyticsRow {
  date?: string;
  week_start?: string;
  month?: string;
  total_tasks: number | string;
  total_cleaners: number | string;
  average_wash_time?: number | string;
  total_incentives?: number | string;
  total_penalties?: number | string;
  [key: string]: any;
}

type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export default function OperationalReports() {
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [data, setData] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedWeek, setSelectedWeek] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchReportData(period);
  }, [period, selectedDate, selectedWeek, selectedMonth]);

  const fetchReportData = async (selectedPeriod: ReportPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (selectedPeriod === 'daily' && selectedDate) params.date = selectedDate;
      if (selectedPeriod === 'weekly' && selectedWeek) params.week = selectedWeek;
      if (selectedPeriod === 'monthly' && selectedMonth) params.month = `${selectedMonth}-01`;

      const res = await api.get(`/api/analytics/${selectedPeriod}`, { params });
      setData(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error(`Failed to fetch ${selectedPeriod} report:`, err);
      setData([]);
      setError(`Failed to fetch ${selectedPeriod} report`);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = (row: AnalyticsRow) => {
    if (period === 'daily') return row.date ? new Date(row.date).toLocaleDateString() : 'N/A';
    if (period === 'weekly')
      return row.week_start ? `Week of ${new Date(row.week_start).toLocaleDateString()}` : 'N/A';
    if (period === 'monthly')
      return row.month
        ? new Date(row.month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        : 'N/A';
    return 'Unknown';
  };

  const getPeriodKeyForFilename = () => {
    if (period === 'daily') return selectedDate;
    if (period === 'weekly') return selectedWeek;
    return selectedMonth;
  };

  const handleExportExcel = () => {
    if (data.length === 0) return;

    const rawKeys = Object.keys(data[0]);
    const headers = rawKeys.map((k) => k.replace(/_/g, ' ').toUpperCase());

    const worksheetData = [headers, ...data.map((row) => rawKeys.map((k) => row[k]))];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Operational Report');
    XLSX.writeFile(
      workbook,
      `${period}_operational_report_${getPeriodKeyForFilename() || new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const handleExportCSV = () => {
    if (data.length === 0) return;

    const rawKeys = Object.keys(data[0]);
    const headers = rawKeys.map((k) => k.replace(/_/g, ' ').toUpperCase());

    const rows = data.map((row) => {
      return rawKeys
        .map((k) => {
          const val = row[k];
          if (val === null || val === undefined) return '';
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
          return val;
        })
        .join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${period}_operational_report_${getPeriodKeyForFilename() || new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6 text-blue-600" />
            Operational Reports
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Export operational metrics and performance over time
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex gap-3">
          <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
            {(['daily', 'weekly', 'monthly'] as ReportPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition ${
                  period === p
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div>
            {period === 'daily' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-[42px] px-3 border border-slate-300 rounded-lg text-sm bg-white"
              />
            )}
            {period === 'weekly' && (
              <input
                type="date"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="h-[42px] px-3 border border-slate-300 rounded-lg text-sm bg-white"
              />
            )}
            {period === 'monthly' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-[42px] px-3 border border-slate-300 rounded-lg text-sm bg-white"
              />
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              disabled={loading || data.length === 0}
              className="flex items-center gap-2 bg-slate-900 text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50 transition shadow-sm"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export Excel
            </button>

            <button
              onClick={handleExportCSV}
              disabled={loading || data.length === 0}
              className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 transition"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <CalendarDaysIcon className="w-5 h-5 text-slate-500" />
          <h3 className="font-semibold text-slate-800 capitalize">{period} Progress Data</h3>
        </div>
        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Period</th>
                <th className="px-6 py-3 font-medium text-right">Total Tasks</th>
                <th className="px-6 py-3 font-medium text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                      <p className="text-slate-500">Loading {period} data...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-slate-500">
                    <ChartBarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    No operational data found for this period.
                  </td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-medium text-slate-900 border-l-4 border-l-blue-500">
                      {getPeriodLabel(row)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{row.total_tasks || 0}</td>
                    <td className="px-6 py-4 text-emerald-600 text-right font-medium">
                      ₹
                      {Number(row.total_revenue || 0).toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PeakActivitySection period={period} />
    </div>
  );
}

function PeakActivitySection({ period }: { period: string }) {
  const [data, setData] = useState<{ hour: number; task_count: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/analytics/peak-activity?period=${period}`);
        setData(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch peak activity:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [period]);

  const maxCount = Math.max(...data.map((d) => parseInt(d.task_count)), 1);

  return (
    <div className="mt-8 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <ClockIcon className="w-5 h-5 text-orange-500" />
        Peak Activity Analysis
      </h3>
      <p className="text-sm text-slate-600 mb-6">
        Hourly distribution of completed tasks over the selected period
      </p>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-400 italic">
          No activity data available for this period.
        </div>
      ) : (
        <div className="flex items-end gap-1 h-48 border-b border-l border-slate-100 px-2">
          {Array.from({ length: 24 }).map((_, hour) => {
            const hourData = data.find((d) => Number(d.hour) === hour);
            const count = hourData ? parseInt(hourData.task_count) : 0;
            const height = (count / maxCount) * 100;

            return (
              <div key={hour} className="flex-1 flex flex-col items-center group relative">
                <div
                  className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all cursor-help"
                  style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                >
                  <div className="hidden group-hover:block absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                    {hour}:00 - {count} tasks
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 mt-2 transform -rotate-45 sm:rotate-0">
                  {hour % 6 === 0 ? `${hour}h` : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
