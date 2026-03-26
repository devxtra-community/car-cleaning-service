import React, { useState } from 'react';
import { useAlert } from '../../context/AlertContext';
import { errMsg } from '../../utils/errorUtils';
import { updateCleaner, deleteCleaner } from '../../services/allAPI';

interface Cleaner {
  cleaner_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  document_id: string;
  age: number;
  nationality: string;
  total_tasks: number;
  total_earning: number;
  base_salary?: number;
}

interface EditForm {
  full_name: string;
  email: string;
  phone: string;
  age: string;
  nationality: string;
  document_id: string;
  base_salary: string;
}

export const DeleteCleanerModal = ({
  cleaner,
  onClose,
  onDeleted,
}: {
  cleaner: any;
  onClose: () => void;
  onDeleted: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useAlert();

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteCleaner(cleaner.cleaner_id || cleaner.id);
      onDeleted();
      showToast('Cleaner deleted successfully', 'success');
    } catch (err: unknown) {
      showToast(errMsg(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'modalPop 0.2s ease' }}
      >
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-5">
          <svg
            className="w-7 h-7 text-red-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Cleaner?</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-1">
          You're about to permanently delete{' '}
          <span className="font-semibold text-slate-700">{cleaner.full_name}</span>. This action
          cannot be undone.
        </p>
        <p className="text-slate-400 text-xs mb-6">
          Cleaners with active or pending tasks cannot be deleted.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const EditCleanerModal: React.FC<{
  cleaner: any;
  onClose: () => void;
  onSaved: (updated: any) => void;
}> = ({ cleaner, onClose, onSaved }) => {
  const { showToast } = useAlert();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<EditForm>({
    full_name: cleaner.full_name || '',
    email: cleaner.email || '',
    phone: cleaner.phone || '',
    age: String(cleaner.age || ''),
    nationality: cleaner.nationality || '',
    document_id: cleaner.document_id || '',
    base_salary: String(cleaner.base_salary || ''),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await updateCleaner(cleaner.cleaner_id || cleaner.id, form);
      if (res.success || res.data) {
        onSaved({
          ...form,
          age: Number(form.age),
          base_salary: Number(form.base_salary),
        });
      }
    } catch (err) {
      showToast(errMsg(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[110] p-5">
      <div className="bg-white rounded-[24px] w-full max-w-xl shadow-2xl animate-modal-pop overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Edit Cleaner</h3>
            <p className="text-sm text-slate-400 mt-1">Update personal and professional details</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                placeholder="Full Name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                placeholder="Email"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                placeholder="Phone"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Age</label>
              <input
                name="age"
                type="number"
                value={form.age}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                placeholder="Age"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nationality</label>
              <input
                name="nationality"
                value={form.nationality}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                placeholder="Nationality"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Document ID</label>
              <input
                name="document_id"
                value={form.document_id}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                placeholder="Document ID"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Base Salary</label>
              <input
                name="base_salary"
                type="number"
                value={form.base_salary}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                placeholder="Base Salary"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
