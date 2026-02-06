import React, { useEffect, useState } from 'react';
import { api } from '../../services/commonAPI';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Vehicle {
  id: string;
  type: string;
  brand: string;
  model: string;
  base_price: number;
}

const Vehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: '',
    brand: '',
    model: '',
    base_price: '',
  });

  /* ================= API ================= */

  const createVehicle = (data: Partial<Vehicle>) => api.post('/api/vehicle', data);
  const getVehicles = () => api.get('/api/vehicle');
  const updateVehicle = (id: string, data: Partial<Vehicle>) => api.put(`/api/vehicle/${id}`, data);
  const deleteVehicle = (id: string) => api.delete(`/api/vehicle/${id}`);

  /* ===================================== */

  const loadVehicles = React.useCallback(async () => {
    try {
      const res = await getVehicles();
      setVehicles(res.data);
    } catch (error) {
      console.log('Failed to load vehicles', error);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => loadVehicles());
  }, [loadVehicles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateVehicle(editingId, {
          ...form,
          base_price: Number(form.base_price),
        });
      } else {
        await createVehicle({
          ...form,
          base_price: Number(form.base_price),
        });
      }

      setForm({ type: '', brand: '', model: '', base_price: '' });
      setEditingId(null);
      loadVehicles();
    } catch (error) {
      console.error('Failed to save vehicle:', error);
      alert('Failed to save vehicle. Please check the console for details.');
    }
  };

  const handleEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setForm({
      type: v.type,
      brand: v.brand,
      model: v.model,
      base_price: String(v.base_price),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ type: '', brand: '', model: '', base_price: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return;
    try {
      await deleteVehicle(id);
      loadVehicles();
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      alert('Failed to delete vehicle');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your vehicle fleet and pricing</p>
        </div>
        <div className="text-sm text-gray-600">
          Total Vehicles: <span className="font-semibold text-gray-900">{vehicles.length}</span>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            {editingId ? (
              <>
                <PencilIcon className="w-5 h-5 text-blue-600" />
                Update Vehicle
              </>
            ) : (
              <>
                <PlusIcon className="w-5 h-5 text-blue-600" />
                Add New Vehicle
              </>
            )}
          </h2>
          {editingId && (
            <button
              onClick={handleCancelEdit}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <XMarkIcon className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
            <input
              name="type"
              placeholder="e.g., Sedan, SUV, Truck"
              value={form.type}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            <input
              name="brand"
              placeholder="e.g., Toyota, BMW, Ford"
              value={form.brand}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <input
              name="model"
              placeholder="e.g., Camry, X5, F-150"
              value={form.model}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Base Price (₹)</label>
            <input
              name="base_price"
              type="number"
              placeholder="e.g., 500"
              value={form.base_price}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          {editingId ? (
            <>
              <PencilIcon className="w-5 h-5" />
              Update Vehicle
            </>
          ) : (
            <>
              <PlusIcon className="w-5 h-5" />
              Add Vehicle
            </>
          )}
        </button>
      </div>

      {/* LIST */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Vehicles</h2>

        {vehicles.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No vehicles yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Add your first vehicle using the form above
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
                  <h3 className="text-white font-semibold text-lg">
                    {v.brand} {v.model}
                  </h3>
                  <p className="text-blue-100 text-sm">{v.type}</p>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">Base Price</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ₹{v.base_price.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(v)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Vehicles;
