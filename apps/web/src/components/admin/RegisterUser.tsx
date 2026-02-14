import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/commonAPI';
import { getAllSupervisors, registerUser } from '../../services/allAPI';

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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className=" mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 capitalize">
                Create New {form.role}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Fill in the details to register a new team member
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
        >
          {/* Personal Information Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                1
              </span>
              Personal Information
            </h2>
            <p className="text-sm text-slate-500 mb-6">Basic details about the team member</p>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Profile Photo</label>
              <div className="flex items-start gap-6">
                {profilePhotoPreview ? (
                  <div className="relative">
                    <img
                      src={profilePhotoPreview}
                      alt="Profile preview"
                      className="w-24 h-24 object-cover rounded-xl border-2 border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProfilePhoto(null);
                        setProfilePhotoPreview('');
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                    <svg
                      className="w-8 h-8 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Recommended: Square image, at least 400x400px
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 mt-2 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  placeholder="Enter full name"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="email@example.com"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Create a secure password"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+971 50 123 4567"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  required
                  placeholder="25"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nationality <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={form.nationality}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Indian, Filipino"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          {/* Document & Financial Section */}
          <div className="mb-8 pt-8 border-t border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                2
              </span>
              Documents & Financial
            </h2>
            <p className="text-sm text-slate-500 mb-6">Verification and compensation details</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Document ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="document_id"
                  value={form.document_id}
                  onChange={handleChange}
                  required
                  placeholder="Passport or Emirates ID"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Base Salary (AED) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    AED
                  </span>
                  <input
                    type="number"
                    name="base_salary"
                    value={form.base_salary}
                    onChange={handleChange}
                    required
                    placeholder="3000"
                    className="w-full border border-slate-300 rounded-lg pl-14 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Document File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleDocumentChange}
                  required
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer cursor-pointer"
                />
                {document && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium">{document.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Role Specific Assignments */}
          <div className="mb-8 pt-8 border-t border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                3
              </span>
              Assignment Details
            </h2>
            <p className="text-sm text-slate-500 mb-6">Work location and reporting structure</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {form.role === 'supervisor' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Assigned Building <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="building_id"
                    value={form.building_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 bg-white"
                  >
                    <option value="">Select a building</option>
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Reporting Supervisor <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="supervisor_id"
                      value={form.supervisor_id}
                      onChange={handleSupervisorChange}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 bg-white"
                    >
                      <option value="">Select a supervisor</option>
                      {supervisors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.supervisor_id && form.building_id && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Assigned Building
                      </label>
                      <div className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-600">
                        {buildings.find((b) => b.id === form.building_id)?.building_name ||
                          'Loading...'}
                      </div>
                      <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Auto-assigned based on supervisor's building
                      </p>
                    </div>
                  )}

                  {form.supervisor_id && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Assigned Floor <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="floor_id"
                        value={form.floor_id}
                        onChange={handleChange}
                        required
                        disabled={floors.length === 0}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <option value="">
                          {floors.length === 0 ? 'No floors available' : 'Select a floor'}
                        </option>
                        {floors.map((f) => (
                          <option key={f.id} value={f.id}>
                            Floor {f.floor_number}
                          </option>
                        ))}
                      </select>

                      {floors.length === 0 && form.supervisor_id && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1 bg-amber-50 px-3 py-2 rounded-lg">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          No floors found. Please add floors to the building first.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 rounded-lg text-slate-700 font-medium border border-slate-300 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-3 rounded-lg text-white font-semibold transition flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Create {form.role}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterUser;
