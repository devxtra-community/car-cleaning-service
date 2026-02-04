import { useState } from 'react';

type AddIncentiveModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const AddIncentiveModal: React.FC<AddIncentiveModalProps> = ({ isOpen, onClose }) => {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [openDropdown, setOpenDropdown] = useState(false);

  if (!isOpen) return null;

  const categories = [
    'Performance Bonus',
    'Attendance Bonus',
    'Customer Satisfaction',
    'Overtime',
    'Special Achievement',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Incentive</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            ✕
          </button>
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">
            Category <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(!openDropdown)}
              className="flex w-full items-center justify-between rounded-lg border border-blue-500 bg-white px-4 py-2 text-left focus:outline-none"
            >
              <span className={category ? 'text-black' : 'text-gray-400'}>
                {category || 'Select category'}
              </span>
              <span>▾</span>
            </button>

            {openDropdown && (
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow">
                <div className="bg-gray-600 px-4 py-2 text-sm text-white">Select category</div>
                {categories.map((item) => (
                  <div
                    key={item}
                    onClick={() => {
                      setCategory(item);
                      setOpenDropdown(false);
                    }}
                    className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">
            Amount ($) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={amount}
            disabled
            placeholder="0.00"
            className="w-full rounded-lg bg-gray-100 px-4 py-2 text-gray-500 outline-none"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes"
            className="w-full rounded-lg bg-gray-100 px-4 py-2 outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">
            Cancel
          </button>
          <button className="rounded-lg bg-black px-4 py-2 text-sm text-white">
            Add Incentive
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddIncentiveModal;
