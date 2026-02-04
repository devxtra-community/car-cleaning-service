import React from 'react';

const AddNewSalary = () => {
  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Accountant Dashboard</h1>
        <p className="text-sm text-gray-500">Finance & Salary Management</p>
      </div>

      {/* Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Form */}
        <div className="col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white border rounded-xl p-5">
            <h2 className="font-semibold mb-4">Personal Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Name" placeholder="Supervisor or Cleaner" />
              <Input label="Designation" placeholder="Cleaner or Supervisor" />
              <Input label="Employee ID" placeholder="id" />
              <Input label="Building Assignment" placeholder="Building" />
              <Input label="Join Date" placeholder="00-00-00" />
              <Input label="Contact Number" placeholder="000-000-000" />
            </div>

            <div className="mt-4">
              <Input label="Email Address" placeholder="example@gmail.com" full />
            </div>
          </div>

          {/* Salary Information */}
          <div className="bg-white border rounded-xl p-5">
            <h2 className="font-semibold mb-4">Salary Information</h2>

            <div className="grid grid-cols-3 gap-4">
              <Input label="Base Salary (Monthly)" placeholder="00000" />
              <Input label="Work Days (This Month)" placeholder="00000" />
              <Input label="Performance Score (%)" placeholder="00000" />
            </div>
          </div>

          {/* Incentives */}
          <div className="bg-white border rounded-xl p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold">
                Incentives
                <span className="text-xs text-green-600 ml-2">Total: $0.00</span>
              </h2>
              <button className="bg-blue-500 text-white text-sm px-3 py-1.5 rounded">
                Add Incentives
              </button>
            </div>

            <div className="text-center text-gray-400 text-sm py-10">
              <div className="text-lg mb-2">↗</div>
              <p>No Incentives are added yet</p>
              <p className="text-xs">Click "Add Incentives" to add bonuses</p>
            </div>
          </div>
          {/* Penalties */}
          <div className="bg-white border rounded-xl p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold">
                Penalties
                <span className="text-xs text-red-500 ml-2">Total: $0.00</span>
              </h2>
              <button className="bg-blue-500 text-white text-sm px-3 py-1.5 rounded">
                Add Penalties
              </button>
            </div>

            <div className="text-center text-gray-400 text-sm py-10">
              <div className="text-lg mb-2">↗</div>
              <p>No Penalties are added yet</p>
              <p className="text-xs">Click "Add Penalties" to add deduction</p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Payment Details</h2>
              <button className="bg-blue-500 text-white text-sm px-3 py-1.5 rounded">
                Add Penalties
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Payment Method</label>
                <input
                  type="text"
                  placeholder="Bank Transfer"
                  className="w-full border rounded-md px-3 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Bank Account Number</label>
                <input
                  type="text"
                  placeholder="Account number"
                  className="w-full border rounded-md px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary */}
        <div className="space-y-6">
          {/* Salary Summary */}
          <div className="bg-white border rounded-xl p-5">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-500">Base Salary</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-500">Total Incentives</span>
              <span className="text-green-600">$0.00</span>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-500">Total Penalties</span>
              <span className="text-red-500">$0.00</span>
            </div>

            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Net Salary</span>
              <span>$0.00</span>
            </div>

            <button className="w-full mt-4 bg-blue-500 text-white py-2 rounded">Save</button>
            <button className="w-full mt-2 border py-2 rounded">Reset Form</button>
          </div>

          {/* Important Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
            <p className="font-semibold mb-1">Important</p>
            <p>
              Please ensure all information is accurate before saving. This data will be used for
              payroll processing.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddNewSalary;

function Input({
  label,
  placeholder,
  full,
}: {
  label: string;
  placeholder: string;
  full?: boolean;
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full border rounded-md px-3 py-2 text-sm outline-none"
      />
    </div>
  );
}
