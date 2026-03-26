import React, { useState, useEffect, useCallback } from 'react';
import { getBuildingById, updateBuilding } from '../../services/allAPI';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useAlert } from '../../context/AlertContext';

const EditBuilding = () => {
  const navigate = useNavigate();
  const { buildingId } = useParams<{ buildingId: string }>();
  const { showAlert } = useAlert();

  const [formData, setFormData] = useState({
    building_name: '',
    location: '',
    latitude: '',
    longitude: '',
    radius: '100',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const fetchBuildingData = useCallback(async () => {
    if (!buildingId) return;

    try {
      setFetchingData(true);
      const response = await getBuildingById(buildingId);
      const building = response.data;

      setFormData({
        building_name: building.building_name,
        location: building.location || '',
        latitude: building.latitude,
        longitude: building.longitude,
        radius: building.radius,
      });
    } catch (error) {
      console.error('Error fetching building:', error);
      setErrorMessage('Failed to load building data');
    } finally {
      setFetchingData(false);
    }
  }, [buildingId]);

  useEffect(() => {
    if (buildingId) {
      fetchBuildingData();
    }
  }, [buildingId, fetchBuildingData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const payload = {
        building_name: formData.building_name,
        location: formData.location,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseInt(formData.radius),
      };

      await updateBuilding(buildingId!, payload);
      await showAlert('Building updated successfully!', 'Success');
      navigate(`/admin/buildings/${buildingId}`);
    } catch (err: unknown) {
      let msg = 'Failed to update building';
      if (err instanceof Error) {
        msg = err.message;
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading building data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/admin/buildings/${buildingId}`)}
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Building</h1>
            <p className="text-sm text-gray-600 mt-1">Update building information</p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3">
            <ExclamationCircleIcon className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BUILDING INFORMATION */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Building Information</h2>
                <p className="text-sm text-gray-500">Basic details about the property</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Building Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="building_name"
                  placeholder="e.g., Marina Heights Tower"
                  value={formData.building_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Building Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g., Dubai Marina, UAE"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>
          </div>

          {/* GEO-LOCATION */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <MapPinIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Geo-Location Settings</h2>
                <p className="text-sm text-gray-500">GPS coordinates for attendance tracking</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  placeholder="e.g., 25.0803"
                  value={formData.latitude}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  placeholder="e.g., 55.1396"
                  value={formData.longitude}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allowed Radius (meters) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="radius"
                  placeholder="e.g., 100"
                  value={formData.radius}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Changing coordinates may affect attendance tracking for
                existing employees assigned to this building.
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/admin/buildings/${buildingId}`)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Updating...
                </>
              ) : (
                'Update Building'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBuilding;
