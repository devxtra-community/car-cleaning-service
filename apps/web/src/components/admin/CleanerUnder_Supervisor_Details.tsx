import React from 'react';

const CleanerUnder_Supervisor_Details = () => {
  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Supervisor</h1>
        <p className="text-sm text-gray-500">Overview and System Management</p>
      </div>

      {/* Supervisor Banner */}
      <div className="bg-linear-to-r from-blue-500 to-blue-400 rounded-xl p-6 text-white flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Nithish Kumar</h2>
          <p className="text-sm opacity-90">Supervisor</p>
        </div>

        <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden">
          <img
            src="https://via.placeholder.com/150"
            alt="Supervisor"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Cleaners Section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">CLEANERS</h2>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="border rounded-md pl-8 pr-3 py-1.5 text-sm outline-none"
            />
            <span className="absolute left-2 top-2 text-gray-400">🔍</span>
          </div>

          <button className="bg-blue-500 text-white px-4 py-1.5 rounded text-sm">
            + Add Cleaner
          </button>

          <button className="border px-3 py-1.5 rounded text-sm">Today ▾</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-3"></th>
              <th className="text-left p-3">Name</th>
              <th>Employee ID</th>
              <th>Location</th>
              <th>Status</th>
              <th>Action</th>
              <th>Update</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-t">
              <td className="text-center">
                <input type="checkbox" />
              </td>
              <td className="p-3">
                <p className="font-medium">Olivia Rhye</p>
                <p className="text-xs text-gray-400">CC103</p>
              </td>
              <td className="text-center">#90234567</td>
              <td className="text-center">Location</td>
              <td className="text-center text-green-600">Active</td>
              <td className="text-center">
                <button className="bg-green-100 text-green-600 px-3 py-1 rounded text-xs">
                  Enable
                </button>
              </td>
              <td className="text-center">✏️</td>
            </tr>

            <tr className="border-t">
              <td className="text-center">
                <input type="checkbox" />
              </td>
              <td className="p-3">
                <p className="font-medium">Phoenix Baker</p>
                <p className="text-xs text-gray-400">CC103</p>
              </td>
              <td className="text-center">#90234567</td>
              <td className="text-center">Location</td>
              <td className="text-center text-green-600">Active</td>
              <td className="text-center">
                <button className="bg-green-100 text-green-600 px-3 py-1 rounded text-xs">
                  Enable
                </button>
              </td>
              <td className="text-center">✏️</td>
            </tr>

            <tr className="border-t">
              <td className="text-center">
                <input type="checkbox" />
              </td>
              <td className="p-3">
                <p className="font-medium">Natalia Craig</p>
                <p className="text-xs text-gray-400">CC103</p>
              </td>
              <td className="text-center">#90234567</td>
              <td className="text-center">Location</td>
              <td className="text-center text-green-600">Active</td>
              <td className="text-center">
                <button className="bg-red-100 text-red-600 px-3 py-1 rounded text-xs">
                  Disable
                </button>
              </td>
              <td className="text-center">✏️</td>
            </tr>

            <tr className="border-t">
              <td className="text-center">
                <input type="checkbox" />
              </td>
              <td className="p-3">
                <p className="font-medium">Andi Lane</p>
                <p className="text-xs text-gray-400">CC103</p>
              </td>
              <td className="text-center">#90234567</td>
              <td className="text-center">Location</td>
              <td className="text-center text-green-600">Active</td>
              <td className="text-center">
                <button className="bg-green-100 text-green-600 px-3 py-1 rounded text-xs">
                  Enable
                </button>
              </td>
              <td className="text-center">✏️</td>
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

export default CleanerUnder_Supervisor_Details;
