import React, { useEffect, useState } from 'react';
import {
  getAllIncentiveTargets,
  createIncentiveTarget,
  updateIncentiveTarget,
  deleteIncentiveTarget,
  IncentiveTarget,
  getAllBuildings,
  getAllFloors,
  getUsersByRole,
} from '../../services/allAPI';
import { useAlert } from '../../context/AlertContext';

export default function TargetManagement() {
  const { showAlert, showConfirm } = useAlert();
  const [targets, setTargets] = useState<IncentiveTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<IncentiveTarget | null>(null);

  // Form State
  const [targetTasks, setTargetTasks] = useState('');
  const [reason, setReason] = useState('');
  const [incentiveAmount, setIncentiveAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const [cleaners, setCleaners] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);

  // Selector IDs
  const [selectedCleaner, setSelectedCleaner] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');

  useEffect(() => {
    fetchTargets();
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const [cRes, bRes, fRes] = await Promise.all([
        getUsersByRole('cleaner'),
        getAllBuildings(),
        getAllFloors(),
      ]);
      setCleaners(cRes || []);
      setBuildings(bRes.data || bRes || []);
      setFloors(fRes.data || fRes || []);
    } catch (err) {
      console.error('Failed to load metadata', err);
    }
  };

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const data = await getAllIncentiveTargets();
      setTargets(data || []);
    } catch (err) {
      console.error('Failed to fetch targets', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingTarget(null);
    setTargetTasks('');
    setReason('');
    setIncentiveAmount('');
    setSelectedCleaner('');
    setSelectedBuilding('');
    setSelectedFloor('');
    setShowModal(true);
  };

  const openEditModal = (t: IncentiveTarget) => {
    setEditingTarget(t);
    setTargetTasks(t.target_tasks.toString());
    setReason(t.reason);
    setIncentiveAmount(t.incentive_amount.toString());
    setSelectedCleaner(t.cleaner_id || '');
    setSelectedBuilding(t.building_id || '');
    setSelectedFloor(t.floor_id || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!(await showConfirm('Are you sure you want to delete this target?'))) return;
    try {
      await deleteIncentiveTarget(id);
      setTargets((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      showAlert('Failed to delete target', 'Error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        target_tasks: Number(targetTasks),
        reason,
        incentive_amount: Number(incentiveAmount),
        cleaner_id: selectedCleaner || null,
        building_id: selectedBuilding || null,
        floor_id: selectedFloor || null,
      };

      if (editingTarget) {
        await updateIncentiveTarget(editingTarget.id, payload);
      } else {
        await createIncentiveTarget(payload);
      }
      setShowModal(false);
      fetchTargets();
    } catch (err) {
      showAlert('Failed to save target. Only one active target might be allowed.', 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 min-h-screen">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Target Management</h1>
          <p className="text-sm text-slate-600 mt-1">
            Configure daily work targets and incentives for all cleaners or a specific assignment
            scope
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
        >
          + Add New Target
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700">Reason/Name</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Scope</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Daily Target</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Incentive</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
              <th className="px-6 py-4 font-semibold text-center text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-500">
                  Loading targets...
                </td>
              </tr>
            ) : targets.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-500">
                  No incentive targets found. Click 'Add New Target' to create one.
                </td>
              </tr>
            ) : (
              targets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{t.reason}</td>
                  <td className="px-6 py-4">
                    {t.cleaner_name ? (
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[11px] font-bold">
                        Cleaner: {t.cleaner_name}
                      </span>
                    ) : t.building_name ? (
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[11px] font-bold">
                        Building: {t.building_name}
                      </span>
                    ) : t.floor_name ? (
                      <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-[11px] font-bold">
                        Floor: {t.floor_name}
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[11px] font-bold">
                        Global
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-semibold">{t.target_tasks} Tasks</td>
                  <td className="px-6 py-4 text-emerald-600 font-semibold">
                    ₹{t.incentive_amount}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                        t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {t.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => openEditModal(t)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingTarget ? 'Edit Target' : 'Create New Target'}
              </h3>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Target Name / Reason
                  </label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g. Daily Wash Target"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Daily Task Target
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={targetTasks}
                    onChange={(e) => setTargetTasks(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Number of tasks"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Incentive Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={incentiveAmount}
                    onChange={(e) => setIncentiveAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Amount to reward"
                  />
                </div>
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Optional Scope
                  </p>
                  <p className="text-xs text-slate-500 mb-3">
                    Choose one scope if this target should apply only to a specific cleaner,
                    building, or floor.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Specific Cleaner
                      </label>
                      <select
                        value={selectedCleaner}
                        onChange={(e) => {
                          setSelectedCleaner(e.target.value);
                          if (e.target.value) {
                            setSelectedBuilding('');
                            setSelectedFloor('');
                          }
                        }}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Apply to all cleaners</option>
                        {cleaners.map((c, index) => {
                          const cleanerId = c.cleaner_id || c.id || `cleaner-${index}`;
                          return (
                            <option key={cleanerId} value={cleanerId}>
                              {c.full_name}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Specific Building
                      </label>
                      <select
                        value={selectedBuilding}
                        onChange={(e) => {
                          setSelectedBuilding(e.target.value);
                          if (e.target.value) {
                            setSelectedCleaner('');
                            setSelectedFloor('');
                          }
                        }}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Buildings</option>
                        {buildings.map((b, index) => {
                          const buildingId = b.id || `building-${index}`;
                          return (
                            <option key={buildingId} value={buildingId}>
                              {b.building_name}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Specific Floor
                      </label>
                      <select
                        value={selectedFloor}
                        onChange={(e) => {
                          setSelectedFloor(e.target.value);
                          if (e.target.value) {
                            setSelectedCleaner('');
                            setSelectedBuilding('');
                          }
                        }}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Floors</option>
                        {floors.map((f, index) => {
                          const floorId = f.id || `floor-${index}`;
                          return (
                            <option key={floorId} value={floorId}>
                              {f.floor_name || `Floor ${f.floor_number ?? ''}`.trim()} (
                              {f.building_name || 'Floor'})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
