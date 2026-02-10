import React from 'react';

const AdminDashboard = () => {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Overview and System Management</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Stat title="TOTAL INCOME (CURRENT)" value="$12,426" />
        <Stat title="CLEANER LIVE STATUS" value="78" />
        <Stat title="VEHICLE LIVE STATUS" value="78" />
        <Stat title="SUPERVISOR LIVE STATUS" value="22" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5">
          <h2 className="font-semibold mb-4">Operational Dashboard</h2>

          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-600">Attendency Summary</span>
              <span className="text-gray-400">Today</span>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
              <div className="text-center w-1/2">
                <p className="text-lg font-semibold">Worker</p>
                <p className="text-sm">87 / 100</p>
              </div>
              <div className="w-px h-12 bg-blue-200" />
              <div className="text-center w-1/2">
                <p className="text-lg font-semibold">Supervisor</p>
                <p className="text-sm">22 / 28</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <MiniStat value="23" label="ACTIVE" bg="bg-blue-50" />
            <MiniStat value="30" label="COMPLETED" bg="bg-green-50" />
            <MiniStat value="7" label="PENDING" bg="bg-orange-50" />
          </div>

          <div>
            <p className="font-medium mb-4">Building-Wise Performance</p>

            <ProgressRow label="Building A" percent="82%" color="bg-green-500" />
            <ProgressRow label="Building B" percent="90%" color="bg-green-500" />
            <ProgressRow label="Building C" percent="45%" color="bg-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5">
          <div className="flex justify-between mb-4">
            <h2 className="font-semibold">Performance Insights</h2>
          </div>

          <div className="flex justify-between text-sm mb-3">
            <span className="font-medium text-gray-600">Cleaner Rankings</span>
            <span className="text-gray-400">This month</span>
          </div>

          <RankingCard rating="4.7" highlight />
          <RankingCard rating="4.6" />
          <RankingCard rating="4.5" />
          <RankingCard rating="4.0" />
          <RankingCard rating="4.0" />
          <RankingCard rating="4.0" />
        </div>
      </div>

      <div className="p-6min-h-screen">
        <div className="bg-linear-to-r from-blue-500 to-blue-400 rounded-xl p-6 text-white mb-6">
          <p className="text-sm opacity-90">Revenue Visibility</p>
          <p className="text-2xl font-semibold mt-1">5987.37</p>
          <p className="text-xs mt-1 text-green-200">+13.25% vs Last Month</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <p className="font-medium">Today</p>
              <div className="flex gap-3 text-xs text-gray-400">
                <span>1D</span>
                <span>1W</span>
                <span>1M</span>
                <span>1Y</span>
              </div>
            </div>

            <div className="h-60 bg-red-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
              Chart Placeholder
            </div>

            <div className="flex gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full" />
                ACTUAL
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                EXPECTED
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5">
            <h3 className="font-semibold mb-4">Customer Review Summary</h3>

            <p className="text-sm text-gray-500 mb-3">Rating Distribution</p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span>5 ⭐</span>
                <div className="flex-1 h-2 bg-gray-200 rounded">
                  <div className="h-full bg-yellow-400 w-3/4 rounded" />
                </div>
                <span>876</span>
              </div>

              <div className="flex items-center gap-2">
                <span>4 ⭐</span>
                <div className="flex-1 h-2 bg-gray-200 rounded">
                  <div className="h-full bg-yellow-400 w-2/3 rounded" />
                </div>
                <span>700</span>
              </div>

              <div className="flex items-center gap-2">
                <span>3 ⭐</span>
                <div className="flex-1 h-2 bg-gray-200 rounded">
                  <div className="h-full bg-yellow-400 w-1/3 rounded" />
                </div>
                <span>204</span>
              </div>

              <div className="flex items-center gap-2">
                <span>2 ⭐</span>
                <div className="flex-1 h-2 bg-gray-200 rounded">
                  <div className="h-full bg-yellow-400 w-1/6 rounded" />
                </div>
                <span>50</span>
              </div>

              <div className="flex items-center gap-2">
                <span>1 ⭐</span>
                <div className="flex-1 h-2 bg-gray-200 rounded">
                  <div className="h-full bg-yellow-400 w-[5%] rounded" />
                </div>
                <span>12</span>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium mb-3">Location Performance</p>

              <div className="flex justify-between items-center text-sm mb-2">
                <span className="flex items-center gap-2 text-gray-600">📍 Building B</span>
                <span className="text-yellow-500">⭐ 4.5</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-gray-600">📍 Building C</span>
                <span className="text-yellow-500">⭐ 4.3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function MiniStat({ value, label, bg }: { value: string; label: string; bg: string }) {
  return (
    <div className={`${bg} rounded-lg p-4 text-center`}>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function ProgressRow({ label, percent, color }: { label: string; percent: string; color: string }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-gray-400">{percent}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded">
        <div className={`h-full rounded ${color} w-[70%]`} />
      </div>
    </div>
  );
}

function RankingCard({ rating, highlight }: { rating: string; highlight?: boolean }) {
  return (
    <div
      className={`flex justify-between items-center p-3 rounded-lg mb-2 ${
        highlight ? 'bg-yellow-50' : 'bg-gray-50'
      }`}
    >
      <div>
        <p className="font-medium">John Smith</p>
        <p className="text-xs text-gray-500">45 Washes</p>
      </div>
      <div className="text-sm font-medium">⭐ {rating}</div>
    </div>
  );
}
