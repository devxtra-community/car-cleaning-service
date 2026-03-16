import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, MessageSquare, ArrowLeft } from 'lucide-react-native';
import api from '../../src/api/api';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';

/* ========== TYPES ========== */

interface Rating {
    id: string;
    rating: number;
    comment?: string;
    created_at: string;
    task?: {
        car_type: string;
        car_number: string;
        owner_name: string;
    };
}

/* ========== STAR ROW ========== */

const StarRow = ({ count, total }: { count: number; total: number }) => {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <View className="flex-row items-center gap-2 mb-1.5">
            <View className="flex-row items-center w-16">
                {[1, 2, 3, 4, 5].slice(0, count).map((i) => (
                    <Star key={i} size={10} color="#F59E0B" fill="#F59E0B" />
                ))}
            </View>
            <View className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <View style={{ width: `${pct}%`, backgroundColor: '#F59E0B', height: '100%', borderRadius: 999 }} />
            </View>
            <Text className="text-xs text-gray-400 w-6 text-right">{count}</Text>
        </View>
    );
};

/* ========== MAIN COMPONENT ========== */

export default function MyRatings() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { t } = useLanguage();
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadRatings = async () => {
        try {
            const res = await api.get('/feedback/my');
            const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
            setRatings(data);
        } catch (err) {
            console.error('Failed to load ratings:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadRatings();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadRatings();
    };

    // Compute stats
    const total = ratings.length;
    const avg = total > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / total : 0;
    const starCounts = [5, 4, 3, 2, 1].map((s) => ({
        star: s,
        count: ratings.filter((r) => r.rating === s).length,
    }));

    const renderStars = (rating: number) =>
        [1, 2, 3, 4, 5].map((i) => (
            <Star
                key={i}
                size={14}
                color="#F59E0B"
                fill={i <= rating ? '#F59E0B' : 'transparent'}
            />
        ));

    return (
        <View className="flex-1 bg-[#E0F2FE]">
            <LinearGradient
                colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
                style={{ position: 'absolute', width: '100%', height: '100%' }}
            />

            {/* Header */}
            <View
                className="pb-6 rounded-b-[40px] shadow-sm bg-white/80 z-10"
                style={{ paddingTop: insets.top + 10 }}
            >
                <View className="px-6 flex-row items-center">
                    <Pressable
                        onPress={() => router.back()}
                        className="w-10 h-10 items-center justify-center rounded-full bg-white shadow-sm mr-4"
                    >
                        <ArrowLeft size={24} color="#334155" />
                    </Pressable>
                    <View className="flex-1">
                        <Text className="text-2xl font-heading tracking-tight text-clay-text">{t('tabs.ratings')}</Text>
                        <Text className="font-label text-xs text-clay-secondary mt-1">{t('ratings.subtitle')}</Text>
                    </View>
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#0EA5E9" />
                </View>
            ) : (
                <ScrollView
                    className="flex-1 px-6"
                    contentContainerStyle={{ paddingTop: 24, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />}
                >
                    {/* Summary Card */}
                    <View className="clay-card p-6 mb-6 bg-white">
                        <View className="flex-row items-center gap-6">
                            {/* Big Average */}
                            <View className="items-center">
                                <Text className="text-5xl font-heading text-[#0EA5E9]">{avg.toFixed(1)}</Text>
                                <View className="flex-row mt-1">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star
                                            key={i}
                                            size={14}
                                            color="#F59E0B"
                                            fill={i <= Math.round(avg) ? '#F59E0B' : 'transparent'}
                                        />
                                    ))}
                                </View>
                                <Text className="font-label text-[10px] uppercase tracking-widest mt-1 text-clay-secondary">
                                    {total} {total === 1 ? t('ratings.review') : t('ratings.reviews')}
                                </Text>
                            </View>

                            {/* Breakdown bars */}
                            <View className="flex-1">
                                {starCounts.map(({ star, count }) => (
                                    <StarRow key={star} count={count} total={total} />
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Individual Rating Cards */}
                    {total === 0 ? (
                        <View className="clay-card p-8 items-center">
                            <MessageSquare size={40} color="#CBD5E1" />
                            <Text className="font-heading text-lg text-clay-text mt-4 mb-2">{t('ratings.noRatings')}</Text>
                            <Text className="text-center font-label text-xs text-clay-secondary max-w-[200px] leading-5">
                                {t('ratings.noRatingsSubtitle')}
                            </Text>
                        </View>
                    ) : (
                        ratings.map((r) => (
                            <View key={r.id} className="clay-card p-4 mb-3 bg-white">
                                <View className="flex-row justify-between items-start mb-2">
                                    <View>
                                        <Text className="font-heading text-sm text-clay-text">
                                            {r.task?.car_type ?? 'Vehicle'} — {r.task?.car_number ?? ''}
                                        </Text>
                                        <Text className="font-label text-[10px] uppercase tracking-widest text-clay-secondary mt-0.5">
                                            {new Date(r.created_at).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </Text>
                                    </View>
                                    <View className="flex-row">{renderStars(r.rating)}</View>
                                </View>
                                {r.comment ? (
                                    <Text className="font-body text-sm text-clay-secondary">{r.comment}</Text>
                                ) : (
                                    <Text className="font-label text-[10px] text-gray-300 italic">No comment left</Text>
                                )}
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}
