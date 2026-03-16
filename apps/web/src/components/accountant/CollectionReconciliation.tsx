import React, { useEffect, useState } from 'react';
import { getCollectionsReconciliation } from '../../services/allAPI';
import {
    BanknotesIcon,
    ArrowPathIcon,
    ExclamationCircleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ReconciliationRow {
    cleaner_id: string;
    cleaner_name: string;
    expected_total: number;
    actual_total: number;
    difference: number;
    cash_collected: number;
    upi_collected: number;
    card_collected: number;
}

export default function CollectionReconciliation() {
    const [data, setData] = useState<ReconciliationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getCollectionsReconciliation();
            setData(res.data || []);
        } catch (err) {
            console.error('Failed to fetch reconciliation:', err);
            setError('Failed to load reconciliation data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-500">Loading reconciliation data...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <BanknotesIcon className="w-5 h-5 text-emerald-600" />
                        Collections Reconciliation
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Expected vs Actual collections per cleaner</p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                    <ArrowPathIcon className="w-5 h-5 text-slate-500" />
                </button>
            </div>

            {error && (
                <div className="p-6 text-center text-red-500 flex flex-col items-center">
                    <ExclamationCircleIcon className="w-10 h-10 mb-2" />
                    <p>{error}</p>
                </div>
            )}

            {!error && data.length === 0 && (
                <div className="p-12 text-center text-slate-400 italic">
                    No reconciliation data found for the current period.
                </div>
            )}

            {!error && data.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Cleaner</th>
                                <th className="px-6 py-3 font-medium text-right">Expected (Sales)</th>
                                <th className="px-6 py-3 font-medium text-right">Actual (Collected)</th>
                                <th className="px-6 py-3 font-medium text-right">Difference</th>
                                <th className="px-6 py-3 font-medium text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.map((row) => (
                                <tr key={row.cleaner_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{row.cleaner_name}</div>
                                        <div className="text-[11px] text-slate-400 uppercase flex gap-2 mt-1">
                                            <span>Cash: ₹{row.cash_collected}</span>
                                            <span>•</span>
                                            <span>UPI: ₹{row.upi_collected}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-700">₹{Number(row.expected_total).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-900">₹{Number(row.actual_total).toFixed(2)}</td>
                                    <td className={`px-6 py-4 text-right font-bold ${row.difference === 0 ? 'text-emerald-500' :
                                            Math.abs(row.difference) < 10 ? 'text-amber-500' : 'text-red-500'
                                        }`}>
                                        {row.difference === 0 ? '0.00' : (row.difference > 0 ? '+' : '') + Number(row.difference).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {row.difference === 0 ? (
                                            <CheckCircleIcon className="w-5 h-5 text-emerald-500 mx-auto" />
                                        ) : (
                                            <ExclamationCircleIcon className="w-5 h-5 text-amber-500 mx-auto" />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 italic">
                * Expected value is calculated from all completed washes. Actual is based on payment records.
            </div>
        </div>
    );
}
