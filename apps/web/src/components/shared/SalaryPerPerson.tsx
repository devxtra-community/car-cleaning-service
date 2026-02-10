import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSalaryDetailsPerWorker } from '../../services/allAPI';

interface UserSalary {
  id: string;
  month: string;
  base_salary: number;
  incentive_amount: number;
  penalty_amount: number;
  final_salary: number;
  status: string;
  created_at: string;
}

const SalaryPerPerson = () => {
  const { userId } = useParams<{ userId: string }>();

  const [salaries, setSalaries] = useState<UserSalary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSalaryDetailsPerWorker(userId);
        console.log('SALARY DATA:', data);
        setSalaries(data);
      } catch (err) {
        console.error('Failed to fetch salary details', err);
        setError('Failed to load salary details');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [userId]);

  // Calculate totals
  const totalBase = salaries.reduce((sum, s) => sum + Number(s.base_salary || 0), 0);
  const totalIncentives = salaries.reduce((sum, s) => sum + Number(s.incentive_amount || 0), 0);
  const totalPenalties = salaries.reduce((sum, s) => sum + Number(s.penalty_amount || 0), 0);
  const totalFinal = salaries.reduce((sum, s) => sum + Number(s.final_salary || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-sm text-gray-600">Loading salary details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-700 font-medium">{error}</p>
        <p className="text-red-600 text-sm mt-1">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {salaries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Total Base Salary" value={totalBase} color="blue" />
          <SummaryCard title="Total Incentives" value={totalIncentives} color="green" prefix="+" />
          <SummaryCard title="Total Penalties" value={totalPenalties} color="red" prefix="-" />
          <SummaryCard title="Total Earnings" value={totalFinal} color="purple" />
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-800">Salary History</h3>
          <p className="text-sm text-gray-600 mt-0.5">
            {salaries.length} {salaries.length === 1 ? 'record' : 'records'} found
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-left font-semibold text-gray-700">Month</th>
                <th className="p-4 text-right font-semibold text-gray-700">Base Salary</th>
                <th className="p-4 text-right font-semibold text-gray-700">Incentives</th>
                <th className="p-4 text-right font-semibold text-gray-700">Penalties</th>
                <th className="p-4 text-right font-semibold text-gray-700">Final Salary</th>
                <th className="p-4 text-center font-semibold text-gray-700">Status</th>
                <th className="p-4 text-center font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {salaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-6xl mb-3">📊</div>
                      <p className="text-gray-600 font-medium">No salary records found</p>
                      <p className="text-gray-500 text-sm mt-1">
                        Salary records will appear here once they are created
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                salaries.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <span className="font-medium text-gray-800">{formatMonth(s.month)}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md font-medium">
                        ₹
                        {Number(s.base_salary).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md font-medium">
                        +₹
                        {Number(s.incentive_amount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-md font-medium">
                        -₹
                        {Number(s.penalty_amount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md font-semibold">
                        ₹
                        {Number(s.final_salary).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
                          s.status === 'finalized'
                            ? 'bg-green-100 text-green-700'
                            : s.status === 'paid'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {s.status === 'finalized' && '✓ '}
                        {s.status === 'paid' && '💰 '}
                        {s.status === 'draft' && '📝 '}
                        {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-center text-gray-600">{formatDate(s.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Totals Row */}
            {salaries.length > 0 && (
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
                    ₹{totalFinal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalaryPerPerson;

/* =========================
   Summary Card Component
   ========================= */
function SummaryCard({
  title,
  value,
  color = 'blue',
  prefix = '',
}: {
  title: string;
  value: number;
  color?: 'blue' | 'green' | 'red' | 'purple';
  prefix?: string;
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
    <div className={`border ${colorClasses[color]} rounded-lg p-4 shadow-sm`}>
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
      <p className={`text-xl font-bold mt-2 ${textColorClasses[color]}`}>
        {prefix}₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

/* =========================
   Helper Functions
   ========================= */
function formatMonth(monthStr: string): string {
  if (!monthStr) return 'N/A';

  // If it's in YYYY-MM format
  if (monthStr.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  return monthStr;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';

  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
