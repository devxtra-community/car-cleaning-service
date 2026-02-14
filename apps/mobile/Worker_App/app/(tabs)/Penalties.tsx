import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, AlertTriangle } from 'lucide-react-native';
import api from '../../src/api/api';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onPress(value)}
      className="flex-1 py-3 rounded-xl border"
      style={{
        backgroundColor: active ? colors.primary : colors.cardBackground,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text
        className="text-[10px] font-black text-center uppercase tracking-wide"
        style={{
          color: active ? '#FFFFFF' : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const PenaltyCard = ({ penalty }: { penalty: Penalty }) => {
  const { colors } = useTheme();
  return (
    <View
      className="p-4 rounded-[20px] mb-3 border shadow-sm"
      style={{
        backgroundColor: colors.cardBackground,
        borderColor: colors.dangerLight,
        shadowColor: colors.danger,
        shadowOpacity: 0.05,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: colors.dangerLight }}
          >
            <AlertTriangle size={18} color={colors.danger} />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-[12px] mb-0.5" style={{ color: colors.text }}>
              {penalty.reason}
            </Text>
            <Text className="text-[10px] font-medium" style={{ color: colors.textTertiary }}>
              {new Date(penalty.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>
        <Text className="font-black text-[13px]" style={{ color: colors.danger }}>
          -₹{Number(penalty.amount).toFixed(0)}
        </Text>
      </View>
    </View>
  );
};

export default function PenaltiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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
    } catch (e: any) {
      console.error('FULL ERROR:', e);
      if (e.response) {
        console.error('RESPONSE STATUS:', e.response.status);
        console.error('RESPONSE DATA:', JSON.stringify(e.response.data, null, 2));
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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View
        className="pb-4 shadow-sm"
        style={{
          paddingTop: insets.top + 10,
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        }}
      >
        <View className="px-6 flex-row items-center justify-between mb-6">
          <Pressable
            onPress={() => router.push('/(tabs)/Homepage')}
            className="w-12 h-12 rounded-xl items-center justify-center shadow-sm"
            style={{ backgroundColor: colors.background }}
          >
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text className="text-lg font-black tracking-tight" style={{ color: colors.text }}>
            Penalties
          </Text>
          <View className="w-12" />
        </View>

        <View className="flex-row gap-2 px-6">
          <PeriodTab label="Daily" value="day" active={period === 'day'} onPress={setPeriod} />
          <PeriodTab label="Weekly" value="week" active={period === 'week'} onPress={setPeriod} />
          <PeriodTab
            label="Monthly"
            value="month"
            active={period === 'month'}
            onPress={setPeriod}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.danger} />
        }
      >
        <View className="px-6 pt-6">
          {/* Summary Card */}
          <View
            className="rounded-[32px] p-6 mb-6 shadow-sm border"
            style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
          >
            <View className="flex-row items-center gap-3 mb-4">
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: colors.dangerLight }}
              >
                <AlertTriangle size={20} color={colors.danger} />
              </View>
              <Text
                className="text-[11px] font-black uppercase tracking-widest"
                style={{ color: colors.textSecondary }}
              >
                Total Penalty
              </Text>
            </View>
            <Text
              className="text-4xl font-black mb-5 tracking-tighter"
              style={{ color: colors.danger }}
            >
              ₹{stats.totalAmount}
            </Text>

            <View
              className="p-3 rounded-xl border-t"
              style={{ backgroundColor: colors.dangerLight, borderColor: colors.danger }}
            >
              <Text
                className="text-[10px] font-black uppercase tracking-wide text-center"
                style={{ color: colors.danger }}
              >
                {stats.count} {stats.count === 1 ? 'Record' : 'Records'} Found
              </Text>
            </View>
          </View>

          {/* Penalties List */}
          {penalties.length > 0 ? (
            <View>
              <Text
                className="font-bold text-[10px] uppercase tracking-widest mb-4"
                style={{ color: colors.textTertiary }}
              >
                Detailed Log
              </Text>
              {penalties.map((penalty) => (
                <PenaltyCard key={penalty.id} penalty={penalty} />
              ))}
            </View>
          ) : (
            <View
              className="rounded-[32px] p-10 items-center border"
              style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
            >
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: colors.successLight }}
              >
                <AlertTriangle size={32} color={colors.success} />
              </View>
              <Text
                className="font-black text-[12px] mb-1 uppercase tracking-widest"
                style={{ color: colors.text }}
              >
                No Penalties
              </Text>
              <Text className="text-[10px] font-bold" style={{ color: colors.textSecondary }}>
                Great work! Keep it up.
              </Text>
            </View>
          )}
          <View className="h-16" />
        </View>
      </ScrollView>
    </View>
  );
}
