import React, { useEffect, useState } from 'react';
import { getFraudTrends } from '../../services/allAPI';
import { ShieldExclamationIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface FraudTrend {
    date: string;
    building_name: string;
    fraud_type: string;
    incident_count: string | number;
}

export default function FraudTrends() {
    const [trends, setTrends] = useState<FraudTrend[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await getFraudTrends();
                setTrends(res.data || []);
            } catch (err) {
                console.error('Failed to fetch fraud trends:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const formatType = (type: string) => {
        return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <ShieldExclamationIcon className="w-5 h-5 text-red-500" />
                        Fraud Trend Analysis
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Incident breakdown by location and date</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Building</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Violation Type</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Count</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {trends.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No fraud incidents recorded for the current period.</td>
                            </tr>
                        ) : (
                            trends.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                                            {new Date(row.date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                            <MapPinIcon className="w-4 h-4 text-blue-500" />
                                            {row.building_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.fraud_type.includes('location') ? 'bg-orange-100 text-orange-800' :
                                                row.fraud_type.includes('duplicate') ? 'bg-red-100 text-red-800' :
                                                    'bg-slate-100 text-slate-800'
                                            }`}>
                                            {formatType(row.fraud_type)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className="text-sm font-bold text-slate-900">{row.incident_count}</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
