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
import { useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Award } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../src/api/api';

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
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('day');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await api.get('/workers/dashboard', {
        params: { range, date: date.toISOString() },
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
      <View className="flex-1 justify-center items-center bg-[#F5F7FA]">
        <ActivityIndicator size="large" color="#1B86C6" />
      </View>
    );
  }

  const period = data?.period;
  const jobsDone = period?.jobs || 0;
  const target = period?.next_target || 10;
  const progressPerc = period?.progress || 0;
  const pieData = [
    { value: jobsDone, color: '#1B86C6' },
    { value: Math.max(target - jobsDone, 0), color: '#F1F5F9' },
  ];

  return (
    <View className="flex-1 bg-[#F5F7FA]">
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
            tintColor="#1B86C6"
          />
        }
      >
        <View
          className="bg-white rounded-b-[40px] shadow-sm pb-6 px-6"
          style={{ paddingTop: insets.top + 10 }}
        >
          <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
            Performance Insight
          </Text>
          <Text className="text-gray-900 text-3xl font-black tracking-tighter mb-6">Analytics</Text>

          <View className="flex-row bg-gray-100 p-1 rounded-2xl mb-4">
            {['day', 'week', 'month'].map((r) => (
              <Pressable
                key={r}
                onPress={() => setRange(r as Range)}
                className="flex-1 py-3 items-center rounded-xl"
                style={
                  range === r
                    ? {
                        backgroundColor: 'white',
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
                  className="text-[10px] font-black uppercase tracking-tighter"
                  style={{ color: range === r ? '#1B86C6' : '#9ca3af' }}
                >
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row items-center justify-between bg-gray-50 border border-gray-100 p-2 rounded-2xl">
            <Pressable
              onPress={() => shiftDate('prev')}
              className="w-10 h-10 items-center justify-center bg-white rounded-xl shadow-sm"
            >
              <ChevronLeft size={20} color="#1B86C6" />
            </Pressable>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center gap-2"
            >
              <Calendar size={14} color="#1B86C6" />
              <Text className="font-bold text-gray-700 text-xs">{formatDateLabel()}</Text>
            </Pressable>
            <Pressable
              onPress={() => shiftDate('next')}
              className="w-10 h-10 items-center justify-center bg-white rounded-xl shadow-sm"
            >
              <ChevronRight size={20} color="#1B86C6" />
            </Pressable>
          </View>
        </View>

        <View className="p-6">
          <View className="bg-white rounded-[32px] p-8 items-center shadow-xl shadow-blue-500/5 mb-6">
            <View className="absolute top-6 left-6 flex-row items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-[#1B86C6]" />
              <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Progress
              </Text>
            </View>
            <PieChart
              data={pieData}
              donut
              radius={width * 0.22}
              innerRadius={width * 0.17}
              backgroundColor="white"
              centerLabelComponent={() => (
                <View className="items-center">
                  <Text className="text-3xl font-black text-gray-900">
                    {Math.round(progressPerc)}%
                  </Text>
                  <Text className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                    Complete
                  </Text>
                </View>
              )}
            />
            <View className="flex-row gap-8 mt-8 border-t border-gray-50 pt-6 w-full justify-center">
              <View className="items-center">
                <Text className="text-xl font-black text-gray-900">{jobsDone}</Text>
                <Text className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                  Completed
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-xl font-black text-gray-900">{target}</Text>
                <Text className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                  Target
                </Text>
              </View>
            </View>
          </View>

          <LinearGradient
            colors={['#1B86C6', '#0ea5e9']}
            className="rounded-[32px] p-6 mb-6 shadow-xl shadow-blue-500/20"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View className="flex-row justify-between mb-8">
              <View>
                <Text className="text-white/60 text-[9px] font-bold uppercase tracking-widest">
                  Potential Bonus
                </Text>
                <Text className="text-white text-3xl font-black">
                  ₹{period?.incentive_amount || 0}
                </Text>
              </View>
              <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center">
                <Award size={24} color="white" />
              </View>
            </View>
            <View className="bg-white/10 rounded-2xl p-4 flex-row items-center gap-4">
              <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                <TrendingUp size={16} color="white" />
              </View>
              <Text className="text-white text-[11px] font-bold leading-4 flex-1">
                {jobsDone >= target
                  ? 'Goal achieved! Reward confirmed.'
                  : `Wash ${target - jobsDone} more to unlock bonus.`}
              </Text>
            </View>
          </LinearGradient>

          <View className="flex-row gap-4 mb-32">
            <View className="flex-1 bg-white p-6 rounded-[28px] shadow-sm">
              <Text className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1">
                Today's Revenue
              </Text>
              <Text className="text-xl font-black text-gray-900">₹{period?.revenue || 0}</Text>
            </View>
            <View className="flex-1 bg-white p-6 rounded-[28px] shadow-sm">
              <Text className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1">
                Total Revenue
              </Text>
              <Text className="text-black text-xl font-black">₹{data?.totalRevenue || 0}</Text>
            </View>
          </View>
        </View>

        {/* INCENTIVE ACHIEVEMENTS BOX */}
        <View className="px-6 mb-32">
          <View className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                  Rewards Summary
                </Text>
                <Text className="text-gray-900 text-xl font-black">Incentive Achievements</Text>
              </View>
              <View className="w-10 h-10 bg-green-50 rounded-2xl items-center justify-center">
                <Award size={20} color="#10b981" />
              </View>
            </View>

            <View className="flex-row gap-3">
              {[
                {
                  label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                  value: data?.incentives?.day || 0,
                  color: '#1B86C6',
                },
                { label: 'Weekly Total', value: data?.incentives?.week || 0, color: '#10b981' },
                { label: 'Monthly Total', value: data?.incentives?.month || 0, color: '#8b5cf6' },
              ].map((item, idx) => (
                <View
                  key={idx}
                  className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-100/50"
                >
                  <Text className="text-gray-400 text-[8px] font-bold uppercase tracking-wider mb-2">
                    {item.label}
                  </Text>
                  <Text className="text-gray-900 text-base font-black">₹{item.value}</Text>
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
            onChange={(e: any, d?: Date) => {
              setShowDatePicker(false);
              if (d) setDate(d);
            }}
          />
        )}
      </ScrollView>
    </View>
  );
}
