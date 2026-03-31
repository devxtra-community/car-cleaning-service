import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlert } from '../../context/AlertContext';
import { errMsg } from '../../utils/errorUtils';
import SalaryBreakdownModal from './SalaryBreakdownModal';
import { getSalaryPeriod, markSalaryPeriodPaid } from '../../services/allAPI';

interface SalaryRow {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
  base_salary: number;
  incentives: number;
  penalties: number;
  final_salary: number;
  status: 'pending' | 'locked' | 'paid';
}

const SalaryList: React.FC = () => {
  const { cycleId } = useParams<{ cycleId: string }>();
  const navigate = useNavigate();

  const [cycle, setCycle] = useState<any>(null);
  const [rows, setRows] = useState<SalaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<string | null>(null);
  const { showToast } = useAlert();

  /* =========================
       Fetch Salaries
       ========================= */
  const fetchData = useCallback(async () => {
    if (!cycleId) return;

    setLoading(true);
    try {
      const res = await getSalaryPeriod(cycleId);
      setCycle(res.cycle);
      setRows(res.salaries || []);
    } catch (err: unknown) {
      showToast(errMsg(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [cycleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* =========================
       Mark Cycle Paid
       ========================= */
  const handleMarkPaid = async () => {
    if (!cycleId) return;
    try {
      await markSalaryPeriodPaid(cycleId);
      showToast('Whole cycle marked as paid', 'success');
      fetchData();
    } catch (err: unknown) {
      showToast(errMsg(err), 'error');
    }
  };

  /* =========================
       Summary
       ========================= */
  const totalSalary = rows.reduce((s, r) => s + Number(r.final_salary || 0), 0);
  const totalBase = rows.reduce((s, r) => s + Number(r.base_salary || 0), 0);
  const paidCount = rows.filter((r) => r.status === 'paid').length;

  /* =========================
       Render
       ========================= */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {cycle ? `${getMonthName(cycle.month)} ${cycle.year} Payout` : 'Salary List'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Review detailed salary breakdown and verify totals before final payout.
          </p>
        </div>
        <div className="flex gap-2">
          {cycle?.is_locked && rows.length > 0 && paidCount < rows.length && (
            <button
              onClick={handleMarkPaid}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm font-semibold"
            >
              Mark All as Paid
            </button>
          )}
          <button
            onClick={() => navigate('/admin/salary-cycles')}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            ← Back to Cycles
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Stat
          title="TOTAL PAYROLL"
          value={`₹${totalSalary.toLocaleString('en-IN')}`}
          color="blue"
        />
        <Stat title="BASE PAY" value={`₹${totalBase.toLocaleString('en-IN')}`} color="purple" />
        <Stat title="PAID" value={paidCount.toString()} color="green" />
        <Stat title="PENDING" value={(rows.length - paidCount).toString()} color="amber" />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
            <tr>
              <th className="p-4 text-left">Recipient</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-right">Base</th>
              <th className="p-4 text-right">Incentives</th>
              <th className="p-4 text-right">Penalties</th>
              <th className="p-4 text-right">Net Salary</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Crunching salary data...</p>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-16 text-center text-gray-500 italic">
                  No salaries generated for this period yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition group">
                  <td className="p-4">
                    <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                      {row.full_name}
                    </div>
                    {row.role === 'cleaner' && (
                      <button
                        onClick={() => setSelectedSalary(row.id)}
                        className="text-[10px] text-blue-500 hover:underline font-bold"
                      >
                        VIEW BREAKDOWN →
                      </button>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        row.role === 'cleaner'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {row.role}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono">
                    ₹{Number(row.base_salary).toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-right text-green-600 font-mono">
                    {row.role === 'cleaner'
                      ? `+₹${Number(row.incentives).toLocaleString('en-IN')}`
                      : '—'}
                  </td>
                  <td className="p-4 text-right text-red-600 font-mono">
                    {row.role === 'cleaner'
                      ? `-₹${Number(row.penalties).toLocaleString('en-IN')}`
                      : '—'}
                  </td>
                  <td className="p-4 text-right font-bold text-gray-900 bg-gray-50/50">
                    ₹{Number(row.final_salary).toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-center">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedSalary && (
        <SalaryBreakdownModal salaryId={selectedSalary} onClose={() => setSelectedSalary(null)} />
      )}
    </div>
  );
};

export default SalaryList;

/* =========================
   UI Help Components
   ========================= */
function Stat({ title, value, color }: { title: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };

  return (
    <div className={`border rounded-xl p-5 ${colors[color]}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">{title}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: 'bg-green-100 text-green-700 ring-1 ring-green-200',
    locked: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
    pending: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200',
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${map[status] || map.pending}`}
    >
      {status}
    </span>
  );
}

function getMonthName(m: number) {
  return new Date(2000, m - 1).toLocaleString('en-US', { month: 'long' });
}
