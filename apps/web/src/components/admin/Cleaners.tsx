import React from 'react';
import { Link } from 'react-router-dom';

const Cleaners = () => {
  return (
    <>
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Cleaner Report</h1>
          <p className="text-sm text-gray-500">Overview and System Management</p>
        </div>

        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
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

            <Link to="/admin/AddMemebers">
              <button className="bg-blue-500 text-white px-4 py-1.5 rounded text-sm">
                + Add Cleaner
              </button>
            </Link>

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
                <th>Penalty</th>
                <th>Status</th>
                <th>Action</th>
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
                <td className="text-center text-red-500">$60.00</td>
                <td className="text-center text-green-600">Active</td>
                <td className="text-center">
                  <button className="bg-green-100 text-green-600 px-3 py-1 rounded text-xs">
                    Enable
                  </button>
                </td>
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
                <td className="text-center text-red-500">$60.00</td>
                <td className="text-center text-green-600">Active</td>
                <td className="text-center">
                  <button className="bg-green-100 text-green-600 px-3 py-1 rounded text-xs">
                    Enable
                  </button>
                </td>
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
                <td className="text-center text-red-500">$60.00</td>
                <td className="text-center text-green-600">Active</td>
                <td className="text-center">
                  <button className="bg-red-100 text-red-600 px-3 py-1 rounded text-xs">
                    Disable
                  </button>
                </td>
              </tr>

              <tr className="border-t">
                <td className="text-center">
                  <input type="checkbox" />
                </td>
                <td className="p-3">
                  <p className="font-medium">Drew Cano</p>
                  <p className="text-xs text-gray-400">CC103</p>
                </td>
                <td className="text-center">#90234567</td>
                <td className="text-center">Location</td>
                <td className="text-center text-red-500">$60.00</td>
                <td className="text-center text-green-600">Active</td>
                <td className="text-center">
                  <button className="bg-green-100 text-green-600 px-3 py-1 rounded text-xs">
                    Enable
                  </button>
                </td>
              </tr>
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
                <td className="text-center text-red-500">$60.00</td>
                <td className="text-center text-green-600">Active</td>
                <td className="text-center">
                  <button className="bg-green-100 text-green-600 px-3 py-1 rounded text-xs">
                    Enable
                  </button>
                </td>
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
                <td className="text-center text-red-500">$60.00</td>
                <td className="text-center text-green-600">Active</td>
                <td className="text-center">
                  <button className="bg-green-100 text-green-600 px-3 py-1 rounded text-xs">
                    Enable
                  </button>
                </td>
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
                <td className="text-center text-red-500">$60.00</td>
                <td className="text-center text-green-600">Active</td>
                <td className="text-center">
                  <button className="bg-red-100 text-red-600 px-3 py-1 rounded text-xs">
                    Disable
                  </button>
                </td>
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
    </>
  );
};

export default Cleaners;
