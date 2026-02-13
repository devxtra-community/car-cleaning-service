import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { registerUser, getAllSupervisors } from '../../services/allapi';
import { api } from '../../services/commonAPI';

interface Building {
  id: string;
  building_name: string;
}

interface Supervisor {
  id: string;
  full_name: string;
  building_id: string;
}

interface Floor {
  id: string;
  floor_number: string;
  building_id: string;
}

interface FormData {
  role: string;
  full_name: string;
  email: string;
  password: string;
  phone: string;
  age: string;
  nationality: string;
  document_id: string;
  building_id: string;
  supervisor_id: string;
  floor_id: string;
  base_salary: string;
}

const RegisterUser = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);

  const [form, setForm] = useState<FormData>({
    role: role || '',
    full_name: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    nationality: '',
    document_id: '',
    building_id: '',
    supervisor_id: '',
    floor_id: '',
    base_salary: '',
  });

  // ================= FETCH BASED ON ROLE =================

  const fetchBuildings = async () => {
    try {
      const response = await api.get('/api/buildings');
      setBuildings(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch buildings', error);
      alert('Failed to load buildings');
    }
  };

  const fetchSupervisors = async () => {
    try {
      const data = await getAllSupervisors();
      setSupervisors(data || []);
    } catch (error) {
      console.error('Failed to fetch supervisors', error);
      alert('Failed to load supervisors');
    }
  };

  const fetchFloorsByBuilding = async (buildingId: string) => {
    try {
      const response = await api.get(`/api/auth/buildings/${buildingId}/floors`);
      setFloors(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch floors', error);
      alert('Failed to load floors');
    }
  };

  useEffect(() => {
    if (!role) return;

    if (role === 'supervisor') fetchBuildings();
    if (role === 'cleaner') fetchSupervisors();
  }, [role]);

  // ================= HANDLERS =================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSupervisorChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const supervisorId = e.target.value;

    setForm((prev) => ({
      ...prev,
      supervisor_id: supervisorId,
      building_id: '',
      floor_id: '',
    }));

    setFloors([]);

    if (!supervisorId) {
      return;
    }

    try {
      const selectedSupervisor = supervisors.find((s) => s.id === supervisorId);

      if (selectedSupervisor && selectedSupervisor.building_id) {
        const buildingId = selectedSupervisor.building_id;

        setForm((prev) => ({
          ...prev,
          supervisor_id: supervisorId,
          building_id: buildingId,
        }));

        if (buildings.length === 0) {
          const buildingResponse = await api.get('/api/buildings');
          setBuildings(buildingResponse.data.data || []);
        }

        await fetchFloorsByBuilding(buildingId);
      } else {
        alert('This supervisor is not assigned to any building yet');
      }
    } catch (error) {
      console.error('Failed to fetch building and floors', error);
      setFloors([]);
      alert('Failed to load building details');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePhoto(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocument(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!document) {
      alert('Document is required');
      return;
    }

    if (
      !form.full_name ||
      !form.email ||
      !form.password ||
      !form.age ||
      !form.nationality ||
      !form.document_id ||
      !form.base_salary
    ) {
      alert('Please fill in all required fields');
      return;
    }

    if (form.role === 'supervisor' && !form.building_id) {
      alert('Please select a building for supervisor');
      return;
    }

    if (form.role === 'cleaner' && !form.supervisor_id) {
      alert('Please select a supervisor for cleaner');
      return;
    }

    if (form.role === 'cleaner' && !form.floor_id) {
      alert('Please select a floor for cleaner');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append('role', form.role);
      formData.append('email', form.email.trim());
      formData.append('password', form.password);
      formData.append('full_name', form.full_name);
      formData.append('phone', form.phone || '');
      formData.append('age', form.age);
      formData.append('nationality', form.nationality);
      formData.append('document_id', form.document_id);
      formData.append('base_salary', form.base_salary);
      formData.append('document', document);

      if (profilePhoto) {
        formData.append('profile_image', profilePhoto);
      }

      if (form.role === 'supervisor') {
        formData.append('building_id', form.building_id);
      }

      if (form.role === 'cleaner') {
        formData.append('supervisor_id', form.supervisor_id);
        if (form.floor_id) {
          formData.append('floor_id', form.floor_id);
        }
      }

      const response = await registerUser(formData);

      if (response.success) {
        alert(`${form.role} created successfully`);
        navigate(-1);
      } else {
        alert(response.message || 'Failed to create user');
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);

      const err = error as { response?: { data?: { message?: string } } };

      alert(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 capitalize">Create {form.role}</h2>

      <form onSubmit={handleSubmit}>
        {/* Personal Info */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="age"
            value={form.age}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nationality <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nationality"
            value={form.nationality}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="document_id"
            value={form.document_id}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base Salary <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="base_salary"
            value={form.base_salary}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>

        {/* Profile Photo with Preview */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Photo (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {profilePhotoPreview && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <img
                src={profilePhotoPreview}
                alt="Profile preview"
                className="w-32 h-32 object-cover rounded-full border-2 border-gray-300"
              />
            </div>
          )}
        </div>

        {/* Document */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document File <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleDocumentChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {document && <p className="text-sm text-gray-600 mt-2">Selected: {document.name}</p>}
        </div>

        {/* Role Specific */}
        {form.role === 'supervisor' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Building <span className="text-red-500">*</span>
            </label>
            <select
              name="building_id"
              value={form.building_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select Building</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.building_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {form.role === 'cleaner' && (
          <>
            {/* Supervisor Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supervisor <span className="text-red-500">*</span>
              </label>
              <select
                name="supervisor_id"
                value={form.supervisor_id}
                onChange={handleSupervisorChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select Supervisor</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Building Display (Auto-filled, Read-only) */}
            {form.supervisor_id && form.building_id && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Building</label>
                <input
                  type="text"
                  value={
                    buildings.find((b) => b.id === form.building_id)?.building_name || 'Loading...'
                  }
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Automatically assigned based on supervisor's building
                </p>
              </div>
            )}

            {/* Floor Selection (Only show if supervisor is selected) */}
            {form.supervisor_id && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floor <span className="text-red-500">*</span>
                </label>
                <select
                  name="floor_id"
                  value={form.floor_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={floors.length === 0}
                >
                  <option value="">
                    {floors.length === 0 ? 'No floors available' : 'Select Floor'}
                  </option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      Floor {f.floor_number}
                    </option>
                  ))}
                </select>

                {floors.length === 0 && form.supervisor_id && (
                  <p className="text-xs text-amber-600 mt-1">
                    No floors found for this building. Please add floors first.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-6 rounded-lg text-white font-semibold transition-colors ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Creating...' : `Create ${form.role}`}
        </button>
      </form>
    </div>
  );
};

export default RegisterUser;
