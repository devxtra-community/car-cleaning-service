import React, { useState, useEffect } from 'react';
import { api } from '../../services/commonAPI';
import {
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface Building {
  id: string;
  building_id: string;
  building_name: string;
  location?: string;
}

const BuildingsManagement = () => {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    building_id: '',
    building_name: '',
    location: '',
  });

  const loadBuildings = React.useCallback(async () => {
    try {
      const res = await api.get('/api/buildings');
      setBuildings(res.data.data);
    } catch (error) {
      console.log('Failed to load buildings', error);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => loadBuildings());
  }, [loadBuildings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/buildings/${editingId}`, form);
      } else {
        await api.post('/api/buildings', form);
      }
      setForm({ building_id: '', building_name: '', location: '' });
      setEditingId(null);
      loadBuildings();
    } catch (error) {
      console.error('Failed to save building:', error);
      alert('Failed to save building');
    }
  };

  const handleEdit = (building: Building) => {
    setEditingId(building.id);
    setForm({
      building_id: building.building_id,
      building_name: building.building_name,
      location: building.location || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this building?')) return;
    try {
      await api.delete(`/api/buildings/${id}`);
      loadBuildings();
    } catch (error) {
      console.error('Failed to delete building:', error);
      alert('Failed to delete building');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ building_id: '', building_name: '', location: '' });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
            Buildings Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage all your buildings and locations</p>
        </div>
        <div className="text-sm text-gray-600">
          Total Buildings: <span className="font-semibold text-gray-900">{buildings.length}</span>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            {editingId ? (
              <>
                <PencilIcon className="w-5 h-5 text-blue-600" />
                Update Building
              </>
            ) : (
              <>
                <PlusIcon className="w-5 h-5 text-blue-600" />
                Add New Building
              </>
            )}
          </h2>
          {editingId && (
            <button
              type="button"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Building ID *</label>
            <input
              name="building_id"
              value={form.building_id}
              onChange={handleChange}
              required
              placeholder="e.g., BLD-001, TOWER-A"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Building Name *</label>
            <input
              name="building_name"
              value={form.building_name}
              onChange={handleChange}
              required
              placeholder="e.g., Main Tower, Block A"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Dubai Marina, Downtown, etc."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          {editingId ? 'Update Building' : 'Add Building'}
        </button>
      </form>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buildings.map((building) => (
          <div
            key={building.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
              <h3 className="text-white font-semibold text-lg">{building.building_name}</h3>
              <p className="text-blue-100 text-sm">ID: {building.building_id}</p>
              {building.location && <p className="text-blue-100 text-sm">{building.location}</p>}
            </div>

            <div className="p-6">
              <div className="space-y-2 mb-4">{/* No additional details to show */}</div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(building)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(building.id)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete
                  </button>
                </div>
                <button
                  onClick={() => navigate(`/admin/floors?buildingId=${building.id}`)}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors border flex items-center justify-center gap-2"
                >
                  <BuildingOfficeIcon className="w-4 h-4" />
                  Manage Floors
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuildingsManagement;
