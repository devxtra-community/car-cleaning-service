import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllSupervisors } from '../../services/allapi';

type Supervisor = {
  supervisor_id: string;
  full_name: string;
  email?: string;
  location?: string;
  profile_image: string;
};

const Supervisors = () => {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;

    const allSupervisors = async () => {
      try {
        const data: Supervisor[] = await getAllSupervisors();
        setSupervisors(data);
        console.log(data);
      } catch (err) {
        console.error('Failed to fetch supervisors', err);
      }
    };

    allSupervisors();
  }, [loading, isAuthenticated]);

  return (
    <>
      <div className="p-6 min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Supervisors</h1>
          <p className="text-sm text-gray-500">Overview and system management</p>
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex items-center justify-between">
          <input
            type="text"
            placeholder="Search supervisor..."
            className="border rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />

          <Link to="/admin/register/supervisor">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              + Add Supervisor
            </button>
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="text-left p-4">Supervisor</th>
                <th className="text-left p-4">Email</th>
                <th className="text-center p-4">Status</th>
                <th className="text-center p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {supervisors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No supervisors found
                  </td>
                </tr>
              ) : (
                supervisors.map((sup) => (
                  <tr key={sup.supervisor_id} className="border-t hover:bg-gray-50 transition">
                    {/* Supervisor */}
                    <td className="p-4">
                      <Link
                        to={`/admin/supervisor/${sup.supervisor_id}`}
                        className="flex items-center gap-3"
                      >
                        <img
                          src={sup.profile_image}
                          alt={sup.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-800">{sup.full_name}</p>
                          <p className="text-xs text-gray-400">ID: {sup.supervisor_id}</p>
                        </div>
                      </Link>
                    </td>

                    {/* Email */}
                    <td className="p-4 text-gray-700">{sup.email || '—'}</td>

                    {/* Status */}
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Active
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <Link
                        to={`/admin/supervisor/${sup.supervisor_id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 text-sm">
          <button className="border px-3 py-1.5 rounded-md hover:bg-gray-100">← Previous</button>

          <div className="flex gap-1">
            <button className="px-3 py-1 rounded-md bg-blue-600 text-white">1</button>
            <button className="px-3 py-1 rounded-md hover:bg-gray-100">2</button>
            <button className="px-3 py-1 rounded-md hover:bg-gray-100">3</button>
            <span className="px-3 py-1 text-gray-400">…</span>
            <button className="px-3 py-1 rounded-md hover:bg-gray-100">10</button>
          </div>

          <button className="border px-3 py-1.5 rounded-md hover:bg-gray-100">Next →</button>
        </div>
      </div>
    </>
  );
};

export default Supervisors;
