import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { errMsg } from '../../utils/errorUtils';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import {
  getCleanerDetail,
  updateCleaner,
  getCleanerBuildings,
  getFloorsForBuilding,
  getSupervisorsForBuilding,
  type CleanerDetail,
  type UpdateCleanerPayload,
  type FloorOption,
  type SupervisorOption,
  type BuildingDropdownItem,
} from '../../services/allAPI';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const initials = (n: string) =>
  n
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
const COLORS = [
  '#3B5BDB',
  '#1971C2',
  '#0C8599',
  '#2F9E44',
  '#E67700',
  '#C2255C',
  '#9C36B5',
  '#5C7CFA',
];
const ac = (n: string) => COLORS[n.charCodeAt(0) % COLORS.length];
// ─── Field components ─────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, required, hint, children }) => (
  <div>
    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { error?: string }> = ({
  error,
  className = '',
  ...props
}) => (
  <>
    <input
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 bg-white transition-all
        focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
        ${error ? 'border-red-300 bg-red-50' : 'border-slate-200'}
        disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
        ${className}`}
    />
    {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
  </>
);

const Select: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string; loading?: boolean }
> = ({ error, loading, className = '', children, ...props }) => (
  <>
    <div className="relative">
      <select
        {...props}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 bg-white transition-all appearance-none
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
          ${error ? 'border-red-300 bg-red-50' : 'border-slate-200'}
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          ${className}`}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        {loading ? (
          <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
    </div>
    {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
  </>
);

// ─── Section divider ──────────────────────────────────────────────────────────
const Section: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, icon, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
interface FormState {
  full_name: string;
  email: string;
  phone: string;
  age: string;
  nationality: string;
  document_id: string;
  base_salary: string;
  password: string;
  building_id: string;
  floor_id: string;
  supervisor_id: string;
}

interface FormErrors {
  [k: string]: string;
}

const EditCleaner: React.FC = () => {
  const { cleanerId } = useParams<{ cleanerId: string }>();
  const navigate = useNavigate();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [cleaner, setCleaner] = useState<CleanerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const { showToast } = useAlert();

  // dropdown options
  const [buildings, setBuildings] = useState<BuildingDropdownItem[]>([]);
  const [floors, setFloors] = useState<FloorOption[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingSups, setLoadingSups] = useState(false);

  // ── Load cleaner + buildings ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!cleanerId) return;
    try {
      setLoading(true);
      const [r, bds] = await Promise.all([getCleanerDetail(cleanerId), getCleanerBuildings()]);
      const d = r.data;
      setCleaner(d);
      setBuildings(bds);
      setForm({
        full_name: d.fullName,
        email: d.email,
        phone: d.phone ?? '',
        age: d.age?.toString() ?? '',
        nationality: d.nationality ?? '',
        document_id: d.documentId ?? '',
        base_salary: d.baseSalary?.toString() ?? '',
        password: '',
        building_id: d.building?.id ?? '',
        floor_id: d.floor?.id ?? '',
        supervisor_id: d.supervisor?.id ?? '',
      });
      // pre-load floors and supervisors for current building
      if (d.building?.id) {
        const [fls, sps] = await Promise.all([
          getFloorsForBuilding(d.building.id),
          getSupervisorsForBuilding(d.building.id),
        ]);
        setFloors(fls);
        setSupervisors(sps);
      }
    } catch (e) {
      showToast(errMsg(e), 'error');
    } finally {
      setLoading(false);
    }
  }, [cleanerId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) void loadData();
  }, [authLoading, isAuthenticated, loadData]);

  // ── Building cascade ──────────────────────────────────────────────────────
  const handleBuildingChange = async (buildingId: string) => {
    setForm((f) => (f ? { ...f, building_id: buildingId, floor_id: '', supervisor_id: '' } : f));
    setFloors([]);
    setSupervisors([]);
    if (!buildingId) return;
    setLoadingFloors(true);
    setLoadingSups(true);
    try {
      const [fls, sps] = await Promise.all([
        getFloorsForBuilding(buildingId),
        getSupervisorsForBuilding(buildingId),
      ]);
      setFloors(fls);
      setSupervisors(sps);
    } catch (e) {
      showToast(errMsg(e), 'error');
    } finally {
      setLoadingFloors(false);
      setLoadingSups(false);
    }
  };

  // ── Field change ──────────────────────────────────────────────────────────
  const set = (k: keyof FormState, v: string) => {
    setForm((f) => (f ? { ...f, [k]: v } : f));
    setErrors((e) => {
      const n = { ...e };
      delete n[k];
      return n;
    });
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    if (!form) return false;
    const errs: FormErrors = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Invalid email address';
    if (form.age && (isNaN(Number(form.age)) || Number(form.age) < 18 || Number(form.age) > 80))
      errs.age = 'Age must be 18–80';
    if (form.base_salary && (isNaN(Number(form.base_salary)) || Number(form.base_salary) < 0))
      errs.base_salary = 'Must be a positive number';
    if (form.password && form.password.length < 8)
      errs.password = 'Password must be at least 8 characters';
    if (form.floor_id && !form.building_id) errs.floor_id = 'Select a building first';
    if (form.supervisor_id && !form.building_id) errs.supervisor_id = 'Select a building first';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate() || !form || !cleanerId) return;
    setSaving(true);
    try {
      const payload: UpdateCleanerPayload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone || undefined,
        age: form.age ? Number(form.age) : undefined,
        nationality: form.nationality || undefined,
        document_id: form.document_id || undefined,
        base_salary: form.base_salary ? Number(form.base_salary) : undefined,
        building_id: form.building_id || undefined,
        floor_id: form.floor_id || undefined,
        supervisor_id: form.supervisor_id || null,
      };
      if (form.password) payload.password = form.password;
      const res = await updateCleaner(cleanerId, payload);
      console.log(res);

      showToast('Cleaner updated successfully', 'success');
      setTimeout(() => navigate(`/admin/cleaner/${cleanerId}`), 1200);
    } catch (e) {
      showToast(errMsg(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading / error states ───────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-slate-400">Loading cleaner…</p>
        </div>
      </div>
    );
  if (!cleaner || !form)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-500">Cleaner not found.</p>
          <button
            onClick={() => navigate('/admin/cleaners')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl"
          >
            Back to Cleaners
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen">

      {/* ── Sticky top bar ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/admin/cleaner/${cleanerId}`)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
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
            <div className="flex items-center gap-3">
              {cleaner.profileImage ? (
                <img
                  src={cleaner.profileImage}
                  alt={cleaner.fullName}
                  className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: ac(cleaner.fullName) }}
                >
                  {initials(cleaner.fullName)}
                </div>
              )}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Editing
                </p>
                <p className="text-sm font-bold text-slate-900">{cleaner.fullName}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/admin/cleaner/${cleanerId}`)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {saving && (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Form body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* HISTORICAL DATA NOTE */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex gap-3">
          <svg
            className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Historical data is always preserved
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              Every task already recorded carries a snapshot of the building &amp; floor it was
              created in. Reassigning this cleaner to a new building, floor, or supervisor will only
              affect <strong>future tasks</strong> — all previous records remain fully accessible
              with their original location data.
            </p>
          </div>
        </div>

        {/* ── Personal information ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <Section
            title="Personal Information"
            subtitle="Basic profile and contact details"
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"
                />
              </svg>
            }
          >
            {/* Full name — full width */}
            <div className="sm:col-span-2">
              <Field label="Full Name" required>
                <Input
                  value={form.full_name}
                  onChange={(e) => set('full_name', e.target.value)}
                  placeholder="Enter full name"
                  error={errors.full_name}
                />
              </Field>
            </div>

            <Field label="Email" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="email@example.com"
                error={errors.email}
              />
            </Field>

            <Field label="Phone">
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+971 50 000 0000"
              />
            </Field>

            <Field label="Age" hint="Must be 18–80">
              <Input
                type="number"
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
                placeholder="e.g. 28"
                min={18}
                max={80}
                error={errors.age}
              />
            </Field>

            <Field label="Nationality">
              <Input
                value={form.nationality}
                onChange={(e) => set('nationality', e.target.value)}
                placeholder="e.g. Indian"
              />
            </Field>

            <Field label="Document ID">
              <Input
                value={form.document_id}
                onChange={(e) => set('document_id', e.target.value)}
                placeholder="Passport / Emirates ID"
              />
            </Field>

            <Field label="Base Salary (AED)" hint="Monthly base salary">
              <Input
                type="number"
                value={form.base_salary}
                onChange={(e) => set('base_salary', e.target.value)}
                placeholder="e.g. 1500"
                min={0}
                error={errors.base_salary}
              />
            </Field>
          </Section>
        </div>

        {/* ── Security ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <Section
            title="Security"
            subtitle="Leave blank to keep existing password"
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            }
          >
            <div className="sm:col-span-2">
              <Field
                label="New Password"
                hint="Minimum 8 characters. Leave blank to keep unchanged."
              >
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Enter new password (optional)"
                  error={errors.password}
                  autoComplete="new-password"
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* ── Assignment ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <Section
            title="Work Assignment"
            subtitle="Changing building resets floor and supervisor — previous task records are unaffected"
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15"
                />
              </svg>
            }
          >
            {/* Building ─ full width */}
            <div className="sm:col-span-2">
              <Field
                label="Building"
                hint="Selecting a new building will reload available floors and supervisors"
              >
                <Select
                  value={form.building_id}
                  onChange={(e) => void handleBuildingChange(e.target.value)}
                >
                  <option value="">— Unassigned —</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.building_name}
                      {b.location ? ` · ${b.location}` : ''}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {/* Floor */}
            <Field
              label="Floor"
              hint={
                !form.building_id
                  ? 'Select a building first'
                  : floors.length === 0
                    ? 'No floors in this building'
                    : undefined
              }
            >
              <Select
                value={form.floor_id}
                onChange={(e) => set('floor_id', e.target.value)}
                disabled={!form.building_id || loadingFloors}
                loading={loadingFloors}
                error={errors.floor_id}
              >
                <option value="">— No floor —</option>
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>
                    F{f.floor_number} · {f.floor_name}
                  </option>
                ))}
              </Select>
            </Field>

            {/* Supervisor */}
            <Field
              label="Supervisor"
              hint={
                !form.building_id
                  ? 'Select a building first'
                  : supervisors.length === 0
                    ? 'No active supervisors in this building'
                    : undefined
              }
            >
              <Select
                value={form.supervisor_id}
                onChange={(e) => set('supervisor_id', e.target.value)}
                disabled={!form.building_id || loadingSups}
                loading={loadingSups}
                error={errors.supervisor_id}
              >
                <option value="">— No supervisor —</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </Select>
            </Field>
          </Section>
        </div>

        {/* ── Current assignment preview ───────────────────────────────────── */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Current saved assignment
          </p>
          <div className="flex flex-wrap gap-2">
            {cleaner.building ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 text-xs font-semibold">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5"
                  />
                </svg>
                {cleaner.building.name}
              </span>
            ) : (
              <span className="text-xs text-slate-400 italic">No building</span>
            )}
            {cleaner.floor && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
                F{cleaner.floor.number} · {cleaner.floor.name}
              </span>
            )}
            {cleaner.supervisor ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 text-xs font-semibold">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"
                  />
                </svg>
                {cleaner.supervisor.name}
              </span>
            ) : (
              <span className="text-xs text-slate-400 italic">No supervisor</span>
            )}
          </div>
        </div>

        {/* ── Bottom action bar ────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            onClick={() => navigate(`/admin/cleaner/${cleanerId}`)}
            className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            {saving && (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {saving ? 'Saving Changes…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCleaner;
