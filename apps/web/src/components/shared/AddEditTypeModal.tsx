// src/pages/Incentives/AddEditTypeModal.tsx
import { useEffect, useState } from 'react';
import { api } from '../../services/commonAPI';

interface IncentiveType {
  id: string;
  name: string;
  category: string;
  calculation_type: string;
  description?: string;
  active: boolean;
}

interface Props {
  onClose: () => void;
  onSuccess: (message: string, type: 'success' | 'error') => void;
  editData?: IncentiveType | null;
}

const AddEditTypeModal = ({ onClose, onSuccess, editData }: Props) => {
  const [form, setForm] = useState({
    name: '',
    category: 'performance',
    calculation_type: 'fixed',
    description: '',
    active: true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name,
        category: editData.category,
        calculation_type: editData.calculation_type,
        description: editData.description || '',
        active: editData.active,
      });
    }
  }, [editData]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!form.category) {
      newErrors.category = 'Category is required';
    }

    if (!form.calculation_type) {
      newErrors.calculation_type = 'Calculation type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (editData) {
        await api.put(`/api/incentives/types/${editData.id}`, form);
        onSuccess('Incentive type updated successfully', 'success');
      } else {
        await api.post('/api/incentives/types', form);
        onSuccess('Incentive type created successfully', 'success');
      }
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = 'Operation failed';
      onSuccess(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="text-xl font-semibold text-gray-900">
            {editData ? 'Edit Incentive Type' : 'New Incentive Type'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Performance Target, Overtime Premium"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent ${
                errors.name
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Category & Calculation Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => {
                  setForm({ ...form, category: e.target.value });
                  if (errors.category) setErrors({ ...errors, category: '' });
                }}
                className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent ${
                  errors.category
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              >
                <option value="performance">🎯 Performance</option>
                <option value="attendance">📅 Attendance</option>
                <option value="quality">⭐ Quality</option>
                <option value="overtime">⏰ Overtime</option>
                <option value="milestone">🏆 Milestone</option>
              </select>
              {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calculation Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.calculation_type}
                onChange={(e) => {
                  setForm({ ...form, calculation_type: e.target.value });
                  if (errors.calculation_type) setErrors({ ...errors, calculation_type: '' });
                }}
                className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent ${
                  errors.calculation_type
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              >
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage</option>
                <option value="tiered">Tiered</option>
                <option value="per_unit">Per Unit</option>
              </select>
              {errors.calculation_type && (
                <p className="text-xs text-red-600 mt-1">{errors.calculation_type}</p>
              )}
            </div>
          </div>

          {/* Calculation Type Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-900 mb-1">Calculation Type Guide:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>
                • <strong>Fixed:</strong> Set amount per achievement
              </li>
              <li>
                • <strong>Percentage:</strong> % of base amount
              </li>
              <li>
                • <strong>Tiered:</strong> Different amounts at different levels
              </li>
              <li>
                • <strong>Per Unit:</strong> Amount multiplied by quantity
              </li>
            </ul>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              placeholder="Optional description of this incentive type..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Explain what this incentive type is for and when it applies
            </p>
          </div>

          {/* Active Status - Only show when editing */}
          {editData && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="active" className="flex-1 cursor-pointer">
                <div className="text-sm font-medium text-gray-900">Active Status</div>
                <div className="text-xs text-gray-600">
                  Inactive types won't be used in incentive calculations
                </div>
              </label>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
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
                  {editData ? 'Update Type' : 'Create Type'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditTypeModal;
