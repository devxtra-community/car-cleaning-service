import React from 'react';

const MonthlyReport = () => {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Accountant Dashboard</h1>
        <p className="text-sm text-gray-500">Finance & Salary Management</p>
      </div>

      {/* Salary Records Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold">
            Salary Records
            <span className="text-xs text-blue-500 ml-2">6 Months</span>
          </h2>
        </div>

        <div className="flex gap-2">
          <button className="border px-3 py-1.5 rounded text-sm">Monthly</button>
          <button className="border px-3 py-1.5 rounded text-sm">Export Report</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-3">Month</th>
              <th>Base Salary</th>
              <th>Incentives</th>
              <th>Penalties</th>
              <th>Net Payout</th>
              <th>Status</th>
              <th>Actions</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            <SalaryRow month="Jan 2026" status="Current" />
            <SalaryRow month="Dec 2025" status="Finalized" />
            <SalaryRow month="Nov 2025" status="Finalized" />
            <SalaryRow month="Oct 2025" status="Finalized" />
            <SalaryRow month="Jun 2025" status="Finalized" />
            <SalaryRow month="May 2025" status="Finalized" />
          </tbody>
        </table>
      </div>

      {/* Building Cards */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <BuildingCard />
        <BuildingCard />
        <BuildingCard />
        <BuildingCard />
      </div>
    </>
  );
};

export default MonthlyReport;

function SalaryRow({ month, status }: { month: string; status: string }) {
  return (
    <tr className="border-t">
      <td className="p-3 font-medium">{month}</td>
      <td className="text-center">$2000</td>
      <td className="text-center">
        <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs">$5000</span>
      </td>
      <td className="text-center">
        <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">$5000</span>
      </td>
      <td className="text-center">
        <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">$5000</span>
      </td>
      <td className="text-center">
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            status === 'Current' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {status}
        </span>
      </td>
      <td className="text-center">
        <button className="border px-2 py-1 rounded text-xs">View</button>
      </td>
      <td className="text-center">
        <button className="border px-2 py-1 rounded text-xs">Export</button>
      </td>
    </tr>
  );
}

function BuildingCard() {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="font-medium mb-1">🏢 Building A</div>
      <p className="text-xs text-gray-500 mb-3">52 Cleaners</p>

      <div className="mb-2">
        <p className="text-xs text-gray-500">Total Salary</p>
        <p className="font-semibold">$68,400</p>
      </div>

      <div className="mb-3">
        <p className="text-xs text-gray-500">Expected Salary</p>
        <p className="font-semibold">$1,629</p>
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-green-600">↗ $5,200</span>
        <span className="text-red-500">↘ $5,200</span>
      </div>
    </div>
  );
}
