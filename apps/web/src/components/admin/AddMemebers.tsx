import React, { useState } from 'react';

type Building = {
  id: string;
  name: string;
};

type Supervisor = {
  id: string;
  full_name: string;
  building_id: string;
};

const AddMemebers = () => {
  const [formData, setFormData] = useState({
    role: '',

    full_name: '',
    email: '',
    password: '',

    document_type: 'Passport',
    document_id: '',
    age: '',
    nationality: 'India',

    building_id: '',
    floor: '',
    supervisor_id: '',
    location: '',
  });

  // Later you will map it from API (now just placeholder arrays)
  const _buildings: Building[] = [];
  const _supervisors: Supervisor[] = [];
  const _floors: string[] = [];

  const roles = ['user', 'supervisor', 'accountant', 'admin', 'super_admin'];
  const documentTypes = ['Passport', 'Aadhar Card', 'Driving License', 'Voter ID', 'PAN Card'];

  const nationalities = [
    'India',
    'UAE',
    'Qatar',
    'Saudi Arabia',
    'Oman',
    'Kuwait',
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
  ];

  // Later you will filter supervisors from API
  const _filteredSupervisors = _supervisors.filter(
    (sup) => sup.building_id === formData.building_id
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // reset floor and supervisor if building changes
    if (name === 'building_id') {
      setFormData((prev) => ({
        ...prev,
        building_id: value,
        floor: '',
        supervisor_id: '',
      }));
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      role: e.target.value,

      full_name: '',
      email: '',
      password: '',

      document_type: 'Passport',
      document_id: '',
      age: '',
      nationality: 'India',

      building_id: '',
      floor: '',
      supervisor_id: '',
      location: '',
    });
  };

  const handleSubmit = () => {
    console.log('Register Data:', formData);
  };

  const isWorker = formData.role === 'user';
  const isSupervisor = formData.role === 'supervisor';
  const isAccountant = formData.role === 'accountant';
  const isAdmin = formData.role === 'admin' || formData.role === 'super_admin';

  return (
    <div className="mt-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Register User</h1>
        <p className="text-sm text-gray-500">Select role first and complete registration</p>
      </div>

      {/* ROLE SELECTION CARD (TOP) */}
      <div className="bg-blue-50 border border-blue-400 rounded-xl p-5 mb-8 shadow-sm">
        <h2 className="text-md font-semibold text-blue-700 mb-2">Select User Role</h2>
        <select
          name="role"
          value={formData.role}
          onChange={handleRoleChange}
          className="w-full border-2 border-blue-500 bg-white rounded-lg px-4 py-3 text-sm font-semibold outline-none shadow-sm"
        >
          <option value="">-- Select Role --</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* IF ROLE NOT SELECTED */}
      {!formData.role && (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm">
          Please select a role to continue
        </div>
      )}

      {/* IF ROLE SELECTED SHOW FORM */}
      {formData.role && (
        <div className="grid grid-cols-2 gap-6">
          {/* Left Section */}
          <div className="bg-white rounded-xl p-6 flex flex-col items-center shadow-sm">
            <div className="w-full space-y-4">
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Full Name"
                className="w-full bg-blue-50 border rounded-md px-3 py-2 text-sm outline-none"
              />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full bg-blue-50 border rounded-md px-3 py-2 text-sm outline-none"
              />

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full bg-blue-50 border rounded-md px-3 py-2 text-sm outline-none"
              />

              {(isWorker || isSupervisor) && (
                <>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Age"
                    className="w-full bg-blue-50 border rounded-md px-3 py-2 text-sm outline-none"
                  />

                  <select
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="w-full bg-blue-50 border rounded-md px-3 py-2 text-sm outline-none"
                  >
                    {nationalities.map((nation) => (
                      <option key={nation} value={nation}>
                        {nation}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {(isWorker || isSupervisor) && (
              <div className="w-full mt-6 bg-blue-50 border rounded-lg p-4 flex flex-col items-center">
                <div className="text-3xl mb-2">📄</div>

                <div className="flex items-center gap-2 mt-2 w-full">
                  <input
                    type="text"
                    name="document_id"
                    value={formData.document_id}
                    onChange={handleChange}
                    placeholder="Document ID"
                    className="flex-1 border rounded px-3 py-1.5 text-sm outline-none"
                  />

                  <select
                    name="document_type"
                    value={formData.document_type}
                    onChange={handleChange}
                    className="border px-3 py-1.5 rounded text-sm outline-none bg-white"
                  >
                    {documentTypes.map((doc) => (
                      <option key={doc} value={doc}>
                        {doc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold mb-4">Allocation Details</h2>

            {/* Worker Allocation */}
            {isWorker && (
              <>
                <div className="mb-5">
                  <label className="text-sm font-medium text-gray-600 mb-2 block">
                    Select Building
                  </label>

                  <select
                    name="building_id"
                    value={formData.building_id}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 text-sm outline-none"
                  >
                    <option value="">-- Select Building --</option>

                    {/* Later you will map buildings here */}
                    {/* {buildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.name}
                      </option>
                    ))} */}
                  </select>
                </div>

                <div className="mb-5">
                  <label className="text-sm font-medium text-gray-600 mb-2 block">
                    Select Floor
                  </label>

                  <select
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 text-sm outline-none"
                    disabled={!formData.building_id}
                  >
                    <option value="">-- Select Floor --</option>

                    {/* Later you will map floors here */}
                    {/* {floors.map((floor) => (
                      <option key={floor} value={floor}>
                        {floor}
                      </option>
                    ))} */}
                  </select>
                </div>

                <div className="mb-5">
                  <label className="text-sm font-medium text-gray-600 mb-2 block">
                    Select Supervisor
                  </label>

                  <select
                    name="supervisor_id"
                    value={formData.supervisor_id}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 text-sm outline-none"
                    disabled={!formData.building_id}
                  >
                    <option value="">-- Select Supervisor --</option>

                    {/* Later you will map supervisors here */}
                    {/* {filteredSupervisors.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.full_name}
                      </option>
                    ))} */}
                  </select>
                </div>
              </>
            )}

            {/* Supervisor Allocation */}
            {isSupervisor && (
              <>
                <div className="mb-5">
                  <label className="text-sm font-medium text-gray-600 mb-2 block">
                    Select Building
                  </label>

                  <select
                    name="building_id"
                    value={formData.building_id}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 text-sm outline-none"
                  >
                    <option value="">-- Select Building --</option>

                    {/* Later you will map buildings here */}
                    {/* {buildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.name}
                      </option>
                    ))} */}
                  </select>
                </div>

                <div className="relative mb-5">
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Location"
                    className="w-full border rounded-md px-3 py-2 text-sm outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-400">📍</span>
                </div>
              </>
            )}

            {/* Accountant */}
            {isAccountant && (
              <div className="bg-blue-50 border rounded-lg p-4 text-sm text-gray-600">
                Accountant role requires only basic registration details.
              </div>
            )}

            {/* Admin / Super Admin */}
            {isAdmin && (
              <div className="bg-blue-50 border rounded-lg p-4 text-sm text-gray-600">
                Admin / Super Admin requires only basic details.
              </div>
            )}

            {/* Summary */}
            <div className="mt-6">
              <h3 className="font-medium mb-3">Summary</h3>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-blue-50 border rounded px-3 py-2">
                  <p className="text-gray-500 text-xs">Role</p>
                  <p className="font-medium">{formData.role.toUpperCase()}</p>
                </div>

                <div className="bg-blue-50 border rounded px-3 py-2">
                  <p className="text-gray-500 text-xs">Building</p>
                  <p className="font-medium">{formData.building_id || '-'}</p>
                </div>

                <div className="bg-blue-50 border rounded px-3 py-2">
                  <p className="text-gray-500 text-xs">Floor</p>
                  <p className="font-medium">{isWorker ? formData.floor || '-' : 'N/A'}</p>
                </div>

                <div className="bg-blue-50 border rounded px-3 py-2">
                  <p className="text-gray-500 text-xs">Supervisor</p>
                  <p className="font-medium">{isWorker ? formData.supervisor_id || '-' : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium"
      >
        Register {formData.role.toUpperCase()}
      </button>
    </div>
  );
};

export default AddMemebers;
