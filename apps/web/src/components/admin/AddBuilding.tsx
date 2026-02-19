import React, { useState } from 'react';
import { createBuilding } from '../../services/allAPI';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Floor {
  id: string;
  floor_name: string;
  notes: string;
}

interface FormData {
  building_name: string;
  location: string;
  latitude: string;
  longitude: string;
  radius: string;
}

// ─── Field Components ──────────────────────────────────────────────────────────

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
    {children}
    {required && <span className="text-red-400 ml-0.5">*</span>}
  </label>
);

const TextInput = ({
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  step,
  icon,
  required,
}: {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  step?: string;
  icon?: React.ReactNode;
  required?: boolean;
}) => (
  <div className="relative group">
    {icon && (
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-400 transition-colors pointer-events-none">
        {icon}
      </span>
    )}
    <input
      name={name}
      type={type}
      step={step}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50
        text-sm text-slate-800 font-medium placeholder:text-slate-300
        focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
        hover:border-slate-300 transition-all`}
    />
  </div>
);

// ─── Icons ─────────────────────────────────────────────────────────────────────

const Icon = {
  building: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
      />
    </svg>
  ),
  pin: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    </svg>
  ),
  radius: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 3.75a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM3.75 7.5a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5H3.75zM3 12.75a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zM3.75 16.5a.75.75 0 000 1.5H12a.75.75 0 000-1.5H3.75z"
      />
    </svg>
  ),
  lat: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
      />
    </svg>
  ),
  floor: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122"
      />
    </svg>
  ),
  note: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
      />
    </svg>
  ),
};

// ─── Floor Card ────────────────────────────────────────────────────────────────

const FloorCard = ({
  floor,
  index,
  total,
  onChange,
  onRemove,
}: {
  floor: Floor;
  index: number;
  total: number;
  onChange: (id: string, field: string, val: string) => void;
  onRemove: (id: string) => void;
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all group animate-fade-up">
    {/* Floor header */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-extrabold">
          {index + 1}
        </div>
        <p className="text-sm font-bold text-slate-700">Floor {index + 1}</p>
      </div>
      {total > 1 && (
        <button
          type="button"
          onClick={() => onRemove(floor.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300
            hover:bg-red-50 hover:text-red-500 hover:border hover:border-red-100 transition-all opacity-0 group-hover:opacity-100"
          title="Remove floor"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>

    {/* Fields */}
    <div className="space-y-3">
      <div>
        <Label required>Floor Name</Label>
        <TextInput
          name="floor_name"
          value={floor.floor_name}
          onChange={(e) => onChange(floor.id, 'floor_name', e.target.value)}
          placeholder="e.g. Ground Floor, Level 1…"
          icon={Icon.floor}
          required
        />
      </div>
      <div>
        <Label>Notes</Label>
        <TextInput
          name="notes"
          value={floor.notes}
          onChange={(e) => onChange(floor.id, 'notes', e.target.value)}
          placeholder="Optional notes about this floor"
          icon={Icon.note}
        />
      </div>
    </div>
  </div>
);

// ─── Section Wrapper ────────────────────────────────────────────────────────────

const Section = ({
  step,
  title,
  description,
  icon,
  children,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-up">
    <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm font-extrabold shrink-0">
        {step}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <div className="text-slate-300">{icon}</div>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

const AddBuilding: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    building_name: '',
    location: '',
    latitude: '',
    longitude: '',
    radius: '100',
  });

  const [floors, setFloors] = useState<Floor[]>([
    { id: crypto.randomUUID(), floor_name: 'Ground Floor', notes: '' },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFloorChange = (id: string, field: string, value: string) => {
    setFloors((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const addFloor = () => {
    setFloors((prev) => [
      ...prev,
      { id: crypto.randomUUID(), floor_name: `Floor ${prev.length + 1}`, notes: '' },
    ]);
  };

  const removeFloor = (id: string) => {
    if (floors.length === 1) return;
    setFloors((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.building_name.trim()) {
      setError('Building name is required.');
      return;
    }
    if (!formData.location.trim()) {
      setError('Location is required.');
      return;
    }
    if (!formData.latitude) {
      setError('Latitude is required.');
      return;
    }
    if (!formData.longitude) {
      setError('Longitude is required.');
      return;
    }

    try {
      setSubmitting(true);
      await createBuilding({
        building_name: formData.building_name,
        location: formData.location,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseInt(formData.radius),
        floors: floors.map((f, i) => ({
          floor_number: i + 1,
          floor_name: f.floor_name,
          notes: f.notes,
        })),
      });
      navigate('/admin/buildings');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? err.message ?? 'Failed to create building.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create building.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isReady =
    formData.building_name.trim() &&
    formData.location.trim() &&
    formData.latitude &&
    formData.longitude &&
    floors.every((f) => f.floor_name.trim());

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/buildings"
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center
                text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
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
            </Link>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Admin / Buildings
              </p>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                Add New Building
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/buildings"
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !isReady}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700
                disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-sm"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{' '}
                  Creating…
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Create Building
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 py-8">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 px-5 py-3.5 mb-6 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-fade-in">
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
            {error}
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto text-red-300 hover:text-red-500 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── LEFT: building info ────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            <Section
              step={1}
              title="Building Details"
              description="Name and physical address"
              icon={Icon.building}
            >
              <div className="space-y-4">
                <div>
                  <Label required>Building Name</Label>
                  <TextInput
                    name="building_name"
                    value={formData.building_name}
                    onChange={handleChange}
                    placeholder="e.g. Tower A, Marina Block"
                    icon={Icon.building}
                    required
                  />
                </div>
                <div>
                  <Label required>Address / Location</Label>
                  <TextInput
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Full street address"
                    icon={Icon.pin}
                    required
                  />
                </div>
              </div>
            </Section>

            <Section
              step={2}
              title="Geo-Location"
              description="Coordinates and attendance radius"
              icon={Icon.lat}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Latitude</Label>
                    <TextInput
                      name="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={handleChange}
                      placeholder="10.8505"
                      icon={Icon.lat}
                      required
                    />
                  </div>
                  <div>
                    <Label required>Longitude</Label>
                    <TextInput
                      name="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={handleChange}
                      placeholder="76.2711"
                      icon={Icon.lat}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label required>Attendance Radius (m)</Label>
                  <TextInput
                    name="radius"
                    type="number"
                    value={formData.radius}
                    onChange={handleChange}
                    placeholder="100"
                    icon={Icon.radius}
                    required
                  />
                  {/* Radius preview */}
                  <div className="mt-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Radius Preview
                      </span>
                      <span className="text-xs font-bold text-blue-600">
                        {formData.radius || 0}m
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, ((parseInt(formData.radius) || 0) / 500) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-slate-300">0m</span>
                      <span className="text-[10px] text-slate-300">500m</span>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* Summary chip */}
            <div className="px-5 py-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-4 animate-fade-up">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
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
                    d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Floors configured
                </p>
                <p className="text-2xl font-extrabold text-slate-900">{floors.length}</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: floors ─────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Floor section header */}
            <div className="flex items-center justify-between animate-fade-up">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm font-extrabold shrink-0">
                  3
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Floor Configuration</p>
                  <p className="text-xs text-slate-400">Define each floor of the building</p>
                </div>
              </div>

              <button
                type="button"
                onClick={addFloor}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100
                  border border-blue-200 text-blue-700 text-sm font-semibold transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Floor
              </button>
            </div>

            {/* Floor cards */}
            <div className="space-y-3">
              {floors.map((floor, idx) => (
                <FloorCard
                  key={floor.id}
                  floor={floor}
                  index={idx}
                  total={floors.length}
                  onChange={handleFloorChange}
                  onRemove={removeFloor}
                />
              ))}
            </div>

            {/* Add floor inline button */}
            <button
              type="button"
              onClick={addFloor}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-semibold
                text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50
                flex items-center justify-center gap-2 transition-all"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add another floor
            </button>
          </div>
        </div>

        {/* ── Bottom action bar ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 animate-fade-up">
          <Link
            to="/admin/buildings"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
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
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Discard and go back
          </Link>

          <button
            type="submit"
            disabled={submitting || !isReady}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700
              disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold
              transition-colors shadow-md shadow-blue-200"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{' '}
                Creating…
              </>
            ) : (
              <>
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
                    d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18"
                  />
                </svg>
                Create Building
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBuilding;
