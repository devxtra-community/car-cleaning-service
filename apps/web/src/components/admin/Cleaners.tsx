import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/commonAPI';

interface Cleaner {
  cleaner_id: string;
  user_id: string;
  full_name: string;
  email: string;
  document_id: string;
  age: number;
  nationality: string;
  floor_id?: string;
  total_tasks: number;
  total_earning: number;
  building_name?: string;
  supervisor_name?: string;
}

const Cleaners = () => {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCleaners = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/auth/cleaners');
        if (response.data.success) {
          setCleaners(response.data.data);
        }
      } catch (err: unknown) {
        console.error('Failed to fetch cleaners:', err);
        setError('Failed to load cleaners');
      } finally {
        setLoading(false);
      }
    };

    fetchCleaners();
  }, []);

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

            <Link to="/admin/register/cleaner">
              <button className="bg-blue-500 text-white px-4 py-1.5 rounded text-sm">
                + Add Cleaner
              </button>
            </Link>

            <button className="border px-3 py-1.5 rounded text-sm">Today ▾</button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3"></th>
                  <th className="text-left p-3">Name</th>
                  <th>Email</th>
                  <th>Supervisor</th>
                  <th>Building / Floor</th>
                  <th>Tasks</th>
                  <th>Earning</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-gray-400">
                      Loading cleaners...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-red-400">
                      {error}
                    </td>
                  </tr>
                ) : cleaners.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-gray-400">
                      No cleaners found.
                    </td>
                  </tr>
                ) : (
                  cleaners.map((cleaner) => (
                    <tr key={cleaner.cleaner_id} className="border-t">
                      <td className="text-center">
                        <input type="checkbox" />
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{cleaner.full_name}</p>
                        <p className="text-xs text-gray-400">ID: {cleaner.document_id}</p>
                      </td>
                      <td className="text-center">{cleaner.email}</td>
                      <td className="text-center">{cleaner.supervisor_name || 'N/A'}</td>
                      <td className="text-center">{cleaner.building_name || 'N/A'} </td>
                      <td className="text-center">{cleaner.total_tasks}</td>
                      <td className="text-center text-green-600">₹{cleaner.total_earning}</td>
                      <td className="text-center">
                        <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 text-sm">
          <button className="border px-3 py-1.5 rounded">← Previous</button>

          <div className="flex gap-2">
            <span className="bg-blue-100 text-blue-600 px-2 rounded">1</span>
          </div>

          <button className="border px-3 py-1.5 rounded">Next →</button>
        </div>
      </div>
    </>
  );
};

export default Cleaners;
