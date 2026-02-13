import { useEffect, useState } from 'react';
import { api } from '../../services/commonAPI';
import { IncentiveTarget } from './AddIncentiveTarget';

interface Props {
  onClose: () => void;
  onSuccess: (message: string, type: 'success' | 'error') => void;
  editData?: IncentiveTarget | null;
}

const AddEditIncentiveModal = ({ onClose, onSuccess, editData }: Props) => {
  const [form, setForm] = useState({
    target_tasks: '',
    incentive_amount: '',
    reason: '',
    active: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({
        target_tasks: String(editData.target_tasks),
        incentive_amount: String(editData.incentive_amount),
        reason: editData.reason,
        active: editData.active,
      });
    }
  }, [editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editData) {
        await api.put(`/api/incentives/targets/${editData.id}`, {
          target_tasks: Number(form.target_tasks),
          incentive_amount: Number(form.incentive_amount),
          reason: form.reason,
          active: form.active,
        });

        onSuccess('Incentive updated successfully', 'success');
      } else {
        await api.post('/api/incentives/targets', {
          target_tasks: Number(form.target_tasks),
          incentive_amount: Number(form.incentive_amount),
          reason: form.reason,
        });

        onSuccess('Incentive added successfully', 'success');
      }

      onClose();
    } catch (err) {
      console.error(err);
      onSuccess('Operation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white w-full max-w-md rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-900">
              {editData ? 'Edit Incentive' : 'Add New Incentive'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Target Tasks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Tasks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g., 50"
                value={form.target_tasks}
                onChange={(e) => setForm({ ...form, target_tasks: e.target.value })}
                required
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of tasks required to earn this incentive
              </p>
            </div>

            {/* Incentive Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Incentive Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g., 500"
                value={form.incentive_amount}
                onChange={(e) => setForm({ ...form, incentive_amount: e.target.value })}
                required
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Amount to be paid when target is achieved
              </p>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Notes</label>
              <textarea
                placeholder="Optional description or notes about this incentive"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Active Status - Only show when editing */}
            {editData && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Active
                </label>
                <span className="text-xs text-gray-500 ml-1">
                  (Inactive incentives won't be applied)
                </span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
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
                    {editData ? 'Update' : 'Save'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddEditIncentiveModal;
