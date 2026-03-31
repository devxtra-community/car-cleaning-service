import React, { useEffect, useState, useCallback } from 'react';
import Toast from './Toast';
import { useNavigate } from 'react-router-dom';
import {
  getSalaryCycles,
  generateSalaries,
  lockSalaryPeriod,
  createSalaryCycle,
} from '../../services/allAPI';

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCycle, setNewCycle] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
  });

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const navigate = useNavigate();

  /* =========================
     Fetch cycles
     ========================= */
  const fetchCycles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSalaryCycles();
      setCycles(res || []);
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

  const handleGenerate = async (cycleId: string) => {
    try {
      await generateSalaries(cycleId);
      setToast({ message: 'Salary generated successfully', type: 'success' });
      navigate(`/admin/salaries/${cycleId}`);
    } catch {
      setToast({ message: 'Failed to generate salary', type: 'error' });
    }
  };

  const handleLock = async (cycleId: string) => {
    try {
      await lockSalaryPeriod(cycleId);
      setToast({ message: 'Salary locked successfully', type: 'success' });
      fetchCycles();
    } catch {
      setToast({ message: 'Failed to lock salary', type: 'error' });
    }
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSalaryCycle(newCycle);
      setToast({ message: 'Salary cycle created successfully', type: 'success' });
      setShowCreateModal(false);
      fetchCycles();
    } catch {
      setToast({ message: 'Failed to create salary cycle', type: 'error' });
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Salary Cycles</h1>
          <p className="text-sm text-gray-600 mt-1">Manage payroll periods and salary processing</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
        >
          + Create New Cycle
        </button>
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
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase tracking-wider font-semibold">
            <tr>
              <th className="p-4 text-left">Period</th>
              <th className="p-4 text-left">Start Date</th>
              <th className="p-4 text-left">End Date</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-500">
                  Loading cycles...
                </td>
              </tr>
            ) : cycles.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-500">
                  No salary cycles found
                </td>
              </tr>
            ) : (
              cycles.map((cycle) => (
                <tr key={cycle.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-medium text-gray-900">
                    {getMonthName(cycle.month)} {cycle.year}
                  </td>
                  <td className="p-4 text-gray-600">
                    {new Date(cycle.start_date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-gray-600">
                    {new Date(cycle.end_date).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    {cycle.is_locked ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => navigate(`/admin/salaries/${cycle.id}`)}
                      className="px-3 py-1 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View
                    </button>
                    {!cycle.is_locked && (
                      <>
                        <button
                          onClick={() => handleGenerate(cycle.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 transition"
                        >
                          Generate
                        </button>
                        <button
                          onClick={() => handleLock(cycle.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-700 transition"
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">New Salary Cycle</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCycle} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Month</label>
                  <select
                    className="w-full border rounded-lg p-2"
                    value={newCycle.month}
                    onChange={(e) => setNewCycle({ ...newCycle, month: parseInt(e.target.value) })}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {getMonthName(i + 1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg p-2"
                    value={newCycle.year}
                    onChange={(e) => setNewCycle({ ...newCycle, year: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full border rounded-lg p-2"
                    value={newCycle.start_date}
                    onChange={(e) => setNewCycle({ ...newCycle, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    className="w-full border rounded-lg p-2"
                    value={newCycle.end_date}
                    onChange={(e) => setNewCycle({ ...newCycle, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Create Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default SalaryCycles;

/* =========================
   Helper Components/Functions
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
      <p className="text-xs font-semibold uppercase text-gray-600 tracking-wider font-mono">
        {title}
      </p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}

function getMonthName(m: number) {
  return new Date(2000, m - 1).toLocaleString('en-US', { month: 'long' });
}
