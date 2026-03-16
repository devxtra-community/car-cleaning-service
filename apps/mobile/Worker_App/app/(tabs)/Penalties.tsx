import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, AlertTriangle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../src/api/api';
import { useLanguage } from '../../contexts/LanguageContext';

type Penalty = {
  id: string;
  amount: string;
  reason: string;
  created_at: string;
};

type Period = 'day' | 'week' | 'month';

const PeriodTab = ({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: Period;
  active: boolean;
  onPress: (p: Period) => void;
}) => {
  return (
    <Pressable
      onPress={() => onPress(value)}
      className={`flex-1 py-3 rounded-xl border ${active ? 'bg-[#EF4444] border-[#EF4444]' : 'bg-white border-transparent'
        } clay-button items-center justify-center`}
    >
      <Text
        className={`text-[10px] font-black text-center uppercase tracking-wide ${active ? 'text-white' : 'text-clay-secondary'
          }`}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const PenaltyCard = ({ penalty }: { penalty: Penalty }) => {
  return (
    <View className="clay-card p-5 mb-4 bg-white border border-red-50">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-4 flex-1">
          <View className="w-10 h-10 rounded-full items-center justify-center bg-red-50 border border-red-100">
            <AlertTriangle size={18} color="#EF4444" />
          </View>
          <View className="flex-1">
            <Text className="font-heading text-sm text-clay-text mb-0.5">{penalty.reason}</Text>
            <Text className="text-[10px] font-body text-clay-secondary">
              {new Date(penalty.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>
        <Text className="font-heading text-base text-[#EF4444]">
          -₹{Number(penalty.amount).toFixed(0)}
        </Text>
      </View>
    </View>
  );
};

export default function PenaltiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [period, setPeriod] = useState<Period>('week');
  const [stats, setStats] = useState({ totalAmount: 0, count: 0 });

  const loadPenalties = async (selectedPeriod: Period) => {
    try {
      setLoading(true);
      const res = await api.get(`/penalties/my?period=${selectedPeriod}&_t=${Date.now()}`);
      if (res.data.success) {
        setPenalties(res.data.data);
        setStats({
          totalAmount: res.data.meta.totalAmount,
          count: res.data.meta.count,
        });
      }
    } catch (e: unknown) {
      console.error('FULL ERROR:', e);
      const err = e as { response?: { status?: number; data?: unknown } };
      if (err.response) {
        console.error('RESPONSE STATUS:', err.response.status);
        console.error('RESPONSE DATA:', JSON.stringify(err.response.data, null, 2));
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPenalties(period);
    }, [period])
  );

  const onRefresh = () => loadPenalties(period);

  return (
    <View className="flex-1 bg-[#FEF2F2]">
      <LinearGradient
        colors={['#FEF2F2', '#FFF1F2', '#FFFFFF']}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      <View
        className="pb-6 rounded-b-[40px] shadow-sm bg-white/80"
        style={{
          paddingTop: insets.top + 10,
        }}
      >
        <View className="px-6 flex-row items-center justify-between mb-6">
          <Pressable
            onPress={() => router.push('/(tabs)/Homepage')}
            className="w-10 h-10 rounded-xl items-center justify-center bg-white shadow-sm border border-gray-100"
          >
            <ChevronLeft size={24} color="#1E293B" />
          </Pressable>
          <Text className="text-xl font-heading tracking-tight text-clay-text">{t('penalties.title')}</Text>
          <View className="w-10" />
        </View>

        <View className="flex-row gap-3 px-6">
          <PeriodTab label={t('penalties.daily')} value="day" active={period === 'day'} onPress={setPeriod} />
          <PeriodTab label={t('penalties.weekly')} value="week" active={period === 'week'} onPress={setPeriod} />
          <PeriodTab
            label={t('penalties.monthly')}
            value="month"
            active={period === 'month'}
            onPress={setPeriod}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#EF4444" />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Summary Card */}
        <View className="clay-card p-6 mb-8 bg-white overflow-hidden relative border-red-100">
          <LinearGradient
            colors={['rgba(254,242,242,0.8)', 'rgba(255,255,255,0.4)']}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
          />
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center border border-red-100">
              <AlertTriangle size={20} color="#EF4444" />
            </View>
            <Text className="text-[11px] font-label uppercase tracking-widest text-[#EF4444]">
              {t('penalties.total')}
            </Text>
          </View>

          <Text className="text-4xl font-heading mb-6 text-clay-text tracking-tight ml-1">
            ₹{stats.totalAmount}
          </Text>

          <View className="p-3 rounded-xl bg-red-50 border border-red-100">
            <Text className="text-[10px] font-bold uppercase tracking-wide text-center text-[#EF4444]">
              {t(stats.count === 1 ? 'penalties.recordsFound' : 'penalties.recordsFound_plural', { count: stats.count })}
            </Text>
          </View>
        </View>

        {/* Penalties List */}
        {penalties.length > 0 ? (
          <View>
            <Text className="font-label text-[10px] uppercase tracking-widest mb-4 ml-1 text-clay-secondary/80">
              {t('penalties.detailedLog')}
            </Text>
            {penalties.map((penalty) => (
              <PenaltyCard key={penalty.id} penalty={penalty} />
            ))}
          </View>
        ) : (
          <View className="clay-card p-10 items-center justify-center bg-white border-green-50">
            <View className="w-16 h-16 rounded-full bg-green-50 items-center justify-center mb-4 border border-green-100">
              <AlertTriangle size={32} color="#10B981" />
            </View>
            <Text className="font-heading text-lg text-clay-text mb-1">{t('penalties.noPenalties')}</Text>
            <Text className="text-xs font-body text-clay-secondary">{t('penalties.keepItUp')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
