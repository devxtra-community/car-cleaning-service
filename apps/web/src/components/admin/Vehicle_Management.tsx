import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/commonAPI';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';

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
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await api.delete(`/api/vehicle/${deleteTarget}`);
      await loadVehicles();
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
    } finally {
      setDeleting(false);
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
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pop     { from { opacity:0; transform:scale(0.94) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
      `}</style>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Vehicle Type?"
        message="Are you sure you want to delete this vehicle type? This action cannot be undone."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Admin / Assets
            </p>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Vehicle Management</h1>
          </div>
          <Link
            to="/admin/vechicles/addVehicles"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Vehicle Type
          </Link>
        </div>
      </div>

      <div className="mx-auto px-6 py-8 space-y-6">
        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"
          style={{ animation: 'fadeUp 0.3s ease both', animationDelay: '40ms' }}
        >
          {[
            {
              label: 'Total Vehicle Types',
              value: vehicles.length,
              sub: 'types registered',
              icon: (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.806H8.044a2.056 2.056 0 00-1.58.806 17.901 17.901 0 00-3.213 9.193c-.039.62.469 1.124 1.09 1.124h1.125m12.75 0h-1.125m-1.125 0H8.25m1.125-11.25V3.75m0 0h1.125a1.125 1.125 0 011.125 1.125V6.75m-2.25-3h-1.125a1.125 1.125 0 00-1.125 1.125v3M3.375 19.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5a1.125 1.125 0 00-1.125-1.125H3.375a1.125 1.125 0 00-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              ),
              iconBg: 'bg-blue-50',
              numColor: 'text-slate-900',
            },
            {
              label: 'Avg Base Rate',
              value: `${avgBasePrice} AED`,
              sub: 'standard price',
              icon: (
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              iconBg: 'bg-emerald-50',
              numColor: 'text-slate-900',
            },
            {
              label: 'Avg Premium Rate',
              value: `${avgPremiumPrice} AED`,
              sub: 'specialist services',
              icon: (
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                </svg>
              ),
              iconBg: 'bg-amber-50',
              numColor: 'text-amber-600',
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className={`w-9 h-9 ${stat.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                {stat.icon}
              </div>
              <p className={`text-2xl font-extrabold ${stat.numColor} tracking-tight`}>{stat.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">{stat.label}</p>
              <p className="text-xs text-slate-300 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Content Section ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Loading vehicles…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-sm text-slate-600 font-medium">{error}</p>
            <button
              onClick={loadVehicles}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Retry
            </button>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <svg className="w-14 h-14 text-slate-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0M12 18h6.75a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5h6" />
            </svg>
            <p className="text-sm text-slate-400 font-medium">No vehicles found yet</p>
            <Link
              to="/admin/vechicles/addVehicles"
              className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Add First Vehicle
            </Link>
          </div>
        ) : (
          <div
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
            style={{ animation: 'fadeUp 0.3s ease both', animationDelay: '120ms' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-600">Vehicle Type</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-center">Category</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-center">Size</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-center">Base Price</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-center">Premium Price</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-center">Wash Time</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-center">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 uppercase font-bold text-blue-600 text-xs">
                            {vehicle.type.substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{vehicle.type}</div>
                            <div className="text-[11px] font-medium text-slate-400 mt-0.5 uppercase tracking-wide">
                              ID: {vehicle.id.split('-')[0]}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(vehicle.category)}`}>
                          {vehicle.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-lg border border-slate-200">
                          {vehicle.size}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-900">
                        {vehicle.base_price} AED
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-900">
                        {vehicle.premium_price} AED
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 font-medium">
                        {vehicle.wash_time} min
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${vehicle.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                          }`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/admin/vechicles/addVehicles?edit=${vehicle.id}`}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(vehicle.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                            title="Delete vehicle"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 flex-wrap gap-3">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium
              text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← Previous
            </button>

            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all
                  ${currentPage === n
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
                    }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium
              text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vehicle_Management;
