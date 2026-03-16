import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/commonAPI';

interface TaskRecord {
  id: string;
  owner_name: string;
  car_number: string;
  car_type: string;
  cleaner_name: string;
  penalty_amount: number;
  task_amount: number;
  final_price: number;
  status: string;
  completed_at: string;
}

const Customers = () => {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [todaySummary, setTodaySummary] = useState({
    totalRevenue: 0,
    completedWash: 0,
    completionRate: 0,
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/analytics/customer-report');
      if (res.data?.success) {
        const data = res.data.data || [];
        setTasks(data);

        const completedTasks = data.filter((t: TaskRecord) => t.status === 'completed');
        const totalRevenue = completedTasks.reduce(
          (sum: number, t: TaskRecord) => sum + (t.final_price || t.task_amount || 0),
          0
        );
        const completionRate =
          data.length > 0 ? Math.round((completedTasks.length / data.length) * 100) : 0;
        setTodaySummary({
          totalRevenue,
          completedWash: completedTasks.length,
          completionRate,
        });
      }
    } catch (err) {
      console.error('Failed to fetch customer report:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Customer Report</h1>
        <p className="text-sm text-gray-500">Overview and System Management</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Weekly Overview */}
        <div className="bg-white rounded-xl p-5 flex justify-between items-center">
          <div>
            <p className="font-medium">Today's Overview</p>
            <p className="text-xs text-gray-500 mb-4">
              Performance of{' '}
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>

            <p className="text-xs text-gray-500">Completed Wash</p>
            <p className="text-lg font-semibold">{loading ? '...' : todaySummary.completedWash}</p>

            <button
              onClick={fetchTasks}
              className="mt-4 text-sm text-blue-500 border border-blue-500 px-3 py-1.5 rounded hover:bg-blue-50 transition-colors"
            >
              Refresh Report
            </button>
          </div>

          {/* Circular progress */}
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="48" stroke="#E2E8F0" strokeWidth="8" fill="none" />
              <circle
                cx="56"
                cy="56"
                r="48"
                stroke="#3B82F6"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 48}`}
                strokeDashoffset={`${2 * Math.PI * 48 * (1 - todaySummary.completionRate / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-semibold">{todaySummary.completionRate}%</span>
            </div>
          </div>
        </div>

        {/* Today Revenue */}
        <div className="col-span-2 bg-blue-500 rounded-xl p-6 text-white flex justify-between items-center">
          <div>
            <p className="text-sm opacity-90 flex items-center gap-2">💳 Today's Revenue</p>
            <p className="text-2xl font-semibold mt-1">
              ₹ {loading ? '...' : todaySummary.totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs opacity-80 mt-1">Calculated based on completed jobs</p>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border">
        {/* Table Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <p className="font-medium">Vehicle Tasks</p>
          <span className="text-sm text-gray-500">{tasks.length} records</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No task records found for today.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left p-3">Owner</th>
                <th>Plate No</th>
                <th>Car Type</th>
                <th>Cleaner</th>
                <th>Penalties</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="p-3">
                    <p className="font-medium">{task.owner_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{task.car_number}</p>
                  </td>
                  <td className="text-center">{task.car_number}</td>
                  <td className="text-center">{task.car_type || '—'}</td>
                  <td className="text-center">{task.cleaner_name || '—'}</td>
                  <td className="text-center">
                    {task.penalty_amount > 0 ? (
                      <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">
                        ₹{task.penalty_amount}
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">
                        NIL
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">
                      ₹{task.final_price || task.task_amount || 0}
                    </span>
                  </td>
                  <td className="text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        task.status === 'completed'
                          ? 'bg-green-100 text-green-600'
                          : task.status === 'pending'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Customers;
