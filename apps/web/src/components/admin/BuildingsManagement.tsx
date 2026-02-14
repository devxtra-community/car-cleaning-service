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
  location: string;
  latitude: number;
  longitude: number;
  radius: number;
  floors: Floor[];
  created_at?: string;
}

const BuildingsManagement = () => {
  console.log(' BuildingsManagement component rendering');

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    console.log(' BuildingsManagement useEffect triggered');
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    console.log(' Loading buildings...');
    try {
      setError(null);
      const response = await api.get('/api/buildings');
      console.log(' Buildings loaded:', response.data);
      setBuildings(response.data?.data || []);
    } catch (error: unknown) {
      console.error(' Failed to load buildings:', error);
      setError(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to load buildings. Please check the console for details.'
      );
    } finally {
      setLoading(false);
      console.log(' Loading complete');
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this building? This will also delete all associated floors.'
      )
    )
      return;

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
  const avgFloorsPerBuilding =
    buildings.length > 0 ? Math.round(totalFloors / buildings.length) : 0;

  // Pagination
  const totalPages = Math.ceil(buildings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBuildings = buildings.slice(startIndex, endIndex);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Buildings Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage properties and floor assignments</p>
        </div>
        <Link to="/admin/buildings/add">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Building
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Buildings</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{buildings.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Floors</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalFloors}</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Avg Floors/Building</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{avgFloorsPerBuilding}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Buildings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600 mb-3"></div>
            <p className="text-slate-600 text-sm">Loading buildings...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Error Loading Buildings</h3>
            <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">{error}</p>
            <button
              onClick={loadBuildings}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Try Again
            </button>
          </div>
        ) : buildings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No Buildings Yet</h3>
            <p className="text-sm text-slate-600 mb-4">Get started by adding your first building</p>
            <Link to="/admin/buildings/add">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                Add First Building
              </button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Building Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Coordinates
                  </th>

                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Radius (m)
                  </th>

                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Floors
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {currentBuildings.map((building) => (
                  <tr key={building.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                        <span className="font-medium text-slate-900">{building.building_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{building.location || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        Lat: {building.latitude ? Number(building.latitude).toFixed(6) : 'N/A'}
                      </div>
                      <div>
                        Lng: {building.longitude ? Number(building.longitude).toFixed(6) : 'N/A'}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                        {building.radius} m
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                        {building.floors?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/admin/buildings/floors?building=${building.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                          title="Manage Floors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(building.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                          title="Delete Building"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {buildings.length > itemsPerPage && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Previous
          </button>

          <div className="flex gap-1.5">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="flex items-center px-1 text-slate-400">…</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                    currentPage === totalPages
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
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
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default BuildingsManagement;
