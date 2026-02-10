import { useState } from 'react';
import { api } from '../../services/commonAPI';

const AddIncentiveTarget = () => {
  const [form, setForm] = useState({
    target_tasks: '',
    incentive_amount: '',
    reason: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/api/incentives/targets', {
        target_tasks: Number(form.target_tasks),
        incentive_amount: Number(form.incentive_amount),
        reason: form.reason,
      });
      console.log(res);

      alert('Incentive added successfully');
      setForm({ target_tasks: '', incentive_amount: '', reason: '' });
    } catch (error) {
      alert('Failed to add incentive');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-1">Add Incentive</h2>
      <p className="text-sm text-gray-500 mb-6">Set incentive targets for cleaners</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Target Tasks */}
        <div>
          <label className="block text-sm font-medium mb-1">Target Tasks</label>
          <input
            type="number"
            name="target_tasks"
            value={form.target_tasks}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>

        {/* Incentive Amount */}
        <div>
          <label className="block text-sm font-medium mb-1">Incentive Amount (₹)</label>
          <input
            type="number"
            name="incentive_amount"
            value={form.incentive_amount}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium mb-1">Reason / Notes</label>
          <textarea
            name="reason"
            value={form.reason}
            onChange={handleChange}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Save Incentive'}
        </button>
      </form>
    </div>
  );
};

export default AddIncentiveTarget;
