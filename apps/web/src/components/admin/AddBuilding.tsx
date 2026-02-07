import React, { useState } from "react";
import { createBuilding } from "../../services/allAPI";
import { useNavigate } from "react-router-dom";

interface Floor {
  id: string;
  floor_number: number;
  floor_name: string;
  notes: string;
}

const AddBuilding = () => {
  const [formData, setFormData] = useState({
    building_id: "",
    building_name: "",
    location: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const navigate = useNavigate()

  const [floors, setFloors] = useState<Floor[]>([
    { id: Date.now().toString(), floor_number: 1, floor_name: "Ground Floor", notes: "" }
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFloorChange = (id: string, field: string, value: string) => {
    setFloors((prev) =>
      prev.map((floor) =>
        floor.id === id ? { ...floor, [field]: value } : floor
      )
    );
  };

  const addFloor = () => {
    const newFloorNumber = floors.length + 1;
    setFloors((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        floor_number: newFloorNumber,
        floor_name: `Floor ${newFloorNumber}`,
        notes: "",
      },
    ]);
  };

  const removeFloor = (id: string) => {
    if (floors.length === 1) {
      alert("At least one floor is required");
      return;
    }
    setFloors((prev) => prev.filter((floor) => floor.id !== id));
  };
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMessage(null);

  try {
    const payload = {
      building_name: formData.building_name,
      location: formData.location,
      floors: floors.map((floor, index) => ({
        floor_number: index + 1,
        floor_name: floor.floor_name,
        notes: floor.notes,
      })),
    };

    await createBuilding(payload);

    alert("Building added successfully");

    setFormData({
      building_id: "",
      building_name: "",
      location: "",
    });


    setFloors([
      {
        id: Date.now().toString(),
        floor_number: 1,
        floor_name: "Ground Floor",
        notes: "",
      },
      
    ]);
    navigate('/admin/buildings')
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Something went wrong while creating building";
    setErrorMessage(msg);
  }
};


  return (
    <div className="p-6 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Building Management</h1>
        <p className="text-sm text-gray-500">
          Create buildings and configure floors
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Building Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            Building Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Building Name *
              </label>
              <input
                type="text"
                name="building_name"
                value={formData.building_name}
                onChange={handleChange}
                placeholder="Skyline Apartments"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <textarea
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Street, City, State"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                rows={3}
                required
              />
            </div>
          </div>
        </div>

        {/* Floors Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Floor Configuration</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add and configure floors for this building
              </p>
            </div>
            <button
              type="button"
              onClick={addFloor}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
            >
              <span className="text-lg font-bold">+</span>
              Add Floor
            </button>
          </div>

          <div className="space-y-4">
            {floors.map((floor, index) => (
              <div
                key={floor.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-700">
                      Floor {index + 1}
                    </span>
                  </div>
                  {floors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFloor(floor.id)}
                      className="text-red-500 hover:text-red-700 transition text-xl font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Floor Name *
                    </label>
                    <input
                      type="text"
                      value={floor.floor_name}
                      onChange={(e) =>
                        handleFloorChange(floor.id, "floor_name", e.target.value)
                      }
                      placeholder="e.g., Ground Floor, Parking Level"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={floor.notes}
                      onChange={(e) =>
                        handleFloorChange(floor.id, "notes", e.target.value)
                      }
                      placeholder="Special notes about this floor"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Total Floors:</span> {floors.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Workers will be assigned to these floors when you add them
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-8 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition"
          >
            Create Building
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBuilding;