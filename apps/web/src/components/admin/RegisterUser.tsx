import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/commonAPI';
import { registerUser } from '../../services/allAPI';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Building {
  id: string;
  building_name: string;
  location?: string;
}

interface Supervisor {
  id: string; // supervisors.id (PK) — this is what cleaners.supervisor_id stores
  user_id: string;
  full_name: string;
  building_id: string;
  is_active: boolean;
}

interface Floor {
  id: string;
  floor_number: string;
  building_id: string;
}

interface FormState {
  role: string;
  full_name: string;
  email: string;
  password: string;
  phone: string;
  age: string;
  nationality: string;
  document_id: string;
  building_id: string;
  floor_id: string;
  supervisor_id: string; // supervisors.id (PK), not user_id
  base_salary: string;
}

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_META: Record<string, { label: string; accent: string }> = {
  supervisor: { label: 'Supervisor', accent: '#2563EB' },
  cleaner: { label: 'Cleaner', accent: '#059669' },
  admin: { label: 'Admin', accent: '#7C3AED' },
  accountant: { label: 'Accountant', accent: '#D97706' },
  super_admin: { label: 'Super Admin', accent: '#DC2626' },
};

// ─── Style helpers ────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%',
  border: '1.5px solid #E2E8F0',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '0.9rem',
  color: '#0F172A',
  background: '#FAFBFC',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: 'inherit',
};

const inputFocused = (accent: string): React.CSSProperties => ({
  ...inputBase,
  borderColor: accent,
  boxShadow: `0 0 0 3px ${accent}22`,
  background: '#fff',
});

const selectStyle = (accent: string, isFocused: boolean): React.CSSProperties => ({
  ...(isFocused ? inputFocused(accent) : inputBase),
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '36px',
});

const disabledSelect: React.CSSProperties = {
  ...inputBase,
  opacity: 0.5,
  cursor: 'not-allowed',
  background: '#F1F5F9',
};

// ─── Micro components ─────────────────────────────────────────────────────────

const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({
  children,
  required,
}) => (
  <label
    style={{
      display: 'block',
      fontSize: '0.73rem',
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: '#64748B',
      marginBottom: '6px',
    }}
  >
    {children}
    {required && <span style={{ color: '#EF4444', marginLeft: '3px' }}>*</span>}
  </label>
);

const Field: React.FC<{
  label: string;
  required?: boolean;
  colSpan?: boolean;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, required, colSpan, hint, children }) => (
  <div style={{ gridColumn: colSpan ? '1 / -1' : undefined }}>
    <Label required={required}>{label}</Label>
    {children}
    {hint && <p style={{ margin: '5px 0 0', fontSize: '0.72rem', color: '#94A3B8' }}>{hint}</p>}
  </div>
);

const SectionHeader: React.FC<{ step: number; title: string; sub: string; accent: string }> = ({
  step,
  title,
  sub,
  accent,
}) => (
  <div style={{ marginBottom: '22px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
      <span
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '7px',
          background: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#fff',
          flexShrink: 0,
        }}
      >
        {step}
      </span>
      <h2
        style={{
          margin: 0,
          fontSize: '0.97rem',
          fontWeight: 700,
          color: '#0F172A',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>
    </div>
    <p style={{ margin: '0 0 0 36px', fontSize: '0.78rem', color: '#94A3B8' }}>{sub}</p>
  </div>
);

const LoadingRow: React.FC<{ accent: string; text: string }> = ({ accent, text }) => (
  <div
    style={{
      ...inputBase,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#94A3B8',
      background: '#F8FAFC',
    }}
  >
    <svg
      style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={accent}
      strokeWidth="2.5"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
    <span style={{ fontSize: '0.85rem' }}>{text}</span>
  </div>
);

const WarnBox: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 12px',
      borderRadius: '8px',
      background: '#FFFBEB',
      border: '1px solid #FDE68A',
      fontSize: '0.77rem',
      color: '#B45309',
      marginTop: '8px',
    }}
  >
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
    {text}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const RegisterUser: React.FC = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();

  const meta = ROLE_META[role ?? ''] ?? ROLE_META['admin'];
  const accent = meta.accent;

  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Lists
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);

  // Per-section loading flags
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);

  const [form, setForm] = useState<FormState>({
    role: role ?? '',
    full_name: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    nationality: '',
    document_id: '',
    building_id: '',
    floor_id: '',
    supervisor_id: '',
    base_salary: '',
  });

  // ── API calls ──────────────────────────────────────────────────────────────

  const loadBuildings = useCallback(async () => {
    setLoadingBuildings(true);
    try {
      // GET /api/buildings
      const res = await api.get('/api/buildings');
      setBuildings(res.data.data ?? []);
    } catch {
      alert('Failed to load buildings');
    } finally {
      setLoadingBuildings(false);
    }
  }, []);

  /**
   * Called when a building is selected (cleaner form).
   * Hits two dedicated endpoints in parallel:
   *   GET /api/buildings/:buildingId/floors
   *   GET /api/buildings/:buildingId/supervisors
   */
  const loadFloorsAndSupervisors = useCallback(async (buildingId: string) => {
    setFloors([]);
    setSupervisors([]);
    setForm((prev) => ({ ...prev, floor_id: '', supervisor_id: '' }));

    if (!buildingId) return;

    setLoadingFloors(true);
    setLoadingSupervisors(true);

    const [floorsResult, supervisorsResult] = await Promise.allSettled([
      api.get(`/api/buildings/${buildingId}/floors`),
      api.get(`/api/buildings/${buildingId}/supervisors`),
    ]);

    if (floorsResult.status === 'fulfilled') {
      setFloors(floorsResult.value.data.data ?? []);
    } else {
      alert('Failed to load floors for this building');
    }

    if (supervisorsResult.status === 'fulfilled') {
      setSupervisors(supervisorsResult.value.data.data ?? []);
    } else {
      alert('Failed to load supervisors for this building');
    }

    setLoadingFloors(false);
    setLoadingSupervisors(false);
  }, []);

  // ── On mount ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (role === 'supervisor' || role === 'cleaner') {
      loadBuildings();
    }
  }, [role, loadBuildings]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBuildingChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const buildingId = e.target.value;
    setForm((prev) => ({ ...prev, building_id: buildingId, floor_id: '', supervisor_id: '' }));
    await loadFloorsAndSupervisors(buildingId);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfilePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!docFile) {
      alert('Document file is required');
      return;
    }
    if (
      !form.full_name ||
      !form.email ||
      !form.password ||
      !form.age ||
      !form.nationality ||
      !form.document_id ||
      !form.base_salary
    ) {
      alert('Please fill in all required fields');
      return;
    }
    if ((form.role === 'supervisor' || form.role === 'cleaner') && !form.building_id) {
      alert('Please select a building');
      return;
    }
    if (form.role === 'cleaner' && !form.floor_id) {
      alert('Please select a floor');
      return;
    }

    try {
      setSubmitting(true);

      const fd = new FormData();
      fd.append('role', form.role);
      fd.append('email', form.email.trim());
      fd.append('password', form.password);
      fd.append('full_name', form.full_name);
      fd.append('phone', form.phone || '');
      fd.append('age', form.age);
      fd.append('nationality', form.nationality);
      fd.append('document_id', form.document_id);
      fd.append('base_salary', form.base_salary);
      fd.append('document', docFile);
      if (profilePhoto) fd.append('profile_image', profilePhoto);

      if (form.role === 'supervisor') {
        fd.append('building_id', form.building_id);
      }

      if (form.role === 'cleaner') {
        fd.append('building_id', form.building_id);
        fd.append('floor_id', form.floor_id);
        // supervisor_id is supervisors.id (PK), not user_id
        if (form.supervisor_id) fd.append('supervisor_id', form.supervisor_id);
      }

      const response = await registerUser(fd);

      if (response.success) {
        alert(`${meta.label} registered successfully`);
        navigate(-1);
      } else {
        alert(response.message ?? 'Failed to create user');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Style shortcuts ────────────────────────────────────────────────────────

  const inp = (name: string) => (focusedField === name ? inputFocused(accent) : inputBase);
  const sel = (name: string) => selectStyle(accent, focusedField === name);
  const foc = (name: string) => () => setFocusedField(name);
  const blur = () => setFocusedField(null);

  const sectionStyle: React.CSSProperties = {
    padding: '28px 32px',
    borderBottom: '1px solid #F1F5F9',
  };
  const grid2: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2,1fr)',
    gap: '16px',
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F1F5F9',
        padding: '32px 16px',
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
        input[type=number]{-moz-appearance:textfield}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={{ maxWidth: '740px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '9px',
              border: '1.5px solid #E2E8F0',
              background: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              flexShrink: 0,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            >
              {meta.label[0]}
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  letterSpacing: '-0.02em',
                }}
              >
                Register {meta.label}
              </h1>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8' }}>
                Fill in the details to create a new account
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}
          >
            {/* ── Section 1: Personal ── */}
            <div style={sectionStyle}>
              <SectionHeader
                step={1}
                title="Personal Information"
                sub="Basic identity details"
                accent={accent}
              />

              {/* Profile photo */}
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                  padding: '16px',
                  background: '#F8FAFC',
                  borderRadius: '11px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '22px',
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {profilePreview ? (
                    <>
                      <img
                        src={profilePreview}
                        alt="Preview"
                        style={{
                          width: '64px',
                          height: '64px',
                          objectFit: 'cover',
                          borderRadius: '11px',
                          border: '2px solid #E2E8F0',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePhoto(null);
                          setProfilePreview('');
                        }}
                        style={{
                          position: 'absolute',
                          top: '-7px',
                          right: '-7px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#EF4444',
                          border: 'none',
                          color: '#fff',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '11px',
                        background: '#E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94A3B8"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: '0 0 5px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#475569',
                    }}
                  >
                    Profile Photo{' '}
                    <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span>
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{
                      fontSize: '0.8rem',
                      color: '#64748B',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  />
                </div>
              </div>

              <div style={grid2}>
                <Field label="Full Name" required>
                  <input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="John Smith"
                    required
                    style={inp('full_name')}
                    onFocus={foc('full_name')}
                    onBlur={blur}
                  />
                </Field>
                <Field label="Email Address" required>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    required
                    style={inp('email')}
                    onFocus={foc('email')}
                    onBlur={blur}
                  />
                </Field>
                <Field label="Password" required>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Min. 8 characters"
                      required
                      style={{ ...inp('password'), paddingRight: '40px' }}
                      onFocus={foc('password')}
                      onBlur={blur}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      style={{
                        position: 'absolute',
                        right: '11px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94A3B8',
                        padding: 0,
                        display: 'flex',
                      }}
                    >
                      {showPassword ? (
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </Field>
                <Field label="Phone Number">
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+971 50 123 4567"
                    style={inp('phone')}
                    onFocus={foc('phone')}
                    onBlur={blur}
                  />
                </Field>
                <Field label="Age" required>
                  <input
                    type="number"
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    placeholder="25"
                    required
                    min="18"
                    max="70"
                    style={inp('age')}
                    onFocus={foc('age')}
                    onBlur={blur}
                  />
                </Field>
                <Field label="Nationality" required>
                  <input
                    type="text"
                    name="nationality"
                    value={form.nationality}
                    onChange={handleChange}
                    placeholder="e.g. Indian, Filipino"
                    required
                    style={inp('nationality')}
                    onFocus={foc('nationality')}
                    onBlur={blur}
                  />
                </Field>
              </div>
            </div>

            {/* ── Section 2: Documents & Finance ── */}
            <div style={sectionStyle}>
              <SectionHeader
                step={2}
                title="Documents & Finance"
                sub="Verification and compensation details"
                accent={accent}
              />
              <div style={grid2}>
                <Field label="Document ID" required>
                  <input
                    type="text"
                    name="document_id"
                    value={form.document_id}
                    onChange={handleChange}
                    placeholder="Passport / Emirates ID"
                    required
                    style={inp('document_id')}
                    onFocus={foc('document_id')}
                    onBlur={blur}
                  />
                </Field>
                <Field label="Base Salary (AED)" required>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '13px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        color: '#94A3B8',
                        pointerEvents: 'none',
                      }}
                    >
                      AED
                    </span>
                    <input
                      type="number"
                      name="base_salary"
                      value={form.base_salary}
                      onChange={handleChange}
                      placeholder="3000"
                      required
                      min="0"
                      style={{ ...inp('base_salary'), paddingLeft: '50px' }}
                      onFocus={foc('base_salary')}
                      onBlur={blur}
                    />
                  </div>
                </Field>
                <Field label="Document File" required colSpan>
                  <div
                    style={{
                      border: '1.5px dashed #CBD5E1',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      background: '#F8FAFC',
                    }}
                  >
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setDocFile(e.target.files[0]);
                      }}
                      required
                      style={{
                        width: '100%',
                        fontSize: '0.82rem',
                        color: '#64748B',
                        cursor: 'pointer',
                      }}
                    />
                    {docFile && (
                      <div
                        style={{
                          marginTop: '9px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          fontSize: '0.79rem',
                          color: '#059669',
                          background: '#ECFDF5',
                          padding: '7px 10px',
                          borderRadius: '7px',
                        }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span style={{ fontWeight: 500 }}>{docFile.name}</span>
                      </div>
                    )}
                  </div>
                </Field>
              </div>
            </div>

            {/* ── Section 3: Assignment ── */}
            {(form.role === 'supervisor' || form.role === 'cleaner') && (
              <div style={{ ...sectionStyle, animation: 'fadeIn 0.2s ease' }}>
                <SectionHeader
                  step={3}
                  title="Assignment Details"
                  sub="Work location and reporting structure"
                  accent={accent}
                />

                <div style={grid2}>
                  {/* ── SUPERVISOR: pick building only ── */}
                  {form.role === 'supervisor' && (
                    <Field label="Assigned Building" required colSpan hint="GET /api/buildings">
                      {loadingBuildings ? (
                        <LoadingRow accent={accent} text="Loading buildings…" />
                      ) : (
                        <select
                          name="building_id"
                          value={form.building_id}
                          onChange={handleChange}
                          required
                          style={sel('building_id')}
                          onFocus={foc('building_id')}
                          onBlur={blur}
                        >
                          <option value="">Select a building…</option>
                          {buildings.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.building_name}
                              {b.location ? ` — ${b.location}` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </Field>
                  )}

                  {/* ── CLEANER: building → floors + supervisors in parallel ── */}
                  {form.role === 'cleaner' && (
                    <>
                      {/* Step 1: Building */}
                      <Field
                        label="Building"
                        required
                        colSpan
                        hint="Select building first — floors and supervisors load automatically."
                      >
                        {loadingBuildings ? (
                          <LoadingRow accent={accent} text="Loading buildings…" />
                        ) : (
                          <select
                            name="building_id"
                            value={form.building_id}
                            onChange={handleBuildingChange}
                            required
                            style={sel('building_id')}
                            onFocus={foc('building_id')}
                            onBlur={blur}
                          >
                            <option value="">Select a building…</option>
                            {buildings.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.building_name}
                                {b.location ? ` — ${b.location}` : ''}
                              </option>
                            ))}
                          </select>
                        )}
                      </Field>

                      {/* Step 2: Floor — GET /api/buildings/:buildingId/floors */}
                      {form.building_id && (
                        <Field
                          label="Floor"
                          required
                          colSpan
                          hint={`GET /api/buildings/${form.building_id}/floors`}
                        >
                          {loadingFloors ? (
                            <LoadingRow accent={accent} text="Loading floors…" />
                          ) : (
                            <>
                              <select
                                name="floor_id"
                                value={form.floor_id}
                                onChange={handleChange}
                                required
                                style={floors.length === 0 ? disabledSelect : sel('floor_id')}
                                disabled={floors.length === 0}
                                onFocus={foc('floor_id')}
                                onBlur={blur}
                              >
                                <option value="">
                                  {floors.length === 0 ? 'No floors found' : 'Select a floor…'}
                                </option>
                                {floors.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    Floor {f.floor_number}
                                  </option>
                                ))}
                              </select>
                              {floors.length === 0 && (
                                <WarnBox text="No floors found for this building. Add floors first." />
                              )}
                            </>
                          )}
                        </Field>
                      )}

                      {/* Step 3: Supervisor — GET /api/buildings/:buildingId/supervisors */}
                      {form.building_id && (
                        <Field
                          label="Supervisor (optional)"
                          colSpan
                          hint={`GET /api/buildings/${form.building_id}/supervisors — only active supervisors shown`}
                        >
                          {loadingSupervisors ? (
                            <LoadingRow accent={accent} text="Loading supervisors…" />
                          ) : (
                            <>
                              <select
                                name="supervisor_id"
                                value={form.supervisor_id}
                                onChange={handleChange}
                                style={
                                  supervisors.length === 0 ? disabledSelect : sel('supervisor_id')
                                }
                                disabled={supervisors.length === 0}
                                onFocus={foc('supervisor_id')}
                                onBlur={blur}
                              >
                                <option value="">
                                  {supervisors.length === 0
                                    ? 'No active supervisors in this building'
                                    : 'Select a supervisor… (optional)'}
                                </option>
                                {supervisors.map((s) => (
                                  // s.id = supervisors.id (PK) — what cleaners.supervisor_id stores
                                  <option key={s.id} value={s.id}>
                                    {s.full_name}
                                  </option>
                                ))}
                              </select>
                              {supervisors.length === 0 && (
                                <WarnBox text="No active supervisors in this building. You can assign one later." />
                              )}
                            </>
                          )}
                        </Field>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── Footer ── */}
            <div
              style={{ padding: '20px 32px', background: '#F8FAFC', display: 'flex', gap: '10px' }}
            >
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: '1.5px solid #E2E8F0',
                  background: '#fff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.87rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '11px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  background: submitting ? '#CBD5E1' : accent,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: submitting ? 'none' : `0 4px 14px ${accent}44`,
                  letterSpacing: '-0.01em',
                }}
              >
                {submitting ? (
                  <>
                    <svg
                      style={{ animation: 'spin 0.8s linear infinite' }}
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Creating…
                  </>
                ) : (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Create {meta.label}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterUser;
