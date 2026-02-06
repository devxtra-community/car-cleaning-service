import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/commonAPI';

interface Building {
  id: string;
  building_id: string;
  building_name: string;
}

interface Floor {
  id: string;
  building_id: string;
  floor_name: string;
}

const FloorsManagement = () => {
  const [searchParams] = useSearchParams();
  const initialBuildingId = searchParams.get('buildingId') || '';

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(initialBuildingId);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [newFloorName, setNewFloorName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [floorsLoading, setFloorsLoading] = useState<boolean>(false);

  const fetchBuildings = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/buildings');
      setBuildings(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch buildings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFloors = React.useCallback(async (buildingId: string) => {
    try {
      setFloorsLoading(true);
      const response = await api.get(`/api/floors/${buildingId}`);
      if (response.data.success) {
        setFloors(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch floors:', error);
    } finally {
      setFloorsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  // Update selectedBuildingId if URL param changes
  useEffect(() => {
    const urlId = searchParams.get('buildingId');
    if (urlId) {
      Promise.resolve().then(() => setSelectedBuildingId(urlId));
    }
  }, [searchParams, setSelectedBuildingId]);

  useEffect(() => {
    if (selectedBuildingId) {
      Promise.resolve().then(() => fetchFloors(selectedBuildingId));
    } else {
      setFloors([]);
    }
  }, [selectedBuildingId, fetchFloors]);

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuildingId || !newFloorName.trim()) return;

    try {
      const response = await api.post('/api/floors', {
        building_id: selectedBuildingId,
        floor_name: newFloorName.trim(),
      });
      if (response.data.success) {
        setNewFloorName('');
        fetchFloors(selectedBuildingId);
      }
    } catch (error) {
      console.error('Failed to add floor:', error);
      alert('Failed to add floor');
    }
  };

  const handleDeleteFloor = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this floor?')) return;

    try {
      await api.delete(`/api/floors/${id}`);
      fetchFloors(selectedBuildingId);
    } catch (error) {
      console.error('Failed to delete floor:', error);
      alert('Failed to delete floor');
    }
  };

  return (
    <div className="mt-10 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Floor Management</h1>
        <p className="text-sm text-gray-500">Manage floors for each building</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Building</label>
          <select
            value={selectedBuildingId}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">-- Select a Building --</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.building_name} ({building.building_id})
              </option>
            ))}
          </select>
        </div>

        {selectedBuildingId && (
          <>
            <form onSubmit={handleAddFloor} className="flex gap-3 mb-8">
              <input
                type="text"
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                placeholder="Floor Name (e.g. 1st Floor, Ground Floor)"
                className="flex-1 border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Add Floor
              </button>
            </form>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Floor Name</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {floorsLoading ? (
                    <tr>
                      <td colSpan={2} className="p-8 text-center text-gray-400">
                        Loading floors...
                      </td>
                    </tr>
                  ) : floors.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-8 text-center text-gray-400">
                        No floors added yet.
                      </td>
                    </tr>
                  ) : (
                    floors.map((floor) => (
                      <tr key={floor.id} className="hover:bg-gray-50">
                        <td className="p-4">{floor.floor_name}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteFloor(floor.id)}
                            className="text-red-500 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FloorsManagement;
