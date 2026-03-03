import React, { useEffect, useState } from 'react';
import { getAllSalaries, finalizeSalary, getSalaryCycles, lockSalaryPeriod } from '../../services/allAPI';
import { useNavigate } from 'react-router-dom';

/* =========================
   Types
   ========================= */
interface SalaryRow {
  id: string;
  user_id: string;
  full_name: string;
  role: 'cleaner' | 'supervisor' | 'accountant';
  salary_month: string;
  base_salary: number;
  incentive_amount: number;
  penalty_amount: number;
  final_salary: number;
  status: 'draft' | 'finalized' | 'locked' | 'paid';
}

type RoleFilter = 'all' | 'cleaner' | 'supervisor' | 'accountant';

/* =========================
   Component
   ========================= */
const SalaryFinalization: React.FC = () => {
  const [salaries, setSalaries] = useState<SalaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [locking, setLocking] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cycles, setCycles] = useState<any[]>([]);
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const navigate = useNavigate();

  /* =========================
     Fetch data
     ========================= */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [salaryData, cycleData] = await Promise.all([
          getAllSalaries(),
          getSalaryCycles()
        ]);
        setSalaries(salaryData);
        setCycles(cycleData);
        if (cycleData && cycleData.length > 0) {
          const active = cycleData.find((c: any) => !c.is_locked) || cycleData[0];
          setActiveCycle(active);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* =========================
     Finalize salary
     ========================= */
  const handleFinalize = async (salaryId: string) => {
    try {
      await finalizeSalary(salaryId);
      setSalaries((prev) =>
        prev.map((s) => (s.id === salaryId ? { ...s, status: 'finalized' } : s))
      );
    } catch (err) {
      console.error('Failed to finalize salary', err);
    }
  };

  /* =========================
     Filter salaries
     ========================= */
  const filteredSalaries = salaries.filter((salary) => {
    // Role filter
    const matchesRole = selectedRole === 'all' || salary.role === selectedRole;

    // Search filter
    const matchesSearch =
      salary.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salary.user_id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRole && matchesSearch;
  });

  /* =========================
     Summary calculations (based on filtered data)
     ========================= */
  const baseTotal = filteredSalaries.reduce((sum, s) => sum + Number(s.base_salary || 0), 0);

  const incentiveTotal = filteredSalaries.reduce(
    (sum, s) => sum + Number(s.incentive_amount || 0),
    0
  );

  const penaltyTotal = filteredSalaries.reduce((sum, s) => sum + Number(s.penalty_amount || 0), 0);

  const netTotal = filteredSalaries.reduce((sum, s) => sum + Number(s.final_salary || 0), 0);

  const pendingCount = filteredSalaries.filter((s) => s.status === 'draft').length;

  /* =========================
     Lock Salary Period
     ========================= */
  const handleLockPeriod = async () => {
    if (!activeCycle || activeCycle.is_locked) return;
    if (pendingCount > 0) {
      alert('Must finalize all pending salaries before locking the period.');
      return;
    }
    setLocking(true);
    try {
      await lockSalaryPeriod(activeCycle.id);
      setActiveCycle({ ...activeCycle, is_locked: true });
      setSalaries(prev => prev.map(s => ({ ...s, status: 'locked' })));
    } catch (err) {
      console.error(err);
      alert('Failed to lock salary period.');
    } finally {
      setLocking(false);
    }
  };

  /* =========================
     Role-specific column visibility
     ========================= */
  const showIncentivesColumn = selectedRole === 'all' || selectedRole === 'cleaner';
  const showPenaltiesColumn = selectedRole === 'all' || selectedRole === 'cleaner';

  /* =========================
     Render
     ========================= */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Salary Finalization</h1>
          <p className="text-sm text-gray-600 mt-1">Review and lock salary for pay period</p>
        </div>

        <div className="flex gap-3">
          <button className="border border-gray-300 bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            {activeCycle ? `${activeCycle.month}/${activeCycle.year}` : 'Select Period'}
          </button>
          <button
            onClick={handleLockPeriod}
            disabled={!activeCycle || activeCycle.is_locked || locking}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${!activeCycle || activeCycle.is_locked
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
              }`}
          >
            {locking ? 'Locking...' : activeCycle?.is_locked ? '🔒 Locked' : 'Lock Period'}
          </button>
        </div>
      </div>

      {/* Review Banner */}
      {pendingCount > 0 && (
        <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-4 mb-6 flex items-start gap-3">
          <div className="text-yellow-600 text-xl">⚠</div>
          <div className="flex-1">
            <p className="font-semibold text-yellow-800">Review Required</p>
            <p className="text-sm text-yellow-700 mt-1">
              {pendingCount} salary {pendingCount === 1 ? 'record' : 'records'} pending review
              before finalization.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat
          title="BASE SALARY"
          value={`₹${baseTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          color="blue"
        />
        {showIncentivesColumn && (
          <Stat
            title="INCENTIVES"
            value={`₹${incentiveTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            color="green"
          />
        )}
        {showPenaltiesColumn && (
          <Stat
            title="PENALTIES"
            value={`₹${penaltyTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            color="red"
          />
        )}
        <Stat
          title="NET PAYROLL"
          value={`₹${netTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          color="purple"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-200 gap-3">
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">Salary Records</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredSalaries.length} {filteredSalaries.length === 1 ? 'employee' : 'employees'}
              {selectedRole !== 'all' && ` (${selectedRole}s)`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Role Filter Dropdown */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as RoleFilter)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="cleaner">Cleaners</option>
              <option value="supervisor">Supervisors</option>
              <option value="accountant">Accountants</option>
            </select>

            {/* Search Input */}
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name or ID..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Employee</th>
                <th className="text-center p-4 font-semibold text-gray-700">Status</th>
                <th className="text-center p-4 font-semibold text-gray-700">Role</th>
                <th className="text-right p-4 font-semibold text-gray-700">Base Salary</th>
                {showIncentivesColumn && (
                  <th className="text-right p-4 font-semibold text-gray-700">Incentives</th>
                )}
                {showPenaltiesColumn && (
                  <th className="text-right p-4 font-semibold text-gray-700">Penalties</th>
                )}
                <th className="text-right p-4 font-semibold text-gray-700">Total Salary</th>
                <th className="text-center p-4 font-semibold text-gray-700">Actions</th>
                <th className="text-center p-4 font-semibold text-gray-700">Details</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={showIncentivesColumn && showPenaltiesColumn ? 9 : 7}
                    className="text-center p-12"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                      <p className="text-gray-500">Loading salary records...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredSalaries.length === 0 ? (
                <tr>
                  <td
                    colSpan={showIncentivesColumn && showPenaltiesColumn ? 9 : 7}
                    className="text-center p-12"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-6xl mb-3">📊</div>
                      <p className="text-gray-500 font-medium">
                        {searchQuery || selectedRole !== 'all'
                          ? 'No matching salary records found'
                          : 'No salary records found'}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {searchQuery || selectedRole !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Add salary records to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSalaries.map((salary) => (
                  <tr key={salary.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-800">{salary.full_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          ID: {salary.user_id.slice(0, 10).toUpperCase()}
                        </p>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${salary.status === 'finalized'
                            ? 'bg-green-100 text-green-700'
                            : salary.status === 'paid'
                              ? 'bg-blue-100 text-blue-700'
                              : salary.status === 'locked'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}
                      >
                        {salary.status === 'finalized' && '✓ '}
                        {salary.status === 'paid' && '💰 '}
                        {salary.status === 'locked' && '🔒 '}
                        {salary.status === 'draft' && '📝 '}
                        {salary.status.charAt(0).toUpperCase() + salary.status.slice(1)}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <span className="capitalize text-gray-700 font-medium">{salary.role}</span>
                    </td>

                    <td className="p-4 text-right">
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md font-medium">
                        ₹
                        {Number(salary.base_salary).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    {showIncentivesColumn && (
                      <td className="p-4 text-right">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md font-medium">
                          +₹
                          {Number(salary.incentive_amount).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                    )}

                    {showPenaltiesColumn && (
                      <td className="p-4 text-right">
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-md font-medium">
                          -₹
                          {Number(salary.penalty_amount).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                    )}

                    <td className="p-4 text-right">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md font-semibold">
                        ₹
                        {Number(salary.final_salary).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        disabled={salary.status !== 'draft'}
                        onClick={() => handleFinalize(salary.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition ${salary.status === 'draft'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                      >
                        {salary.status === 'draft' ? 'Finalize' : '🔒 Locked'}
                      </button>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => navigate(`../salaryDetails/${salary.user_id}`)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition"
                        title="View Details"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-200 gap-3">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredSalaries.length}</span> of{' '}
            <span className="font-medium">{salaries.length}</span> records
          </p>

          <div className="flex items-center gap-2">
            <button className="border border-gray-300 bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed">
              ← Previous
            </button>
            <span className="text-sm text-gray-600 px-3">Page 1</span>
            <button className="border border-gray-300 bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed">
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryFinalization;

/* =========================
   Stat Component
   ========================= */
function Stat({
  title,
  value,
  color = 'blue',
}: {
  title: string;
  value: string;
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
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
      <p className={`text-2xl font-bold mt-2 ${textColorClasses[color]}`}>{value}</p>
    </div>
  );
}
