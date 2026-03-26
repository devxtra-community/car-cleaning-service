import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/commonAPI';
import { useAlert } from '../../context/AlertContext';
import { errMsg } from '../../utils/errorUtils';
import SalaryBreakdownModal from './SalaryBreakdownModal';

interface SalaryRow {
  id: string;
  user_id: string;
  cleaner_name: string;
  base_salary: number;
  incentives: number;
  penalties: number;
  final_salary: number;
  status: string;
  role: string;
}

const SalaryList: React.FC = () => {
  const { cycleId } = useParams<{ cycleId: string }>();

  const [rows, setRows] = useState<SalaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<string | null>(null);
  const { showToast } = useAlert();

  /* =========================
       Fetch Salaries
       ========================= */
  const fetchSalaries = useCallback(async () => {
    if (!cycleId) return;

    setLoading(true);
    try {
      const res = await api.get(`/salary/cycle/${cycleId}`);
      setRows(res.data.data || []);
    } catch (err: unknown) {
      showToast(errMsg(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [cycleId]);

  useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

  /* =========================
       Mark Salary Paid
       ========================= */
  const handleMarkPaid = async (salaryId: string) => {
    try {
      await api.post(`/salary/pay/${salaryId}`, {});
      showToast('Salary marked as paid', 'success');
      fetchSalaries();
    } catch (err: unknown) {
      showToast(errMsg(err), 'error');
    }
  };

  /* =========================
       Summary
       ========================= */
  const totalSalary = rows.reduce((s, r) => s + Number(r.final_salary || 0), 0);
  const paidCount = rows.filter((r) => r.status === 'paid').length;

  /* =========================
       Render
       ========================= */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Salary List</h1>
        <p className="text-sm text-gray-600 mt-1">
          Role-wise salary breakdown for this cycle (Cleaners & Supervisors)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Stat title="TOTAL PAYROLL" value={`₹${totalSalary.toLocaleString('en-IN')}`} color="blue" />
        <Stat title="PAID" value={paidCount.toString()} color="green" />
        <Stat title="PENDING" value={(rows.length - paidCount).toString()} color="blue" />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-left">Employee</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-right">Base</th>
              <th className="p-4 text-right">Incentives</th>
              <th className="p-4 text-right">Penalties</th>
              <th className="p-4 text-right">Net Salary</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-gray-500">
                  Loading salaries...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-gray-500">
                  No salaries generated
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.user_id || row.id} className="hover:bg-gray-50 text-slate-700">
                  <td className="p-4 font-medium text-gray-900">
                    {row.cleaner_name}
                    {row.role === 'cleaner' && row.id && (
                      <button
                        onClick={() => setSelectedSalary(row.id)}
                        className="ml-2 px-3 py-1 bg-blue-600 text-white rounded-md text-xs shadow-sm"
                      >
                        View
                      </button>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${row.role === 'cleaner' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'
                      }`}>
                      {row.role}
                    </span>
                  </td>
                  <td className="p-4 text-right">₹{Number(row.base_salary).toLocaleString('en-IN')}</td>
                  {row.role === 'cleaner' ? (
                    <>
                      <td className="p-4 text-right text-green-600">₹{Number(row.incentives).toLocaleString('en-IN')}</td>
                      <td className="p-4 text-right text-red-600">₹{Number(row.penalties).toLocaleString('en-IN')}</td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 text-right text-gray-400 font-mono">—</td>
                      <td className="p-4 text-right text-gray-400 font-mono">—</td>
                    </>
                  )}
                  <td className="p-4 text-right font-semibold text-blue-700">₹{Number(row.final_salary).toLocaleString('en-IN')}</td>
                  <td className="p-4">
                    {row.status === 'paid' ? (
                      <span className="text-green-600 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-600"></span> Paid
                      </span>
                    ) : row.status === 'not_generated' ? (
                      <span className="text-slate-400 italic">Not Generated</span>
                    ) : (
                      <span className="text-amber-600 font-medium capitalize">{row.status}</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {row.status === 'locked' && (
                      <button
                        onClick={() => handleMarkPaid(row.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-700 transition shadow-sm"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Toast removed in favor of global provider */}
      {selectedSalary && (
        <SalaryBreakdownModal salaryId={selectedSalary} onClose={() => setSelectedSalary(null)} />
      )}
    </div>
  );
};

export default SalaryList;

/* =========================
   Stat Component
   ========================= */
function Stat({ title, value, color }: { title: string; value: string; color: 'blue' | 'green' }) {
  const map = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
  };

  return (
    <div className={`border rounded-lg p-5 ${map[color]}`}>
      <p className="text-xs font-semibold uppercase text-gray-600">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}
