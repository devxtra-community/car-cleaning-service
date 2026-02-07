import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/commonAPI';

interface Floor {
  id: string;
  floor_number: number;
  floor_name: string;
}

interface Building {
  id: string;
  building_name: string;
  location?: string;
  floors: Floor[];
  created_at?: string;
}

const BuildingsManagement = () => {
  console.log('🏢 BuildingsManagement component rendering');
  
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    console.log('🏢 BuildingsManagement useEffect triggered');
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    console.log('🏢 Loading buildings...');
    try {
      setError(null);
      const response = await api.get('/api/buildings');
      console.log('🏢 Buildings loaded:', response.data);
      setBuildings(response.data?.data || []);
    } catch (error: unknown) {
      console.error('❌ Failed to load buildings:', error);
      setError((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load buildings. Please check the console for details.');
    } finally {
      setLoading(false);
      console.log('🏢 Loading complete');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this building? This will also delete all associated floors.')) return;
    
    try {
      await api.delete(`/api/buildings/${id}`);
      loadBuildings();
    } catch (error) {
      console.error('Failed to delete building:', error);
      alert('Failed to delete building');
    }
  };

  // Calculate stats
  const totalFloors = buildings.reduce((sum, b) => sum + (b.floors?.length || 0), 0);
  const avgFloorsPerBuilding = buildings.length > 0 
    ? Math.round(totalFloors / buildings.length) 
    : 0;

  // Pagination
  const totalPages = Math.ceil(buildings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBuildings = buildings.slice(startIndex, endIndex);

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Buildings Management</h1>
        <p className="text-sm text-gray-500">Overview and System Management</p>
      </div>

      {/* Top Stats Banner */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-400 rounded-xl p-6 text-white mb-6">
        <div className="grid grid-cols-3 text-center">
          <div>
            <p className="text-sm opacity-90">TOTAL BUILDINGS</p>
            <p className="text-2xl font-semibold mt-1">{buildings.length}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">TOTAL FLOORS</p>
            <p className="text-2xl font-semibold mt-1">{totalFloors}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">AVG FLOORS/BUILDING</p>
            <p className="text-2xl font-semibold mt-1">{avgFloorsPerBuilding}</p>
          </div>
        </div>
      </div>

      {/* Add Button */}
      <Link to="/admin/buildings/add">
        <div className="flex justify-end mb-4">
          <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-1.5 rounded text-sm cursor-pointer transition">
            + Add Building
          </button>
        </div>
      </Link>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading buildings...</div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="text-red-500 font-semibold mb-2">Error Loading Buildings</div>
            <div className="text-gray-600 text-sm mb-4">{error}</div>
            <button 
              onClick={loadBuildings}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm"
            >
              Retry
            </button>
          </div>
        ) : buildings.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No buildings found. Add your first building.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left p-3">BUILDING NAME</th>
                <th className="text-left">LOCATION</th>
                <th className="text-center">FLOORS</th>
                <th className="text-center">ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {currentBuildings.map((building) => (
                <tr key={building.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 flex items-center gap-3">
                    🏢 {building.building_name}
                  </td>
                  <td className="text-left">{building.location || 'N/A'}</td>
                  <td className="text-center">
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-600">
                      {building.floors?.length || 0} floors
                    </span>
                  </td>
                  <td className="text-center">
                    <Link 
                      to={`/admin/buildings/floors?building=${building.id}`}
                      className="inline-block mr-2 text-lg cursor-pointer hover:scale-110 transition"
                      title="Manage Floors"
                    >
                      📋
                    </Link>
                    <button
                      onClick={() => handleDelete(building.id)}
                      className="text-lg cursor-pointer hover:scale-110 transition"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {buildings.length > itemsPerPage && (
        <div className="flex justify-between items-center mt-6 text-sm">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="border px-3 py-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ← Previous
          </button>

          <div className="flex gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 rounded cursor-pointer ${
                    currentPage === pageNum 
                      ? 'bg-purple-100 text-purple-600 font-semibold' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span>…</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`px-2 rounded cursor-pointer ${
                    currentPage === totalPages 
                      ? 'bg-purple-100 text-purple-600 font-semibold' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="border px-3 py-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default BuildingsManagement;
