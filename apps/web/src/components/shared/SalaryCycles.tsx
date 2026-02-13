import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/commonAPI';
import Toast from './Toast';

/* =========================
   Types
   ========================= */
interface SalaryCycle {
  id: string;
  month: number;
  year: number;
  start_date: string;
  end_date: string;
  is_locked: boolean;
}

/* =========================
   Component
   ========================= */
const SalaryCycles: React.FC = () => {
  const [cycles, setCycles] = useState<SalaryCycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  /* =========================
     Fetch cycles
     ========================= */
  const fetchCycles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/salary/salary-cycles');
      setCycles(res.data.data || []);
    } catch (_err) {
      console.error('Failed to fetch salary cycles', _err);
      setToast({ message: 'Failed to load salary cycles', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  /* =========================
     Generate Salary
     ========================= */
  const handleGenerate = async (cycleId: string) => {
    try {
      await api.post(`/salary/generate/${cycleId}`);
      setToast({ message: 'Salary generated successfully', type: 'success' });
    } catch {
      setToast({ message: 'Failed to generate salary', type: 'error' });
    }
  };

  /* =========================
     Lock Salary
     ========================= */
  const handleLock = async (cycleId: string) => {
    try {
      await api.post(`/salary/lock/${cycleId}`);
      setToast({ message: 'Salary locked successfully', type: 'success' });
      fetchCycles();
    } catch {
      setToast({ message: 'Failed to lock salary', type: 'error' });
    }
  };

  /* =========================
     Summary Calculations
     ========================= */
  const totalCycles = cycles.length;
  const lockedCycles = cycles.filter((c) => c.is_locked).length;
  const activeCycles = totalCycles - lockedCycles;

  /* =========================
     Render
     ========================= */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Salary Cycles</h1>
        <p className="text-sm text-gray-600 mt-1">Manage payroll periods and salary processing</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Stat title="TOTAL CYCLES" value={totalCycles.toString()} color="blue" />
        <Stat title="LOCKED CYCLES" value={lockedCycles.toString()} color="green" />
        <Stat title="ACTIVE CYCLES" value={activeCycles.toString()} color="purple" />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-left">Month</th>
              <th className="p-4 text-left">Year</th>
              <th className="p-4 text-left">Start Date</th>
              <th className="p-4 text-left">End Date</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-500">
                  Loading cycles...
                </td>
              </tr>
            ) : cycles.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-500">
                  No salary cycles found
                </td>
              </tr>
            ) : (
              cycles.map((cycle) => (
                <tr key={cycle.id} className="hover:bg-gray-50">
                  <td className="p-4">{cycle.month}</td>
                  <td className="p-4">{cycle.year}</td>
                  <td className="p-4">{cycle.start_date}</td>
                  <td className="p-4">{cycle.end_date}</td>
                  <td className="p-4">
                    {cycle.is_locked ? (
                      <span className="text-green-600 font-medium">Locked</span>
                    ) : (
                      <span className="text-yellow-600 font-medium">Draft</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {!cycle.is_locked && (
                      <>
                        <button
                          onClick={() => handleGenerate(cycle.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs"
                        >
                          Generate
                        </button>
                        <button
                          onClick={() => handleLock(cycle.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md text-xs"
                        >
                          Lock
                        </button>
                      </>
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
    </div>
  );
};

export default SalaryCycles;

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
  color: 'blue' | 'green' | 'purple';
}) {
  const map = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
  };

  return (
    <div className={`border rounded-lg p-5 ${map[color]}`}>
      <p className="text-xs font-semibold uppercase text-gray-600">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}
