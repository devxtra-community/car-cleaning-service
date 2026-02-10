import React, { useState, useEffect } from 'react';
import { getUsersByRole, getUserSalaryDetails, createSalary } from '../../services/allAPI';
import axios from 'axios';

type Role = 'accountant' | 'supervisor' | 'cleaner' | '';

interface User {
  id: string;
  full_name: string;
  role: Role;
  email: string;
  department: string;
  base_salary: number;
}

interface DailyWorkRecord {
  date: string;
  tasks_completed: number;
  target_tasks: number;
  base_incentive: number;
  bonus_incentive: number;
  total_incentive: number;
  notes: string;
}

interface Penalty {
  date?: string;
  amount?: number;
  reason?: string;
}

interface UserSalaryDetails {
  user: User & {
    current_month_incentive: number;
    total_incentive_earned: number;
  };
  monthlyIncentives: DailyWorkRecord[];
  penalties: Penalty[];
}

type InputProps = {
  label: string;
  placeholder: string;
  full?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  disabled?: boolean;
};

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  full,
  value,
  onChange,
  type = 'text',
  disabled = false,
}) => (
  <div className={full ? 'col-span-2' : ''}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
    />
  </div>
);

type SelectProps = {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  full?: boolean;
  placeholder?: string;
};

const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  full,
  placeholder = 'Select an option',
}) => (
  <div className={full ? 'col-span-2' : ''}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const AddNewSalary: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role>('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userDetails, setUserDetails] = useState<UserSalaryDetails | null>(null);

  const [salaryMonth, setSalaryMonth] = useState('');
  const [monthlyReview, setMonthlyReview] = useState('');
  const [baseSalary, setBaseSalary] = useState(0);
  const [penaltyAmount, setPenaltyAmount] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* =========================
     API Calls (typed error handling)
     ========================= */
  const fetchUsers = async (role: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsersByRole(role);
      setUsers(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to fetch users');
      } else {
        setError('Failed to fetch users');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string, month: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserSalaryDetails(userId, month);
      setUserDetails(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to fetch user details');
      } else {
        setError('Failed to fetch user details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSalary = async () => {
    if (!selectedUser || !salaryMonth) {
      setError('Please select user and salary month');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createSalary({
        user_id: selectedUser.id,
        salary_month: salaryMonth,
        base_salary: baseSalary || selectedUser.base_salary,
        penalty_amount: penaltyAmount,
        monthly_review: monthlyReview,
        payment_method: paymentMethod,
        bank_account: bankAccountNumber,
      });

      setSuccess('Salary created successfully!');
      setTimeout(() => {
        handleReset();
        setSuccess(null);
      }, 2000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to create salary');
      } else {
        setError('Failed to create salary');
      }
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Effects
     ========================= */
  useEffect(() => {
    if (selectedRole) {
      fetchUsers(selectedRole);
      setSelectedUserId('');
      setSelectedUser(null);
      setUserDetails(null);
    } else {
      setUsers([]);
    }
  }, [selectedRole]);

  useEffect(() => {
    if (selectedUserId && salaryMonth) {
      const user = users.find((u) => u.id === selectedUserId);
      if (user) {
        setSelectedUser(user);
        setBaseSalary(user.base_salary);
        fetchUserDetails(selectedUserId, salaryMonth);
      }
    } else if (selectedUserId) {
      const user = users.find((u) => u.id === selectedUserId);
      if (user) {
        setSelectedUser(user);
        setBaseSalary(user.base_salary);
      }
    } else {
      setSelectedUser(null);
      setUserDetails(null);
    }
  }, [selectedUserId, salaryMonth, users]); // ✅ dependency warning fixed

  const totalIncentives =
    userDetails?.monthlyIncentives.reduce(
      (sum, record) => sum + Number(record.total_incentive),
      0
    ) || 0;

  const finalSalary = (baseSalary || 0) + totalIncentives - (penaltyAmount || 0);

  const handleSave = () => {
    handleCreateSalary();
  };

  const handleReset = () => {
    setSelectedRole('');
    setSelectedUserId('');
    setSelectedUser(null);
    setUserDetails(null);
    setSalaryMonth('');
    setMonthlyReview('');
    setBaseSalary(0);
    setPenaltyAmount(0);
    setPaymentMethod('');
    setBankAccountNumber('');
    setError(null);
    setSuccess(null);
  };

  return (
    <>
      <div className="bg-linear-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
        <h1 className="text-2xl font-bold">Accountant Dashboard</h1>
        <p className="text-blue-100">Finance & Salary Management</p>
      </div>

      <div className="p-6 bg-gray-50">
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-sm font-semibold text-green-800">Success</p>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Employee</h2>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Select Role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  options={[
                    { value: 'accountant', label: 'Accountant' },
                    { value: 'supervisor', label: 'Supervisor' },
                    { value: 'cleaner', label: 'worker/Cleaner' },
                  ]}
                  placeholder="Choose a role"
                />

                <Select
                  label="Select Employee"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  options={users.map((user) => ({
                    value: user.id,
                    label: user.full_name,
                  }))}
                  placeholder={selectedRole ? 'Choose an employee' : 'Select role first'}
                />
              </div>
            </div>

            {selectedUser && (
              <>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      placeholder="Enter name"
                      value={selectedUser.full_name}
                      disabled
                    />
                    <Input
                      label="Email"
                      placeholder="email@example.com"
                      value={selectedUser.email}
                      disabled
                    />
                    <Input
                      label="Department"
                      placeholder="Department"
                      value={selectedUser.department}
                      disabled
                    />
                    <Input label="Role" placeholder="Role" value={selectedUser.role} disabled />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Salary Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Base Salary"
                      placeholder="0.00"
                      type="number"
                      value={baseSalary.toString()}
                      onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      label="Salary Month"
                      placeholder="e.g., 2024-02"
                      type="month"
                      value={salaryMonth}
                      onChange={(e) => setSalaryMonth(e.target.value)}
                    />
                    <Input
                      label="Penalty Amount"
                      placeholder="0.00"
                      type="number"
                      value={penaltyAmount.toString()}
                      onChange={(e) => setPenaltyAmount(parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      label="Final Salary"
                      placeholder="$0.00"
                      value={`$${finalSalary.toFixed(2)}`}
                      disabled
                    />
                  </div>
                </div>

                {selectedUser.role === 'cleaner' && salaryMonth && userDetails && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                          Monthly Incentives (Auto-calculated)
                        </h2>
                        <p className="text-sm text-gray-600">
                          Total: ${totalIncentives.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {userDetails.monthlyIncentives.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="text-3xl mb-2">📊</div>
                        <p className="text-gray-600 font-medium">
                          No work records found for this month
                        </p>
                        <p className="text-sm text-gray-500">
                          Incentives are automatically calculated from daily work records
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {userDetails.monthlyIncentives.map((record, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200"
                          >
                            <div>
                              <p className="font-medium text-gray-800">
                                {new Date(record.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                              <p className="text-sm text-gray-600">
                                Tasks: {record.tasks_completed}/{record.target_tasks}
                                {record.notes && ` - ${record.notes}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-green-600 font-semibold block">
                                +${parseFloat(record.total_incentive.toString()).toFixed(2)}
                              </span>
                              <span className="text-xs text-gray-500">
                                Base: ${parseFloat(record.base_incentive.toString()).toFixed(2)} +
                                Bonus: ${parseFloat(record.bonus_incentive.toString()).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Review</h2>
                  <textarea
                    placeholder="Enter monthly review and performance notes..."
                    value={monthlyReview}
                    onChange={(e) => setMonthlyReview(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                  />
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Payment Method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      options={[
                        { value: 'bank_transfer', label: 'Bank Transfer' },
                        { value: 'cash', label: 'Cash' },
                        { value: 'check', label: 'Check' },
                      ]}
                      placeholder="Select payment method"
                    />
                    <Input
                      label="Bank Account Number"
                      placeholder="XXXX-XXXX-XXXX"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {selectedUser && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow sticky top-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Salary Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Base Salary</span>
                    <span className="font-semibold">${Number(baseSalary).toFixed(2)}</span>
                  </div>

                  {selectedUser.role === 'cleaner' && (
                    <>
                      <div className="flex justify-between items-center pb-3 border-b">
                        <span className="text-gray-600">Total Incentives</span>
                        <span className="font-semibold text-green-600">
                          +${totalIncentives.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b">
                        <span className="text-gray-600">Penalty Amount</span>
                        <span className="font-semibold text-red-600">
                          -${penaltyAmount.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-semibold text-gray-800">Net Salary</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${finalSalary.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleSave}
                    disabled={loading || !selectedUser || !salaryMonth}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Salary'}
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Reset Form
                  </button>
                </div>

                <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm font-semibold text-blue-800">Important</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {selectedUser.role === 'cleaner'
                      ? 'Incentives are automatically calculated from daily work records. Salary will be created in draft status.'
                      : 'Please ensure all information is accurate before saving. Salary will be created in draft status.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AddNewSalary;
