import React, { useState, useEffect } from 'react';
import { api } from '../../services/commonAPI';

interface Supervisor {
  id: string;
  user_id: string;
  building_id: string;
  full_name?: string;
}

interface Building {
  id: string;
  building_id: string;
  building_name: string;
}

interface Floor {
  id: string;
  floor_name: string;
}

const AddCleaners = () => {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    age: '',
    nationality: '',
    phone: '',
    document_id: '',
    building_id: '',
    supervisor_id: '',
    floor_id: '',
  });

  const [document, setDocument] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [filteredSupervisors, setFilteredSupervisors] = useState<Supervisor[]>([]);
  const [availableFloors, setAvailableFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, bldRes] = await Promise.all([
          api.get('/api/auth/supervisors'),
          api.get('/api/buildings'),
        ]);
        setSupervisors(supRes.data.data || []);
        setBuildings(bldRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };

    fetchData();
  }, []);

  // Filter supervisors and fetch floors when building changes
  useEffect(() => {
    const updateSelections = async () => {
      if (!form.building_id) {
        setFilteredSupervisors([]);
        setAvailableFloors([]);
        return;
      }

      // Filter supervisors by building
      const filtered = supervisors.filter((s) => s.building_id === form.building_id);
      setFilteredSupervisors(filtered);

      // Fetch floors for building
      try {
        const response = await api.get(`/api/floors/${form.building_id}`);
        if (response.data.success) {
          setAvailableFloors(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch floors:', error);
      }
    };

    updateSelections();
  }, [form.building_id, supervisors]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Reset dependant fields if building changes
    if (name === 'building_id') {
      setForm((prev) => ({
        ...prev,
        building_id: value,
        supervisor_id: '',
        floor_id: '',
      }));
    }

    // Clear floor selection if supervisor changes
    if (name === 'supervisor_id') {
      setForm((prev) => ({ ...prev, floor_id: '' }));
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocument(e.target.files[0]);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!document) {
      alert('Please upload a document');
      return;
    }

    if (!form.supervisor_id) {
      alert('Please select a supervisor');
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      console.log('=== Uploading document and creating cleaner ===');

      // Send FormData with the file - backend will upload to S3
      const formData = new FormData();
      formData.append('email', form.email);
      formData.append('password', form.password);
      formData.append('full_name', form.full_name);
      formData.append('role', 'cleaner');
      formData.append('document_id', form.document_id);
      formData.append('age', form.age);
      formData.append('nationality', form.nationality);
      formData.append('client_type', 'web');
      formData.append('document', document); // File object
      formData.append('supervisor_id', form.supervisor_id);
      if (form.floor_id) {
        formData.append('floor_id', form.floor_id);
      }

      console.log('Submitting registration...');
      const response = await api.post('/api/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Cleaner created successfully!', response.data);
      setSuccess(true);

      // Reset form
      setForm({
        full_name: '',
        email: '',
        password: '',
        age: '',
        nationality: '',
        phone: '',
        document_id: '',
        building_id: '',
        supervisor_id: '',
        floor_id: '',
      });
      setDocument(null);
      setProfilePhoto(null);

      setTimeout(() => setSuccess(false), 5000);
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        response?: { data?: { message?: string }; status?: number };
      };
      console.error('❌ ERROR OCCURRED ❌');
      console.error('Error object:', error);
      console.error('Error message:', err.message);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);
      const message = err.response?.data?.message || err.message || 'Failed to create cleaner';
      alert(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Create Cleaner</h1>
        <p className="text-sm text-gray-500">Add a new cleaner to the system</p>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          ✅ Cleaner created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Main Card */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Section */}
          <div className="bg-white rounded-xl p-6 flex flex-col items-center">
            {/* Profile Image */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full border-4 border-blue-500 flex items-center justify-center overflow-hidden">
                {profilePhoto ? (
                  <img
                    src={URL.createObjectURL(profilePhoto)}
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-3xl">👤</div>
                )}
              </div>
            </div>

            <label className="text-sm border px-4 py-1.5 rounded mb-6 cursor-pointer hover:bg-gray-50">
              Upload Photo
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>

            {/* Form Fields */}
            <div className="w-full space-y-4">
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Full Name *"
                required
                className="w-full bg-blue-50 border rounded-md px-3 py-2 text-sm outline-none"
              />

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email *"
                required
                className="w-full bg-blue-50 border rounded-md px-3 py-2 text-sm outline-none"
              />

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password *"
                required
                className="w-full bg-blue-50 border rounded-md px-3 py-2 text-sm outline-none"
              />

              <input
                type="text"
                name="age"
                value={form.age}
                onChange={handleChange}
                placeholder="Age *"
                required
                className="w-full bg-blue-50 border rounded-md px-3 py-2 text-sm outline-none"
              />

              <input
                type="text"
                name="nationality"
                value={form.nationality}
                onChange={handleChange}
                placeholder="Nationality *"
                required
                className="w-full bg-blue-50 border rounded-md px-3 py-2 text-sm outline-none"
              />

              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 | Phone"
                className="w-full bg-blue-50 border rounded-md px-3 py-2 text-sm outline-none"
              />
            </div>

            {/* Document Upload */}
            <div className="w-full mt-6 bg-blue-50 border rounded-lg p-4 flex flex-col items-center">
              <div className="text-3xl mb-2">📄</div>
              <p className="text-sm text-gray-600 mb-2">
                {document ? document.name : 'Upload Document *'}
              </p>
              <div className="flex items-center gap-2 mt-2 w-full">
                <input
                  type="text"
                  name="document_id"
                  value={form.document_id}
                  onChange={handleChange}
                  placeholder="Document ID *"
                  required
                  className="flex-1 border rounded px-3 py-1.5 text-sm"
                />
                <label className="border px-3 py-1.5 rounded text-sm cursor-pointer hover:bg-gray-50">
                  Upload
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleDocumentChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="font-semibold mb-4">Assignment Details</h2>

            {/* Building Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Building *</label>
              <select
                name="building_id"
                value={form.building_id}
                onChange={handleChange}
                required
                className="w-full border rounded-md px-3 py-2 text-sm outline-none bg-blue-50 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Building</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.building_name} ({building.building_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Supervisor Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Supervisor *</label>
              <select
                name="supervisor_id"
                value={form.supervisor_id}
                onChange={handleChange}
                required
                disabled={!form.building_id}
                className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Supervisor</option>
                {filteredSupervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.full_name || supervisor.user_id}
                  </option>
                ))}
              </select>
              {!form.building_id && (
                <p className="text-xs text-amber-600 mt-1">
                  Select a building first to see supervisors
                </p>
              )}
            </div>

            {/* Floor Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Floor (Optional)</label>
              <select
                name="floor_id"
                value={form.floor_id}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm outline-none"
                disabled={!form.supervisor_id}
              >
                <option value="">Select Floor</option>
                {availableFloors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.floor_name}
                  </option>
                ))}
              </select>
              {!form.supervisor_id && (
                <p className="text-xs text-amber-600 mt-1">
                  Select a supervisor first to see floors
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-md text-white font-medium ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? 'Creating...' : 'Create Cleaner'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddCleaners;
