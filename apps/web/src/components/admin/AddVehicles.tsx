import React, { useEffect, useState } from 'react';
import { api } from '../../services/commonAPI';
import { PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface Vehicle {
  id: string;
  type: string;
  category: string;
  size: string;
  base_price: number;
  premium_price: number;
  wash_time: number;
  status: string;
}

const AddVehicles = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!editId);

  const [form, setForm] = useState({
    type: '',
    category: '',
    size: '',
    base_price: '',
    premium_price: '',
    wash_time: '',
    status: 'Active',
  });

  const getVehicleById = (id: string) => api.get(`/api/vehicle/${id}`);
  const updateVehicle = (id: string, data: Partial<Vehicle>) => api.put(`/api/vehicle/${id}`, data);
  const createVehicle = (data: Partial<Vehicle>) => api.post('/api/vehicle', data);

  useEffect(() => {
    if (!editId) return;
    setPageLoading(true);
    getVehicleById(editId)
      .then((res) => {
        const v = res.data;
        setEditingId(editId);
        setForm({
          type: v.type,
          category: v.category,
          size: v.size,
          base_price: String(v.base_price),
          premium_price: String(v.premium_price),
          wash_time: String(v.wash_time),
          status: v.status,
        });
      })
      .catch(() => alert('Failed to load vehicle for editing.'))
      .finally(() => setPageLoading(false));
  }, [editId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.type ||
      !form.category ||
      !form.size ||
      !form.base_price ||
      !form.premium_price ||
      !form.wash_time
    ) {
      alert('Please fill in all required fields');
      return;
    }

    const vehicleData = {
      type: form.type,
      category: form.category,
      size: form.size,
      base_price: Number(form.base_price),
      premium_price: Number(form.premium_price),
      wash_time: Number(form.wash_time),
      status: form.status,
    };

    try {
      setFormLoading(true);
      if (editingId) {
        await updateVehicle(editingId, vehicleData);
      } else {
        await createVehicle(vehicleData);
      }
      navigate('/admin/vechicles');
    } catch (error: unknown) {
      alert(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to save vehicle.'
      );
    } finally {
      setFormLoading(false);
    }
  };

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all';
  const labelCls = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top bar ── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/vechicles')}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </button>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Admin / Fleet
              </p>
              <h1 className="text-base font-extrabold text-slate-900">
                {editingId ? 'Edit Vehicle Type' : 'Add Vehicle Type'}
              </h1>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin/vechicles')}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={formLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              {formLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : editingId ? (
                'Save Changes'
              ) : (
                'Add Vehicle'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto px-6 py-8">
        {pageLoading ? (
          <div className="flex items-center justify-center py-32 gap-3 text-slate-400 text-sm">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            Loading vehicle…
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ── Basic info ── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <svg
                      className="w-4.5 h-4.5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Vehicle Information</h2>
                    <p className="text-xs text-slate-400">Type, category and size details</p>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>
                    Vehicle Type <span className="text-red-400 normal-case tracking-normal">*</span>
                  </label>
                  <input
                    name="type"
                    placeholder="e.g. Sedan, SUV, Truck"
                    value={form.type}
                    onChange={handleChange}
                    required
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    Category <span className="text-red-400 normal-case tracking-normal">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      required
                      className={inputCls + ' appearance-none pr-9'}
                    >
                      <option value="">Select Category</option>
                      <option value="Standard">Standard</option>
                      <option value="Large">Large</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Compact">Compact</option>
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>
                    Size <span className="text-red-400 normal-case tracking-normal">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="size"
                      value={form.size}
                      onChange={handleChange}
                      required
                      className={inputCls + ' appearance-none pr-9'}
                    >
                      <option value="">Select Size</option>
                      <option value="Small">Small</option>
                      <option value="Medium">Medium</option>
                      <option value="Large">Large</option>
                      <option value="Extra Large">Extra Large</option>
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>
                    Status <span className="text-red-400 normal-case tracking-normal">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      required
                      className={inputCls + ' appearance-none pr-9'}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* ── Pricing & time ── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <svg
                      className="w-4.5 h-4.5 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Pricing & Duration</h2>
                    <p className="text-xs text-slate-400">Rates and estimated wash time</p>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>
                    Base Price ($){' '}
                    <span className="text-red-400 normal-case tracking-normal">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                      $
                    </span>
                    <input
                      name="base_price"
                      type="number"
                      placeholder="0"
                      value={form.base_price}
                      onChange={handleChange}
                      required
                      className={inputCls + ' pl-8'}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>
                    Premium Price ($){' '}
                    <span className="text-red-400 normal-case tracking-normal">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                      $
                    </span>
                    <input
                      name="premium_price"
                      type="number"
                      placeholder="0"
                      value={form.premium_price}
                      onChange={handleChange}
                      required
                      className={inputCls + ' pl-8'}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>
                    Wash Time (minutes){' '}
                    <span className="text-red-400 normal-case tracking-normal">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="wash_time"
                      type="number"
                      placeholder="e.g. 20"
                      value={form.wash_time}
                      onChange={handleChange}
                      required
                      className={inputCls + ' pr-16'}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                      min
                    </span>
                  </div>
                </div>

                {/* Info note */}
                <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  Premium pricing applies to deluxe wash packages. Base pricing is for standard
                  service.
                </div>
              </div>
            </div>

            {/* ── Bottom save bar ── */}
            <div className="flex items-center justify-end gap-3 pt-6 mt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => navigate('/admin/vechicles')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold transition-colors shadow-md shadow-blue-200"
              >
                {formLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : editingId ? (
                  <>
                    <PencilIcon className="w-4 h-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    Add Vehicle
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddVehicles;
