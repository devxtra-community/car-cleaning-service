import React, { useState, useEffect } from 'react';
import { api } from '../../services/commonAPI';
import { UserPlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Building {
  id: string;
  building_id: string;
  building_name: string;
  location?: string;
}

const AddSupervisor = () => {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    age: '',
    nationality: '',
    phone: '',
    document_id: '',
    location: '',
    block: '',
    building_id: '', // UUID of the building from database
  });

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [document, setDocument] = useState<File | null>(null);
  const [profile_photo, setProfilePhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const res = await api.get('/api/buildings');
        setBuildings(res.data.data || []);
      } catch (error) {
        console.error('Failed to load buildings:', error);
      }
    };
    loadBuildings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

    if (!form.building_id) {
      alert('Please select a building');
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      console.log('=== Uploading document and creating supervisor ===');

      // Send FormData with the file - backend will upload to S3
      const formData = new FormData();
      formData.append('email', form.email);
      formData.append('password', form.password);
      formData.append('full_name', form.full_name);
      formData.append('role', 'supervisor');
      formData.append('document_id', form.document_id);
      formData.append('age', form.age);
      formData.append('nationality', form.nationality);
      formData.append('client_type', 'web');
      formData.append('document', document); // File object
      formData.append('building_id', form.building_id); // Add building_id directly

      console.log('Submitting registration...');
      const response = await api.post('/api/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Supervisor created successfully!', response.data);
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
        location: '',
        block: '',
        building_id: '',
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
      const message = err.response?.data?.message || err.message || 'Failed to create supervisor';
      alert(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <UserPlusIcon className="w-8 h-8 text-blue-600" />
          Create Supervisor
        </h1>
        <p className="mt-1 text-sm text-gray-500">Add a new supervisor to manage site operations</p>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircleIcon className="w-6 h-6 text-green-600" />
          <p className="text-green-800 font-medium">Supervisor created successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>

          {/* Profile Image */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full border-4 border-blue-500 overflow-hidden bg-gray-100">
                {profile_photo ? (
                  <img
                    src={URL.createObjectURL(profile_photo)}
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <UserPlusIcon className="w-12 h-12" />
                  </div>
                )}
              </div>
            </div>
            <label className="cursor-pointer text-sm border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors">
              Upload Photo
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="supervisor@example.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                placeholder="Min 8 characters"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 1234567890"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                required
                min="18"
                placeholder="25"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nationality <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nationality"
                value={form.nationality}
                onChange={handleChange}
                required
                placeholder="Indian"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="document_id"
                value={form.document_id}
                onChange={handleChange}
                required
                placeholder="Passport/Aadhar No."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                onChange={handleDocumentChange}
                required
                accept="image/*,.pdf"
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              {document && <p className="mt-2 text-sm text-gray-600">✓ {document.name}</p>}
            </div>
          </div>

          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Building Assignment</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Building <span className="text-red-500">*</span>
                </label>
                <select
                  name="building_id"
                  value={form.building_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a building...</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.building_name} {building.location && `- ${building.location}`}
                    </option>
                  ))}
                </select>
                {buildings.length === 0 && (
                  <p className="mt-2 text-sm text-amber-600">
                    No buildings available. Please add buildings first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Dubai Marina, Downtown, etc."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Block (Optional)
                </label>
                <select
                  name="block"
                  value={form.block}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Block</option>
                  <option value="A Block">A Block</option>
                  <option value="B Block">B Block</option>
                  <option value="C Block">C Block</option>
                  <option value="D Block">D Block</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-12 py-4 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Creating Supervisor...
                </>
              ) : (
                <>
                  <UserPlusIcon className="w-5 h-5" />
                  Create Supervisor
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddSupervisor;
