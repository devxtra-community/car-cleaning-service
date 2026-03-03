import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getAllBuildings,
  getSupervisorDetails,
  toggleSupervisorStatus,
  updateSupervisor,
  type Supervisor,
  type UpdateSupervisorPayload,
} from '../../services/allAPI';
import Toast from '../shared/Toast';

// ─── types ────────────────────────────────────────────────────────────────────

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const initials = (name: string) =>
  name
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
  '#099268',
  '#D6336C',
];
const avatarColor = (name: string) => COLORS[name.charCodeAt(0) % COLORS.length];

// ─── sub-components ───────────────────────────────────────────────────────────

const InfoRow = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div style={s.infoRow}>
    <span style={s.infoLabel}>{label}</span>
    <span style={s.infoValue}>{value ?? '—'}</span>
  </div>
);

const StatCard = ({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  accent: string;
  icon: React.ReactNode;
}) => (
  <div style={{ ...s.statCard, borderTop: `3px solid ${accent}` }}>
    <div style={{ ...s.statIcon, background: `${accent}18`, color: accent }}>{icon}</div>
    <div style={s.statValue}>{value}</div>
    <div style={s.statLabel}>{label}</div>
  </div>
);

// ─── main component ───────────────────────────────────────────────────────────

const SupervisorDetails: React.FC = () => {
  const { supervisorId } = useParams<{ supervisorId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [buildings, setBuildings] = useState<{ id: string; building_name: string }[]>([]);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [cleanerSearch, setCleanerSearch] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchSupervisor = useCallback(async () => {
    if (!supervisorId) return;
    try {
      setLoading(true);
      setPageError(null);
      const data = await getSupervisorDetails(supervisorId);
      setSupervisor(data.data);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load supervisor';
      setPageError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, [supervisorId]);

  useEffect(() => {
    if (isAuthenticated && supervisorId) {
      fetchSupervisor();
      getAllBuildings()
        .then((data) => {
          const buildingsData = Array.isArray(data)
            ? data
            : ((data as { data?: unknown[] }).data ?? []);
          setBuildings(buildingsData);
        })
        .catch(() => {});
    }
  }, [supervisorId, isAuthenticated, fetchSupervisor]);

  // ── toggle status ──────────────────────────────────────────────────────────
  const handleToggleStatus = async () => {
    if (!supervisor) return;
    try {
      setTogglingStatus(true);
      await toggleSupervisorStatus(supervisor.id, !supervisor.is_active);
      setSupervisor((prev) => (prev ? { ...prev, is_active: !prev.is_active } : null));
      showToast(`Supervisor ${!supervisor.is_active ? 'activated' : 'deactivated'}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setTogglingStatus(false);
    }
  };

  // ── loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={s.centeredPage}>
        <style>{baseCSS}</style>
        <div style={s.spinner} className="sd-spin" />
        <p style={{ marginTop: 14, color: '#94A3B8', fontSize: 14 }}>Loading supervisor…</p>
      </div>
    );
  }

  if (pageError || !supervisor) {
    return (
      <div style={s.centeredPage}>
        <style>{baseCSS}</style>
        <div style={s.errorBox}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EF4444"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p style={{ color: '#EF4444', fontSize: 15, fontWeight: 600, margin: 0 }}>
            {pageError ?? 'Supervisor not found'}
          </p>
          <button style={s.backLink} onClick={() => navigate(-1)}>
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  // ── derived ────────────────────────────────────────────────────────────────
  const totalTasks = supervisor.cleaners.reduce((a, c) => a + (c.total_tasks || 0), 0);
  const totalEarnings = supervisor.cleaners.reduce((a, c) => a + (Number(c.total_earning) || 0), 0);
  const totalSalaries = supervisor.cleaners.reduce((a, c) => a + (Number(c.base_salary) || 0), 0);
  const avgIncentive =
    supervisor.cleaners.length > 0
      ? supervisor.cleaners.reduce((a, c) => a + (c.incentive_target || 0), 0) /
        supervisor.cleaners.length
      : 0;

  const filteredCleaners = supervisor.cleaners.filter(
    (c) =>
      c.full_name.toLowerCase().includes(cleanerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(cleanerSearch.toLowerCase())
  );

  const joinDate = supervisor.joining_date
    ? new Date(supervisor.joining_date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div style={s.page}>
      <style>{baseCSS}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Back + breadcrumb */}
      <div style={s.topNav}>
        <button style={s.backBtn} className="sd-back" onClick={() => navigate(-1)}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Supervisors
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span style={{ color: '#94A3B8' }}>Supervisors</span>
          <span style={{ color: '#CBD5E1' }}>/</span>
          <span style={{ color: '#1E293B', fontWeight: 600 }}>{supervisor.full_name}</span>
        </div>
      </div>

      {/* Hero card */}
      <div style={s.heroCard}>
        <div style={s.heroLeft}>
          {supervisor.profile_image ? (
            <img src={supervisor.profile_image} alt={supervisor.full_name} style={s.heroAvatar} />
          ) : (
            <div style={{ ...s.heroAvatarFb, background: avatarColor(supervisor.full_name) }}>
              {initials(supervisor.full_name)}
            </div>
          )}
          <div>
            <div style={s.heroName}>{supervisor.full_name}</div>
            <div style={s.heroRole}>Supervisor</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 10,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ ...s.pill, ...(supervisor.is_active ? s.pillGreen : s.pillGray) }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: supervisor.is_active ? '#16A34A' : '#94A3B8',
                    display: 'inline-block',
                  }}
                />
                {supervisor.is_active ? 'Active' : 'Inactive'}
              </span>
              {supervisor.building && (
                <span style={s.buildingPill}>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 22V12h6v10M3 9h18" />
                  </svg>
                  {supervisor.building.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          <button
            style={{ ...s.heroBtn, ...(supervisor.is_active ? s.heroBtnWarn : s.heroBtnSuccess) }}
            className="sd-hero-btn"
            onClick={handleToggleStatus}
            disabled={togglingStatus}
          >
            {togglingStatus ? '…' : supervisor.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button
            style={s.heroBtnPrimary}
            className="sd-hero-primary"
            onClick={() => setEditOpen(true)}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={s.statsGrid}>
        <StatCard
          label="Cleaners Assigned"
          value={supervisor.cleaners.length}
          accent="#3B5BDB"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
        <StatCard
          label="Total Tasks"
          value={totalTasks}
          accent="#0C8599"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          }
        />
        <StatCard
          label="Total Earnings (AED)"
          value={fmt(totalEarnings)}
          accent="#2F9E44"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        />
        <StatCard
          label="Base Salary (AED)"
          value={fmt(supervisor.base_salary)}
          accent="#E67700"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          }
        />
      </div>

      {/* Details grid */}
      <div style={s.detailsGrid}>
        {/* Personal */}
        <div style={s.infoCard}>
          <div style={s.infoCardHead}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3B5BDB"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Personal Information
          </div>
          <InfoRow label="Full Name" value={supervisor.full_name} />
          <InfoRow label="Nationality" value={supervisor.nationality} />
          <InfoRow label="Age" value={supervisor.age} />
          <InfoRow label="Document ID" value={supervisor.document_id} />
          {joinDate && <InfoRow label="Joined" value={joinDate} />}
          {supervisor.document && (
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Document</span>
              <a href={supervisor.document} target="_blank" rel="noreferrer" style={s.docLink}>
                View ↗
              </a>
            </div>
          )}
        </div>

        {/* Contact */}
        <div style={s.infoCard}>
          <div style={s.infoCardHead}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0C8599"
              strokeWidth="2"
            >
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 013 9.18 2 2 0 014.18 7H7a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 14a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
            Contact & Assignment
          </div>
          <InfoRow label="Email" value={supervisor.email} />
          <InfoRow label="Phone" value={supervisor.phone} />
          <InfoRow label="Building" value={supervisor.building?.name} />
          <InfoRow
            label="Base Salary"
            value={supervisor.base_salary ? `${fmt(supervisor.base_salary)} AED` : null}
          />
        </div>

        {/* Team */}
        <div style={s.infoCard}>
          <div style={s.infoCardHead}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2F9E44"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            Team Summary
          </div>
          <InfoRow label="Cleaners" value={supervisor.cleaners.length} />
          <InfoRow label="Total Tasks Done" value={totalTasks} />
          <InfoRow label="Total Earnings" value={`${fmt(totalEarnings)} AED`} />
          <InfoRow label="Total Salaries" value={`${fmt(totalSalaries)} AED`} />
          <InfoRow label="Avg Incentive Target" value={avgIncentive.toFixed(1)} />
        </div>
      </div>

      {/* Cleaners table */}
      <div style={{ marginBottom: 40 }}>
        <div style={s.tableHeader}>
          <div>
            <h2 style={s.tableTitle}>Assigned Cleaners</h2>
            <p style={s.tableSub}>
              {supervisor.cleaners.length} cleaner{supervisor.cleaners.length !== 1 ? 's' : ''}{' '}
              under this supervisor
            </p>
          </div>
          {supervisor.cleaners.length > 4 && (
            <div style={{ position: 'relative' as const }}>
              <svg
                style={s.tableSearchIcon}
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <circle cx="9" cy="9" r="6" />
                <path d="M15 15l-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                style={s.tableSearch}
                className="sd-input"
                placeholder="Search cleaners…"
                value={cleanerSearch}
                onChange={(e) => setCleanerSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        <div style={s.tableCard}>
          {supervisor.cleaners.length === 0 ? (
            <div style={s.empty}>
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#CBD5E1"
                strokeWidth="1.5"
              >
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              <p style={s.emptyText}>No cleaners assigned yet</p>
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  {[
                    'Cleaner',
                    'Email',
                    'Floor',
                    'Tasks',
                    'Base Salary',
                    'Earnings',
                    'Incentive',
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        ...s.th,
                        textAlign: ['Tasks', 'Base Salary', 'Earnings', 'Incentive'].includes(h)
                          ? 'right'
                          : 'left',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(filteredCleaners.length > 0 ? filteredCleaners : supervisor.cleaners).map(
                  (c, idx) => (
                    <tr key={c.id} style={{ animationDelay: `${idx * 35}ms` }} className="sd-row">
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ ...s.cAvatar, background: avatarColor(c.full_name) }}>
                            {initials(c.full_name)}
                          </div>
                          <span style={s.cName}>{c.full_name}</span>
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={s.cEmail}>{c.email}</span>
                      </td>
                      <td style={s.td}>
                        {c.floor ? (
                          <span style={s.floorBadge}>F{c.floor.floor_number}</span>
                        ) : (
                          <span style={{ color: '#CBD5E1' }}>—</span>
                        )}
                      </td>
                      <td style={{ ...s.td, textAlign: 'right' }}>
                        <span style={s.numBold}>{c.total_tasks || 0}</span>
                      </td>
                      <td style={{ ...s.td, textAlign: 'right' }}>
                        <span style={s.num}>{fmt(Number(c.base_salary || 0))} AED</span>
                      </td>
                      <td style={{ ...s.td, textAlign: 'right' }}>
                        <span style={{ ...s.num, color: '#059669' }}>
                          {fmt(Number(c.total_earning || 0))} AED
                        </span>
                      </td>
                      <td style={{ ...s.td, textAlign: 'right' }}>
                        <span style={s.incentiveBadge}>{c.incentive_target || 0}</span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <EditModal
          supervisor={supervisor}
          buildings={buildings}
          onClose={() => setEditOpen(false)}
          onSuccess={() => {
            setEditOpen(false);
            fetchSupervisor();
            showToast('Supervisor updated successfully', 'success');
          }}
        />
      )}
    </div>
  );
};

// ─── EditModal ────────────────────────────────────────────────────────────────

const EditModal: React.FC<{
  supervisor: Supervisor;
  buildings: { id: string; building_name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ supervisor, buildings, onClose, onSuccess }) => {
  // ← loading state declared HERE inside EditModal
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const [form, setForm] = useState({
    full_name: supervisor.full_name,
    email: supervisor.email,
    phone: supervisor.phone,
    age: supervisor.age ? String(supervisor.age) : '',
    nationality: supervisor.nationality,
    document_id: supervisor.document_id,
    base_salary: String(supervisor.base_salary),
    building_id: supervisor.building?.id ?? '',
    profile_image: supervisor.profile_image ?? '',
    document: supervisor.document ?? '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      showToast('Full name is required', 'error');
      return;
    }
    if (!form.email.trim()) {
      showToast('Email is required', 'error');
      return;
    }
    if (!form.phone.trim()) {
      showToast('Phone is required', 'error');
      return;
    }

    const payload: UpdateSupervisorPayload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      nationality: form.nationality.trim(),
      document_id: form.document_id.trim(),
      base_salary: Number(form.base_salary),
    };
    if (form.age) payload.age = Number(form.age);
    if (form.building_id) payload.building_id = form.building_id;
    if (form.profile_image) payload.profile_image = form.profile_image;
    if (form.document) payload.document = form.document;

    try {
      setLoading(true);
      const res = await updateSupervisor(supervisor.id, payload);
      if (res.success) onSuccess();
      else showToast(res.message ?? 'Update failed', 'error');
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Update failed');
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const FLabel = ({
    label,
    children,
    span2 = false,
  }: {
    label: string;
    children: React.ReactNode;
    span2?: boolean;
  }) => (
    <div style={{ gridColumn: span2 ? '1 / -1' : undefined }}>
      <label style={s.fieldLabel}>{label}</label>
      {children}
    </div>
  );

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={s.mOverlay} onClick={onClose}>
        <div style={s.mModal} onClick={(e) => e.stopPropagation()}>
          <div style={s.mHeader}>
            <div>
              <h2 style={s.mTitle}>Edit Supervisor</h2>
              <p style={s.mSub}>Update {supervisor.full_name}'s profile information</p>
            </div>
            <button style={s.mClose} className="em-close" onClick={onClose}>
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div style={s.mDivider} />

          <form onSubmit={handleSubmit} style={s.mForm}>
            <p style={s.mSection}>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Personal Information
            </p>
            <div style={s.mGrid}>
              <FLabel label="Full Name *">
                <input
                  name="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  style={s.mInput}
                  className="em-input"
                />
              </FLabel>
              <FLabel label="Email *">
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={s.mInput}
                  className="em-input"
                />
              </FLabel>
              <FLabel label="Phone *">
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  style={s.mInput}
                  className="em-input"
                />
              </FLabel>
              <FLabel label="Age">
                <input
                  name="age"
                  type="number"
                  value={form.age}
                  onChange={handleChange}
                  min="18"
                  max="100"
                  style={s.mInput}
                  className="em-input"
                />
              </FLabel>
              <FLabel label="Nationality">
                <input
                  name="nationality"
                  type="text"
                  value={form.nationality}
                  onChange={handleChange}
                  style={s.mInput}
                  className="em-input"
                />
              </FLabel>
              <FLabel label="Document ID">
                <input
                  name="document_id"
                  type="text"
                  value={form.document_id}
                  onChange={handleChange}
                  style={s.mInput}
                  className="em-input"
                />
              </FLabel>
            </div>

            <div style={{ ...s.mDivider, margin: '18px 0' }} />
            <p style={s.mSection}>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 22V12h6v10M3 9h18" />
              </svg>
              Assignment & Compensation
            </p>
            <div style={s.mGrid}>
              <FLabel label="Base Salary (AED) *">
                <div style={{ position: 'relative' as const }}>
                  <span style={s.mPrefix}>AED</span>
                  <input
                    name="base_salary"
                    type="number"
                    value={form.base_salary}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    style={{ ...s.mInput, paddingLeft: 52 }}
                    className="em-input"
                  />
                </div>
              </FLabel>
              <FLabel label="Building">
                {buildings.length > 0 ? (
                  <select
                    name="building_id"
                    value={form.building_id}
                    onChange={handleChange}
                    style={s.mSelect}
                    className="em-input"
                  >
                    <option value="">— Select building —</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.building_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name="building_id"
                    type="text"
                    value={form.building_id}
                    onChange={handleChange}
                    placeholder="Building ID"
                    style={s.mInput}
                    className="em-input"
                  />
                )}
              </FLabel>
            </div>

            <div style={{ ...s.mDivider, margin: '18px 0' }} />
            <p style={s.mSection}>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              Media & Documents
            </p>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
              <FLabel label="Profile Image URL" span2>
                <input
                  name="profile_image"
                  type="url"
                  value={form.profile_image}
                  onChange={handleChange}
                  placeholder="https://…"
                  style={s.mInput}
                  className="em-input"
                />
              </FLabel>
              <FLabel label="Document URL" span2>
                <input
                  name="document"
                  type="url"
                  value={form.document}
                  onChange={handleChange}
                  placeholder="https://…"
                  style={s.mInput}
                  className="em-input"
                />
              </FLabel>
            </div>

            <div style={s.mFooter}>
              <button
                type="button"
                style={s.mCancel}
                className="em-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" style={s.mSubmit} className="em-submit" disabled={loading}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={s.mSpinner} className="sd-spin" />
                    Updating…
                  </span>
                ) : (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    >
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

// ─── styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: '32px 40px',
    minHeight: '100vh',
    background: '#F8FAFC',
    fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
    margin: '0 auto',
  },
  centeredPage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
  },
  errorBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    background: '#FFF5F5',
    border: '1px solid #FEE2E2',
    borderRadius: 14,
    padding: '40px 48px',
  },
  backLink: {
    marginTop: 8,
    background: 'none',
    border: 'none',
    color: '#3B5BDB',
    fontSize: 14,
    cursor: 'pointer',
    fontWeight: 500,
    textDecoration: 'underline',
  },
  topNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '8px 16px',
    borderRadius: 9,
    border: '1.5px solid #E2E8F0',
    background: '#fff',
    color: '#374151',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  heroCard: {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 18,
    padding: '28px 32px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
    flexWrap: 'wrap',
    gap: 20,
  },
  heroLeft: { display: 'flex', alignItems: 'flex-start', gap: 20 },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #F1F5F9',
    flexShrink: 0,
  },
  heroAvatarFb: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  heroName: { fontSize: 22, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' },
  heroRole: { fontSize: 13, color: '#64748B', marginTop: 3, fontWeight: 500 },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  pillGreen: { background: '#DCFCE7', color: '#15803D' },
  pillGray: { background: '#F1F5F9', color: '#64748B' },
  buildingPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    background: '#EFF6FF',
    color: '#1D4ED8',
  },
  heroBtn: {
    padding: '9px 18px',
    borderRadius: 9,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  heroBtnWarn: { background: '#FEF3C7', color: '#92400E' },
  heroBtnSuccess: { background: '#DCFCE7', color: '#14532D' },
  heroBtnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 18px',
    borderRadius: 9,
    border: 'none',
    background: '#1E40AF',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(30,64,175,0.25)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
    gap: 14,
    marginBottom: 20,
  },
  statCard: {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 14,
    padding: '20px 22px',
    boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: { fontSize: 24, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 3, fontWeight: 500 },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
    gap: 14,
    marginBottom: 20,
  },
  infoCard: {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 14,
    padding: '20px 22px',
    boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
  },
  infoCardHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    fontWeight: 700,
    color: '#64748B',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid #F1F5F9',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '9px 0',
    borderBottom: '1px solid #F8FAFC',
  },
  infoLabel: { fontSize: 12, color: '#94A3B8', fontWeight: 500 },
  infoValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: 600,
    textAlign: 'right',
    maxWidth: '60%',
  },
  docLink: { fontSize: 13, color: '#3B5BDB', fontWeight: 500, textDecoration: 'none' },
  tableHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 12,
  },
  tableTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  tableSub: { fontSize: 12, color: '#94A3B8', marginTop: 3 },
  tableSearchIcon: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 14,
    height: 14,
    color: '#94A3B8',
  },
  tableSearch: {
    padding: '8px 12px 8px 32px',
    border: '1.5px solid #E2E8F0',
    borderRadius: 9,
    fontSize: 13,
    color: '#1E293B',
    background: '#fff',
    outline: 'none',
    width: 200,
    boxSizing: 'border-box',
  },
  tableCard: {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '12px 18px',
    fontSize: 11,
    fontWeight: 700,
    color: '#94A3B8',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    background: '#F8FAFC',
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '13px 18px',
    borderBottom: '1px solid #F8FAFC',
    verticalAlign: 'middle',
    fontSize: 13,
  },
  cAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  cName: { fontSize: 13, fontWeight: 600, color: '#1E293B' },
  cEmail: { fontSize: 12, color: '#64748B' },
  floorBadge: {
    display: 'inline-flex',
    padding: '3px 9px',
    borderRadius: 6,
    background: '#EFF6FF',
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: 600,
  },
  numBold: { fontSize: 13, fontWeight: 700, color: '#1E293B' },
  num: { fontSize: 13, fontWeight: 600 },
  incentiveBadge: {
    display: 'inline-flex',
    padding: '3px 9px',
    borderRadius: 6,
    background: '#FFF7ED',
    color: '#C2410C',
    fontSize: 12,
    fontWeight: 600,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '48px 24px',
  },
  emptyText: { fontSize: 14, color: '#94A3B8', margin: 0 },
  spinner: {
    width: 22,
    height: 22,
    border: '2.5px solid #E2E8F0',
    borderTopColor: '#1E40AF',
    borderRadius: '50%',
  },
  // edit modal
  mOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 20,
  },
  mModal: {
    background: '#fff',
    borderRadius: 18,
    width: '100%',
    maxWidth: 640,
    maxHeight: '92vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
    animation: 'sdPop 0.2s ease',
  },
  mHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '24px 28px 20px',
  },
  mTitle: { fontSize: 20, fontWeight: 700, color: '#0F172A', margin: 0 },
  mSub: { fontSize: 13, color: '#94A3B8', marginTop: 3 },
  mClose: {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: '1.5px solid #E2E8F0',
    background: '#fff',
    color: '#94A3B8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  mDivider: { height: 1, background: '#F1F5F9' },
  mForm: { padding: '20px 28px 28px' },
  mSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 11,
    fontWeight: 700,
    color: '#64748B',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 14,
    marginTop: 0,
  },
  mGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' },
  fieldLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
  },
  mInput: {
    width: '100%',
    padding: '10px 13px',
    border: '1.5px solid #E2E8F0',
    borderRadius: 9,
    fontSize: 13.5,
    color: '#1E293B',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  mSelect: {
    width: '100%',
    padding: '10px 36px 10px 13px',
    border: '1.5px solid #E2E8F0',
    borderRadius: 9,
    fontSize: 13.5,
    color: '#1E293B',
    background: '#fff',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394A3B8' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 13px center',
  },
  mPrefix: {
    position: 'absolute',
    left: 13,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 12,
    fontWeight: 600,
    color: '#94A3B8',
    pointerEvents: 'none',
  },
  mFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    paddingTop: 20,
    borderTop: '1px solid #F1F5F9',
  },
  mCancel: {
    padding: '10px 22px',
    borderRadius: 9,
    border: '1.5px solid #E2E8F0',
    background: '#fff',
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
  },
  mSubmit: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '10px 22px',
    borderRadius: 9,
    border: 'none',
    background: '#1E40AF',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(30,64,175,0.25)',
  },
  mSpinner: {
    display: 'inline-block',
    width: 14,
    height: 14,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
  },
};

const baseCSS = `
  @keyframes sdFade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes sdPop  { from { opacity:0; transform:scale(0.95); }    to { opacity:1; transform:scale(1); } }
  @keyframes sdSpin { to { transform:rotate(360deg); } }
  .sd-spin { animation: sdSpin 0.8s linear infinite; }
  .sd-row  { animation: sdFade 0.22s ease both; }
  .sd-row:hover { background: #F8FAFC !important; }
  .sd-back:hover { background: #F8FAFC; border-color: #CBD5E1; }
  .sd-hero-btn:hover { opacity: 0.82; }
  .sd-hero-primary:hover { background: #1D4ED8 !important; }
  .sd-input:focus { border-color: #93C5FD !important; box-shadow: 0 0 0 3px rgba(147,197,253,0.2) !important; }
  .em-input:focus { border-color: #93C5FD !important; box-shadow: 0 0 0 3px rgba(147,197,253,0.2) !important; outline: none; }
  .em-input::placeholder { color: #CBD5E1; }
  .em-close:hover  { color:#374151 !important; border-color:#CBD5E1 !important; background:#F8FAFC !important; }
  .em-cancel:hover { background:#F8FAFC !important; }
  .em-submit:hover { background:#1D4ED8 !important; }
`;

export default SupervisorDetails;
