import React, { useState, useEffect } from 'react';
import { api } from '../../services/commonAPI';
import { UserPlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface Building {
  id: string;
  building_name: string;
  location?: string;
}

interface Supervisor {
  supervisor_id: string;
  full_name: string;
  building_id: string;
  building_name: string;
}

type UserRole = 'supervisor' | 'cleaner' | 'admin' | 'super_admin' | 'accountant';

const UnifiedRegister = () => {
  const [form, setForm] = useState({
    role: '' as UserRole | '',
    full_name: '',
    email: '',
    password: '',
    age: '',
    nationality: '',
    phone: '',
    document_id: '',
    // Supervisor specific
    building_id: '',
    // Cleaner specific
    supervisor_id: '',
    floor_id: '',
  });

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [document, setDocument] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Load buildings when component mounts
  useEffect(() => {
    loadBuildings();
  }, []);

  // Load supervisors when role is cleaner
  useEffect(() => {
    if (form.role === 'cleaner') {
      loadSupervisors();
    }
  }, [form.role]);

  const loadBuildings = async () => {
    try {
      const res = await api.get('/api/buildings');
      setBuildings(res.data.data || []);
    } catch (error) {
      console.error('Failed to load buildings:', error);
    }
  };

  const loadSupervisors = async () => {
    try {
      const res = await api.get('/api/auth/supervisors');
      setSupervisors(res.data.data || []);
    } catch (error) {
      console.error('Failed to load supervisors:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
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

    // Validation
    if (!form.role) {
      setError('Please select a role');
      return;
    }

    if (!document) {
      setError('Please upload a document');
      return;
    }

    if (form.role === 'supervisor' && !form.building_id) {
      setError('Please select a building for supervisor');
      return;
    }

    if (form.role === 'cleaner' && !form.supervisor_id) {
      setError('Please select a supervisor for cleaner');
      return;
    }

    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      const formData = new FormData();

      // Base fields
      formData.append('email', form.email);
      formData.append('password', form.password);
      formData.append('full_name', form.full_name);
      formData.append('role', form.role);
      formData.append('document_id', form.document_id);
      formData.append('age', form.age);
      formData.append('nationality', form.nationality);
      formData.append('client_type', 'web');
      formData.append('document', document);

      // Optional fields
      if (form.phone) formData.append('phone', form.phone);
      if (profilePhoto) formData.append('profile_image', profilePhoto);

      // Role-specific fields
      if (form.role === 'supervisor') {
        formData.append('building_id', form.building_id);
      }

      if (form.role === 'cleaner') {
        formData.append('supervisor_id', form.supervisor_id);
        if (form.floor_id) formData.append('floor_id', form.floor_id);
      }

      const response = await api.post('/api/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ User created successfully!', response.data);
      setSuccess(true);

      // Reset form
      setForm({
        role: '' as UserRole | '',
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
      console.error('❌ Registration failed:', error);

      let message = 'Failed to register user';

      if (error instanceof Error) {
        message = error.message;
      }

      // Axios error handling (safe)
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as {
          response?: {
            data?: {
              message?: string;
            };
          };
        };

        message = err.response?.data?.message || message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    const roleMap: Record<UserRole, string> = {
      supervisor: 'Supervisor',
      cleaner: 'Cleaner',
      admin: 'Admin',
      super_admin: 'Super Admin',
      accountant: 'Accountant',
    };
    return roleMap[role];
  };

  return (
    <div className="p-6 min-h-screen max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <UserPlusIcon className="w-8 h-8 text-blue-600" />
          Register New User
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new account for supervisors, cleaners, or staff members
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircleIcon className="w-6 h-6 text-green-600 shrink-0" />
          <p className="text-green-800 font-medium">User registered successfully!</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <XCircleIcon className="w-6 h-6 text-red-600 shrink-0" />
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Role Selection */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select User Role</h2>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
            >
              <option value="">-- Choose Role --</option>
              <option value="supervisor">Supervisor</option>
              <option value="cleaner">Cleaner</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
              <option value="accountant">Accountant</option>
            </select>
          </div>

          {form.role && (
            <>
              {/* Personal Information */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>

                {/* Profile Photo */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full border-4 border-blue-500 overflow-hidden bg-gray-100">
                      {profilePhoto ? (
                        <img
                          src={URL.createObjectURL(profilePhoto)}
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
                    Upload Photo (Optional)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="user@example.com"
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
              </div>

              {/* Role-Specific Fields */}
              {form.role === 'supervisor' && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Supervisor Assignment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assigned Building <span className="text-red-500">*</span>
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
                  </div>
                </div>
              )}

              {form.role === 'cleaner' && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Cleaner Assignment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supervisor <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="supervisor_id"
                        value={form.supervisor_id}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Choose a supervisor...</option>
                        {supervisors.map((supervisor) => (
                          <option key={supervisor.supervisor_id} value={supervisor.supervisor_id}>
                            {supervisor.full_name} - {supervisor.building_name}
                          </option>
                        ))}
                      </select>
                      {supervisors.length === 0 && (
                        <p className="mt-2 text-sm text-amber-600">
                          No supervisors available. Please add supervisors first.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Floor ID (Optional)
                      </label>
                      <input
                        type="text"
                        name="floor_id"
                        value={form.floor_id}
                        onChange={handleChange}
                        placeholder="e.g., Floor 3"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                      Creating {form.role && getRoleDisplayName(form.role)}...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="w-5 h-5" />
                      Create {form.role && getRoleDisplayName(form.role)}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default UnifiedRegister;
