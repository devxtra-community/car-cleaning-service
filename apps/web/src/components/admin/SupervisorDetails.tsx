import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../context/AlertContext';
import {
  getAllBuildings,
  getSupervisorDetails,
  toggleSupervisorStatus,
  updateSupervisor,
  toggleUserStatus,
  resetUserPassword,
  type Supervisor,
  type UpdateSupervisorPayload,
} from '../../services/allAPI';
import {
  EditCleanerModal,
  DeleteCleanerModal,
} from '../shared/ManageCleanerModals';
import { errMsg } from '../../utils/errorUtils';

// ─── types ────────────────────────────────────────────────────────────────────


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
  <div className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
    <span className="text-xs font-medium text-slate-400">{label}</span>
    <span className="text-[13px] font-semibold text-slate-800 text-right max-w-[60%] truncate">
      {value ?? '—'}
    </span>
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
  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 border-t-[3px] flex flex-col items-center text-center transition-transform hover:-translate-y-0.5" style={{ borderTopColor: accent }}>
    <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-transform hover:scale-110" style={{ background: `${accent}18`, color: accent }}>
      {icon}
    </div>
    <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1.5">{value}</div>
    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
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
  const [editCleanerTarget, setEditCleanerTarget] = useState<any | null>(null);
  const [deleteCleanerTarget, setDeleteCleanerTarget] = useState<any | null>(null);
  const { showConfirm, showToast, showPrompt } = useAlert();

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchSupervisor = useCallback(async () => {
    if (!supervisorId) return;
    try {
      setLoading(true);
      setPageError(null);
      const data = await getSupervisorDetails(supervisorId);
      setSupervisor(data.data);
    } catch (error) {
      const errorMsg = errMsg(error);
      setPageError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, [supervisorId, showToast]);

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
        .catch(() => { });
    }
  }, [supervisorId, isAuthenticated, fetchSupervisor]);

  // ── toggle status ──────────────────────────────────────────────────────────
  const handleToggleCleanerStatus = async (cleaner: any) => {
    try {
      const newStatus = !cleaner.is_active;
      const confirmed = await showConfirm(
        `Are you sure you want to ${newStatus ? 'enable' : 'disable'} this user?`,
        'User Status'
      );
      if (!confirmed) return;

      await toggleUserStatus(cleaner.user_id, newStatus);
      showToast(`User ${newStatus ? 'enabled' : 'disabled'}`, 'success');
      fetchSupervisor();
    } catch (err) {
      showToast(errMsg(err), 'error');
    }
  };

  const handleResetCleanerPassword = async (cleaner: any) => {
    const newPass = await showPrompt(
      `Enter new password for ${cleaner.full_name}:`,
      'Reset Password',
      '',
      'password'
    );
    if (!newPass) return;
    if (newPass.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    try {
      await resetUserPassword(cleaner.user_id, newPass);
      showToast('Password reset successfully', 'success');
    } catch (err) {
      showToast(errMsg(err), 'error');
    }
  };

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
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="w-[30px] h-[30px] border-[3px] border-slate-200 border-t-[#3B5BDB] rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-[15px] font-medium tracking-wide">Loading supervisor…</p>
      </div>
    );
  }

  if (pageError || !supervisor) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 max-w-sm w-full mx-auto flex flex-col items-center gap-3 shadow-sm">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EF4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-red-600 text-[15px] font-semibold m-0 text-center">
            {pageError ?? 'Supervisor not found'}
          </p>
          <button className="mt-3 text-[13px] font-semibold text-[#3B5BDB] hover:text-blue-700 hover:underline transition-colors cursor-pointer bg-transparent border-none" onClick={() => navigate(-1)}>
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
    <div className="min-h-screen font-['Plus_Jakarta_Sans',sans-serif]">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
              title="Back to Supervisors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
              style={
                supervisor.profile_image
                  ? {
                    backgroundImage: `url(${supervisor.profile_image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                  : { background: avatarColor(supervisor.full_name) }
              }
            >
              {!supervisor.profile_image && initials(supervisor.full_name)}
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                Admin / People / Supervisor
              </p>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                {supervisor.full_name}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${supervisor.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-500'
                    }`}
                >
                  {supervisor.is_active ? 'Active' : 'Inactive'}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleStatus}
              disabled={togglingStatus}
              className={`px-4 py-2 text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 ${supervisor.is_active
                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
            >
              {togglingStatus ? '…' : supervisor.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
            >
              <svg
                width="16"
                height="16"
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
      </div>

      <div className="mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Personal */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest pb-3 border-b border-slate-100 mb-4">
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
            <div className="space-y-1">
              <InfoRow label="Full Name" value={supervisor.full_name} />
              <InfoRow label="Nationality" value={supervisor.nationality} />
              <InfoRow label="Age" value={supervisor.age} />
              <InfoRow label="Document ID" value={supervisor.document_id} />
              {joinDate && <InfoRow label="Joined" value={joinDate} />}
              {supervisor.document && (
                <div className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <span className="text-xs font-medium text-slate-400">Document</span>
                  <a href={supervisor.document} target="_blank" rel="noreferrer" className="text-[13px] text-blue-600 font-medium hover:underline">
                    View ↗
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest pb-3 border-b border-slate-100 mb-4">
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
            <div className="space-y-1">
              <InfoRow label="Email" value={supervisor.email} />
              <InfoRow label="Phone" value={supervisor.phone} />
              <InfoRow label="Building" value={supervisor.building?.name} />
              <InfoRow
                label="Base Salary"
                value={supervisor.base_salary ? `${fmt(supervisor.base_salary)} AED` : null}
              />
            </div>
          </div>

          {/* Team */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest pb-3 border-b border-slate-100 mb-4">
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
            <div className="space-y-1">
              <InfoRow label="Cleaners" value={supervisor.cleaners.length} />
              <InfoRow label="Total Tasks Done" value={totalTasks} />
              <InfoRow label="Total Earnings" value={`${fmt(totalEarnings)} AED`} />
              <InfoRow label="Total Salaries" value={`${fmt(totalSalaries)} AED`} />
              <InfoRow label="Avg Incentive Target" value={avgIncentive.toFixed(1)} />
            </div>
          </div>
        </div>

        {/* Cleaners table */}
        <div className="mb-10">
          <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="text-[17px] font-bold text-slate-900 m-0 tracking-tight">Assigned Cleaners</h2>
              <p className="text-xs text-slate-400 mt-1">
                {supervisor.cleaners.length} cleaner{supervisor.cleaners.length !== 1 ? 's' : ''}{' '}
                under this supervisor
              </p>
            </div>
            {supervisor.cleaners.length > 4 && (
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <circle cx="9" cy="9" r="6" />
                  <path d="M15 15l-3.5-3.5" strokeLinecap="round" />
                </svg>
                <input
                  className="py-2 pl-9 pr-3 border-[1.5px] border-slate-200 rounded-lg text-[13px] text-slate-800 bg-white outline-none w-52 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                  placeholder="Search cleaners…"
                  value={cleanerSearch}
                  onChange={(e) => setCleanerSearch(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {supervisor.cleaners.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 py-12 px-6">
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
                <p className="text-sm text-slate-400 m-0">No cleaners assigned yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
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
                        'Status',
                        'Actions',
                      ].map((h) => (
                        <th
                          key={h}
                          className={`py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 border-b border-slate-100 whitespace-nowrap ${['Tasks', 'Base Salary', 'Earnings', 'Incentive', 'Status', 'Actions'].includes(h)
                            ? 'text-right'
                            : 'text-left'
                            }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredCleaners.length > 0 ? filteredCleaners : supervisor.cleaners).map(
                      (c, idx) => (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors border-b border-slate-50 last:border-0">
                          <td className="py-3 px-4 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: avatarColor(c.full_name) }}>
                                {initials(c.full_name)}
                              </div>
                              <span className="text-[13px] font-semibold text-slate-800">{c.full_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle whitespace-nowrap">
                            <span className="text-xs text-slate-500">{c.email}</span>
                          </td>
                          <td className="py-3 px-4 align-middle whitespace-nowrap">
                            {c.floor ? (
                              <span className="inline-flex py-0.5 px-2.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">F{c.floor.floor_number}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 align-middle whitespace-nowrap text-right">
                            <span className="text-[13px] font-bold text-slate-800">{c.total_tasks || 0}</span>
                          </td>
                          <td className="py-3 px-4 align-middle whitespace-nowrap text-right">
                            <span className="text-[13px] font-semibold text-slate-700">{fmt(Number(c.base_salary || 0))} AED</span>
                          </td>
                          <td className="py-3 px-4 align-middle whitespace-nowrap text-right">
                            <span className="text-[13px] font-semibold text-emerald-600">
                              {fmt(Number(c.total_earning || 0))} AED
                            </span>
                          </td>
                          <td className="py-3 px-4 align-middle whitespace-nowrap text-right">
                            <span className="inline-flex py-0.5 px-2.5 rounded-md bg-orange-50 text-orange-700 text-[11px] font-bold">
                              {c.incentive_target || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 align-middle whitespace-nowrap text-center">
                            <button
                              onClick={() => handleToggleCleanerStatus(c)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all
                              ${c.is_active !== false
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                            >
                              {c.is_active !== false ? 'Active' : 'Disabled'}
                            </button>
                          </td>
                          <td className="py-3 px-4 align-middle whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* View */}
                              <Link
                                to={`/admin/cleaner/${c.id}`}
                                title="View details"
                                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400
                                hover:bg-slate-50 hover:border-slate-300 hover:text-slate-600 transition-all"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M2 12s3.6-8 10-8 10 8 10 8-3.6 8-10 8-10-8-10-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </Link>

                              {/* Edit */}
                              <button
                                onClick={() => setEditCleanerTarget(c)}
                                title="Edit cleaner"
                                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400
                                hover:bg-blue-50 hover:border-blue-200 hover:text-blue-500 transition-all"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => handleResetCleanerPassword(c)}
                                title="Reset Password"
                                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400
                                hover:bg-amber-50 hover:border-amber-200 hover:text-amber-500 transition-all"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => setDeleteCleanerTarget(c)}
                                title="Delete cleaner"
                                className="w-7 h-7 rounded-lg border border-red-100 flex items-center justify-center text-red-400
                                hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
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

        {/* Edit Cleaner modal */}
        {editCleanerTarget && (
          <EditCleanerModal
            cleaner={editCleanerTarget}
            onClose={() => setEditCleanerTarget(null)}
            onSaved={() => {
              setEditCleanerTarget(null);
              fetchSupervisor();
              showToast('Cleaner updated successfully', 'success');
            }}
          />
        )}

        {/* Delete Cleaner modal */}
        {deleteCleanerTarget && (
          <DeleteCleanerModal
            cleaner={deleteCleanerTarget}
            onClose={() => setDeleteCleanerTarget(null)}
            onDeleted={() => {
              setDeleteCleanerTarget(null);
              fetchSupervisor();
            }}
          />
        )}
      </div>
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
  const { showToast } = useAlert();
  const [loading, setLoading] = useState(false);

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
      showToast(errMsg(err), 'error');
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
    <div className={span2 ? 'col-span-1 md:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );

  return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-5" onClick={onClose}>
        <div className="bg-white rounded-[18px] w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl font-['Plus_Jakarta_Sans',sans-serif] animate-[sdPop_0.2s_ease]" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between px-7 pt-6 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 m-0">Edit Supervisor</h2>
              <p className="text-[13px] text-slate-400 mt-1">Update {supervisor.full_name}'s profile information</p>
            </div>
            <button className="w-[34px] h-[34px] rounded-lg border-[1.5px] border-slate-200 bg-white text-slate-400 flex items-center justify-center cursor-pointer shrink-0 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors" onClick={onClose}>
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

          <div className="h-px bg-slate-100" />

          <form onSubmit={handleSubmit} className="px-7 pt-5 pb-7">
            <p className="flex items-center gap-2 text-[11px] font-bold text-slate-500 tracking-widest uppercase mb-3.5 mt-0">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3.5">
              <FLabel label="Full Name *">
                <input
                  name="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  className="w-full py-2.5 px-3.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                />
              </FLabel>
              <FLabel label="Email *">
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full py-2.5 px-3.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                />
              </FLabel>
              <FLabel label="Phone *">
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full py-2.5 px-3.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
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
                  className="w-full py-2.5 px-3.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                />
              </FLabel>
              <FLabel label="Nationality">
                <input
                  name="nationality"
                  type="text"
                  value={form.nationality}
                  onChange={handleChange}
                  className="w-full py-2.5 px-3.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                />
              </FLabel>
              <FLabel label="Document ID">
                <input
                  name="document_id"
                  type="text"
                  value={form.document_id}
                  onChange={handleChange}
                  className="w-full py-2.5 px-3.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                />
              </FLabel>
            </div>

            <div className="h-px bg-slate-100 my-4" />
            <p className="flex items-center gap-2 text-[11px] font-bold text-slate-500 tracking-widest uppercase mb-3.5 mt-0">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3.5">
              <FLabel label="Base Salary (AED) *">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">AED</span>
                  <input
                    name="base_salary"
                    type="number"
                    value={form.base_salary}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full py-2.5 pr-3.5 pl-[52px] border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                  />
                </div>
              </FLabel>
              <FLabel label="Building">
                {buildings.length > 0 ? (
                  <select
                    name="building_id"
                    value={form.building_id}
                    onChange={handleChange}
                    className="w-full py-2.5 px-3.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300 cursor-pointer"
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
                    className="w-full py-2.5 px-3.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                  />
                )}
              </FLabel>
            </div>

            <div className="h-px bg-slate-100 my-4" />
            <p className="flex items-center gap-2 text-[11px] font-bold text-slate-500 tracking-widest uppercase mb-3.5 mt-0">
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
            <div className="flex flex-col gap-3.5">
              <FLabel label="Profile Image URL" span2>
                <input
                  name="profile_image"
                  type="url"
                  value={form.profile_image}
                  onChange={handleChange}
                  placeholder="https://…"
                  className="w-full py-2.5 px-3.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                />
              </FLabel>
              <FLabel label="Document URL" span2>
                <input
                  name="document"
                  type="url"
                  value={form.document}
                  onChange={handleChange}
                  placeholder="https://…"
                  className="w-full py-2.5 px-3.5 border-[1.5px] border-slate-200 rounded-lg text-[13.5px] text-slate-800 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                />
              </FLabel>
            </div>

            <div className="flex justify-end items-center gap-2.5 mt-6 pt-5 border-t border-slate-100">
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg border-[1.5px] border-slate-200 bg-white text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-lg border-none bg-[#1E40AF] text-white text-sm font-semibold cursor-pointer hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-50" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
    );
};

export default SupervisorDetails;
