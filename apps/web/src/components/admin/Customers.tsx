import React from 'react';

const Customers = () => {
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
            <p className="font-medium">Weekly Overview</p>
            <p className="text-xs text-gray-500 mb-4">Performance of Oct 24–30</p>

            <p className="text-xs text-gray-500">Completed Wash</p>
            <p className="text-lg font-semibold">567</p>

            <button className="mt-4 text-sm text-blue-500 border border-blue-500 px-3 py-1.5 rounded">
              Export Report
            </button>
          </div>

          {/* Static circular progress */}
          <div className="relative w-28 h-28">
            <div className="absolute inset-0 rounded-full border-8 border-blue-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-semibold">98%</span>
            </div>
          </div>
        </div>

        {/* Today Revenue */}
        <div className="col-span-2 bg-blue-500 rounded-xl p-6 text-white flex justify-between items-center">
          <div>
            <p className="text-sm opacity-90 flex items-center gap-2">💳 Today’s Revenue</p>
            <p className="text-2xl font-semibold mt-1">$ 2089.00</p>
            <p className="text-xs opacity-80 mt-1">Calculated based on current jobs</p>
          </div>

          <div className="text-xs bg-white/20 px-3 py-1 rounded">+12.3%</div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border">
        {/* Table Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <p className="font-medium">Customers</p>
          <button className="border px-3 py-1.5 rounded text-sm">Today ▾</button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-3">Name</th>
              <th>Plate No</th>
              <th>Car Type</th>
              <th>Cleaner</th>
              <th>Penalties</th>
              <th>Cash</th>
              <th>Payment Method</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-t">
              <td className="p-3">
                <p className="font-medium">Olivia Rhye</p>
                <p className="text-xs text-gray-400">CC103</p>
              </td>
              <td className="text-center">AA 185</td>
              <td className="text-center">SUV</td>
              <td className="text-center">Ali Muhammed</td>
              <td className="text-center">
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">$50</span>
              </td>
              <td className="text-center">
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">$500</span>
              </td>
              <td className="text-center">Cash</td>
            </tr>

            <tr className="border-t">
              <td className="p-3">
                <p className="font-medium">Phoenix Baker</p>
                <p className="text-xs text-gray-400">CC103</p>
              </td>
              <td className="text-center">AB 544</td>
              <td className="text-center">Super Car</td>
              <td className="text-center">Raj Patel</td>
              <td className="text-center">
                <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">NIL</span>
              </td>
              <td className="text-center">
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">$500</span>
              </td>
              <td className="text-center">Debit Card</td>
            </tr>

            <tr className="border-t">
              <td className="p-3">
                <p className="font-medium">Natalia Craig</p>
                <p className="text-xs text-gray-400">CC103</p>
              </td>
              <td className="text-center">BB 777</td>
              <td className="text-center">Sedan</td>
              <td className="text-center">Suresh</td>
              <td className="text-center">
                <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">NIL</span>
              </td>
              <td className="text-center">
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">$500</span>
              </td>
              <td className="text-center">Credit Card</td>
            </tr>

            <tr className="border-t">
              <td className="p-3">
                <p className="font-medium">Drew Cano</p>
                <p className="text-xs text-gray-400">CC103</p>
              </td>
              <td className="text-center">AA 185</td>
              <td className="text-center">Sedan</td>
              <td className="text-center">Malik</td>
              <td className="text-center">
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">$50</span>
              </td>
              <td className="text-center">
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">$500</span>
              </td>
              <td className="text-center">Cash</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;
