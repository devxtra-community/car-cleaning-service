import React from 'react';
import {
  BanknotesIcon,
  UserGroupIcon,
  TruckIcon,
  UserIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview and System Management</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-emerald-50 rounded-lg">
              <BanknotesIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">
              +12.5%
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-1">TOTAL INCOME (CURRENT)</p>
          <p className="text-2xl font-semibold text-gray-900">$12,426</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <UserGroupIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
              Live
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-1">CLEANER LIVE STATUS</p>
          <p className="text-2xl font-semibold text-gray-900">78</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-violet-50 rounded-lg">
              <TruckIcon className="w-5 h-5 text-violet-600" />
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-violet-50 text-violet-700 rounded-full">
              Active
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-1">VEHICLE LIVE STATUS</p>
          <p className="text-2xl font-semibold text-gray-900">78</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-amber-50 rounded-lg">
              <UserIcon className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-amber-50 text-amber-700 rounded-full">
              Online
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-1">SUPERVISOR LIVE STATUS</p>
          <p className="text-2xl font-semibold text-gray-900">22</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operational Dashboard */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-5 text-lg">Operational Dashboard</h2>

          {/* Attendance Summary */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-3">
              <span className="font-medium text-gray-700">Attendance Summary</span>
              <span className="text-gray-400">Today</span>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 flex justify-between items-center">
              <div className="text-center flex-1">
                <p className="text-lg font-semibold text-gray-900">Worker</p>
                <p className="text-sm text-gray-600 mt-1">87 / 100</p>
              </div>
              <div className="w-px h-14 bg-blue-200" />
              <div className="text-center flex-1">
                <p className="text-lg font-semibold text-gray-900">Supervisor</p>
                <p className="text-sm text-gray-600 mt-1">22 / 28</p>
              </div>
            </div>
          </div>

          {/* Task Status */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
              <p className="text-xl font-semibold text-gray-900">23</p>
              <p className="text-xs text-gray-600 mt-1">ACTIVE</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center">
              <p className="text-xl font-semibold text-gray-900">30</p>
              <p className="text-xs text-gray-600 mt-1">COMPLETED</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center">
              <p className="text-xl font-semibold text-gray-900">7</p>
              <p className="text-xs text-gray-600 mt-1">PENDING</p>
            </div>
          </div>

          {/* Building Performance */}
          <div>
            <p className="font-medium text-gray-900 mb-4">Building-Wise Performance</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700">Building A</span>
                  <span className="text-gray-500 font-medium">82%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '82%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700">Building B</span>
                  <span className="text-gray-500 font-medium">90%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700">Building C</span>
                  <span className="text-gray-500 font-medium">45%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-semibold text-gray-900 text-lg">Performance Insights</h2>
          </div>

          <div className="flex justify-between text-sm mb-4">
            <span className="font-medium text-gray-700">Cleaner Rankings</span>
            <span className="text-gray-400">This month</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 rounded-lg bg-yellow-50 border border-yellow-100">
              <div>
                <p className="font-medium text-gray-900">John Smith</p>
                <p className="text-xs text-gray-500">45 Washes</p>
              </div>
              <div className="text-sm font-medium text-yellow-600">⭐ 4.7</div>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Sarah Johnson</p>
                <p className="text-xs text-gray-500">42 Washes</p>
              </div>
              <div className="text-sm font-medium text-gray-600">⭐ 4.6</div>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Mike Wilson</p>
                <p className="text-xs text-gray-500">40 Washes</p>
              </div>
              <div className="text-sm font-medium text-gray-600">⭐ 4.5</div>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Emma Davis</p>
                <p className="text-xs text-gray-500">38 Washes</p>
              </div>
              <div className="text-sm font-medium text-gray-600">⭐ 4.4</div>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div>
                <p className="font-medium text-gray-900">James Brown</p>
                <p className="text-xs text-gray-500">35 Washes</p>
              </div>
              <div className="text-sm font-medium text-gray-600">⭐ 4.3</div>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Lisa Anderson</p>
                <p className="text-xs text-gray-500">33 Washes</p>
              </div>
              <div className="text-sm font-medium text-gray-600">⭐ 4.2</div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <p className="text-sm opacity-90">Revenue Visibility</p>
        <p className="text-3xl font-semibold mt-2">$5,987.37</p>
        <p className="text-sm mt-1 flex items-center gap-1">
          <ArrowTrendingUpIcon className="w-4 h-4" />
          <span className="text-emerald-200">+13.25% vs Last Month</span>
        </p>
      </div>

      {/* Analytics & Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex justify-between items-center mb-5">
            <p className="font-medium text-gray-900">Revenue Trends</p>
            <div className="flex gap-3 text-xs">
              <button className="px-3 py-1 rounded-md bg-blue-50 text-blue-700 font-medium">
                1D
              </button>
              <button className="px-3 py-1 rounded-md text-gray-400 hover:bg-gray-50">1W</button>
              <button className="px-3 py-1 rounded-md text-gray-400 hover:bg-gray-50">1M</button>
              <button className="px-3 py-1 rounded-md text-gray-400 hover:bg-gray-50">1Y</button>
            </div>
          </div>

          <div className="h-64 bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
            Chart Placeholder - Revenue Analytics
          </div>

          <div className="flex gap-6 mt-5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-amber-500 rounded-full" />
              <span className="text-gray-600">ACTUAL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span className="text-gray-600">EXPECTED</span>
            </div>
          </div>
        </div>

        {/* Customer Reviews */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-5">Customer Review Summary</h3>

          <p className="text-sm text-gray-600 mb-4">Rating Distribution</p>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-gray-700 w-10">5 ⭐</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: '75%' }} />
              </div>
              <span className="text-gray-500 w-10 text-right">876</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-700 w-10">4 ⭐</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: '67%' }} />
              </div>
              <span className="text-gray-500 w-10 text-right">700</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-700 w-10">3 ⭐</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: '33%' }} />
              </div>
              <span className="text-gray-500 w-10 text-right">204</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-700 w-10">2 ⭐</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: '17%' }} />
              </div>
              <span className="text-gray-500 w-10 text-right">50</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-700 w-10">1 ⭐</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: '5%' }} />
              </div>
              <span className="text-gray-500 w-10 text-right">12</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-4">Location Performance</p>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-gray-700">
                  <span className="text-base">📍</span> Building B
                </span>
                <span className="text-yellow-500 font-medium">⭐ 4.5</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-gray-700">
                  <span className="text-base">📍</span> Building C
                </span>
                <span className="text-yellow-500 font-medium">⭐ 4.3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
