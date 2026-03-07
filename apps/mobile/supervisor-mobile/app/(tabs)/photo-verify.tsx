import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    Pressable,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, AlertCircle, Camera } from 'lucide-react-native';
import api from '../../src/api/api';

interface Job {
    id: string;
    car_number: string;
    car_type: string;
    owner_name: string;
    before_wash_image_url?: string;
    car_image_url?: string;
    after_wash_image_url?: string;
    created_at: string;
    verification_status?: 'pending' | 'approved' | 'flagged';
}

export default function PhotoVerify() {
    const insets = useSafeAreaInsets();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState<string | null>(null);

    const loadJobs = async () => {
        try {
            const res = await api.get('/tasks/supervisor/completed?limit=20');
            const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
            setJobs(data);
        } catch (err) {
            console.error('Failed to load jobs for verification:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadJobs(); }, []);

    const onRefresh = () => { setRefreshing(true); loadJobs(); };

    const verify = async (jobId: string, action: 'approved' | 'flagged') => {
        try {
            setSubmitting(jobId);
            await api.patch(`/tasks/${jobId}/verify`, { status: action });
            setJobs((prev) =>
                prev.map((j) => (j.id === jobId ? { ...j, verification_status: action } : j))
            );
        } catch {
            Alert.alert('Error', 'Failed to update verification status.');
        } finally {
            setSubmitting(null);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingTop: insets.top }}>
            {/* Header */}
            <View style={{ padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#1E293B' }}>Photo Verification</Text>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                    Review before/after photos and approve or flag jobs
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
                    {jobs.length === 0 ? (
                        <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <Camera size={48} color="#CBD5E1" />
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#94A3B8', marginTop: 16 }}>
                                No jobs to verify
                            </Text>
                        </View>
                    ) : (
                        jobs.map((job) => (
                            <View
                                key={job.id}
                                style={{
                                    backgroundColor: '#fff',
                                    borderRadius: 16,
                                    padding: 16,
                                    marginBottom: 16,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.06,
                                    shadowRadius: 12,
                                    elevation: 3,
                                    borderWidth: 1,
                                    borderColor:
                                        job.verification_status === 'approved'
                                            ? '#10B981'
                                            : job.verification_status === 'flagged'
                                                ? '#EF4444'
                                                : '#E2E8F0',
                                }}
                            >
                                {/* Job Info */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <View>
                                        <Text style={{ fontWeight: '700', fontSize: 15, color: '#1E293B' }}>
                                            {job.car_number}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>
                                            {job.car_type} • {job.owner_name}
                                        </Text>
                                    </View>
                                    {job.verification_status && (
                                        <View
                                            style={{
                                                paddingHorizontal: 10,
                                                paddingVertical: 4,
                                                borderRadius: 20,
                                                backgroundColor:
                                                    job.verification_status === 'approved' ? '#ECFDF5' : '#FEF2F2',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    color: job.verification_status === 'approved' ? '#10B981' : '#EF4444',
                                                }}
                                            >
                                                {job.verification_status}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Photos */}
                                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                                    {[
                                        { label: 'Before', url: job.car_image_url ?? job.before_wash_image_url },
                                        { label: 'After', url: job.after_wash_image_url },
                                    ].map(({ label, url }) => (
                                        <View key={label} style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 10, fontWeight: '600', color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase' }}>
                                                {label}
                                            </Text>
                                            {url ? (
                                                <Image
                                                    source={{ uri: url }}
                                                    style={{ width: '100%', height: 120, borderRadius: 10, backgroundColor: '#F1F5F9' }}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View
                                                    style={{
                                                        width: '100%',
                                                        height: 120,
                                                        borderRadius: 10,
                                                        backgroundColor: '#F1F5F9',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Text style={{ fontSize: 11, color: '#CBD5E1' }}>No Photo</Text>
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </View>

                                {/* Action Buttons */}
                                {!job.verification_status && (
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        <Pressable
                                            onPress={() => verify(job.id, 'approved')}
                                            disabled={submitting === job.id}
                                            style={{
                                                flex: 1,
                                                backgroundColor: '#10B981',
                                                borderRadius: 10,
                                                paddingVertical: 10,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            {submitting === job.id ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <>
                                                    <CheckCircle size={14} color="#fff" />
                                                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Approve</Text>
                                                </>
                                            )}
                                        </Pressable>

                                        <Pressable
                                            onPress={() => verify(job.id, 'flagged')}
                                            disabled={submitting === job.id}
                                            style={{
                                                flex: 1,
                                                backgroundColor: '#FEF2F2',
                                                borderRadius: 10,
                                                paddingVertical: 10,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 6,
                                                borderWidth: 1,
                                                borderColor: '#EF4444',
                                            }}
                                        >
                                            <AlertCircle size={14} color="#EF4444" />
                                            <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 12 }}>Flag</Text>
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}
