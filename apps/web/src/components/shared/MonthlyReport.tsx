import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/commonAPI';

interface MonthData {
  month: string;
  baseSalary: number;
  incentives: number;
  penalties: number;
  netPayout: number;
  status: 'current' | 'finalized' | 'paid';
}

interface BuildingData {
  id: string;
  name: string;
  icon: string;
  cleanersCount: number;
  totalSalary: number;
  expectedSalary: number;
  incentives: number;
  penalties: number;
}

const MonthlyReport = () => {
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly'>('monthly');
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [buildingData, setBuildingData] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/salary/monthly-report');
      const { history, buildings } = res.data.data;

      // Map History
      const mappedHistory: MonthData[] = history.map((h: any) => ({
        month: h.month_key,
        baseSalary: Number(h.base_salary),
        incentives: Number(h.incentives),
        penalties: Number(h.penalties),
        netPayout: Number(h.net_payout),
        status: h.status,
      }));

      // Map Buildings
      const mappedBuildings: BuildingData[] = buildings.map((b: any) => ({
        id: b.id,
        name: b.name,
        icon: '🏢',
        cleanersCount: b.cleaners_count,
        totalSalary: Number(b.total_salary),
        expectedSalary: b.cleaners_count > 0 ? Number(b.total_salary) / b.cleaners_count : 0,
        incentives: Number(b.incentives),
        penalties: Number(b.penalties),
      }));

      setMonthlyData(mappedHistory);
      setBuildingData(mappedBuildings);
    } catch (err) {
      console.error('Failed to fetch monthly report', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Calculate totals
  const totalBase = monthlyData.reduce((sum, m) => sum + m.baseSalary, 0);
  const totalIncentives = monthlyData.reduce((sum, m) => sum + m.incentives, 0);
  const totalPenalties = monthlyData.reduce((sum, m) => sum + m.penalties, 0);
  const totalNet = monthlyData.reduce((sum, m) => sum + m.netPayout, 0);

  const handleExportReport = () => {
    if (!monthlyData.length) return;
    const headers = ['Month', 'Base Salary', 'Incentives', 'Penalties', 'Net Payout', 'Status'];
    const csvRows = monthlyData.map(m =>
      [m.month, m.baseSalary, m.incentives, m.penalties, m.netPayout, m.status].join(',')
    );
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'monthly_report.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Accountant Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Finance & Salary Management</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="TOTAL BASE SALARY" value={totalBase} icon="💰" color="blue" />
        <SummaryCard title="TOTAL INCENTIVES" value={totalIncentives} icon="📈" color="green" />
        <SummaryCard title="TOTAL PENALTIES" value={totalPenalties} icon="📉" color="red" />
        <SummaryCard title="NET PAYROLL" value={totalNet} icon="💵" color="purple" />
      </div>

      {/* Salary Records Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-200 gap-3">
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">Salary Records</h2>
            <p className="text-sm text-gray-500 mt-0.5">{monthlyData.length} months of data</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode('quarterly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'quarterly'
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              Quarterly
            </button>
            <button
              onClick={handleExportReport}
              className="border border-gray-300 bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export Report
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Month</th>
                <th className="text-right p-4 font-semibold text-gray-700">Base Salary</th>
                <th className="text-right p-4 font-semibold text-gray-700">Incentives</th>
                <th className="text-right p-4 font-semibold text-gray-700">Penalties</th>
                <th className="text-right p-4 font-semibold text-gray-700">Net Payout</th>
                <th className="text-center p-4 font-semibold text-gray-700">Status</th>
                <th className="text-center p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-500 italic">
                    Loading records from database...
                  </td>
                </tr>
              ) : monthlyData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-500">
                    No salary records found for the last 12 months.
                  </td>
                </tr>
              ) : (
                monthlyData.map((row, index) => (
                  <SalaryRow key={index} data={row} />
                ))
              )}
            </tbody>

            {/* Totals Footer */}
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr className="font-semibold">
                <td className="p-4 text-gray-800">Total</td>
                <td className="p-4 text-right text-gray-800">
                  ₹{totalBase.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4 text-right text-green-700">
                  +₹{totalIncentives.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4 text-right text-red-700">
                  -₹{totalPenalties.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4 text-right text-blue-700 text-base">
                  ₹{totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4"></td>
                <td className="p-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Building Cards Section */}
      <div>
        <div className="mb-4">
          <h2 className="font-semibold text-gray-800 text-lg">Building Overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">Salary distribution by building</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {buildingData.map((building) => (
            <BuildingCard key={building.id} data={building} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;

/* =========================
   Summary Card Component
   ========================= */
function SummaryCard({
  title,
  value,
  icon,
  color = 'blue',
}: {
  title: string;
  value: number;
  icon: string;
  color?: 'blue' | 'green' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    red: 'border-red-200 bg-red-50',
    purple: 'border-purple-200 bg-purple-50',
  };

  const textColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  };

  return (
    <div className={`border ${colorClasses[color]} rounded-lg p-5 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${textColorClasses[color]}`}>
        ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

/* =========================
   Salary Row Component
   ========================= */
function SalaryRow({ data }: { data: MonthData }) {
  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="p-4">
        <span className="font-medium text-gray-800">{data.month}</span>
      </td>
      <td className="p-4 text-right">
        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md font-medium">
          ₹{data.baseSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </td>
      <td className="p-4 text-right">
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md font-medium">
          +₹{data.incentives.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </td>
      <td className="p-4 text-right">
        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-md font-medium">
          -₹{data.penalties.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </td>
      <td className="p-4 text-right">
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md font-semibold">
          ₹{data.netPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </td>
      <td className="p-4 text-center">
        <span
          className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${data.status === 'current'
            ? 'bg-green-100 text-green-700'
            : data.status === 'finalized'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600'
            }`}
        >
          {data.status === 'current' && '🟢 '}
          {data.status === 'finalized' && '✓ '}
          {data.status === 'paid' && '💰 '}
          {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
        </span>
      </td>
      <td className="p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <button className="border border-gray-300 bg-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition">
            View
          </button>
          <button className="border border-gray-300 bg-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition">
            Export
          </button>
        </div>
      </td>
    </tr>
  );
}

function BuildingCard({ data }: { data: BuildingData }) {
  const netChange = data.incentives - data.penalties;
  const changePercentage = ((netChange / data.totalSalary) * 100).toFixed(1);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{data.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800">{data.name}</h3>
            <p className="text-xs text-gray-500">{data.cleanersCount} Cleaners</p>
          </div>
        </div>
      </div>

      {/* Salary Info */}
      <div className="space-y-3 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Salary</p>
          <p className="text-xl font-bold text-gray-800">
            ₹{data.totalSalary.toLocaleString('en-IN')}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Avg per Cleaner</p>
          <p className="text-lg font-semibold text-gray-700">
            ₹{data.expectedSalary.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Incentives & Penalties */}
      <div className="border-t border-gray-200 pt-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-lg p-2">
            <p className="text-xs text-green-600 mb-1">Incentives</p>
            <p className="text-sm font-semibold text-green-700">
              +₹{data.incentives.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-2">
            <p className="text-xs text-red-600 mb-1">Penalties</p>
            <p className="text-sm font-semibold text-red-700">
              -₹{data.penalties.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Net Change */}
        <div className="mt-3 flex items-center justify-between bg-gray-50 rounded-lg p-2">
          <span className="text-xs text-gray-600">Net Impact</span>
          <div className="flex items-center gap-1">
            <span
              className={`text-sm font-semibold ${netChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
            >
              {netChange >= 0 ? '+' : ''}₹{Math.abs(netChange).toLocaleString('en-IN')}
            </span>
            <span className={`text-xs ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({netChange >= 0 ? '+' : ''}
              {changePercentage}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
