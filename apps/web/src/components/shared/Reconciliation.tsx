import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/commonAPI';
import { ArrowDownTrayIcon, BanknotesIcon } from '@heroicons/react/24/outline';

interface CollectionRow {
  cleaner_id: string;
  cleaner_name: string;
  building_name: string;
  total_jobs: number;
  cash_collected: number;
  online_collected: number;
  salary_owed: number;
}

const Reconciliation: React.FC = () => {
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = month ? `?month=${month}-01` : '';
      const res = await api.get(`/api/analytics/collections-reconciliation${params}`);
      setRows(res.data.data || []);
    } catch {
      setToast({ message: 'Failed to load collections data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportCSV = () => {
    if (!rows.length) return;
    const headers = [
      'Cleaner Name',
      'Building',
      'Total Jobs',
      'Cash Collected (₹)',
      'Online Collected (₹)',
      'Salary Owed (₹)',
      'Net Balance (₹)',
    ];
    const csvRows = rows.map((r) => {
      const total = Number(r.cash_collected) + Number(r.online_collected);
      const net = total - Number(r.salary_owed);
      return [
        r.cleaner_name,
        r.building_name || 'N/A',
        r.total_jobs,
        Number(r.cash_collected).toFixed(2),
        Number(r.online_collected).toFixed(2),
        Number(r.salary_owed).toFixed(2),
        net.toFixed(2),
      ].join(',');
    });
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciliation_${month || 'all'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const totals = rows.reduce(
    (acc, r) => ({
      cash: acc.cash + Number(r.cash_collected),
      online: acc.online + Number(r.online_collected),
      salary: acc.salary + Number(r.salary_owed),
    }),
    { cash: 0, online: 0, salary: 0 }
  );
  const totalNet = totals.cash + totals.online - totals.salary;

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BanknotesIcon className="w-6 h-6 text-blue-600" />
            Collections Reconciliation
          </h1>
          <p className="text-sm text-slate-500 mt-1">Cleaner-level cash vs online breakdown</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2 items-center">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleExportCSV}
            disabled={!rows.length}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 transition"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Totals Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total Cash',
            value: totals.cash,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          },
          {
            label: 'Total Online',
            value: totals.online,
            color: 'text-blue-600 bg-blue-50 border-blue-200',
          },
          {
            label: 'Salary Owed',
            value: totals.salary,
            color: 'text-purple-600 bg-purple-50 border-purple-200',
          },
          {
            label: 'Net Balance',
            value: totalNet,
            color:
              totalNet >= 0
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-red-600 bg-red-50 border-red-200',
          },
        ].map((c) => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.color}`}>
            <p className="text-xs font-semibold uppercase text-gray-600">{c.label}</p>
            <p className="text-2xl font-bold mt-1">
              ₹{c.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Cleaner</th>
                <th className="px-5 py-3 font-medium">Building</th>
                <th className="px-5 py-3 font-medium text-right">Jobs</th>
                <th className="px-5 py-3 font-medium text-right">Cash (₹)</th>
                <th className="px-5 py-3 font-medium text-right">Online (₹)</th>
                <th className="px-5 py-3 font-medium text-right">Salary Owed (₹)</th>
                <th className="px-5 py-3 font-medium text-right">Net Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    No data for selected period
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const total = Number(row.cash_collected) + Number(row.online_collected);
                  const net = total - Number(row.salary_owed);
                  return (
                    <tr key={row.cleaner_id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 font-medium text-slate-900">{row.cleaner_name}</td>
                      <td className="px-5 py-4 text-slate-600">{row.building_name || '—'}</td>
                      <td className="px-5 py-4 text-right">{row.total_jobs}</td>
                      <td className="px-5 py-4 text-right text-emerald-700 font-medium">
                        ₹{Number(row.cash_collected).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-right text-blue-700 font-medium">
                        ₹{Number(row.online_collected).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-right text-purple-700">
                        ₹{Number(row.salary_owed).toLocaleString('en-IN')}
                      </td>
                      <td
                        className={`px-5 py-4 text-right font-semibold ${net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                      >
                        {net >= 0 ? '+' : ''}₹
                        {net.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-5 right-5 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Reconciliation;
