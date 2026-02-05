import React from 'react';

const AddVehicles = () => {
  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Vehicle Management</h1>
        <p className="text-sm text-gray-500">Overview and System Management</p>
      </div>

      {/* Card */}
      <div className="bg-blue-50 rounded-2xl p-6">
        <h2 className="font-semibold mb-6">Add New Vehicle</h2>

        <div className="grid grid-cols-3 gap-8">
          {/* Vehicle Information */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-blue-600 font-medium">
              🚗 Vehicle Information
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1">Type Name *</label>
                <input
                  type="text"
                  placeholder="Sedan, SUV"
                  className="w-full border rounded-md px-3 py-2 text-sm outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs mb-1">Category *</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                  <option>Category</option>
                </select>
              </div>

              <div>
                <label className="block text-xs mb-1">Vehicle Size *</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                  <option>Medium</option>
                </select>
              </div>

              <div>
                <label className="block text-xs mb-1">Description *</label>
                <textarea
                  placeholder="Additional Information"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white h-28 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-green-600 font-medium">
              💲 Pricing
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1">Base Price $</label>
                <input
                  type="text"
                  placeholder="$00.00"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs mb-1">Premium Price $</label>
                <input
                  type="text"
                  placeholder="$00.00"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                />
              </div>
            </div>
          </div>

          {/* Service Time */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-blue-600 font-medium">
              ⏱ Service Time
            </div>

            <div>
              <label className="block text-xs mb-1">Wash Time (MIN)</label>
              <input
                type="text"
                placeholder="20 min"
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddVehicles;
