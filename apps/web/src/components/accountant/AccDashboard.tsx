import React from 'react';
import {
  BanknotesIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const AccDashboard = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
                Finance Dashboard
              </h1>
              <p className="text-slate-600 mt-1 text-sm">
                Comprehensive salary and finance management
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                Export Report
              </button>
              <button className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm hover:shadow">
                Process Payroll
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stat 1 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-emerald-50">
                <BanknotesIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                +12.5%
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Income Generated</p>
              <p className="text-2xl font-semibold text-slate-900">$12,426</p>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-50">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                +8
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Active Cleaners</p>
              <p className="text-2xl font-semibold text-slate-900">500</p>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-violet-50">
                <ArrowTrendingUpIcon className="w-6 h-6 text-violet-600" />
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                +5.2%
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Incentives</p>
              <p className="text-2xl font-semibold text-slate-900">84,382</p>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-amber-50">
                <ArrowTrendingDownIcon className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700">
                -2.1%
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Penalties</p>
              <p className="text-2xl font-semibold text-slate-900">33,493</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Pending Actions</h2>
                  <span className="text-xs font-medium px-2.5 py-1 bg-slate-200 text-slate-700 rounded-full">
                    3 items
                  </span>
                </div>
              </div>
              <div className="divide-y divide-slate-200">
                {/* Action 1 */}
                <div className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-slate-900">
                          January 2026 Salary Finalization
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200">
                          high
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        Review and lock salary for 156 cleaners
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          Due: Jan 15, 2026
                        </span>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium rounded-lg transition-all bg-slate-900 text-white hover:bg-slate-800">
                      Start
                    </button>
                  </div>
                </div>

                {/* Action 2 */}
                <div className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-slate-900">Q4 2025 Bonus Calculation</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                          medium
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        Calculate performance bonuses for 500 employees
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          Due: Jan 18, 2026
                        </span>
                        <span className="flex items-center gap-1 text-blue-600">
                          <ChartBarIcon className="w-4 h-4" />
                          In Progress
                        </span>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium rounded-lg transition-all bg-blue-600 text-white hover:bg-blue-700">
                      Continue
                    </button>
                  </div>
                </div>

                {/* Action 3 */}
                <div className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-slate-900">Expense Report Approval</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                          low
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        Review pending expense claims totaling $8,450
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          Due: Jan 20, 2026
                        </span>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium rounded-lg transition-all bg-slate-900 text-white hover:bg-slate-800">
                      Start
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {/* Activity 1 */}
                <div className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex gap-3">
                    <div className="shrink-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        December 2025 Payroll Locked
                      </p>
                      <p className="text-xs text-slate-600 mb-2">
                        Successfully processed 500 employee payments
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>John Smith</span>
                        <span>•</span>
                        <span>2 hours ago</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity 2 */}
                <div className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex gap-3">
                    <div className="shrink-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        Performance Incentives Distributed
                      </p>
                      <p className="text-xs text-slate-600 mb-2">
                        Approved $12,500 in quarterly bonuses
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Sarah Johnson</span>
                        <span>•</span>
                        <span>5 hours ago</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity 3 */}
                <div className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex gap-3">
                    <div className="shrink-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        Monthly Financial Report Generated
                      </p>
                      <p className="text-xs text-slate-600 mb-2">
                        December 2025 comprehensive salary report
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Michael Chen</span>
                        <span>•</span>
                        <span>1 day ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50">
                <button className="text-sm text-slate-700 hover:text-slate-900 font-medium transition-colors w-full text-center">
                  View All Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccDashboard;
