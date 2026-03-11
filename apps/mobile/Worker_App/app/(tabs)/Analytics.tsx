import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Award } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../src/api/api';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

const { width } = Dimensions.get('window');

type Range = 'day' | 'week' | 'month';

interface AnalyticsData {
  period: {
    jobs: number;
    next_target: number;
    progress: number;
    incentive_amount: number;
    revenue: number;
  };
  totalRevenue: number;
  incentives: {
    day: number;
    week: number;
    month: number;
  };
}

export default function Analytics() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('day');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const res = await api.get('/workers/dashboard', {
        params: { range, date: dateStr },
      });
      if (res.data) setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [range, date]);

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [loadAnalytics])
  );

  const shiftDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(date);
    if (range === 'day') newDate.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    else if (range === 'week') newDate.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
    else newDate.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
    setDate(newDate);
  };

  const formatDateLabel = () => {
    if (range === 'day') return date.toDateString();
    if (range === 'month')
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay() || 7;
    if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return `${startOfWeek.getDate()} ${startOfWeek.toLocaleString('default', { month: 'short' })} - ${endOfWeek.getDate()} ${endOfWeek.toLocaleString('default', { month: 'short' })}`;
  };

  if (loading && !data) {
    return (
      <View className="flex-1 justify-center items-center bg-[#E0F2FE]">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  const period = data?.period;
  const jobsDone = period?.jobs || 0;
  const target = period?.next_target || 10;
  const progressPerc = period?.progress || 0;
  const pieData = [
    { value: jobsDone, color: '#0EA5E9' },
    { value: Math.max(target - jobsDone, 0), color: '#E2E8F0' },
  ];

  return (
    <View className="flex-1 bg-[#E0F2FE]">
      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadAnalytics();
              setRefreshing(false);
            }}
            tintColor="#0EA5E9"
          />
        }
      >
        <BlurView
          intensity={20}
          tint="light"
          style={{
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
            paddingBottom: 24,
            paddingHorizontal: 24,
            overflow: 'hidden',
            paddingTop: insets.top + 10,
          }}
        >
          <Text className="text-[10px] font-label uppercase tracking-widest mb-1 text-clay-secondary/80">
            {t('analytics.performanceInsight')}
          </Text>
          <Text className="text-3xl font-heading tracking-tighter mb-6 text-clay-text">
            {t('tabs.analytics')}
          </Text>

          <View className="flex-row p-1 rounded-2xl mb-4 bg-white/60 border border-white/50">
            {['day', 'week', 'month'].map((r) => (
              <Pressable
                key={r}
                onPress={() => setRange(r as Range)}
                className="flex-1 py-3 items-center rounded-xl"
                style={
                  range === r
                    ? {
                        backgroundColor: '#fff',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }
                    : {}
                }
              >
                <Text
                  className="text-[11px] font-heading uppercase tracking-tighter"
                  style={{ color: range === r ? '#0EA5E9' : '#94A3B8' }}
                >
                  {t(`wallet.${r}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row items-center justify-between border border-white/60 p-2 rounded-2xl bg-white/40">
            <Pressable
              onPress={() => shiftDate('prev')}
              className="w-10 h-10 items-center justify-center rounded-xl bg-white shadow-sm"
            >
              <ChevronLeft size={20} color="#0EA5E9" />
            </Pressable>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center gap-2"
            >
              <Calendar size={16} color="#0EA5E9" />
              <Text className="font-heading text-sm text-clay-text">{formatDateLabel()}</Text>
            </Pressable>
            <Pressable
              onPress={() => shiftDate('next')}
              className="w-10 h-10 items-center justify-center rounded-xl bg-white shadow-sm"
            >
              <ChevronRight size={20} color="#0EA5E9" />
            </Pressable>
          </View>
        </BlurView>

        <View className="p-6">
          <View className="clay-card p-8 items-center shadow-xl mb-6 bg-white border border-white/60">
            <View className="absolute top-6 left-6 flex-row items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
              <Text className="text-[10px] font-label uppercase tracking-widest text-clay-secondary/80">
                {t('analytics.progress')}
              </Text>
            </View>
            <PieChart
              data={pieData}
              donut
              radius={width * 0.22}
              innerRadius={width * 0.17}
              backgroundColor={'#ffffff'}
              centerLabelComponent={() => (
                <View className="items-center">
                  <Text className="text-4xl font-heading text-clay-text">
                    {Math.round(progressPerc)}%
                  </Text>
                  <Text className="text-[9px] font-label uppercase tracking-widest text-clay-secondary/60">
                    {t('analytics.complete')}
                  </Text>
                </View>
              )}
            />
            <View className="flex-row gap-8 mt-8 border-t border-gray-100 pt-6 w-full justify-center">
              <View className="items-center">
                <Text className="text-2xl font-heading text-clay-text">{jobsDone}</Text>
                <Text className="text-[9px] font-label uppercase tracking-widest text-clay-secondary/60">
                  {t('home.completed')}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-heading text-clay-text">{target}</Text>
                <Text className="text-[9px] font-label uppercase tracking-widest text-clay-secondary/60">
                  {t('analytics.target')}
                </Text>
              </View>
            </View>
          </View>

          <LinearGradient
            colors={['#0EA5E9', '#0284C7']}
            style={{ borderRadius: 32, padding: 24, marginBottom: 24, elevation: 15 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View className="flex-row justify-between mb-8">
              <View>
                <Text className="text-white/80 text-[10px] font-label uppercase tracking-widest">
                  {t('analytics.potentialBonus')}
                </Text>
                <Text className="text-white text-4xl font-heading">
                  ₹{period?.incentive_amount || 0}
                </Text>
              </View>
              <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center border border-white/10">
                <Award size={24} color="white" />
              </View>
            </View>
            <View className="bg-white/10 rounded-2xl p-4 flex-row items-center gap-4 border border-white/5">
              <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                <TrendingUp size={16} color="white" />
              </View>
              <Text className="text-white text-[12px] font-heading leading-5 flex-1">
                {jobsDone >= target
                  ? t('analytics.goalAchieved', 'Goal achieved! Reward confirmed.')
                  : t('analytics.washMore', {
                      count: target - jobsDone,
                      defaultValue: `Wash ${target - jobsDone} more to unlock bonus.`,
                    })}
              </Text>
            </View>
          </LinearGradient>

          <View className="flex-row gap-4 mb-8">
            <View className="flex-1 p-6 rounded-[28px] bg-white border border-white/60 shadow-sm clay-card">
              <Text className="text-[9px] font-label uppercase tracking-widest mb-1 text-clay-secondary/80">
                {t('analytics.todayRevenue')}
              </Text>
              <Text className="text-2xl font-heading text-clay-text">₹{period?.revenue || 0}</Text>
            </View>
            <View className="flex-1 p-6 rounded-[28px] bg-white border border-white/60 shadow-sm clay-card">
              <Text className="text-[9px] font-label uppercase tracking-widest mb-1 text-clay-secondary/80">
                {t('home.totalRevenue')}
              </Text>
              <Text className="text-2xl font-heading text-clay-text">
                ₹{data?.totalRevenue || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* INCENTIVE ACHIEVEMENTS BOX */}
        <View className="px-6 mb-32">
          <View className="clay-card p-6 bg-white border border-white/60">
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-[10px] font-label uppercase tracking-widest mb-1 text-clay-secondary/80">
                  {t('analytics.rewardsSummary')}
                </Text>
                <Text className="text-xl font-heading text-clay-text">
                  {t('analytics.incentiveAchieved')}
                </Text>
              </View>
              <View className="w-10 h-10 rounded-2xl items-center justify-center bg-[#ECFDF5]">
                <Award size={20} color="#10B981" />
              </View>
            </View>

            <View className="flex-row gap-3">
              {[
                {
                  label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                  value: data?.incentives?.day || 0,
                  color: '#0EA5E9',
                },
                {
                  label: t('wallet.week'),
                  value: data?.incentives?.week || 0,
                  color: '#10B981',
                },
                { label: t('wallet.month'), value: data?.incentives?.month || 0, color: '#8b5cf6' },
              ].map((item, idx) => (
                <View
                  key={idx}
                  className="flex-1 rounded-2xl p-3 border"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' }}
                >
                  <Text className="text-[9px] font-label uppercase tracking-wider mb-2 text-clay-secondary/60">
                    {item.label}
                  </Text>
                  <Text className="text-base font-heading text-clay-text">₹{item.value}</Text>
                  <View
                    className="h-1 w-6 rounded-full mt-2"
                    style={{ backgroundColor: item.color }}
                  />
                </View>
              ))}
            </View>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(e, d) => {
              setShowDatePicker(false);
              if (d) setDate(d);
            }}
          />
        )}
      </ScrollView>
    </View>
  );
}
