import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCleanersBySupervisor } from '../../services/allAPI';
import { useAuth } from '../../context/AuthContext';

type Cleaner = {
  cleaner_id: string;
  user_id: string;
  full_name: string;
  email: string;
  document_id: string;
  age: number;
  nationality: string;
  document: string;
  floor_id: string | null;
  total_tasks: number;
  total_earning: number;
  building_name: string;
  building_id: string;
  supervisor_id: string;
  supervisor_name: string;
};

const CleanerUnder_Supervisor_Details = () => {
  const { supervisorId } = useParams<{ supervisorId: string }>();
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const supervisorName = cleaners.length > 0 ? cleaners[0].supervisor_name : 'Supervisor';

  useEffect(() => {
    if (!isAuthenticated || !supervisorId) return;

    const fetchCleaners = async () => {
      try {
        setLoading(true);
        const data = await getCleanersBySupervisor(supervisorId);
        setCleaners(data);
        console.log('Fetched cleaners:', data);
      } catch (err) {
        console.error('Failed to fetch cleaners', err);
        setError('Failed to load cleaners');
      } finally {
        setLoading(false);
      }
    };

    fetchCleaners();
  }, [supervisorId, isAuthenticated]);

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Supervisor</h1>
        <p className="text-sm text-gray-500">Overview and System Management</p>
      </div>

      {/* Supervisor Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl p-6 text-white flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">{supervisorName}</h2>
          <p className="text-sm opacity-90">Supervisor</p>
        </div>

        <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-white flex items-center justify-center">
          <span className="text-4xl text-blue-500">{supervisorName.charAt(0)}</span>
        </div>
      </div>

      {/* Cleaners Section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          CLEANERS {cleaners.length > 0 && `(${cleaners.length})`}
        </h2>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="border rounded-md pl-8 pr-3 py-1.5 text-sm outline-none"
            />
            <span className="absolute left-2 top-2 text-gray-400">🔍</span>
          </div>
        </div>
      </div>

      {/* Table */}
      {cleaners.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <p className="text-gray-500">No cleaners assigned to this supervisor yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-center p-3">Document ID</th>
                <th className="text-center p-3">Age</th>
                <th className="text-center p-3">Nationality</th>
                <th className="text-center p-3">Building</th>
                <th className="text-center p-3">Total Tasks</th>
                <th className="text-center p-3">Total Earning</th>
              </tr>
            </thead>

            <tbody>
              {cleaners.map((cleaner) => (
                <tr key={cleaner.cleaner_id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <p className="font-medium">{cleaner.full_name}</p>
                    <p className="text-xs text-gray-400">{cleaner.email}</p>
                  </td>
                  <td className="text-center">{cleaner.document_id}</td>
                  <td className="text-center">{cleaner.age}</td>
                  <td className="text-center">{cleaner.nationality}</td>
                  <td className="text-center">{cleaner.building_name || 'N/A'}</td>
                  <td className="text-center">{cleaner.total_tasks || 0}</td>
                  <td className="text-center">
                    ${cleaner.total_earning ? cleaner.total_earning.toFixed(2) : '0.00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CleanerUnder_Supervisor_Details;
