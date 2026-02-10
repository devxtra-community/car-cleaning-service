import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCleanersBySupervisor } from '../../services/allAPI';
import { useAuth } from '../../context/AuthContext';

/* =========================
   Types
   ========================= */
interface Supervisor {
  id: string;
  full_name: string;
  building_name?: string;
  email?: string;
}

interface Cleaner {
  cleaner_id: string;
  full_name: string;
  email: string;
  phone?: string;
  age?: number;
  nationality?: string;
  document_id?: string;
  total_tasks: number;
  total_earning: number;
  building_name?: string;
}

/* =========================
   Component
   ========================= */
const SupervisorDetails = () => {
  const { supervisorId } = useParams<{ supervisorId: string }>();
  const { isAuthenticated } = useAuth();

  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !supervisorId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await getCleanersBySupervisor(supervisorId);
        console.log('RAW API', res);

        if (!Array.isArray(res) || res.length === 0) {
          throw new Error('No cleaners found');
        }

        // 🔹 Extract supervisor from first cleaner
        const supervisorData: Supervisor = {
          id: res[0].supervisor_id,
          full_name: res[0].supervisor_name,
          building_name: res[0].building_name,
        };

        // 🔹 Cleaners array
        const cleanersData: Cleaner[] = res.map((item) => ({
          cleaner_id: item.cleaner_id,
          full_name: item.full_name,
          email: item.email,
          phone: item.phone,
          age: item.age,
          nationality: item.nationality,
          document_id: item.document_id,
          total_tasks: item.total_tasks,
          total_earning: Number(item.total_earning),
          building_name: item.building_name,
        }));

        setSupervisor(supervisorData);
        setCleaners(cleanersData);
      } catch (err) {
        console.error(err);
        setError('Failed to load supervisor details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supervisorId, isAuthenticated]);

  if (loading) {
    return <div className="p-6">Loading supervisor details...</div>;
  }

  if (error || !supervisor) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Supervisor */}
      <div className="bg-white p-6 rounded-xl border mb-6 flex justify-between">
        <div>
          <h2 className="text-xl font-semibold">{supervisor.full_name}</h2>
          <p className="text-sm text-gray-500">Building: {supervisor.building_name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Cleaners</p>
          <p className="text-2xl font-bold">{cleaners.length}</p>
        </div>
      </div>

      {/* Cleaners */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-center">Age</th>
              <th className="p-3 text-center">Nationality</th>
              <th className="p-3 text-center">Tasks</th>
              <th className="p-3 text-center">Earnings</th>
            </tr>
          </thead>

          <tbody>
            {cleaners.map((c) => (
              <tr key={c.cleaner_id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <p className="font-medium">{c.full_name}</p>
                  <p className="text-xs text-gray-400">{c.email}</p>
                </td>
                <td className="text-center">{c.age ?? '-'}</td>
                <td className="text-center">{c.nationality ?? '-'}</td>
                <td className="text-center">{c.total_tasks}</td>
                <td className="text-center font-semibold">₹{Number(c.total_earning).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupervisorDetails;
