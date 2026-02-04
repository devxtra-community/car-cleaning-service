import React from 'react';
import { Link } from 'react-router-dom';

const Vehicle_Management = () => {
  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Vehicle Management</h1>
        <p className="text-sm text-gray-500">Overview and System Management</p>
      </div>

      {/* Top Stats Banner */}
      <div className="bg-linear-to-r from-blue-500 to-blue-400 rounded-xl p-6 text-white mb-6">
        <div className="grid grid-cols-3 text-center">
          <div>
            <p className="text-sm opacity-90">VEHICLE TYPES</p>
            <p className="text-2xl font-semibold mt-1">6</p>
          </div>
          <div>
            <p className="text-sm opacity-90">AVG BASE RATE</p>
            <p className="text-2xl font-semibold mt-1">$ 34</p>
          </div>
          <div>
            <p className="text-sm opacity-90">AVG PREMIUM RATE</p>
            <p className="text-2xl font-semibold mt-1">$ 64</p>
          </div>
        </div>
      </div>

      {/* Add Button */}
      <Link to="/admin/vechicles/addVehicles">
        <div className="flex justify-end mb-4">
          <button className="bg-blue-500 text-white px-4 py-1.5 rounded text-sm cursor-pointer">
            + Add Vehicle Type
          </button>
        </div>
      </Link>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-3">VEHICLE TYPE</th>
              <th>CATEGORY</th>
              <th>SIZE</th>
              <th>BASE PRICE</th>
              <th>PREMIUM PRICE</th>
              <th>WASH TIME</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-t">
              <td className="p-3 flex items-center gap-3">🚗 Sedan</td>
              <td className="text-center">
                <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs">
                  Standard
                </span>
              </td>
              <td className="text-center">Medium</td>
              <td className="text-center">$25</td>
              <td className="text-center">$45</td>
              <td className="text-center">20 min</td>
              <td className="text-center">
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">
                  Active
                </span>
              </td>
              <td className="text-center">✏️ 🗑️</td>
            </tr>

            <tr className="border-t">
              <td className="p-3 flex items-center gap-3">🚙 SUV</td>
              <td className="text-center">
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">Large</span>
              </td>
              <td className="text-center">Large</td>
              <td className="text-center">$35</td>
              <td className="text-center">$60</td>
              <td className="text-center">30 min</td>
              <td className="text-center">
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">
                  Active
                </span>
              </td>
              <td className="text-center">✏️ 🗑️</td>
            </tr>

            <tr className="border-t">
              <td className="p-3 flex items-center gap-3">🚚 Truck</td>
              <td className="text-center">
                <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs">
                  Commercial
                </span>
              </td>
              <td className="text-center">Extra Large</td>
              <td className="text-center">$40</td>
              <td className="text-center">$70</td>
              <td className="text-center">35 min</td>
              <td className="text-center">
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">
                  Active
                </span>
              </td>
              <td className="text-center">✏️ 🗑️</td>
            </tr>

            <tr className="border-t">
              <td className="p-3 flex items-center gap-3">🚗 Hatchback</td>
              <td className="text-center">
                <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded text-xs">
                  Compact
                </span>
              </td>
              <td className="text-center">Small</td>
              <td className="text-center">$20</td>
              <td className="text-center">$35</td>
              <td className="text-center">15 min</td>
              <td className="text-center">
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">
                  Active
                </span>
              </td>
              <td className="text-center">✏️ 🗑️</td>
            </tr>

            <tr className="border-t">
              <td className="p-3 flex items-center gap-3">🚐 Van</td>
              <td className="text-center">
                <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs">
                  Commercial
                </span>
              </td>
              <td className="text-center">Large</td>
              <td className="text-center">$38</td>
              <td className="text-center">$65</td>
              <td className="text-center">32 min</td>
              <td className="text-center">
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">
                  Active
                </span>
              </td>
              <td className="text-center">✏️ 🗑️</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6 text-sm">
        <button className="border px-3 py-1.5 rounded">← Previous</button>

        <div className="flex gap-2">
          <span>1</span>
          <span>2</span>
          <span className="bg-blue-100 text-blue-600 px-2 rounded">3</span>
          <span>4</span>
          <span>…</span>
          <span>10</span>
        </div>

        <button className="border px-3 py-1.5 rounded">Next →</button>
      </div>
    </div>
  );
};

export default Vehicle_Management;
