import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/commonAPI';

interface Vehicle {
  id: string;
  type: string;
  category: string;
  size: string;
  base_price: number;
  premium_price: number;
  wash_time: number;
  status: string;
}

const Vehicle_Management = () => {
  console.log(' Vehicle_Management component rendering');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    console.log(' Vehicle_Management useEffect triggered');
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    console.log('Loading vehicles...');
    try {
      setError(null);
      const response = await api.get('/api/vehicle');
      console.log(' Vehicles loaded:', response.data);
      setVehicles(response.data || []);
    } catch (error: unknown) {
      console.error(' Failed to load vehicles:', error);
      setError(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to load vehicles. Please check the console for details.'
      );
    } finally {
      setLoading(false);
      console.log(' Loading complete');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      await api.delete(`/api/vehicle/${id}`);
      loadVehicles();
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      alert('Failed to delete vehicle');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      standard: 'bg-blue-100 text-blue-600',
      large: 'bg-green-100 text-green-600',
      commercial: 'bg-orange-100 text-orange-600',
      compact: 'bg-purple-100 text-purple-600',
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  // Calculate stats
  const avgBasePrice =
    vehicles.length > 0
      ? Math.round(vehicles.reduce((sum, v) => sum + v.base_price, 0) / vehicles.length)
      : 0;
  const avgPremiumPrice =
    vehicles.length > 0
      ? Math.round(vehicles.reduce((sum, v) => sum + v.premium_price, 0) / vehicles.length)
      : 0;

  // Pagination
  const totalPages = Math.ceil(vehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVehicles = vehicles.slice(startIndex, endIndex);

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
            <p className="text-2xl font-semibold mt-1">{vehicles.length}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">AVG BASE RATE</p>
            <p className="text-2xl font-semibold mt-1">$ {avgBasePrice}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">AVG PREMIUM RATE</p>
            <p className="text-2xl font-semibold mt-1">$ {avgPremiumPrice}</p>
          </div>
        </div>
      </div>

      {/* Add Button */}
      <Link to="/admin/vechicles/addVehicles">
        <div className="flex justify-end mb-4">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded text-sm cursor-pointer transition">
            + Add Vehicle Type
          </button>
        </div>
      </Link>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading vehicles...</div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="text-red-500 font-semibold mb-2">Error Loading Vehicles</div>
            <div className="text-gray-600 text-sm mb-4">{error}</div>
            <button
              onClick={loadVehicles}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
            >
              Retry
            </button>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No vehicles found. Add your first vehicle type.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left p-3">VEHICLE TYPE</th>
                <th className="text-center">CATEGORY</th>
                <th className="text-center">SIZE</th>
                <th className="text-center">BASE PRICE</th>
                <th className="text-center">PREMIUM PRICE</th>
                <th className="text-center">WASH TIME</th>
                <th className="text-center">STATUS</th>
                <th className="text-center">ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {currentVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 flex items-center gap-3">{vehicle.type}</td>
                  <td className="text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs ${getCategoryColor(vehicle.category)}`}
                    >
                      {vehicle.category}
                    </span>
                  </td>
                  <td className="text-center">{vehicle.size}</td>
                  <td className="text-center">${vehicle.base_price}</td>
                  <td className="text-center">${vehicle.premium_price}</td>
                  <td className="text-center">{vehicle.wash_time} min</td>
                  <td className="text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        vehicle.status === 'Active'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <Link
                      to={`/admin/vechicles/addVehicles?edit=${vehicle.id}`}
                      className="inline-block mr-2 text-lg cursor-pointer hover:scale-110 transition"
                      title="Edit"
                    >
                      ✏️
                    </Link>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
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
      {vehicles.length > itemsPerPage && (
        <div className="flex justify-between items-center mt-6 text-sm">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                      ? 'bg-blue-100 text-blue-600 font-semibold'
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
                      ? 'bg-blue-100 text-blue-600 font-semibold'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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

export default Vehicle_Management;
