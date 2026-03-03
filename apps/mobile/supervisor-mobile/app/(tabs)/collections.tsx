import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banknote, Smartphone, AlertCircle } from 'lucide-react-native';
import api from '../../src/api/api';

interface CleanerCollection {
    cleaner_id: string;
    cleaner_name: string;
    cash: number;
    upi: number;
    card: number;
    total: number;
    pending_count: number;
}

export default function Collections() {
    const insets = useSafeAreaInsets();
    const [collections, setCollections] = useState<CleanerCollection[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadCollections = async () => {
        try {
            const res = await api.get('/tasks/collections/supervisor');
            const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
            setCollections(data);
        } catch (err) {
            console.error('Failed to load collections:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadCollections(); }, []);
    const onRefresh = () => { setRefreshing(true); loadCollections(); };

    const totalCash = collections.reduce((s, c) => s + c.cash, 0);
    const totalUPI = collections.reduce((s, c) => s + c.upi, 0);
    const totalAll = collections.reduce((s, c) => s + c.total, 0);

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingTop: insets.top }}>
            {/* Header */}
            <View style={{ padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#1E293B' }}>Collections</Text>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                    Payment summary across your cleaners (today)
                </Text>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#1B86C6" />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Summary row */}
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                        {[
                            { label: 'Cash', value: totalCash, color: '#10B981', bg: '#ECFDF5', icon: <Banknote size={16} color="#10B981" /> },
                            { label: 'UPI', value: totalUPI, color: '#1B86C6', bg: '#EFF6FF', icon: <Smartphone size={16} color="#1B86C6" /> },
                            { label: 'Total', value: totalAll, color: '#7C3AED', bg: '#F5F3FF', icon: <Banknote size={16} color="#7C3AED" /> },
                        ].map(({ label, value, color, bg, icon }) => (
                            <View key={label} style={{ flex: 1, backgroundColor: bg, borderRadius: 12, padding: 12, alignItems: 'center' }}>
                                {icon}
                                <Text style={{ fontSize: 16, fontWeight: '800', color, marginTop: 4 }}>
                                    ₹{value.toLocaleString('en-IN')}
                                </Text>
                                <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, textTransform: 'uppercase' }}>
                                    {label}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Per-cleaner cards */}
                    {collections.length === 0 ? (
                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <Banknote size={48} color="#CBD5E1" />
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#94A3B8', marginTop: 16 }}>
                                No collection data yet
                            </Text>
                        </View>
                    ) : (
                        collections.map((c) => (
                            <View
                                key={c.cleaner_id}
                                style={{
                                    backgroundColor: '#fff',
                                    borderRadius: 14,
                                    padding: 16,
                                    marginBottom: 12,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.05,
                                    shadowRadius: 10,
                                    elevation: 2,
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>
                                        {c.cleaner_name}
                                    </Text>
                                    {c.pending_count > 0 && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                                            <AlertCircle size={12} color="#EF4444" />
                                            <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: '700' }}>
                                                {c.pending_count} pending
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {[
                                        { label: 'Cash', value: c.cash, color: '#10B981' },
                                        { label: 'UPI', value: c.upi, color: '#1B86C6' },
                                        { label: 'Card', value: c.card, color: '#7C3AED' },
                                        { label: 'Total', value: c.total, color: '#1E293B' },
                                    ].map(({ label, value, color }) => (
                                        <View key={label} style={{ flex: 1, alignItems: 'center' }}>
                                            <Text style={{ fontSize: 13, fontWeight: '700', color }}>
                                                ₹{value.toLocaleString('en-IN')}
                                            </Text>
                                            <Text style={{ fontSize: 9, color: '#94A3B8', marginTop: 2, textTransform: 'uppercase' }}>
                                                {label}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}
