import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Pressable,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldAlert, CheckCircle, AlertTriangle, Clock, MapPin } from 'lucide-react-native';
import api from '@/src/api/api';

interface FraudCase {
    id: string;
    type: 'missing_photo' | 'too_fast' | 'duplicate_vehicle' | 'duplicate_photo' | 'location_mismatch';
    status: 'pending' | 'resolved' | 'escalated';
    created_at: string;
    car_number: string;
    car_type: string;
    task_id: string;
    cleaner_name: string;
    before_wash_image_url?: string;
    after_wash_image_url?: string;
}

export default function FraudReview() {
    const insets = useSafeAreaInsets();
    const [cases, setCases] = useState<FraudCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const loadCases = async () => {
        try {
            const res = await api.get('/api/fraud/pending');
            const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
            setCases(data);
        } catch (err) {
            console.error('Failed to load fraud cases:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadCases(); }, []);
    const onRefresh = () => { setRefreshing(true); loadCases(); };

    const handleStatusUpdate = async (id: string, newStatus: 'resolved' | 'escalated') => {
        try {
            setUpdating(id);
            await api.patch(`/api/fraud/${id}/status`, { status: newStatus });
            setCases((prev) => prev.filter((c) => c.id !== id));
        } catch {
            Alert.alert('Error', 'Failed to update fraud case.');
        } finally {
            setUpdating(null);
        }
    };

    const getFraudIcon = (type: string) => {
        switch (type) {
            case 'missing_photo': return <ShieldAlert size={20} color="#EF4444" />;
            case 'too_fast': return <Clock size={20} color="#F59E0B" />;
            case 'duplicate_vehicle': return <AlertTriangle size={20} color="#EF4444" />;
            case 'duplicate_photo': return <ShieldAlert size={20} color="#EF4444" />;
            case 'location_mismatch': return <MapPin size={20} color="#EF4444" />;
            default: return <AlertTriangle size={20} color="#94A3B8" />;
        }
    };

    const formatType = (type: string) => {
        return type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingTop: insets.top }}>
            {/* Header */}
            <View style={{ padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#1E293B' }}>Fraud Review</Text>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                    Action required on flagged tasks across your building
                </Text>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#0EA5E9" />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsVerticalScrollIndicator={false}
                >
                    {cases.length === 0 ? (
                        <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <CheckCircle size={48} color="#10B981" />
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#10B981', marginTop: 16 }}>
                                All clear! No fraud cases pending.
                            </Text>
                        </View>
                    ) : (
                        cases.map((c) => (
                            <View
                                key={c.id}
                                style={{
                                    backgroundColor: '#fff',
                                    borderRadius: 14,
                                    padding: 16,
                                    marginBottom: 12,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.05,
                                    shadowRadius: 10,
                                    elevation: 2,
                                    borderLeftWidth: 4,
                                    borderLeftColor: c.type === 'too_fast' ? '#F59E0B' : '#EF4444',
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        {getFraudIcon(c.type)}
                                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E293B' }}>
                                            {formatType(c.type)}
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 10, color: '#64748B' }}>
                                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>

                                <View style={{ backgroundColor: '#F1F5F9', borderRadius: 8, padding: 10, marginBottom: 14 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B', marginBottom: 4 }}>
                                        {c.cleaner_name}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                                        {c.car_type} • {c.car_number}
                                    </Text>
                                </View>

                                {/* Photo Verification Section */}
                                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                                    <Pressable
                                        onPress={() => c.before_wash_image_url && setSelectedImage(c.before_wash_image_url)}
                                        style={{ flex: 1, height: 100, backgroundColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden' }}
                                    >
                                        {c.before_wash_image_url ? (
                                            <View style={{ flex: 1 }}>
                                                <Image source={{ uri: c.before_wash_image_url }} style={{ flex: 1 }} />
                                                <View style={{ position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 4, borderRadius: 2 }}>
                                                    <Text style={{ color: '#fff', fontSize: 8 }}>Before</Text>
                                                </View>
                                            </View>
                                        ) : (
                                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={{ fontSize: 10, color: '#94A3B8' }}>No Photo</Text>
                                            </View>
                                        )}
                                    </Pressable>
                                    <Pressable
                                        onPress={() => c.after_wash_image_url && setSelectedImage(c.after_wash_image_url)}
                                        style={{ flex: 1, height: 100, backgroundColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden' }}
                                    >
                                        {c.after_wash_image_url ? (
                                            <View style={{ flex: 1 }}>
                                                <Image source={{ uri: c.after_wash_image_url }} style={{ flex: 1 }} />
                                                <View style={{ position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 4, borderRadius: 2 }}>
                                                    <Text style={{ color: '#fff', fontSize: 8 }}>After</Text>
                                                </View>
                                            </View>
                                        ) : (
                                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={{ fontSize: 10, color: '#94A3B8' }}>No Photo</Text>
                                            </View>
                                        )}
                                    </Pressable>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <Pressable
                                        onPress={() => handleStatusUpdate(c.id, 'resolved')}
                                        disabled={updating === c.id}
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#ECFDF5',
                                            borderRadius: 8,
                                            paddingVertical: 10,
                                            alignItems: 'center',
                                            borderWidth: 1,
                                            borderColor: '#10B981',
                                        }}
                                    >
                                        {updating === c.id ? (
                                            <ActivityIndicator size="small" color="#10B981" />
                                        ) : (
                                            <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 12 }}>Mark Resolved</Text>
                                        )}
                                    </Pressable>

                                    <Pressable
                                        onPress={() => handleStatusUpdate(c.id, 'escalated')}
                                        disabled={updating === c.id}
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#FEF2F2',
                                            borderRadius: 8,
                                            paddingVertical: 10,
                                            alignItems: 'center',
                                            borderWidth: 1,
                                            borderColor: '#EF4444',
                                        }}
                                    >
                                        <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 12 }}>Escalate</Text>
                                    </Pressable>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <Pressable
                    onPress={() => setSelectedImage(null)}
                    style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                >
                    <Image source={{ uri: selectedImage }} style={{ width: '90%', height: '70%', borderRadius: 12 }} resizeMode="contain" />
                    <Pressable
                        onPress={() => setSelectedImage(null)}
                        style={{ marginTop: 20, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
                    >
                        <Text style={{ fontWeight: '700', color: '#1E293B' }}>Close View</Text>
                    </Pressable>
                </Pressable>
            )}
        </View>
    );
}

import { Image } from 'react-native';
