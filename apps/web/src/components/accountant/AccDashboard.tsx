import React from 'react';
import {
  BanknotesIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

const AccDashboard = () => {
  return (
    <>
      <div className="mb-6 mt-0">
        <h1 className="text-xl font-semibold">Accountant Dashboard</h1>
        <p className="text-sm text-gray-500">Finance & Salary Management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border-0 shadow rounded-xl p-4 flex items-center gap-4">
          <BanknotesIcon className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500">TOTAL INCOME GENERATED</p>
            <p className="text-xl font-semibold">$12,426</p>
          </div>
        </div>

        <div className="bg-white border-0 shadow rounded-xl p-4 flex items-center gap-4">
          <UsersIcon className="w-8 h-8 text-indigo-500" />
          <div>
            <p className="text-xs text-gray-500">ACTIVE CLEANERS</p>
            <p className="text-xl font-semibold">500</p>
          </div>
        </div>

        <div className="bg-white border-0 shadow rounded-xl p-4 flex items-center gap-4">
          <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-xs text-gray-500">TOTAL INCENTIVES</p>
            <p className="text-xl font-semibold">84,382</p>
          </div>
        </div>

        <div className="bg-white border-0 shadow rounded-xl p-4 flex items-center gap-4">
          <ArrowTrendingDownIcon className="w-8 h-8 text-red-500" />
          <div>
            <p className="text-xs text-gray-500">TOTAL PENALTIES</p>
            <p className="text-xl font-semibold">33,493</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Pending Actions */}
        <div className="col-span-2 bg-white border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Pending Actions</h2>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">3 items</span>
          </div>

          <div className="space-y-4">
            <div className="border rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">January 2026 Salary Finalization</p>
                <p className="text-sm text-gray-500">Review and lock salary for 156 cleaners</p>
                <p className="text-xs text-gray-400 mt-1">Due: Jan 15, 2026</p>
              </div>
              <button className="border px-4 py-1.5 rounded-full text-sm">Start</button>
            </div>

            <div className="border rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">January 2026 Salary Finalization</p>
                <p className="text-sm text-gray-500">Review and lock salary for 156 cleaners</p>
                <p className="text-xs text-gray-400 mt-1">Due: Jan 15, 2026</p>
              </div>
              <button className="border px-4 py-1.5 rounded-full text-sm">Continue</button>
            </div>

            <div className="border rounded-xl p-4">
              <p className="font-medium">January 2026 Salary Finalization</p>
              <p className="text-sm text-gray-500">Review and lock salary for 156 cleaners</p>
              <p className="text-xs text-gray-400 mt-1">Due: Jan 15, 2026</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Recent Activity</h2>

          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm">Salary finalized</p>
              <p className="text-xs text-gray-500">December 2025 payroll locked</p>
              <p className="text-xs text-gray-400">John Smith · 2 hours ago</p>
            </div>

            <div>
              <p className="font-medium text-sm">Salary finalized</p>
              <p className="text-xs text-gray-500">December 2025 payroll locked</p>
              <p className="text-xs text-gray-400">John Smith · 2 hours ago</p>
            </div>

            <div>
              <p className="font-medium text-sm">Salary finalized</p>
              <p className="text-xs text-gray-500">December 2025 payroll locked</p>
              <p className="text-xs text-gray-400">John Smith · 2 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccDashboard;
