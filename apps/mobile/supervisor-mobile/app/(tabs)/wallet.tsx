import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, Users, TrendingUp, CheckCircle, DollarSign } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { API } from '../../src/api/api';
import { useLanguage } from '../../contexts/LanguageContext';

const LG = LinearGradient as any;

type Period = 'day' | 'week' | 'month';

interface PeriodData {
  total_earnings: number;
  total_jobs: number;
  carTypeBreakdown: { type: string; count: number; amount: number }[];
}

interface AnalyticsData {
  daily: PeriodData;
  weekly: PeriodData;
  monthly: PeriodData;
}

export default function SupervisorWallet() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>('day');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const { t } = useLanguage();

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await API.get('/api/supervisor/analytics');
      if (res.data && res.data.success) {
        setData(res.data.data);
      }
    } catch (e) {
      console.error('Supervisor wallet analytics fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [fetchAnalytics])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const currentData: PeriodData | null = data
    ? period === 'day'
      ? data.daily
      : period === 'week'
        ? data.weekly
        : data.monthly
    : null;

  const periodLabel =
    period === 'day'
      ? t('wallet.today', { defaultValue: 'Today' })
      : period === 'week'
        ? t('wallet.week', { defaultValue: 'This Week' })
        : t('wallet.month', { defaultValue: 'This Month' });

  const FilterTab = ({ label, value }: { label: string; value: Period }) => (
    <Pressable
      onPress={() => setPeriod(value)}
      className={`flex-1 py-3 rounded-[14px] items-center justify-center border ${
        period === value
          ? 'bg-[#0EA5E9] border-[#0EA5E9] elevation-md shadow-sm'
          : 'bg-white border-[#F1F5F9] elevation-sm shadow-xs'
      }`}
    >
      <Text
        className={`text-[10px] font-extrabold uppercase tracking-widest ${
          period === value ? 'text-white' : 'text-[#64748B]'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-[#E0F2FE]">
      <LG colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']} className="absolute w-full h-full" />

      {/* Header */}
      <View
        className="bg-white/85 rounded-b-[40px] pb-5 elevation-md shadow-sm"
        style={{ paddingTop: insets.top + 10 }}
      >
        {/* Title row */}
        <View className="px-6 flex-row items-center justify-between mb-5">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl items-center justify-center bg-white border border-[#F1F5F9]"
          >
            <ChevronLeft size={24} color="#1E293B" />
          </Pressable>
          <View className="items-center">
            <Text className="text-xl font-extrabold text-[#1E293B]">
              {t('tabs.wallet', { defaultValue: 'Team Earnings' })}
            </Text>
            <Text className="text-[11px] text-[#64748B] mt-0.5">
              {t('supervisor.workers', { defaultValue: 'Your assigned workers' })}
            </Text>
          </View>
          <View className="w-10" />
        </View>

        {/* Period Filters */}
        <View className="flex-row gap-3 px-6">
          <FilterTab label={t('wallet.today', { defaultValue: 'Today' })} value="day" />
          <FilterTab label={t('wallet.week', { defaultValue: 'Week' })} value="week" />
          <FilterTab label={t('wallet.month', { defaultValue: 'Month' })} value="month" />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {loading && !refreshing ? (
          <View className="mt-20 items-center">
            <ActivityIndicator size="large" color="#0EA5E9" />
          </View>
        ) : currentData ? (
          <>
            {/* Hero Earnings Card */}
            <LG
              colors={['#0EA5E9', '#0284C7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-[28px] p-7 mb-5 elevation-xl shadow-lg shadow-[#0EA5E9]/30"
            >
              <View className="flex-row items-center gap-3 mb-4">
                <View className="w-11 h-11 rounded-full bg-white/20 items-center justify-center">
                  <Users size={22} color="#fff" />
                </View>
                <View>
                  <Text className="text-[11px] text-white/70 font-bold uppercase tracking-widest">
                    {t('supervisor.totalEarnings', { defaultValue: 'Team Total Earnings' })}
                  </Text>
                  <Text className="text-[12px] text-white/85 mt-0.5">{periodLabel}</Text>
                </View>
              </View>

              <Text className="text-[48px] font-extrabold text-white tracking-tighter">
                ₹{currentData.total_earnings.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </Text>

              <View className="flex-row gap-6 mt-5 pt-5 border-t border-white/25">
                <View className="items-center">
                  <Text className="text-[22px] font-extrabold text-white">
                    {currentData.total_jobs}
                  </Text>
                  <Text className="text-[10px] text-white/70 mt-0.5 font-bold uppercase tracking-widest">
                    {t('supervisor.jobsDone', { defaultValue: 'Jobs Done' })}
                  </Text>
                </View>
                {currentData.total_jobs > 0 && (
                  <View className="items-center">
                    <Text className="text-[22px] font-extrabold text-white">
                      ₹{(currentData.total_earnings / currentData.total_jobs).toFixed(0)}
                    </Text>
                    <Text className="text-[10px] text-white/70 mt-0.5 font-bold uppercase tracking-widest">
                      Avg / Job
                    </Text>
                  </View>
                )}
              </View>
            </LG>

            {/* Car Type Breakdown */}
            {currentData.carTypeBreakdown.length > 0 && (
              <View className="bg-white rounded-3xl p-6 mb-4 elevation-sm shadow-sm">
                <View className="flex-row items-center gap-2.5 mb-5">
                  <View className="w-10 h-10 rounded-full bg-[#E0F2FE] items-center justify-center">
                    <TrendingUp size={18} color="#0EA5E9" />
                  </View>
                  <Text className="text-[13px] font-bold text-[#1E293B] uppercase tracking-widest">
                    By Car Type
                  </Text>
                </View>

                {currentData.carTypeBreakdown.map((item, idx) => {
                  const maxEarning = Math.max(
                    ...currentData.carTypeBreakdown.map((x) => x.amount),
                    1
                  );
                  const barWidth = `${(item.amount / maxEarning) * 100}%`;
                  return (
                    <View
                      key={idx}
                      className={idx < currentData.carTypeBreakdown.length - 1 ? 'mb-5' : ''}
                    >
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-[13px] font-bold text-[#334155] capitalize">
                          {item.type || 'Unknown'}
                        </Text>
                        <View className="flex-row gap-3">
                          <View className="flex-row items-center gap-1">
                            <CheckCircle size={12} color="#10B981" />
                            <Text className="text-[12px] font-bold text-[#10B981]">
                              {item.count} jobs
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <DollarSign size={12} color="#0EA5E9" />
                            <Text className="text-[12px] font-bold text-[#0EA5E9]">
                              ₹{item.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <View
                          className="h-full bg-[#0EA5E9] rounded-full"
                          style={{ width: barWidth as any }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Empty state for carType */}
            {currentData.carTypeBreakdown.length === 0 && (
              <View className="bg-white rounded-3xl p-12 items-center elevation-sm shadow-sm">
                <View className="w-14 h-14 rounded-full bg-[#F8FAFC] items-center justify-center mb-4">
                  <TrendingUp size={28} color="#94A3B8" />
                </View>
                <Text className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">
                  {t('wallet.noTransactions', { defaultValue: 'No earnings yet' })}
                </Text>
                <Text className="text-xs text-[#CBD5E1] mt-1.5 text-center">
                  {periodLabel} — no completed jobs found
                </Text>
              </View>
            )}
          </>
        ) : (
          <View className="bg-white rounded-3xl p-10 items-center elevation-sm shadow-sm mt-5">
            <Users size={32} color="#94A3B8" />
            <Text className="text-[11px] font-bold mt-4 uppercase tracking-widest text-[#94A3B8]">
              {t('wallet.noData', { defaultValue: 'No data available' })}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
