import React from 'react';

const SalaryFinalization = () => {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Salary Finalization</h1>
          <p className="text-sm text-gray-500">Review and lock salary for pay period</p>
        </div>

        <div className="flex gap-2">
          <button className="border px-3 py-1.5 rounded text-sm">January 2026</button>
          <button className="border px-3 py-1.5 rounded text-sm">Lock Period</button>
        </div>
      </div>

      {/* Review Required Banner */}
      <div className="border border-yellow-300 bg-yellow-50 rounded-xl p-4 mb-6 flex gap-3">
        <div className="text-yellow-500">✎</div>
        <div>
          <p className="font-medium text-yellow-700">Review Required</p>
          <p className="text-sm text-yellow-600">
            2 salary records pending review. Complete all reviews before locking.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Stat title="BASE SALARY" value="$12,426" />
        <Stat title="INCENTIVES" value="500" />
        <Stat title="PENALTIES" value="84,382" />
        <Stat title="NET PAYROLL" value="33,493" />
      </div>

      {/* Table Section */}
      <div className="bg-white border rounded-xl">
        {/* Table Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-medium">
            Cleaners
            <span className="text-xs text-blue-500 ml-2">500 users</span>
          </div>

          <div className="flex gap-2">
            <input className="border rounded px-3 py-1.5 text-sm" placeholder="Search here" />
            <button className="border px-3 py-1.5 rounded text-sm">Role</button>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-3">Name</th>
              <th>Status</th>
              <th>Building</th>
              <th>Basic Salary</th>
              <th>Incentives</th>
              <th>Penalties</th>
              <th>Total Salary</th>
              <th>Actions</th>
              <th>History</th>
            </tr>
          </thead>

          <tbody>
            {[
              ['Olivia Rhye', 'Active', 'Approved'],
              ['Phoenix Baker', 'Active', 'Locked'],
              ['Lana Steiner', 'Active', 'Pending'],
              ['Demi Wilkinson', 'Active', 'Approved'],
              ['Candice Wu', 'Active', 'Approved'],
              ['Natalia Craig', 'Inactive', 'Pending'],
              ['Drew Cano', 'Active', 'Approved'],
              ['Orlando Diggs', 'Active', 'Approved'],
              ['Andi Lane', 'Active', 'Approved'],
              ['Kate Morrison', 'Active', 'Approved'],
            ].map((row, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">
                  <p className="font-medium">{row[0]}</p>
                  <p className="text-xs text-gray-400">CC103</p>
                </td>
                <td>
                  <button
                    className={`text-xs px-2 py-1 rounded-full ${
                      row[1] === 'Active'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {row[1]}
                  </button>
                </td>
                <td>Building A</td>
                <td>
                  <span className="bg-gray-100 px-2 py-1 rounded">$2000</span>
                </td>
                <td>
                  <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded">$5000</span>
                </td>
                <td>
                  <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded">$5000</span>
                </td>
                <td>
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded">$5000</span>
                </td>
                <td>
                  <span className="border px-2 py-1 rounded text-xs">{row[2]}</span>
                </td>
                <td className="text-center">👁</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t text-sm">
          <button className="border px-3 py-1.5 rounded">← Previous</button>

          <div className="flex gap-2">
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded">1</span>
            <span>2</span>
            <span>3</span>
            <span>…</span>
            <span>10</span>
          </div>

          <button className="border px-3 py-1.5 rounded">Next →</button>
        </div>
      </div>
    </>
  );
};

export default SalaryFinalization;

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}
