import React, { useEffect, useState } from 'react';
import { api } from '../../services/commonAPI';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate, useSearchParams } from 'react-router-dom';

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

const AddVehicles = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: '',
    category: '',
    size: '',
    base_price: '',
    premium_price: '',
    wash_time: '',
    status: 'Active',
  });

  const createVehicle = (data: Partial<Vehicle>) => api.post('/api/vehicle', data);
  const getVehicles = () => api.get('/api/vehicle');
  const getVehicleById = (id: string) => api.get(`/api/vehicle/${id}`);
  const updateVehicle = (id: string, data: Partial<Vehicle>) => api.put(`/api/vehicle/${id}`, data);
  const deleteVehicle = (id: string) => api.delete(`/api/vehicle/${id}`);

  const loadVehicles = React.useCallback(async () => {
    try {
      const res = await getVehicles();
      setVehicles(res.data);
    } catch (error) {
      console.log('Failed to load vehicles', error);
    }
  }, []);

  const loadVehicleForEdit = React.useCallback(async (id: string) => {
    try {
      const res = await getVehicleById(id);
      const v = res.data;
      setEditingId(id);
      setForm({
        type: v.type,
        category: v.category,
        size: v.size,
        base_price: String(v.base_price),
        premium_price: String(v.premium_price),
        wash_time: String(v.wash_time),
        status: v.status,
      });
    } catch (error) {
      console.error('Failed to load vehicle for edit:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadVehicles();

      if (editId) {
        await loadVehicleForEdit(editId);
      }
    };

    init();
  }, [editId, loadVehicles, loadVehicleForEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.type ||
      !form.category ||
      !form.size ||
      !form.base_price ||
      !form.premium_price ||
      !form.wash_time
    ) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const vehicleData = {
        type: form.type,
        category: form.category,
        size: form.size,
        base_price: Number(form.base_price),
        premium_price: Number(form.premium_price),
        wash_time: Number(form.wash_time),
        status: form.status,
      };

      if (editingId) {
        await updateVehicle(editingId, vehicleData);
        alert('Vehicle updated successfully!');
      } else {
        await createVehicle(vehicleData);
        alert('Vehicle added successfully!');
      }

      setForm({
        type: '',
        category: '',
        size: '',
        base_price: '',
        premium_price: '',
        wash_time: '',
        status: 'Active',
      });
      setEditingId(null);
      loadVehicles();

      navigate('/admin/vechicles');
    } catch (error: unknown) {
      console.error('Failed to save vehicle:', error);
      alert(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to save vehicle. Please check the console for details.'
      );
    }
  };

  const handleEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setForm({
      type: v.type,
      category: v.category,
      size: v.size,
      base_price: String(v.base_price),
      premium_price: String(v.premium_price),
      wash_time: String(v.wash_time),
      status: v.status,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      type: '',
      category: '',
      size: '',
      base_price: '',
      premium_price: '',
      wash_time: '',
      status: 'Active',
    });
    navigate('/admin/vechicles/addVehicles');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your vehicle fleet and pricing</p>
        </div>
        <div className="text-sm text-gray-600">
          Total Vehicles: <span className="font-semibold text-gray-900">{vehicles.length}</span>
        </div>
      </div>
      <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-8">
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

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type *</label>
              <input
                name="type"
                placeholder="e.g., Sedan, SUV, Truck"
                value={form.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Select Category</option>
                <option value="Standard">Standard</option>
                <option value="Large">Large</option>
                <option value="Commercial">Commercial</option>
                <option value="Compact">Compact</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Size *</label>
              <select
                name="size"
                value={form.size}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Select Size</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
                <option value="Extra Large">Extra Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Price ($) *
              </label>
              <input
                name="base_price"
                type="number"
                placeholder="e.g., 25"
                value={form.base_price}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Premium Price ($) *
              </label>
              <input
                name="premium_price"
                type="number"
                placeholder="e.g., 45"
                value={form.premium_price}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wash Time (minutes) *
              </label>
              <input
                name="wash_time"
                type="number"
                placeholder="e.g., 20"
                value={form.wash_time}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
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
        </form>
      </div>

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
                  <h3 className="text-white font-semibold text-lg">{v.type}</h3>
                  <p className="text-blue-100 text-sm">
                    {v.category} - {v.size}
                  </p>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Base Price</p>
                      <p className="text-xl font-bold text-gray-900">${v.base_price}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Premium</p>
                      <p className="text-xl font-bold text-gray-900">${v.premium_price}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Wash Time</p>
                    <p className="text-lg font-semibold text-gray-700">{v.wash_time} minutes</p>
                  </div>

                  <div className="mb-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        v.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {v.status}
                    </span>
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

export default AddVehicles;
