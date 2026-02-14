import React, { useState } from 'react';
import { createBuilding } from '../../services/allAPI';
import { useNavigate } from 'react-router-dom';

interface Floor {
  id: string;
  floor_name: string;
  notes: string;
}

const AddBuilding = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    building_name: '',
    location: '',
    latitude: '',
    longitude: '',
    radius: '100',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [floors, setFloors] = useState<Floor[]>(() => [
    {
      id: crypto.randomUUID(),
      floor_name: 'Ground Floor',
      notes: '',
    },
  ]);

  /* ================= HANDLE CHANGE ================= */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFloorChange = (id: string, field: string, value: string) => {
    setFloors((prev) =>
      prev.map((floor) => (floor.id === id ? { ...floor, [field]: value } : floor))
    );
  };

  const addFloor = () => {
    setFloors((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        floor_name: `Floor ${prev.length + 1}`,
        notes: '',
      },
    ]);
  };

  const removeFloor = (id: string) => {
    if (floors.length === 1) {
      alert('At least one floor is required');
      return;
    }
    setFloors((prev) => prev.filter((floor) => floor.id !== id));
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const payload = {
        building_name: formData.building_name,
        location: formData.location,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseInt(formData.radius),
        floors: floors.map((floor, index) => ({
          floor_number: index + 1,
          floor_name: floor.floor_name,
          notes: floor.notes,
        })),
      };

      await createBuilding(payload);

      alert('Building created successfully');
      navigate('/admin/buildings');
    } catch (err: unknown) {
      let msg = 'Failed to create building';

      if (err instanceof Error) {
        msg = err.message;
      }

      setErrorMessage(msg);
    }
  };

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">Add Building (Geo Enabled)</h1>

      {errorMessage && (
        <div className="bg-red-100 text-red-600 p-3 mb-4 rounded">{errorMessage}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* BUILDING INFO */}
        <div className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Building Information</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              name="building_name"
              placeholder="Building Name"
              value={formData.building_name}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              name="location"
              placeholder="Building Address"
              value={formData.location}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />

            <input
              type="number"
              step="any"
              name="latitude"
              placeholder="Latitude (e.g. 10.8505)"
              value={formData.latitude}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />

            <input
              type="number"
              step="any"
              name="longitude"
              placeholder="Longitude (e.g. 76.2711)"
              value={formData.longitude}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />

            <input
              type="number"
              name="radius"
              placeholder="Allowed Radius (meters)"
              value={formData.radius}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
          </div>
        </div>

        {/* FLOORS */}
        <div className="bg-white p-6 rounded shadow mb-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Floor Configuration</h2>
            <button
              type="button"
              onClick={addFloor}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              + Add Floor
            </button>
          </div>

          {floors.map((floor, index) => (
            <div key={floor.id} className="border p-4 rounded mb-3 bg-gray-50">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Floor {index + 1}</span>
                {floors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFloor(floor.id)}
                    className="text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Floor Name"
                value={floor.floor_name}
                onChange={(e) => handleFloorChange(floor.id, 'floor_name', e.target.value)}
                className="border p-2 rounded w-full mb-2"
                required
              />

              <input
                type="text"
                placeholder="Notes (Optional)"
                value={floor.notes}
                onChange={(e) => handleFloorChange(floor.id, 'notes', e.target.value)}
                className="border p-2 rounded w-full"
              />
            </div>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/buildings')}
            className="border px-4 py-2 rounded"
          >
            Cancel
          </button>

          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded">
            Create Building
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBuilding;
