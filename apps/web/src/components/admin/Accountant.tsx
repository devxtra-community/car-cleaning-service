import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getAllAccountants,
  toggleAccountantStatus,
  deleteAccountant,
  updateAccountant,
  type AccountantListItem,
  type UserUpdatePayload,
} from '../../services/allAPI';
import Toast from '../shared/Toast';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';

// ── helpers ──────────────────────────────────────────────────────────────────
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
const fmtD = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const errMsg = (e: unknown) => {
  if (e instanceof Error) return e.message;
  const x = e as { response?: { data?: { message?: string } } };
  return x?.response?.data?.message ?? 'Something went wrong';
};

type SortKey = 'full_name' | 'email' | 'building_name' | 'joining_date' | 'base_salary';
type SortDir = 'asc' | 'desc';
interface TS {
  message: string;
  type: 'success' | 'error';
}

const PER_PAGE = 10;

const SortTh: React.FC<{
  label: string;
  col: SortKey;
  cur: SortKey;
  dir: SortDir;
  onSort: (c: SortKey) => void;
  cls?: string;
}> = ({ label, col, cur, dir, onSort, cls = '' }) => (
  <th
    className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer select-none hover:text-slate-600 whitespace-nowrap ${cls}`}
    onClick={() => onSort(col)}
  >
    <span className="inline-flex items-center gap-1">
      {label}
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
        {cur === col ? (
          dir === 'asc' ? (
            <path d="M8 4l4 6H4z" />
          ) : (
            <path d="M8 12L4 6h8z" />
          )
        ) : (
          <path opacity=".3" d="M8 4l4 6H4zM8 12L4 6h8z" />
        )}
      </svg>
    </span>
  </th>
);

// ── Edit Modal ────────────────────────────────────────────────────────────────
const EditAccountantModal: React.FC<{
  accountant: AccountantListItem;
  onClose: () => void;
  onSaved: (updated: AccountantListItem) => void;
}> = ({ accountant, onClose, onSaved }) => {
  const [form, setForm] = useState<
    UserUpdatePayload & { building_id?: string | null; floor_id?: string | null }
  >({
    full_name: accountant.full_name,
    email: accountant.email,
    phone: accountant.phone ?? '',
    age: accountant.age ?? undefined,
    nationality: accountant.nationality ?? '',
    document_id: accountant.document_id ?? '',
    base_salary: accountant.base_salary ?? undefined,
    joining_date: accountant.joining_date?.slice(0, 10) ?? '',
    building_id: accountant.building_id ?? null,
    floor_id: accountant.floor_id ?? null,
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const payload: UserUpdatePayload = { ...form };
    if (!payload.password) delete payload.password;
    if (!payload.phone) delete payload.phone;
    try {
      setSaving(true);
      const updated = await updateAccountant(accountant.id, payload);
      onSaved(updated);
    } catch (ex) {
      setErr(errMsg(ex));
    } finally {
      setSaving(false);
    }
  };

  const inp =
    'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all';
  const lbl = 'block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Edit Accountant</h2>
            <p className="text-xs text-slate-400 mt-0.5">{accountant.full_name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {err && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {err}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Full Name *</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handle}
                required
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Email *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handle}
                required
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Phone</label>
              <input name="phone" value={form.phone ?? ''} onChange={handle} className={inp} />
            </div>
            <div>
              <label className={lbl}>Age</label>
              <input
                name="age"
                type="number"
                value={form.age ?? ''}
                onChange={handle}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Nationality</label>
              <input
                name="nationality"
                value={form.nationality ?? ''}
                onChange={handle}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Document ID</label>
              <input
                name="document_id"
                value={form.document_id ?? ''}
                onChange={handle}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Base Salary (AED)</label>
              <input
                name="base_salary"
                type="number"
                value={form.base_salary ?? ''}
                onChange={handle}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Joining Date</label>
              <input
                name="joining_date"
                type="date"
                value={form.joining_date ?? ''}
                onChange={handle}
                className={inp}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>
                New Password{' '}
                <span className="normal-case text-slate-300 tracking-normal font-normal">
                  (leave blank to keep current)
                </span>
              </label>
              <input
                name="password"
                type="password"
                value={form.password ?? ''}
                onChange={handle}
                placeholder="••••••••"
                className={inp}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const Accountants: React.FC = () => {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [accountants, setAccountants] = useState<AccountantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('full_name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [delTarget, setDelTarget] = useState<AccountantListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<AccountantListItem | null>(null);
  const [toast, setToast] = useState<TS | null>(null);

  const showToast = (m: string, t: TS['type']) => setToast({ message: m, type: t });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setAccountants(await getAllAccountants());
    } catch {
      showToast('Failed to load accountants', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) void fetchData();
  }, [authLoading, isAuthenticated, fetchData]);

  const handleSort = (col: SortKey) => {
    if (col === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return accountants
      .filter((a) => {
        const ms =
          a.full_name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.phone ?? '').toLowerCase().includes(q) ||
          (a.building_name ?? '').toLowerCase().includes(q) ||
          (a.nationality ?? '').toLowerCase().includes(q) ||
          (a.document_id ?? '').toLowerCase().includes(q);
        const mf = statusF === 'all' || (statusF === 'active' ? a.is_active : !a.is_active);
        return ms && mf;
      })
      .sort((a, b) => {
        const av = a[sortKey] ?? '';
        const bv = b[sortKey] ?? '';
        return av < bv ? (sortDir === 'asc' ? -1 : 1) : av > bv ? (sortDir === 'asc' ? 1 : -1) : 0;
      });
  }, [accountants, search, statusF, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalActive = accountants.filter((a) => a.is_active).length;
  const totalInactive = accountants.length - totalActive;
  const totalAssigned = accountants.filter((a) => a.building_id !== null).length;

  const handleToggle = async (a: AccountantListItem) => {
    const next = !a.is_active;
    setToggling(a.id);
    try {
      await toggleAccountantStatus(a.id, next);
      setAccountants((p) =>
        p.map((x) => (x.id === a.id ? { ...x, is_active: next, token_version: next ? 0 : -1 } : x))
      );
      showToast(`Accountant ${next ? 'activated' : 'deactivated'}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setToggling(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await deleteAccountant(delTarget.id);
      setAccountants((p) => p.filter((a) => a.id !== delTarget.id));
      showToast(`"${delTarget.full_name}" deleted`, 'success');
      setDelTarget(null);
    } catch (err) {
      showToast(errMsg(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaved = (updated: AccountantListItem) => {
    setAccountants((p) =>
      p.map((a) => (a.id === updated.id ? { ...updated, is_active: a.is_active } : a))
    );
    setEditTarget(null);
    showToast('Accountant updated successfully', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {delTarget && (
        <DeleteConfirmModal
          isOpen={!!delTarget}
          title="Delete Accountant?"
          message={
            <>
              Permanently delete{' '}
              <span className="font-semibold">&ldquo;{delTarget?.full_name}&rdquo;</span>? This
              action cannot be undone.
            </>
          }
          confirmText="Delete"
          cancelText="Cancel"
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDelTarget(null)}
        />
      )}
      {editTarget && (
        <EditAccountantModal
          accountant={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {/* top bar */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Admin / People
            </p>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Accountants</h1>
          </div>
          <Link
            to="/admin/register/accountant"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
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
            Add Accountant
          </Link>
        </div>
      </div>

      <div className="mx-auto px-6 py-8 space-y-6">
        {/* stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(
            [
              {
                label: 'Total',
                value: accountants.length,
                sub: 'registered',
                color: 'text-slate-900',
              },
              { label: 'Active', value: totalActive, sub: 'can log in', color: 'text-emerald-600' },
              {
                label: 'Inactive',
                value: totalInactive,
                sub: 'login blocked',
                color: 'text-red-500',
              },
              {
                label: 'Assigned',
                value: totalAssigned,
                sub: 'to a building',
                color: 'text-blue-600',
              },
            ] as const
          ).map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            >
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                {s.label}
              </p>
              <p className="text-xs text-slate-300 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* table card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* toolbar */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-52">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M17 17l4 4" />
              </svg>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, email, building…"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'active', 'inactive'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setStatusF(f);
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${statusF === f ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 ml-auto whitespace-nowrap">
              {filtered.length} accountant{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-8 h-8 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading accountants…</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <SortTh
                      label="Accountant"
                      col="full_name"
                      cur={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      cls="text-left"
                    />
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-left">
                      Contact
                    </th>
                    <SortTh
                      label="Salary"
                      col="base_salary"
                      cur={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      cls="text-right"
                    />
                    <SortTh
                      label="Joined"
                      col="joining_date"
                      cur={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      cls="text-right"
                    />
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                          <svg
                            className="w-10 h-10 text-slate-200"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"
                            />
                          </svg>
                          <p className="text-sm text-slate-400">
                            {search ? `No results for "${search}"` : 'No accountants yet'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((a) => {
                      const busy = toggling === a.id;
                      return (
                        <tr
                          key={a.id}
                          className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                        >
                          {/* name */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              {a.profile_image ? (
                                <img
                                  src={a.profile_image}
                                  alt={a.full_name}
                                  className="w-8 h-8 rounded-xl object-cover shrink-0"
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                                  style={{ background: ac(a.full_name) }}
                                >
                                  {initials(a.full_name)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate">
                                  {a.full_name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  #{a.document_id ?? a.id.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                          </td>
                          {/* contact */}
                          <td className="px-4 py-3.5">
                            <p className="text-xs text-slate-700 truncate max-w-[160px]">
                              {a.email}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">{a.phone ?? '—'}</p>
                          </td>

                          {/* salary */}
                          <td className="px-4 py-3.5 text-right font-semibold text-slate-800 text-sm whitespace-nowrap">
                            {a.base_salary != null
                              ? `${Number(a.base_salary).toLocaleString('en-AE')} AED`
                              : '—'}
                          </td>
                          {/* joined */}
                          <td className="px-4 py-3.5 text-right text-xs text-slate-400 whitespace-nowrap">
                            {a.joining_date ? fmtD(a.joining_date) : '—'}
                          </td>
                          {/* status */}
                          <td className="px-4 py-3.5 text-center">
                            <button
                              disabled={busy}
                              onClick={() => void handleToggle(a)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all disabled:opacity-60 ${a.is_active ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                              {busy ? (
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${a.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}
                                />
                              )}
                              {a.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          {/* actions */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                title="Edit"
                                onClick={() => setEditTarget(a)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
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
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                  />
                                </svg>
                              </button>
                              <button
                                title="Delete"
                                onClick={() => setDelTarget(a)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
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
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-slate-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${page === n ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Accountants;
