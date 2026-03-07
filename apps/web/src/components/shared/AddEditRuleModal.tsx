// src/pages/Incentives/AddEditRuleModal.tsx
import { useEffect, useState } from 'react';
import { api } from '../../services/commonAPI';

interface IncentiveRule {
  id: string;
  incentive_type_id: string;
  rule_name: string;
  base_amount: number;
  criteria: Record<string, unknown>;
  priority: number;
  active: boolean;
  incentive_type_name?: string;
  incentive_category?: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  incentiveTypeId: string;
  categoryType: string;
  onClose: () => void;
  onSuccess: (message: string, type: 'success' | 'error') => void;
  editData?: IncentiveRule | null;
}

const AddEditRuleModal = ({
  incentiveTypeId,
  categoryType,
  onClose,
  onSuccess,
  editData,
}: Props) => {
  const [form, setForm] = useState({
    rule_name: '',
    base_amount: '',
    priority: '0',
    active: true,
    // Performance fields
    target_tasks: '',
    bonus_per_extra: '',
    // Overtime fields
    multiplier: '',
    applies_to: 'weekday',
    // Quality fields
    min_rating: '',
    max_rating: '',
    // Attendance fields
    required_days: 'all',
    max_absences: '0',
    // Milestone fields
    total_tasks: '',
    years_completed: '',
    milestone_type: 'tasks',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (editData) {
      const criteria = editData.criteria || {};
      setForm({
        rule_name: editData.rule_name,
        base_amount: String(editData.base_amount),
        priority: String(editData.priority),
        active: editData.active,
        // Performance
        target_tasks: criteria.target_tasks ? String(criteria.target_tasks) : '',
        bonus_per_extra: criteria.bonus_per_extra ? String(criteria.bonus_per_extra) : '',
        // Overtime
        multiplier: criteria.multiplier ? String(criteria.multiplier) : '',
        applies_to: (criteria.applies_to as string) || 'weekday',
        // Quality
        min_rating: criteria.min_rating ? String(criteria.min_rating) : '',
        max_rating: criteria.max_rating ? String(criteria.max_rating) : '',
        // Attendance
        required_days: (criteria.required_days as string) || 'all',
        max_absences: criteria.max_absences !== undefined ? String(criteria.max_absences) : '0',
        // Milestone
        total_tasks: criteria.total_tasks ? String(criteria.total_tasks) : '',
        years_completed: criteria.years_completed ? String(criteria.years_completed) : '',
        milestone_type: criteria.total_tasks
          ? 'tasks'
          : criteria.years_completed
            ? 'years'
            : 'tasks',
      });
    }
  }, [editData]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.rule_name.trim()) {
      newErrors.rule_name = 'Rule name is required';
    }

    if (!form.base_amount.trim()) {
      newErrors.base_amount = 'Base amount is required';
    } else if (isNaN(Number(form.base_amount)) || Number(form.base_amount) < 0) {
      newErrors.base_amount = 'Base amount must be a positive number';
    }

    if (!form.priority.trim()) {
      newErrors.priority = 'Priority is required';
    } else if (isNaN(Number(form.priority)) || Number(form.priority) < 0) {
      newErrors.priority = 'Priority must be a non-negative number';
    }

    // Category-specific validation
    if (categoryType === 'performance') {
      if (!form.target_tasks.trim()) {
        newErrors.target_tasks = 'Target tasks is required';
      } else if (isNaN(Number(form.target_tasks)) || Number(form.target_tasks) <= 0) {
        newErrors.target_tasks = 'Target tasks must be a positive number';
      }

      if (!form.bonus_per_extra.trim()) {
        newErrors.bonus_per_extra = 'Bonus per extra task is required';
      } else if (isNaN(Number(form.bonus_per_extra)) || Number(form.bonus_per_extra) < 0) {
        newErrors.bonus_per_extra = 'Bonus must be a non-negative number';
      }
    }

    if (categoryType === 'overtime') {
      if (!form.multiplier.trim()) {
        newErrors.multiplier = 'Multiplier is required';
      } else if (isNaN(Number(form.multiplier)) || Number(form.multiplier) <= 0) {
        newErrors.multiplier = 'Multiplier must be greater than 0';
      }
    }

    if (categoryType === 'quality') {
      if (!form.min_rating.trim()) {
        newErrors.min_rating = 'Minimum rating is required';
      } else if (
        isNaN(Number(form.min_rating)) ||
        Number(form.min_rating) < 0 ||
        Number(form.min_rating) > 5
      ) {
        newErrors.min_rating = 'Minimum rating must be between 0 and 5';
      }

      if (form.max_rating.trim()) {
        if (
          isNaN(Number(form.max_rating)) ||
          Number(form.max_rating) < 0 ||
          Number(form.max_rating) > 5
        ) {
          newErrors.max_rating = 'Maximum rating must be between 0 and 5';
        } else if (Number(form.max_rating) < Number(form.min_rating)) {
          newErrors.max_rating = 'Maximum rating must be greater than minimum rating';
        }
      }
    }

    if (categoryType === 'attendance') {
      if (!form.max_absences.trim()) {
        newErrors.max_absences = 'Maximum absences is required';
      } else if (isNaN(Number(form.max_absences)) || Number(form.max_absences) < 0) {
        newErrors.max_absences = 'Maximum absences must be a non-negative number';
      }
    }

    if (categoryType === 'milestone') {
      if (form.milestone_type === 'tasks') {
        if (!form.total_tasks.trim()) {
          newErrors.total_tasks = 'Total tasks is required';
        } else if (isNaN(Number(form.total_tasks)) || Number(form.total_tasks) <= 0) {
          newErrors.total_tasks = 'Total tasks must be a positive number';
        }
      } else {
        if (!form.years_completed.trim()) {
          newErrors.years_completed = 'Years completed is required';
        } else if (isNaN(Number(form.years_completed)) || Number(form.years_completed) <= 0) {
          newErrors.years_completed = 'Years must be a positive number';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildCriteria = (): Record<string, string | number> => {
    const criteria: Record<string, string | number> = {};

    if (categoryType === 'performance') {
      criteria.target_tasks = Number(form.target_tasks);
      criteria.bonus_per_extra = Number(form.bonus_per_extra);
    }

    if (categoryType === 'overtime') {
      criteria.multiplier = Number(form.multiplier);
      criteria.applies_to = form.applies_to;
    }

    if (categoryType === 'quality') {
      criteria.min_rating = Number(form.min_rating);
      if (form.max_rating.trim()) {
        criteria.max_rating = Number(form.max_rating);
      }
    }

    if (categoryType === 'attendance') {
      criteria.required_days = form.required_days;
      criteria.max_absences = Number(form.max_absences);
    }

    if (categoryType === 'milestone') {
      if (form.milestone_type === 'tasks') {
        criteria.total_tasks = Number(form.total_tasks);
      } else {
        criteria.years_completed = Number(form.years_completed);
      }
    }

    return criteria;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        incentive_type_id: incentiveTypeId,
        rule_name: form.rule_name,
        base_amount: Number(form.base_amount),
        priority: Number(form.priority),
        active: form.active,
        criteria: buildCriteria(),
      };

      if (editData) {
        await api.put(`/api/incentives/rules/${editData.id}`, payload);
        onSuccess('Rule updated successfully', 'success');
      } else {
        await api.post('/api/incentives/rules', payload);
        onSuccess('Rule created successfully', 'success');
      }

      onClose();
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Operation failed';
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

  const getCategoryIcon = () => {
    const icons: { [key: string]: string } = {
      performance: '🎯',
      attendance: '📅',
      quality: '⭐',
      overtime: '⏰',
      milestone: '🏆',
    };
    return icons[categoryType] || '💰';
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{getCategoryIcon()}</div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {editData ? 'Edit Rule' : 'Add New Rule'}
              </h3>
              <p className="text-sm text-slate-600 capitalize">{categoryType} Incentive</p>
            </div>
          </div>
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
          {/* Rule Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rule Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Target 50 Tasks, Weekend OT Premium"
              value={form.rule_name}
              onChange={(e) => {
                setForm({ ...form, rule_name: e.target.value });
                if (errors.rule_name) setErrors({ ...errors, rule_name: '' });
              }}
              className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent ${
                errors.rule_name
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.rule_name && <p className="text-xs text-red-600 mt-1">{errors.rule_name}</p>}
          </div>

          {/* Base Amount & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Amount (AED) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g., 100"
                value={form.base_amount}
                onChange={(e) => {
                  setForm({ ...form, base_amount: e.target.value });
                  if (errors.base_amount) setErrors({ ...errors, base_amount: '' });
                }}
                min="0"
                step="0.01"
                className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent ${
                  errors.base_amount
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.base_amount && (
                <p className="text-xs text-red-600 mt-1">{errors.base_amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g., 1"
                value={form.priority}
                onChange={(e) => {
                  setForm({ ...form, priority: e.target.value });
                  if (errors.priority) setErrors({ ...errors, priority: '' });
                }}
                min="0"
                className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent ${
                  errors.priority
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.priority && <p className="text-xs text-red-600 mt-1">{errors.priority}</p>}
              <p className="text-xs text-gray-500 mt-1">Lower number = higher priority</p>
            </div>
          </div>

          {/* Category-Specific Fields */}
          <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-xl">{getCategoryIcon()}</span>
              {categoryType.charAt(0).toUpperCase() + categoryType.slice(1)} Settings
            </h4>

            {/* Performance Fields */}
            {categoryType === 'performance' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Tasks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 50"
                    value={form.target_tasks}
                    onChange={(e) => {
                      setForm({ ...form, target_tasks: e.target.value });
                      if (errors.target_tasks) setErrors({ ...errors, target_tasks: '' });
                    }}
                    min="1"
                    className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent ${
                      errors.target_tasks
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.target_tasks && (
                    <p className="text-xs text-red-600 mt-1">{errors.target_tasks}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Number of tasks to achieve</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bonus Per Extra Task (AED) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 50"
                    value={form.bonus_per_extra}
                    onChange={(e) => {
                      setForm({ ...form, bonus_per_extra: e.target.value });
                      if (errors.bonus_per_extra) setErrors({ ...errors, bonus_per_extra: '' });
                    }}
                    min="0"
                    step="0.01"
                    className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent ${
                      errors.bonus_per_extra
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.bonus_per_extra && (
                    <p className="text-xs text-red-600 mt-1">{errors.bonus_per_extra}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Extra pay for tasks above target</p>
                </div>
              </div>
            )}

            {/* Overtime Fields */}
            {categoryType === 'overtime' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Multiplier <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 1.5"
                    value={form.multiplier}
                    onChange={(e) => {
                      setForm({ ...form, multiplier: e.target.value });
                      if (errors.multiplier) setErrors({ ...errors, multiplier: '' });
                    }}
                    min="0.1"
                    step="0.1"
                    className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent ${
                      errors.multiplier
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.multiplier && (
                    <p className="text-xs text-red-600 mt-1">{errors.multiplier}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Pay rate multiplier (e.g., 1.5x, 2x)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Applies To <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.applies_to}
                    onChange={(e) => setForm({ ...form, applies_to: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="weekday">Weekday</option>
                    <option value="weekend">Weekend</option>
                    <option value="holiday">Holiday</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">When this OT rate applies</p>
                </div>
              </div>
            )}

            {/* Quality Fields */}
            {categoryType === 'quality' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 4.5"
                    value={form.min_rating}
                    onChange={(e) => {
                      setForm({ ...form, min_rating: e.target.value });
                      if (errors.min_rating) setErrors({ ...errors, min_rating: '' });
                    }}
                    min="0"
                    max="5"
                    step="0.1"
                    className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent ${
                      errors.min_rating
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.min_rating && (
                    <p className="text-xs text-red-600 mt-1">{errors.min_rating}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Minimum rating to qualify (0-5)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Rating (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 4.79"
                    value={form.max_rating}
                    onChange={(e) => {
                      setForm({ ...form, max_rating: e.target.value });
                      if (errors.max_rating) setErrors({ ...errors, max_rating: '' });
                    }}
                    min="0"
                    max="5"
                    step="0.1"
                    className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent ${
                      errors.max_rating
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.max_rating && (
                    <p className="text-xs text-red-600 mt-1">{errors.max_rating}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Leave empty for no upper limit</p>
                </div>
              </div>
            )}

            {/* Attendance Fields */}
            {categoryType === 'attendance' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Days <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.required_days}
                    onChange={(e) => setForm({ ...form, required_days: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Working Days</option>
                    <option value="weekdays">Weekdays Only</option>
                    <option value="custom">Custom</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Which days count for attendance</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Absences Allowed <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 0"
                    value={form.max_absences}
                    onChange={(e) => {
                      setForm({ ...form, max_absences: e.target.value });
                      if (errors.max_absences) setErrors({ ...errors, max_absences: '' });
                    }}
                    min="0"
                    className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent ${
                      errors.max_absences
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.max_absences && (
                    <p className="text-xs text-red-600 mt-1">{errors.max_absences}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">0 = perfect attendance</p>
                </div>
              </div>
            )}

            {/* Milestone Fields */}
            {categoryType === 'milestone' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Milestone Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.milestone_type}
                    onChange={(e) => setForm({ ...form, milestone_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="tasks">Total Tasks Completed</option>
                    <option value="years">Years of Service</option>
                  </select>
                </div>

                {form.milestone_type === 'tasks' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Tasks <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 100"
                      value={form.total_tasks}
                      onChange={(e) => {
                        setForm({ ...form, total_tasks: e.target.value });
                        if (errors.total_tasks) setErrors({ ...errors, total_tasks: '' });
                      }}
                      min="1"
                      className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent ${
                        errors.total_tasks
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {errors.total_tasks && (
                      <p className="text-xs text-red-600 mt-1">{errors.total_tasks}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Number of tasks to achieve this milestone
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years Completed <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 1"
                      value={form.years_completed}
                      onChange={(e) => {
                        setForm({ ...form, years_completed: e.target.value });
                        if (errors.years_completed) setErrors({ ...errors, years_completed: '' });
                      }}
                      min="1"
                      className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent ${
                        errors.years_completed
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {errors.years_completed && (
                      <p className="text-xs text-red-600 mt-1">{errors.years_completed}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Years of service to achieve this milestone
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Status */}
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
                Inactive rules won't be calculated in daily work records
              </div>
            </label>
          </div>

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
                  {editData ? 'Update Rule' : 'Create Rule'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditRuleModal;
