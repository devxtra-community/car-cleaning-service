import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/commonAPI';
import {
    ArrowDownTrayIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';

interface SalaryRow {
    salary_id: string;
    user_id: string;
    full_name: string;
    role: string;
    email: string;
    building_name: string;
    base_salary: number;
    incentives: number;
    penalties: number;
    final_salary: number;
    status: string;
    salary_month: string;
    cycle_id: string;
}

interface SalaryCycle {
    id: string;
    year: number;
    month: number;
    is_locked: boolean;
}

type RoleTab = 'cleaner' | 'supervisor' | 'all';

const STATUS_COLORS: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700',
    locked: 'bg-amber-100 text-amber-700',
    finalized: 'bg-blue-100 text-blue-700',
    generated: 'bg-slate-100 text-slate-600',
    pending: 'bg-red-100 text-red-600',
};

export default function RoleBasedSalary() {
    const [rows, setRows] = useState<SalaryRow[]>([]);
    const [cycles, setCycles] = useState<SalaryCycle[]>([]);
    const [selectedCycle, setSelectedCycle] = useState('');
    const [roleTab, setRoleTab] = useState<RoleTab>('cleaner');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

    // Fetch cycles for the dropdown
    useEffect(() => {
        api.get('/salary/salary-cycles')
            .then(res => setCycles(res.data.data || []))
            .catch(() => setCycles([]));
    }, []);

    const fetchSalaries = useCallback(async () => {
        setLoading(true);
        try {
            const params = selectedCycle ? `?cycleId=${selectedCycle}` : '';
            const res = await api.get(`/salary/role-summary${params}`);
            setRows(res.data.data || []);
        } catch {
            setToast({ message: 'Failed to load salary data', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [selectedCycle]);

    useEffect(() => {
        fetchSalaries();
    }, [fetchSalaries]);

    const filtered = rows.filter(r => roleTab === 'all' || r.role === roleTab);

    const totals = filtered.reduce(
        (acc, r) => ({
            base: acc.base + Number(r.base_salary),
            incentives: acc.incentives + Number(r.incentives),
            penalties: acc.penalties + Number(r.penalties),
            net: acc.net + Number(r.final_salary),
        }),
        { base: 0, incentives: 0, penalties: 0, net: 0 }
    );

    const handleExportCSV = () => {
        if (!filtered.length) return;
        const headers = ['Name', 'Role', 'Building', 'Month', 'Base Salary (₹)', 'Incentives (₹)', 'Penalties (₹)', 'Net Salary (₹)', 'Status'];
        const csvRows = filtered.map(r =>
            [r.full_name, r.role, r.building_name, r.salary_month,
            Number(r.base_salary).toFixed(2),
            Number(r.incentives).toFixed(2),
            Number(r.penalties).toFixed(2),
            Number(r.final_salary).toFixed(2),
            r.status].join(',')
        );
        const csv = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `salary_${roleTab}_${selectedCycle || 'all'}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    return (
        <div className="p-6 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <UserGroupIcon className="w-6 h-6 text-indigo-600" />
                        Role-Based Salary
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Real salary data — Cleaners and Supervisors</p>
                </div>
                <div className="mt-4 sm:mt-0 flex flex-wrap gap-2 items-center">
                    {/* Cycle Selector */}
                    <select
                        value={selectedCycle}
                        onChange={e => setSelectedCycle(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Cycles</option>
                        {cycles.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.year}-{String(c.month).padStart(2, '0')} {c.is_locked ? '🔒' : ''}
                            </option>
                        ))}
                    </select>

                    {/* CSV Export */}
                    <button
                        onClick={handleExportCSV}
                        disabled={!filtered.length}
                        className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 transition"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Role Tabs */}
            <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm w-fit mb-6">
                {(['cleaner', 'supervisor', 'all'] as RoleTab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setRoleTab(tab)}
                        className={`px-5 py-1.5 text-sm font-medium rounded-md capitalize transition ${roleTab === tab
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                    >
                        {tab === 'all' ? 'All Roles' : tab === 'cleaner' ? 'Cleaners' : 'Supervisors'}
                        <span className="ml-1.5 text-xs opacity-75">
                            ({rows.filter(r => tab === 'all' || r.role === tab).length})
                        </span>
                    </button>
                ))}
            </div>

            {/* Totals Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Base Salary', value: totals.base, color: 'text-slate-700 bg-slate-50 border-slate-200' },
                    { label: 'Incentives', value: totals.incentives, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                    { label: 'Penalties', value: totals.penalties, color: 'text-red-700 bg-red-50 border-red-200' },
                    { label: 'Net Salary', value: totals.net, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
                ].map(c => (
                    <div key={c.label} className={`border rounded-xl p-4 ${c.color}`}>
                        <p className="text-xs font-semibold uppercase text-gray-600">{c.label}</p>
                        <p className="text-2xl font-bold mt-1">{fmt(c.value)}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                            <tr>
                                <th className="px-5 py-3 font-medium">Employee</th>
                                <th className="px-5 py-3 font-medium">Role</th>
                                <th className="px-5 py-3 font-medium">Building</th>
                                <th className="px-5 py-3 font-medium">Month</th>
                                <th className="px-5 py-3 font-medium text-right">Base (₹)</th>
                                <th className="px-5 py-3 font-medium text-right">Incentives (₹)</th>
                                <th className="px-5 py-3 font-medium text-right">Penalties (₹)</th>
                                <th className="px-5 py-3 font-medium text-right">Net Salary (₹)</th>
                                <th className="px-5 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="py-16 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
                                            <p className="text-slate-500 text-sm">Loading salary data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-16 text-center text-slate-400">
                                        No salary records found. Generate salaries from Salary Cycles first.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={`${row.user_id}-${row.salary_id || 'no-sal'}`} className="hover:bg-slate-50 transition">
                                        <td className="px-5 py-3">
                                            <p className="font-medium text-slate-900">{row.full_name}</p>
                                            <p className="text-xs text-slate-400">{row.email}</p>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${row.role === 'cleaner' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'
                                                }`}>
                                                {row.role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">{row.building_name}</td>
                                        <td className="px-5 py-3 text-slate-600 font-mono text-xs">{row.salary_month || selectedCycle || 'N/A'}</td>
                                        <td className="px-5 py-3 text-right">{fmt(row.base_salary)}</td>
                                        <td className="px-5 py-3 text-right text-emerald-700 font-medium">
                                            {row.role === 'cleaner' && Number(row.incentives) > 0 ? `+${fmt(row.incentives)}` : '—'}
                                        </td>
                                        <td className="px-5 py-3 text-right text-red-600">
                                            {row.role === 'cleaner' && Number(row.penalties) > 0 ? `-${fmt(row.penalties)}` : '—'}
                                        </td>
                                        <td className="px-5 py-3 text-right font-semibold text-indigo-700">{fmt(row.final_salary)}</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${row.status === 'not_generated' ? 'bg-slate-50 text-slate-400 border border-slate-200' : (STATUS_COLORS[row.status] || STATUS_COLORS.pending)
                                                }`}>
                                                {row.status === 'not_generated' ? 'Not Generated' : row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {filtered.length > 0 && (
                            <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-sm">
                                <tr>
                                    <td colSpan={4} className="px-5 py-3 text-slate-700">Totals ({filtered.length} records)</td>
                                    <td className="px-5 py-3 text-right">{fmt(totals.base)}</td>
                                    <td className="px-5 py-3 text-right text-emerald-700">
                                        {roleTab === 'supervisor' ? '—' : `+${fmt(totals.incentives)}`}
                                    </td>
                                    <td className="px-5 py-3 text-right text-red-600">
                                        {roleTab === 'supervisor' ? '—' : `-${fmt(totals.penalties)}`}
                                    </td>
                                    <td className="px-5 py-3 text-right text-indigo-800">{fmt(totals.net)}</td>
                                    <td />
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {toast && (
                <div className={`fixed bottom-5 right-5 px-4 py-3 rounded-lg shadow-lg text-white text-sm z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
