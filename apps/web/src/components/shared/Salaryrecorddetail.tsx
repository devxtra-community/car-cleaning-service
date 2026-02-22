import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getSalaryRecordDetail,
  finalizeSalaryRecord,
  unfinalizeSalaryRecord,
  addSalaryAdjustment,
  deleteSalaryAdjustment,
  type SalaryRecordDetail,
  type SalaryAdjustment,
} from '../../services/allAPI';
import Toast from '../shared/Toast';

const fmt = (n: number | string) =>
  new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(n)
  );
const fmtD = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDT = (s: string) =>
  new Date(s).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
const errMsg = (e: unknown) => {
  const x = e as { response?: { data?: { message?: string } } };
  return x?.response?.data?.message ?? (e instanceof Error ? e.message : 'Error');
};
const initials = (n: string) =>
  n
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
const COLORS = ['#3B5BDB', '#1971C2', '#0C8599', '#2F9E44', '#E67700', '#C2255C', '#9C36B5'];
const ac = (n: string) => COLORS[n.charCodeAt(0) % COLORS.length];

interface TS {
  message: string;
  type: 'success' | 'error';
}
type Tab = 'breakdown' | 'tasks' | 'incentives' | 'penalties' | 'daily';

// ─── Stat card ────────────────────────────────────────────────────────────────
const Stat: React.FC<{
  label: string;
  value: string;
  sub?: string;
  color?: string;
  sign?: string;
}> = ({ label, value, sub, color = 'text-slate-900', sign }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
    <p className={`text-xl font-extrabold ${color}`}>
      {sign ?? ''}
      {value}
    </p>
    {sub && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{sub}</p>}
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{label}</p>
  </div>
);

// ─── Adjustment Modal ─────────────────────────────────────────────────────────
const AdjModal: React.FC<{ recordId: string; onClose: () => void; onAdded: () => void }> = ({
  recordId,
  onClose,
  onAdded,
}) => {
  const [form, setForm] = useState({
    type: 'bonus' as 'bonus' | 'deduction',
    amount: '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const handleSave = async () => {
    if (!form.amount || !form.reason.trim()) {
      setError('Amount and reason are required');
      return;
    }
    if (Number(form.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await addSalaryAdjustment(recordId, {
        type: form.type,
        amount: Number(form.amount),
        reason: form.reason.trim(),
      });
      onAdded();
      onClose();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Add Adjustment</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center text-lg"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['bonus', 'deduction'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${form.type === t ? (t === 'bonus' ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-red-50 border-red-400 text-red-700') : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  {t === 'bonus' ? '+ Bonus' : '− Deduction'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Amount (AED)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder="e.g. 150"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Reason
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              rows={3}
              placeholder="Reason for this adjustment…"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {saving ? 'Adding…' : 'Add Adjustment'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Notes modal ──────────────────────────────────────────────────────────────
const NotesModal: React.FC<{
  initial: string;
  onClose: () => void;
  onFinalize: (notes: string) => void;
  saving: boolean;
}> = ({ initial, onClose, onFinalize, saving }) => {
  const [notes, setNotes] = useState(initial);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Finalize Salary Record</h2>
          <p className="text-xs text-slate-400 mt-0.5">Optionally add notes before finalizing</p>
        </div>
        <div className="px-6 py-5">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add finalization notes (optional)…"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
          />
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onFinalize(notes)}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {saving ? 'Finalizing…' : 'Finalize Record'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const SalaryRecordDetail: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [data, setData] = useState<SalaryRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('breakdown');
  const [toast, setToast] = useState<TS | null>(null);
  const [showAdj, setShowAdj] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const showToast = (m: string, t: TS['type']) => setToast({ message: m, type: t });

  const load = useCallback(async () => {
    if (!recordId) return;
    try {
      setLoading(true);
      const r = await getSalaryRecordDetail(recordId);
      setData(r.data);
    } catch {
      showToast('Failed to load salary record', 'error');
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) void load();
  }, [authLoading, isAuthenticated, load]);

  const handleFinalize = async (notes: string) => {
    if (!recordId) return;
    setSaving(true);
    try {
      await finalizeSalaryRecord(recordId, notes);
      showToast('Record finalized', 'success');
      setShowNotes(false);
      void load();
    } catch (e) {
      showToast(errMsg(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUnfinalize = async () => {
    if (!recordId || !confirm('Move this record back to draft?')) return;
    setSaving(true);
    try {
      await unfinalizeSalaryRecord(recordId);
      showToast('Moved back to draft', 'success');
      void load();
    } catch (e) {
      showToast(errMsg(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAdj = async (adjId: string) => {
    if (!confirm('Remove this adjustment?')) return;
    try {
      await deleteSalaryAdjustment(adjId);
      showToast('Adjustment removed', 'success');
      void load();
    } catch (e) {
      showToast(errMsg(e), 'error');
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-slate-400">Loading…</p>
        </div>
      </div>
    );
  if (!data)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500">Record not found</p>
      </div>
    );

  const r = data.record;
  const isEditable = ['draft'].includes(r.status);
  const isLocked = ['locked', 'paid'].includes(r.status);
  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'breakdown', label: 'Salary Breakdown' },
    { key: 'tasks', label: `Tasks (${data.tasks.length})` },
    { key: 'incentives', label: `Incentives (${data.incentives.length})` },
    { key: 'penalties', label: `Penalties (${data.penalties.length})` },
    { key: 'daily', label: `Daily Records (${data.dailyBreakdown.length})` },
  ];

  const adjNet = r.total_adjustments;

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {showAdj && (
        <AdjModal recordId={r.id} onClose={() => setShowAdj(false)} onAdded={() => void load()} />
      )}
      {showNotes && (
        <NotesModal
          initial={r.notes ?? ''}
          onClose={() => setShowNotes(false)}
          onFinalize={handleFinalize}
          saving={saving}
        />
      )}

      {/* sticky top bar */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/admin/salary/${r.salary_period_id}`)}
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
              {r.profile_image ? (
                <img
                  src={r.profile_image}
                  className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: ac(r.full_name) }}
                >
                  {initials(r.full_name)}
                </div>
              )}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  {r.period_name}
                </p>
                <p className="text-sm font-bold text-slate-900">{r.full_name}</p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${r.status === 'draft' ? 'bg-slate-100 text-slate-600' : r.status === 'finalized' ? 'bg-blue-50 text-blue-700' : r.status === 'locked' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}
            >
              {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isEditable && (
              <>
                <button
                  onClick={() => setShowAdj(true)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
                >
                  + Adjustment
                </button>
                <button
                  onClick={() => setShowNotes(true)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  Finalize
                </button>
              </>
            )}
            {r.status === 'finalized' && !isLocked && (
              <button
                onClick={() => void handleUnfinalize()}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-semibold transition-colors"
              >
                Undo Finalize
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* period info banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex items-center gap-4 flex-wrap">
          <div className="flex-1">
            <p className="text-xs font-bold text-blue-900">{r.period_name}</p>
            <p className="text-xs text-blue-600">
              {fmtD(r.start_date)} — {fmtD(r.end_date)}
            </p>
          </div>
          {r.building_name && (
            <span className="px-3 py-1 bg-white border border-blue-200 rounded-lg text-xs font-semibold text-blue-800">
              {r.building_name}
              {r.floor_number != null ? ` · F${r.floor_number}` : ''}
            </span>
          )}
          {r.supervisor_name && (
            <span className="px-3 py-1 bg-white border border-blue-200 rounded-lg text-xs font-semibold text-blue-800">
              Sup: {r.supervisor_name}
            </span>
          )}
          {r.finalized_by_name && (
            <span className="px-3 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700">
              Finalized by {r.finalized_by_name} · {fmtDT(r.finalized_at!)}
            </span>
          )}
        </div>

        {/* salary summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Stat label="Base Salary" value={`${fmt(r.base_salary)} AED`} />
          <Stat
            label="Task Earnings"
            value={`${fmt(r.total_task_amount)} AED`}
            sub={`${r.total_tasks} completed tasks`}
            color="text-blue-700"
          />
          <Stat
            label="Incentives"
            value={`${fmt(r.total_incentives)} AED`}
            sub={`${data.incentives.length} entries`}
            color="text-emerald-600"
            sign="+"
          />
          <Stat
            label="Penalties"
            value={`${fmt(r.total_penalties)} AED`}
            sub={`${data.penalties.length} entries`}
            color="text-red-500"
            sign="-"
          />
          <Stat
            label="Adjustments"
            value={`${fmt(Math.abs(adjNet))} AED`}
            sub={data.adjustments.length + ' manual entries'}
            color={adjNet >= 0 ? 'text-emerald-600' : 'text-red-500'}
            sign={adjNet >= 0 ? '+' : '-'}
          />
          <div className="bg-blue-600 rounded-2xl shadow-sm p-5 text-white">
            <p className="text-2xl font-extrabold">{fmt(r.net_salary)}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mt-1">
              Net Salary (AED)
            </p>
            <p className="text-[10px] text-blue-200 mt-1">= Base + Tasks + Inc − Pen ± Adj</p>
          </div>
        </div>

        {/* notes */}
        {r.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">
              Accountant Notes
            </p>
            <p className="text-sm text-amber-900">{r.notes}</p>
          </div>
        )}

        {/* tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100 bg-slate-50 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-colors relative ${tab === t.key ? 'text-blue-600 bg-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
              >
                {t.label}
                {tab === t.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ── BREAKDOWN TAB ── */}
            {tab === 'breakdown' && (
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-slate-900">Salary Breakdown Formula</h3>

                {/* formula visual */}
                <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                  {[
                    {
                      label: 'Base Salary',
                      value: fmt(r.base_salary),
                      color: 'text-slate-900',
                      prefix: '',
                    },
                    {
                      label: `Task Earnings (${r.total_tasks} tasks)`,
                      value: fmt(r.total_task_amount),
                      color: 'text-blue-700',
                      prefix: '+',
                    },
                    {
                      label: `Incentives (${data.incentives.length})`,
                      value: fmt(r.total_incentives),
                      color: 'text-emerald-600',
                      prefix: '+',
                    },
                    {
                      label: `Penalties (${data.penalties.length})`,
                      value: fmt(r.total_penalties),
                      color: 'text-red-500',
                      prefix: '−',
                    },
                    {
                      label: `Manual Adjustments (${data.adjustments.length})`,
                      value: fmt(Math.abs(adjNet)),
                      color: adjNet >= 0 ? 'text-emerald-600' : 'text-red-500',
                      prefix: adjNet >= 0 ? '+' : '−',
                    },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className={`flex justify-between items-center ${i < 4 ? 'pb-3 border-b border-slate-200' : ''}`}
                    >
                      <span className="text-sm text-slate-600">
                        {row.prefix && (
                          <span className={`mr-1 font-bold ${row.color}`}>{row.prefix}</span>
                        )}
                        {row.label}
                      </span>
                      <span className={`text-sm font-bold ${row.color}`}>{row.value} AED</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 mt-2 border-t-2 border-slate-300">
                    <span className="text-base font-extrabold text-slate-900">= Net Salary</span>
                    <span className="text-xl font-extrabold text-blue-700">
                      {fmt(r.net_salary)} AED
                    </span>
                  </div>
                </div>

                {/* Adjustments list */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-800">Manual Adjustments</h4>
                    {isEditable && (
                      <button
                        onClick={() => setShowAdj(true)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                  {data.adjustments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No manual adjustments</p>
                  ) : (
                    <div className="space-y-2">
                      {data.adjustments.map((adj: SalaryAdjustment) => (
                        <div
                          key={adj.id}
                          className={`flex items-center justify-between p-3.5 rounded-xl border ${adj.type === 'bonus' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold ${adj.type === 'bonus' ? 'bg-emerald-500' : 'bg-red-500'}`}
                            >
                              {adj.type === 'bonus' ? '+' : '−'}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-slate-900">{adj.reason}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {adj.created_by_name ?? 'System'} · {fmtD(adj.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-sm font-extrabold ${adj.type === 'bonus' ? 'text-emerald-600' : 'text-red-600'}`}
                            >
                              {adj.type === 'bonus' ? '+' : '−'}
                              {fmt(adj.amount)} AED
                            </span>
                            {isEditable && (
                              <button
                                onClick={() => void handleDeleteAdj(adj.id)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TASKS TAB ── */}
            {tab === 'tasks' && (
              <div>
                {data.tasks.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-sm">No completed tasks in this period</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900">
                        {data.tasks.length} Completed Tasks
                      </p>
                      <p className="text-sm font-extrabold text-blue-700">
                        {fmt(r.total_task_amount)} AED total
                      </p>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            {['Car', 'Number', 'Building/Floor', 'Completed', 'Final Price'].map(
                              (h) => (
                                <th
                                  key={h}
                                  className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 ${h === 'Final Price' ? 'text-right' : 'text-left'}`}
                                >
                                  {h}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {data.tasks.map((t) => (
                            <tr
                              key={t.id}
                              className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-4 py-2.5 font-medium text-slate-800">
                                {t.car_type ?? '—'}
                              </td>
                              <td className="px-4 py-2.5 text-slate-600">{t.car_number ?? '—'}</td>
                              <td className="px-4 py-2.5">
                                <p className="text-slate-700">{t.building_name ?? '—'}</p>
                                {t.floor_name && (
                                  <p className="text-[10px] text-slate-400">{t.floor_name}</p>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                                {t.completed_at ? fmtDT(t.completed_at) : '—'}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold text-blue-700">
                                {fmt(t.final_price)} AED
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                          <tr>
                            <td className="px-4 py-3 text-xs font-bold text-slate-700" colSpan={4}>
                              Total ({data.tasks.length} tasks)
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-extrabold text-blue-700">
                              {fmt(r.total_task_amount)} AED
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── INCENTIVES TAB ── */}
            {tab === 'incentives' && (
              <div>
                {data.incentives.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-sm">No incentives in this period</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900">
                        {data.incentives.length} Incentive Entries
                      </p>
                      <p className="text-sm font-extrabold text-emerald-600">
                        +{fmt(r.total_incentives)} AED total
                      </p>
                    </div>
                    <div className="space-y-3">
                      {data.incentives.map((inc) => (
                        <div
                          key={inc.id}
                          className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
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
                                  d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900">
                                {inc.reason ?? 'Incentive'}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {fmtDT(inc.created_at)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-extrabold text-emerald-600">
                            +{fmt(inc.amount)} AED
                          </p>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-700">Total Incentives</span>
                        <span className="text-base font-extrabold text-emerald-600">
                          +{fmt(r.total_incentives)} AED
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── PENALTIES TAB ── */}
            {tab === 'penalties' && (
              <div>
                {data.penalties.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-sm">No penalties in this period</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900">
                        {data.penalties.length} Penalty Entries
                      </p>
                      <p className="text-sm font-extrabold text-red-500">
                        −{fmt(r.total_penalties)} AED total
                      </p>
                    </div>
                    <div className="space-y-3">
                      {data.penalties.map((pen) => (
                        <div
                          key={pen.id}
                          className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center text-white">
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
                                  d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900">
                                {pen.reason ?? 'Penalty'}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {fmtDT(pen.created_at)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-extrabold text-red-600">
                            −{fmt(pen.amount)} AED
                          </p>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-700">Total Penalties</span>
                        <span className="text-base font-extrabold text-red-600">
                          −{fmt(r.total_penalties)} AED
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── DAILY BREAKDOWN TAB ── */}
            {tab === 'daily' && (
              <div>
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-slate-900">Daily Work Records</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tasks completed per day with incentive rule breakdowns
                  </p>
                </div>
                {data.dailyBreakdown.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-sm">No daily records for this period</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.dailyBreakdown.map((day, i) => (
                      <div
                        key={i}
                        className={`rounded-xl border p-4 ${day.incentive_amount ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                              <p className="text-xs font-extrabold text-slate-900">
                                {new Date(day.date).getDate()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900">
                                {fmtD(day.date)}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {day.tasks_completed} task{day.tasks_completed !== 1 ? 's' : ''}{' '}
                                completed
                              </p>
                            </div>
                          </div>
                          {day.incentive_amount && (
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-xs font-extrabold text-emerald-600">
                                  +{fmt(day.incentive_amount)} AED
                                </p>
                                <p className="text-[10px] text-emerald-700 font-medium">
                                  {day.rule_name}
                                </p>
                              </div>
                              <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2.5}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.5 10.5L12 3m0 0l7.5 7.5"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        {day.rule_description && (
                          <p className="text-[10px] text-emerald-700 mt-2 pl-11">
                            {day.rule_description}
                          </p>
                        )}
                        {day.calculation_details && (
                          <div className="mt-2 pl-11">
                            <p className="text-[10px] text-slate-500 font-mono bg-white/70 px-2 py-1 rounded-lg border border-slate-200">
                              {JSON.stringify(day.calculation_details)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SalaryRecordDetail;
