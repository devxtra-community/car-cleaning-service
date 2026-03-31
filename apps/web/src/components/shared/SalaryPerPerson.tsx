import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSalaryDetailsPerWorker } from '../../services/allAPI';

interface UserSalary {
  id: string;
  month: number;
  year: number;
  base_salary: number;
  incentives: number;
  penalties: number;
  final_salary: number;
  status: string;
  created_at: string;
  role: string;
}

const SalaryPerPerson = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [salaries, setSalaries] = useState<UserSalary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const raw = await getSalaryDetailsPerWorker(userId);
        const rows = Array.isArray(raw) ? raw : [];

        const normalized: UserSalary[] = rows.map((row: any) => {
          const parsed = parseSalaryMonth(row?.salary_month);
          return {
            id: String(row?.id || ''),
            month: parsed.month,
            year: parsed.year,
            base_salary: Number(row?.base_salary || 0),
            incentives: Number(row?.incentives || 0),
            penalties: Number(row?.penalties || 0),
            final_salary: Number(row?.final_salary || 0),
            status: String(row?.status || 'pending'),
            created_at: String(row?.created_at || ''),
            role: String(row?.role || 'cleaner'),
          };
        });

        setSalaries(normalized);
      } catch (err) {
        console.error('Failed to fetch salary details', err);
        setError('Failed to load salary details');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [userId]);

  const userRole = salaries.length > 0 ? salaries[0].role : 'cleaner';

  // Calculate totals
  const totalBase = salaries.reduce((sum, s) => sum + Number(s.base_salary || 0), 0);
  const totalIncentives = salaries.reduce((sum, s) => sum + Number(s.incentives || 0), 0);
  const totalPenalties = salaries.reduce((sum, s) => sum + Number(s.penalties || 0), 0);
  const totalFinal = salaries.reduce((sum, s) => sum + Number(s.final_salary || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-sm text-gray-600 font-medium">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center shadow-sm">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-700 font-bold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Earnings Report</h2>
          <p className="text-xs text-gray-500">Historical performance and payouts</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-bold text-blue-600 hover:text-blue-800"
        >
          BACK TO PREVIOUS →
        </button>
      </div>

      {/* Summary Cards */}
      {salaries.length > 0 && (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${userRole === 'cleaner' ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4`}
        >
          <SummaryCard title="Total Base Salary" value={totalBase} color="blue" />
          {userRole === 'cleaner' && (
            <>
              <SummaryCard
                title="Total Incentives"
                value={totalIncentives}
                color="green"
                prefix="+"
              />
              <SummaryCard title="Total Penalties" value={totalPenalties} color="red" prefix="-" />
            </>
          )}
          <SummaryCard title="Total Earnings" value={totalFinal} color="purple" />
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Salary History</h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
              {salaries.length} RECORDED PERIODS
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-left font-bold text-gray-600 uppercase tracking-wider text-[10px]">
                  Period
                </th>
                <th className="p-4 text-right font-bold text-gray-600 uppercase tracking-wider text-[10px]">
                  Base Salary
                </th>
                {userRole === 'cleaner' && (
                  <>
                    <th className="p-4 text-right font-bold text-gray-600 uppercase tracking-wider text-[10px]">
                      Incentives
                    </th>
                    <th className="p-4 text-right font-bold text-gray-600 uppercase tracking-wider text-[10px]">
                      Penalties
                    </th>
                  </>
                )}
                <th className="p-4 text-right font-bold text-gray-600 uppercase tracking-wider text-[10px]">
                  Final Salary
                </th>
                <th className="p-4 text-center font-bold text-gray-600 uppercase tracking-wider text-[10px]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {salaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <div className="text-6xl mb-3">📭</div>
                      <p className="text-gray-900 font-black uppercase text-xs tracking-widest">
                        No history available
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                salaries.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition group">
                    <td className="p-4">
                      <span className="font-bold text-gray-900">
                        {formatMonth(s.month, s.year)}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-gray-600">
                      ₹{Number(s.base_salary).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </td>
                    {userRole === 'cleaner' && (
                      <>
                        <td className="p-4 text-right font-mono text-green-600 font-bold">
                          +₹
                          {Number(s.incentives).toLocaleString('en-IN', {
                            minimumFractionDigits: 0,
                          })}
                        </td>
                        <td className="p-4 text-right font-mono text-red-600 font-bold">
                          -₹
                          {Number(s.penalties).toLocaleString('en-IN', {
                            minimumFractionDigits: 0,
                          })}
                        </td>
                      </>
                    )}
                    <td className="p-4 text-right">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-black font-mono">
                        ₹
                        {Number(s.final_salary).toLocaleString('en-IN', {
                          minimumFractionDigits: 0,
                        })}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* =========================
   UI Components
   ========================= */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: 'bg-blue-100 text-blue-700 border-blue-200',
    locked: 'bg-green-100 text-green-700 border-green-200',
    finalized: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };

  return (
    <span
      className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-tighter ${map[status] || map.pending}`}
    >
      {status}
    </span>
  );
}

function SummaryCard({ title, value, color = 'blue', prefix = '' }: any) {
  const styles: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    red: 'bg-red-50 border-red-100 text-red-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
  };

  return (
    <div className={`p-5 rounded-2xl border ${styles[color]} shadow-sm`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{title}</p>
      <p className="text-2xl font-black">
        {prefix}₹{value.toLocaleString('en-IN')}
      </p>
    </div>
  );
}

function formatMonth(month: number, year: number): string {
  if (!Number.isFinite(month) || !Number.isFinite(year) || month < 1 || month > 12) {
    return 'Unknown Period';
  }
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function parseSalaryMonth(value: unknown): { month: number; year: number } {
  const fallback = { month: 1, year: 1970 };
  if (typeof value !== 'string') return fallback;

  const parts = value.split('-');
  if (parts.length < 2) return fallback;

  const year = Number(parts[0]);
  const month = Number(parts[1]);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return fallback;
  }

  return { month, year };
}

export default SalaryPerPerson;
