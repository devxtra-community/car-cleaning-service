import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getBuildingById, updateBuilding } from '../../services/allAPI';
import { api } from '../../services/commonAPI';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Floor {
  id: string;
  building_id: string;
  floor_number: number;
  floor_name: string;
  notes: string | null;
  created_at: string;
}

interface SupervisorInBuilding {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
  is_active: boolean;
  building_id: string;
}

interface UnassignedSupervisor {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) return err.response?.data?.message ?? err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
};

// ─── Toast ─────────────────────────────────────────────────────────────────────

const ToastBanner: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium
        ${toast.type === 'success' ? 'bg-white border-emerald-200 text-emerald-800' : 'bg-white border-red-200 text-red-700'}`}
      style={{ animation: 'slideIn 0.25s ease' }}
    >
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0
        ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}
      >
        {toast.type === 'success' ? '✓' : '✕'}
      </span>
      {toast.message}
      <button
        onClick={onClose}
        className="ml-2 text-slate-400 hover:text-slate-600 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
};

// ─── Section wrapper ───────────────────────────────────────────────────────────

const Section: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  sub: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ icon, iconBg, title, sub, children, action }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-4">
      <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
      {action}
    </div>
    <div className="px-6 py-6">{children}</div>
  </div>
);

// ─── Input helper ──────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all';
const labelCls = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5';

// ─── Floor row ─────────────────────────────────────────────────────────────────

const FloorRow: React.FC<{
  floor: Floor;
  onEdit: (floor: Floor) => void;
  onDelete: (floor: Floor) => void;
  deleting: string | null;
}> = ({ floor, onEdit, onDelete, deleting }) => (
  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all group">
    {/* Floor number badge */}
    <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
      {floor.floor_number}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-900 truncate">{floor.floor_name}</p>
      {floor.notes && <p className="text-xs text-slate-400 truncate mt-0.5">{floor.notes}</p>}
    </div>

    {/* Edit */}
    <button
      onClick={() => onEdit(floor)}
      title="Edit floor"
      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-all opacity-0 group-hover:opacity-100"
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
        />
      </svg>
    </button>

    {/* Delete */}
    <button
      onClick={() => onDelete(floor)}
      disabled={deleting === floor.id}
      title="Delete floor"
      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {deleting === floor.id ? (
        <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
      )}
    </button>
  </div>
);

// ─── Floor form modal ──────────────────────────────────────────────────────────

const FloorModal: React.FC<{
  initial: { floor_number: string; floor_name: string; notes: string } | null;
  onSave: (data: { floor_number: string; floor_name: string; notes: string }) => Promise<void>;
  onClose: () => void;
  saving: boolean;
  title: string;
}> = ({ initial, onSave, onClose, saving, title }) => {
  const [form, setForm] = useState(initial ?? { floor_number: '', floor_name: '', notes: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7"
        style={{ animation: 'pop 0.2s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-slate-900 mb-5">{title}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Floor Number <span className="text-red-400">*</span>
              </label>
              <input
                name="floor_number"
                type="number"
                value={form.floor_number}
                onChange={handleChange}
                required
                placeholder="1"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Floor Name <span className="text-red-400">*</span>
              </label>
              <input
                name="floor_name"
                type="text"
                value={form.floor_name}
                onChange={handleChange}
                required
                placeholder="Ground Floor"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <input
              name="notes"
              type="text"
              value={form.notes}
              onChange={handleChange}
              placeholder="Optional notes about this floor"
              className={inputCls}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Floor'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Supervisor row ────────────────────────────────────────────────────────────

const SupervisorRow: React.FC<{
  sup: SupervisorInBuilding;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  toggling: string | null;
  removing: string | null;
}> = ({ sup, onToggle, onRemove, toggling, removing }) => (
  <div
    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
    ${sup.is_active ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-100 bg-slate-50'}`}
  >
    {sup.profile_image ? (
      <img
        src={sup.profile_image}
        alt={sup.full_name}
        className="w-9 h-9 rounded-lg object-cover shrink-0"
      />
    ) : (
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
        {sup.full_name[0]?.toUpperCase() ?? 'S'}
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-900 truncate">{sup.full_name}</p>
      <p className="text-xs text-slate-400 truncate">{sup.email}</p>
    </div>
    <span
      className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0
      ${sup.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
    >
      {sup.is_active ? 'Active' : 'Inactive'}
    </span>
    {/* Toggle */}
    <button
      onClick={() => onToggle(sup.id)}
      disabled={toggling === sup.id}
      title={sup.is_active ? 'Deactivate' : 'Activate'}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0
        ${sup.is_active ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'}
        disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {toggling === sup.id ? (
        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : sup.is_active ? (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
    {/* Remove */}
    <button
      onClick={() => onRemove(sup.id)}
      disabled={removing === sup.id}
      title="Remove from building"
      className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all shrink-0 disabled:opacity-50"
    >
      {removing === sup.id ? (
        <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────────

const EditBuilding: React.FC = () => {
  const navigate = useNavigate();
  const { buildingId } = useParams<{ buildingId: string }>();

  // ── Building form ──────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    building_name: '',
    location: '',
    latitude: '',
    longitude: '',
    radius: '100',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Floor state ────────────────────────────────────────────────────────────
  const [floors, setFloors] = useState<Floor[]>([]);
  const [floorsLoading, setFloorsLoading] = useState(false);
  const [deletingFloor, setDeletingFloor] = useState<string | null>(null);
  const [floorModal, setFloorModal] = useState<{
    mode: 'add' | 'edit';
    floor: Floor | null;
  } | null>(null);
  const [savingFloor, setSavingFloor] = useState(false);

  // ── Supervisor state ───────────────────────────────────────────────────────
  const [buildingSups, setBuildingSups] = useState<SupervisorInBuilding[]>([]);
  const [unassigned, setUnassigned] = useState<UnassignedSupervisor[]>([]);
  const [selectedSupId, setSelectedSupId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [supsLoading, setSupsLoading] = useState(false);

  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = (message: string, type: Toast['type']) => setToast({ message, type });

  // ── Fetch building base data ───────────────────────────────────────────────

  const fetchBuildingData = useCallback(async () => {
    if (!buildingId) return;
    try {
      setFetchingData(true);
      const res = await getBuildingById(buildingId);
      const b = res.data;
      setFormData({
        building_name: b.building_name,
        location: b.location ?? '',
        latitude: String(b.latitude),
        longitude: String(b.longitude),
        radius: String(b.radius),
      });
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFetchingData(false);
    }
  }, [buildingId]);

  // ── Fetch floors ───────────────────────────────────────────────────────────
  // GET /api/buildings/:id/floors

  const fetchFloors = useCallback(async () => {
    if (!buildingId) return;
    try {
      setFloorsLoading(true);
      const res = await api.get(`/api/buildings/${buildingId}/floors`);
      setFloors(res.data.data ?? []);
    } catch {
      showToast('Failed to load floors', 'error');
    } finally {
      setFloorsLoading(false);
    }
  }, [buildingId]);

  // ── Fetch supervisors assigned to building ─────────────────────────────────
  // GET /api/buildings/:id/details — returns supervisors[] (active + inactive)

  const fetchBuildingSupervisors = useCallback(async () => {
    if (!buildingId) return;
    try {
      setSupsLoading(true);
      const res = await api.get(`/api/buildings/${buildingId}/details`);
      setBuildingSups(res.data.data?.supervisors ?? []);
    } catch {
      showToast('Failed to load supervisors', 'error');
    } finally {
      setSupsLoading(false);
    }
  }, [buildingId]);

  // ── Fetch unassigned supervisors ───────────────────────────────────────────
  // GET /api/supervisors/unassigned — supervisors where building_id IS NULL

  const fetchUnassigned = useCallback(async () => {
    try {
      const res = await api.get('/api/buildings/supervisors/unassigned');
      console.log(res);

      setUnassigned(res.data.data ?? []);
    } catch {
      // Non-critical — silently skip
    }
  }, []);

  useEffect(() => {
    fetchBuildingData();
    fetchFloors();
    fetchBuildingSupervisors();
    fetchUnassigned();
  }, [fetchBuildingData, fetchFloors, fetchBuildingSupervisors, fetchUnassigned]);

  // ── Building form submit ───────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    try {
      await updateBuilding(buildingId!, {
        building_name: formData.building_name,
        location: formData.location,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseInt(formData.radius),
      });
      showToast('Building updated successfully', 'success');
      setTimeout(() => navigate(`/admin/buildings/${buildingId}`), 1200);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  // ── Floor: save (add or edit) ──────────────────────────────────────────────

  const handleSaveFloor = async (data: {
    floor_number: string;
    floor_name: string;
    notes: string;
  }) => {
    if (!buildingId) return;
    setSavingFloor(true);
    try {
      if (floorModal?.mode === 'add') {
        // POST /api/buildings/:id/floors
        const res = await api.post(`/api/buildings/${buildingId}/floors`, {
          floor_number: parseInt(data.floor_number),
          floor_name: data.floor_name.trim(),
          notes: data.notes.trim() || undefined,
        });
        setFloors((prev) =>
          [...prev, res.data.data].sort((a, b) => a.floor_number - b.floor_number)
        );
        showToast('Floor added successfully', 'success');
      } else if (floorModal?.mode === 'edit' && floorModal.floor) {
        // PUT /api/buildings/:id/floors/:floorId
        const res = await api.put(`/api/buildings/${buildingId}/floors/${floorModal.floor.id}`, {
          floor_number: parseInt(data.floor_number),
          floor_name: data.floor_name.trim(),
          notes: data.notes.trim() || undefined,
        });
        setFloors((prev) =>
          prev
            .map((f) => (f.id === floorModal.floor!.id ? res.data.data : f))
            .sort((a, b) => a.floor_number - b.floor_number)
        );
        showToast('Floor updated successfully', 'success');
      }
      setFloorModal(null);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSavingFloor(false);
    }
  };

  // ── Floor: delete ──────────────────────────────────────────────────────────

  const handleDeleteFloor = async (floor: Floor) => {
    if (!buildingId) return;
    setDeletingFloor(floor.id);
    try {
      // DELETE /api/buildings/:id/floors/:floorId
      await api.delete(`/api/buildings/${buildingId}/floors/${floor.id}`);
      setFloors((prev) => prev.filter((f) => f.id !== floor.id));
      showToast(`"${floor.floor_name}" deleted`, 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDeletingFloor(null);
    }
  };

  // ── Supervisor: assign ─────────────────────────────────────────────────────

  const handleAssign = async () => {
    if (!selectedSupId || !buildingId) return;
    setAssigning(true);
    try {
      await api.post(`/api/buildings/${buildingId}/supervisors`, { supervisorId: selectedSupId });
      showToast('Supervisor assigned successfully', 'success');
      setSelectedSupId('');
      await fetchBuildingSupervisors();
      await fetchUnassigned();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setAssigning(false);
    }
  };

  // ── Supervisor: toggle active ──────────────────────────────────────────────

  const handleToggle = async (supervisorId: string) => {
    if (!buildingId) return;
    setToggling(supervisorId);
    try {
      const res = await api.patch(
        `/api/buildings/${buildingId}/supervisors/${supervisorId}/toggle`
      );
      setBuildingSups((prev) =>
        prev.map((s) => (s.id === supervisorId ? { ...s, is_active: res.data.data.is_active } : s))
      );
      showToast(res.data.message, 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setToggling(null);
    }
  };

  // ── Supervisor: remove from building ──────────────────────────────────────

  const handleRemove = async (supervisorId: string) => {
    if (!buildingId) return;
    setRemoving(supervisorId);
    try {
      await api.delete(`/api/buildings/${buildingId}/supervisors/${supervisorId}`);
      setBuildingSups((prev) => prev.filter((s) => s.id !== supervisorId));
      showToast('Supervisor removed from building', 'success');
      await fetchUnassigned();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setRemoving(null);
    }
  };

  // ─── Loading screen ────────────────────────────────────────────────────────

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-medium">Loading building…</p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pop { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
      `}</style>

      {toast && <ToastBanner toast={toast} onClose={() => setToast(null)} />}

      {floorModal && (
        <FloorModal
          title={floorModal.mode === 'add' ? 'Add Floor' : 'Edit Floor'}
          initial={
            floorModal.floor
              ? {
                  floor_number: String(floorModal.floor.floor_number),
                  floor_name: floorModal.floor.floor_name,
                  notes: floorModal.floor.notes ?? '',
                }
              : null
          }
          onSave={handleSaveFloor}
          onClose={() => setFloorModal(null)}
          saving={savingFloor}
        />
      )}

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/admin/buildings/${buildingId}`)}
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
                Admin / Buildings
              </p>
              <h1 className="text-base font-extrabold text-slate-900">Edit Building</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate(`/admin/buildings/${buildingId}`)}
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
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className=" mx-auto px-6 py-8 space-y-6">
        {formError && (
          <div className="flex items-center gap-3 px-5 py-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <svg
              className="w-4 h-4 text-red-400 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            {formError}
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="ml-auto text-red-300 hover:text-red-500 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Row 1: Building info + Geo ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Building info */}
          <Section
            iconBg="bg-blue-50"
            icon={
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                />
              </svg>
            }
            title="Building Information"
            sub="Name and physical address"
          >
            <div className="space-y-4">
              <div>
                <label className={labelCls}>
                  Building Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="building_name"
                  value={formData.building_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Marina Heights"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>
                  Address / Location <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="Full street address"
                  className={inputCls}
                />
              </div>
            </div>
          </Section>

          {/* Geo-location */}
          <Section
            iconBg="bg-emerald-50"
            icon={
              <svg
                className="w-5 h-5 text-emerald-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
            }
            title="Geo-Location"
            sub="GPS coordinates for attendance tracking"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    Latitude <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    required
                    placeholder="10.8505"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    Longitude <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    required
                    placeholder="76.2711"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  Attendance Radius (m) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="radius"
                  value={formData.radius}
                  onChange={handleChange}
                  required
                  placeholder="100"
                  className={inputCls}
                />
              </div>
              <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                Changing coordinates may affect attendance tracking for existing employees.
              </div>
            </div>
          </Section>
        </div>

        {/* ── Row 2: Floors + Supervisors ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Floor management ──────────────────────────────────────────────── */}
          <Section
            iconBg="bg-indigo-50"
            icon={
              <svg
                className="w-5 h-5 text-indigo-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122"
                />
              </svg>
            }
            title="Floor Management"
            sub="Add, edit, or remove floors in this building"
            action={
              <button
                type="button"
                onClick={() => setFloorModal({ mode: 'add', floor: null })}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shrink-0"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Floor
              </button>
            }
          >
            {floorsLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-sm text-slate-400">
                <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                Loading floors…
              </div>
            ) : floors.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl">
                <svg
                  className="w-10 h-10 text-slate-200 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122"
                  />
                </svg>
                <p className="text-sm text-slate-400">No floors yet</p>
                <p className="text-xs text-slate-300 mt-1">
                  Click "Add Floor" to create the first one
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {floors.map((floor) => (
                  <FloorRow
                    key={floor.id}
                    floor={floor}
                    onEdit={(f) => setFloorModal({ mode: 'edit', floor: f })}
                    onDelete={handleDeleteFloor}
                    deleting={deletingFloor}
                  />
                ))}
              </div>
            )}

            <div className="mt-4 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400">
              Floors with active cleaners assigned cannot be deleted — reassign cleaners first.
            </div>
          </Section>

          {/* ── Supervisor management ──────────────────────────────────────────── */}
          <Section
            iconBg="bg-violet-50"
            icon={
              <svg
                className="w-5 h-5 text-violet-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            }
            title="Supervisor Management"
            sub="Multiple supervisors allowed per building"
          >
            <div className="space-y-5">
              {/* Assign dropdown */}
              <div>
                <p className={labelCls}>Assign Supervisor</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={selectedSupId}
                      onChange={(e) => setSelectedSupId(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 pr-9 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    >
                      <option value="">
                        {unassigned.length === 0
                          ? 'No unassigned supervisors'
                          : 'Select a supervisor…'}
                      </option>
                      {unassigned.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name}
                        </option>
                      ))}
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
                  <button
                    type="button"
                    onClick={handleAssign}
                    disabled={!selectedSupId || assigning}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center gap-2 shrink-0"
                  >
                    {assigning ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
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
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                    )}
                    Assign
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Only supervisors not assigned to any building appear here. Register supervisors
                  first, then assign them here.
                </p>
              </div>

              <div className="border-t border-slate-100" />

              {/* Current supervisors */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className={labelCls}>Current Supervisors</p>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                    {buildingSups.length}
                  </span>
                </div>

                {supsLoading ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-sm text-slate-400">
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
                    Loading…
                  </div>
                ) : buildingSups.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl">
                    <svg
                      className="w-10 h-10 text-slate-200 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                    <p className="text-sm text-slate-400">No supervisors assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {buildingSups.map((sup) => (
                      <SupervisorRow
                        key={sup.id}
                        sup={sup}
                        onToggle={handleToggle}
                        onRemove={handleRemove}
                        toggling={toggling}
                        removing={removing}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 space-y-1">
                <p>
                  <span className="font-semibold text-amber-600">Pause/Play</span> — toggle active
                  status
                </p>
                <p>
                  <span className="font-semibold text-red-500">✕</span> — remove from building
                  (supervisor becomes unassigned, not deleted)
                </p>
              </div>
            </div>
          </Section>
        </div>

        {/* Bottom save bar */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate(`/admin/buildings/${buildingId}`)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Discard changes
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
            ) : (
              'Save Building'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBuilding;
