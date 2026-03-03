import React, { useEffect, useState } from 'react';
import { api } from '../../services/commonAPI';
import {
    TrophyIcon,
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import FraudTrends from './FraudTrends';

interface PerformerRow {
    cleaner_id: string;
    cleaner_name: string;
    building_name: string;
    completed_tasks: number;
    avg_wash_time_mins: number;
}

interface BuildingMetric {
    building_id: string;
    building_name: string;
    total_washes: number;
    avg_rating: number;
    revenue: number;
}

interface RatingSummary {
    rating: number;
    count: number;
    percentage: number;
}

type Period = 'daily' | 'weekly' | 'monthly' | 'all';

export default function PerformanceInsights() {
    const [data, setData] = useState<PerformerRow[]>([]);
    const [buildings, setBuildings] = useState<BuildingMetric[]>([]);
    const [ratings, setRatings] = useState<RatingSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState<Period>('monthly');

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const { getBuildingComparison, getCustomerRatingSummary } = await import('../../services/allAPI');

                const [perfRes, buildRes, rateRes] = await Promise.all([
                    api.get(`/api/analytics/cleaner-performance?period=${period}`),
                    getBuildingComparison(),
                    getCustomerRatingSummary()
                ]);

                setData(perfRes.data.data || []);
                setBuildings(buildRes.data || []);
                setRatings(rateRes.data || []);
            } catch (err) {
                console.error('FETCH INSIGHTS ERROR:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [period]);

    const topPerformers = data.slice(0, 5);
    const lowPerformers = [...data].sort((a, b) => Number(a.completed_tasks) - Number(b.completed_tasks)).slice(0, 5);

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <TrophyIcon className="w-6 h-6 text-amber-500" />
                        Performance Insights
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Cleaner rankings, Building comparisons, and Customer feedback</p>
                </div>

                {/* Period Filter */}
                <div className="mt-4 sm:mt-0 flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                    {(['daily', 'weekly', 'monthly', 'all'] as Period[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition ${period === p
                                ? 'bg-blue-600 text-white shadow'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            {p === 'all' ? 'All Time' : p}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
            ) : data.length === 0 && buildings.length === 0 ? (
                <div className="text-center py-20 text-slate-400">No data found for selected period.</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Top Performers */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
                                <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600" />
                                <h2 className="font-semibold text-emerald-800">Top Performers</h2>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">Rank</th>
                                        <th className="px-5 py-3 font-medium">Cleaner</th>
                                        <th className="px-5 py-3 font-medium text-right">Jobs</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {topPerformers.map((row, i) => (
                                        <tr key={row.cleaner_id} className="hover:bg-slate-50 transition">
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${i === 0 ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {i + 1}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 font-medium text-slate-900">{row.cleaner_name}</td>
                                            <td className="px-5 py-3 text-right font-semibold text-emerald-700">{row.completed_tasks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Low Performers */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-5 py-4 bg-red-50 border-b border-red-100 flex items-center gap-2">
                                <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
                                <h2 className="font-semibold text-red-800">Low Performers</h2>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">#</th>
                                        <th className="px-5 py-3 font-medium">Cleaner</th>
                                        <th className="px-5 py-3 font-medium text-right">Jobs</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {lowPerformers.map((row, i) => (
                                        <tr key={row.cleaner_id} className="hover:bg-slate-50 transition">
                                            <td className="px-5 py-3 text-slate-400 text-xs font-medium">{i + 1}</td>
                                            <td className="px-5 py-3 font-medium text-slate-900">{row.cleaner_name}</td>
                                            <td className="px-5 py-3 text-right font-semibold text-red-600">{row.completed_tasks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Building Comparison Section */}
                    {buildings.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <BuildingOfficeIcon className="w-6 h-6 text-blue-500" />
                                Building-wise Comparison
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {buildings.map(b => (
                                    <div key={b.building_id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{b.building_name}</p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-slate-500">Total Washes</span>
                                                <span className="text-lg font-bold text-slate-900">{b.total_washes}</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-slate-500">Avg Rating</span>
                                                <span className="text-sm font-semibold text-amber-500">★ {Number(b.avg_rating).toFixed(1)}</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-slate-500">Revenue</span>
                                                <span className="text-sm font-bold text-emerald-600">₹{Number(b.revenue).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Customer Rating Summary Section */}
                    {ratings.length > 0 && (
                        <div className="mt-8 mb-12">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <StarIcon className="w-6 h-6 text-amber-500" />
                                Customer Rating Summary
                            </h2>
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="space-y-6 max-w-2xl">
                                    {ratings.map(r => (
                                        <div key={r.rating} className="flex items-center gap-4">
                                            <div className="flex items-center gap-1 w-12">
                                                <span className="text-sm font-bold text-slate-700">{r.rating}</span>
                                                <StarIcon className="w-4 h-4 text-amber-400 fill-amber-400" />
                                            </div>
                                            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-400 rounded-full"
                                                    style={{ width: `${r.percentage}%` }}
                                                />
                                            </div>
                                            <div className="w-20 text-right">
                                                <span className="text-sm font-bold text-slate-900">{r.percentage}%</span>
                                                <span className="text-[10px] text-slate-400 block">({r.count})</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
            <div className="mt-8">
                <FraudTrends />
            </div>
        </div>
    );
}

const BuildingOfficeIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
);
