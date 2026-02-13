import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/commonAPI';
import Toast from './Toast';
import SalaryBreakdownModal from './SalaryBreakdownModal';

interface SalaryRow {
  id: string;
  cleaner_id: string;
  cleaner_name: string;
  base_salary: number;
  total_incentives: number;
  total_penalties: number;
  net_salary: number;
  status: string;
}

const SalaryList: React.FC = () => {
  const { cycleId } = useParams<{ cycleId: string }>();

  const [rows, setRows] = useState<SalaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

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
      console.error('Failed to fetch salaries', err);
      setToast({ message: 'Failed to load salaries', type: 'error' });
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
      await api.post(`/salary/pay/${salaryId}`, {
        payment_method: 'Bank Transfer',
      });
      setToast({ message: 'Salary marked as paid', type: 'success' });
      fetchSalaries();
    } catch {
      setToast({ message: 'Failed to mark as paid', type: 'error' });
    }
  };

  /* =========================
       Summary
       ========================= */
  const totalSalary = rows.reduce((s, r) => s + Number(r.net_salary || 0), 0);
  const paidCount = rows.filter((r) => r.status === 'paid').length;

  /* =========================
       Render
       ========================= */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Salary List</h1>
        <p className="text-sm text-gray-600 mt-1">
          Cleaner-wise salary breakdown for selected cycle
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Stat title="TOTAL SALARY" value={`₹${totalSalary.toLocaleString('en-IN')}`} color="blue" />
        <Stat title="PAID COUNT" value={paidCount.toString()} color="green" />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-left">Cleaner</th>
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
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">
                    {row.cleaner_name}
                    <button
                      onClick={() => setSelectedSalary(row.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs"
                    >
                      View
                    </button>
                  </td>
                  <td className="p-4 text-right">₹{row.base_salary}</td>
                  <td className="p-4 text-right text-green-600">₹{row.total_incentives}</td>
                  <td className="p-4 text-right text-red-600">₹{row.total_penalties}</td>
                  <td className="p-4 text-right font-semibold text-blue-700">₹{row.net_salary}</td>
                  <td className="p-4">
                    {row.status === 'paid' ? (
                      <span className="text-green-600 font-medium">Paid</span>
                    ) : (
                      <span className="text-yellow-600 font-medium">{row.status}</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {row.status === 'locked' && (
                      <button
                        onClick={() => handleMarkPaid(row.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded-md text-xs"
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

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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
