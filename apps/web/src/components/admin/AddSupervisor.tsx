import React from 'react';

const AddSupervisor = () => {
  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Create Supervisor</h1>
        <p className="text-sm text-gray-500">Overview and System Management</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Card */}
        <div className="bg-white rounded-xl p-6 flex flex-col items-center">
          {/* Profile Image */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-blue-500 overflow-hidden">
              <img
                src="https://via.placeholder.com/150"
                alt="profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <button className="text-sm border px-4 py-1.5 rounded mb-6">Upload Photo</button>

          {/* Inputs */}
          <div className="w-full space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              className="w-full bg-blue-50 border rounded-md px-3 py-2 text-sm outline-none"
            />

            <input
              type="email"
              placeholder="Email"
              className="w-full bg-blue-50 border rounded-md px-3 py-2 text-sm outline-none"
            />

            <input
              type="text"
              placeholder="DD/MM/YYYY"
              className="w-full bg-blue-50 border rounded-md px-3 py-2 text-sm outline-none"
            />

            <input
              type="text"
              placeholder="+91 | Phone"
              className="w-full bg-blue-50 border rounded-md px-3 py-2 text-sm outline-none"
            />
          </div>

          {/* Document Upload */}
          <div className="w-full mt-6 bg-blue-50 border rounded-lg p-4 flex flex-col items-center">
            <div className="text-3xl mb-2">📄</div>

            <div className="flex items-center gap-2 w-full mt-2">
              <input
                type="text"
                placeholder="ID"
                className="flex-1 border rounded px-3 py-1.5 text-sm"
              />
              <button className="border px-3 py-1.5 rounded text-sm">Passport ▾</button>
            </div>
          </div>
        </div>

        {/* Right Card */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="font-semibold mb-4">Site Allocation</h2>

          {/* Location */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Location"
              className="w-full border rounded-md px-3 py-2 text-sm outline-none"
            />
            <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
          </div>

          {/* Block Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" />A Block
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" />B Block
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" />C Block
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" />D Block
            </label>
          </div>

          {/* Permanent Building Allocation */}
          <h3 className="font-medium mb-3">Permanent Building Allocation</h3>

          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              placeholder="Building"
              className="flex-1 border rounded-md px-3 py-2 text-sm outline-none"
            />
            <button className="bg-blue-500 text-white px-4 py-2 rounded text-sm">Save</button>
          </div>

          {/* Building Chips */}
          <div className="space-y-2">
            <div className="bg-blue-50 border rounded px-3 py-2 text-sm flex items-center gap-2">
              📍 Dubai Marina
            </div>
            <div className="bg-blue-50 border rounded px-3 py-2 text-sm flex items-center gap-2">
              📍 Dubai Marina
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSupervisor;
