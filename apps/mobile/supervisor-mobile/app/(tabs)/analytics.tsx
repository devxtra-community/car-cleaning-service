import { View, Text, ScrollView, Pressable, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { API } from '../../src/api/api';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  TrendingUp,
  DollarSign,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Calendar,
  Clock,
} from 'lucide-react-native';

// Topographic Pattern
const TopoPattern = () => {
  const SvgComponent = Svg as any;
  const PathComponent = Path as any;
  const CircleComponent = Circle as any;

  return (
    <SvgComponent
      height="100%"
      width="100%"
      className="absolute inset-0"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
    >
      <PathComponent
        d="M 0 80 Q 50 60, 100 80 T 200 80 T 300 80 T 400 80"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
        fill="none"
      />
      <PathComponent
        d="M 0 100 Q 50 85, 100 100 T 200 100 T 300 100 T 400 100"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
        fill="none"
      />
      <PathComponent
        d="M 0 120 Q 50 110, 100 120 T 200 120 T 300 120 T 400 120"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="2"
        fill="none"
      />

      <CircleComponent
        cx="320"
        cy="100"
        r="30"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
        fill="none"
      />
      <CircleComponent
        cx="320"
        cy="100"
        r="45"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="2"
        fill="none"
      />
      <CircleComponent
        cx="320"
        cy="100"
        r="60"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="2"
        fill="none"
      />

      <PathComponent
        d="M 60 180 Q 40 160, 60 140 Q 80 120, 100 140 Q 120 160, 100 180 Q 80 200, 60 180 Z"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
        fill="none"
      />
      <PathComponent
        d="M 50 180 Q 28 160, 50 135 Q 72 110, 110 135 Q 132 160, 110 185 Q 88 210, 50 180 Z"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="2"
        fill="none"
      />

      <PathComponent
        d="M 0 240 Q 60 220, 120 240 T 240 240 T 360 240 T 400 240"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
        fill="none"
      />
      <PathComponent
        d="M 0 260 Q 60 245, 120 260 T 240 260 T 360 260 T 400 260"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="2"
        fill="none"
      />

      <CircleComponent
        cx="80"
        cy="320"
        r="25"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
        fill="none"
      />
      <CircleComponent
        cx="80"
        cy="320"
        r="38"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="2"
        fill="none"
      />
    </SvgComponent>
  );
};

export default function AnalyticsView() {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/supervisor/analytics');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [fetchAnalytics])
  );

  const overview = data?.monthly || { total_earnings: 0, total_jobs: 0 };
  const weeklyPerformance = data?.weeklyPerformance || [];
  const taskBreakdown = data?.taskBreakdown || [];

  const avgPerDay =
    weeklyPerformance.length > 0
      ? (
          weeklyPerformance.reduce((sum: number, p: any) => sum + p.tasks, 0) /
          weeklyPerformance.length
        ).toFixed(1)
      : '0.0';

  const getStatusCount = (status: string) => {
    const item = taskBreakdown.find((b: any) => b.status === status);
    return item ? item.count : 0;
  };

  const completedCount = getStatusCount('completed');
  const inProgressCount = getStatusCount('working') + getStatusCount('started');
  const pendingCount = getStatusCount('pending');
  const totalTasksBreakdown = completedCount + inProgressCount + pendingCount;

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA]">
      {/* HEADER WITH TOPOGRAPHIC BACKGROUND */}
      <View className="h-[140px] mb-5">
        {(() => {
          const LinearGradientComponent = LinearGradient as any;
          return (
            <LinearGradientComponent
              colors={['#0EA5E9', '#0284C7']}
              className="flex-1 pt-3 overflow-hidden"
            >
              <TopoPattern />
              <View className="flex-row justify-between items-center px-5 z-10">
                <View>
                  <Text className="text-[32px] font-antigravity-bold text-white tracking-tighter">
                    {t('supervisor.analytics', { defaultValue: 'Analytics' })}
                  </Text>
                  <Text className="text-sm text-white/90 font-antigravity-medium mt-1">
                    {t('supervisor.trackPerformance', {
                      defaultValue: 'Track your performance metrics',
                    })}
                  </Text>
                </View>
                <TouchableOpacity className="w-11 h-11 rounded-full bg-white justify-center items-center shadow-md">
                  <Calendar size={20} color="#0EA5E9" />
                </TouchableOpacity>
              </View>
            </LinearGradientComponent>
          );
        })()}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* OVERVIEW CARDS */}
        <View className="px-5">
          {/* TOTAL EARNINGS */}
          <Pressable
            onPress={() => router.push('/(tabs)/analytics/earnings')}
            className="mb-3 rounded-[20px] overflow-hidden shadow-xl"
          >
            {(() => {
              const LinearGradientComponent = LinearGradient as any;
              return (
                <LinearGradientComponent
                  colors={['#0EA5E9', '#0284C7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-5 min-h-[160px]"
                >
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="w-12 h-12 rounded-full bg-white/20 justify-center items-center">
                      <DollarSign size={24} color="#fff" strokeWidth={2.5} />
                    </View>
                  </View>
                  <Text className="text-4xl font-antigravity-bold text-white mb-1 tracking-tighter">
                    ₹{overview.total_earnings.toLocaleString()}
                  </Text>
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <TrendingUp size={16} color="#fff" />
                    <Text className="text-sm font-antigravity-bold text-white">
                      {overview.earnings_growth >= 0 ? '+' : ''}
                      {overview.earnings_growth}%
                    </Text>
                    <Text className="text-xs text-white/70 font-antigravity-medium">
                      {t('supervisor.vsLastMonth', { defaultValue: 'vs last month' })}
                    </Text>
                  </View>
                  <Text className="text-base text-white font-antigravity-semibold opacity-95">
                    {t('supervisor.totalEarnings', { defaultValue: 'Total Earnings' })}
                  </Text>
                  <View className="absolute right-5 bottom-5 opacity-50">
                    <ChevronRight size={20} color="#fff" />
                  </View>
                </LinearGradientComponent>
              );
            })()}
          </Pressable>

          {/* COMPLETED TASKS CARD - NOW FULL WIDTH */}
          <Pressable
            className="mb-3 rounded-2xl overflow-hidden shadow-md"
            onPress={() => router.push('/(tabs)/analytics/tasks')}
          >
            {(() => {
              const LinearGradientComponent = LinearGradient as any;
              return (
                <LinearGradientComponent
                  colors={['#0EA5E9', '#0284C7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-[18px] flex-row justify-between items-center"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 rounded-full bg-white/20 justify-center items-center mr-3.5">
                      <CheckCircle size={24} color="#fff" strokeWidth={2.5} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[28px] font-antigravity-bold text-white mb-0.5">
                        {overview.total_jobs}
                      </Text>
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-xs font-antigravity-bold text-white">
                          {overview.jobs_growth >= 0 ? '+' : ''}
                          {overview.jobs_growth}%
                        </Text>
                        <Text className="text-[11px] text-white/70 font-antigravity-medium">
                          {t('supervisor.vsLastMonth', { defaultValue: 'vs last month' })}
                        </Text>
                      </View>
                      <Text className="text-[13px] text-white font-antigravity-semibold opacity-90 mt-1">
                        {t('supervisor.tasksCompleted', { defaultValue: 'Tasks Completed' })}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="opacity-70">
                      <ChevronRight size={20} color="#fff" />
                    </View>
                  </View>
                </LinearGradientComponent>
              );
            })()}
          </Pressable>

          {/* PENALTY CARD */}
          <Pressable
            onPress={() => router.push('/(tabs)/penalty-history')}
            className="bg-white rounded-2xl p-4 border-l-4 border-l-[#EF4444] shadow-sm"
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-[#FEE2E2] justify-center items-center mr-3">
                  <AlertCircle size={20} color="#EF4444" strokeWidth={2.5} />
                </View>
                <View>
                  <Text className="text-base font-antigravity-bold text-[#111827]">
                    {t('supervisor.penalties', { defaultValue: 'Penalties' })}
                  </Text>
                  <Text className="text-xs text-[#6B7280] font-antigravity-medium mt-0.5">
                    {t('supervisor.reviewHistory', { defaultValue: 'Review history' })}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#EF4444" />
            </View>
          </Pressable>
        </View>

        {/* WEEKLY PERFORMANCE */}
        <View className="mt-6 px-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-antigravity-bold text-[#111827]">
              {t('supervisor.weeklyPerformance', { defaultValue: 'Weekly Performance' })}
            </Text>
            <TouchableOpacity>
              <Text className="text-sm font-antigravity-bold text-[#0EA5E9]">
                {t('supervisor.viewAll', { defaultValue: 'View All' })}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="bg-white rounded-[20px] p-5 shadow-sm">
            <View className="flex-row justify-between items-center mb-5">
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-[#0EA5E9] mr-2" />
                <Text className="text-[13px] text-[#6B7280] font-antigravity-medium">
                  {t('supervisor.tasksCompleted', { defaultValue: 'Tasks Completed' })}
                </Text>
              </View>
              <Text className="text-xs text-[#6B7280] font-antigravity-semibold">
                {t('supervisor.avgPerDay', {
                  avg: avgPerDay,
                  defaultValue: `Avg: ${avgPerDay}/day`,
                })}
              </Text>
            </View>
            <View className="flex-row justify-between items-end h-[180px]">
              {weeklyPerformance.map((item: any, i: number) => (
                <TouchableOpacity
                  key={item.date}
                  className="flex-1 items-center justify-end mx-1"
                  activeOpacity={0.7}
                >
                  <Text className="text-[11px] font-antigravity-bold text-[#0EA5E9] mb-1">
                    {item.tasks}
                  </Text>
                  {(() => {
                    const LinearGradientComponent = LinearGradient as any;
                    // Find max tasks to normalize height
                    const maxTasks = Math.max(...weeklyPerformance.map((p: any) => p.tasks), 5);
                    const heightPercent = (item.tasks / maxTasks) * 90 + 10;

                    return (
                      <LinearGradientComponent
                        colors={['#0EA5E9', '#0284C7']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        className="w-full max-w-[32px] rounded-lg shadow-sm"
                        style={{ height: `${heightPercent}%` } as any}
                      />
                    );
                  })()}
                  <Text
                    className={`text-[11px] mt-2 font-antigravity-semibold ${
                      i === weeklyPerformance.length - 1
                        ? 'text-[#0EA5E9] font-antigravity-bold'
                        : 'text-[#9CA3AF]'
                    }`}
                  >
                    {item.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* TASK BREAKDOWN */}
        <View className="mt-6 px-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-antigravity-bold text-[#111827]">
              {t('supervisor.taskBreakdown', { defaultValue: 'Task Breakdown' })}
            </Text>
            <TouchableOpacity>
              <Text className="text-sm font-antigravity-bold text-[#0EA5E9]">
                {t('supervisor.details', { defaultValue: 'Details' })}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="bg-white rounded-[20px] p-5 shadow-sm">
            <Breakdown
              label={t('supervisor.completed', { defaultValue: 'Completed' })}
              value={completedCount.toString()}
              total={totalTasksBreakdown || 1}
              color="#10B981"
            />
            <Breakdown
              label={t('supervisor.inProgress', { defaultValue: 'In Progress' })}
              value={inProgressCount.toString()}
              total={totalTasksBreakdown || 1}
              color="#F59E0B"
            />
            <Breakdown
              label={t('supervisor.pending', { defaultValue: 'Pending' })}
              value={pendingCount.toString()}
              total={totalTasksBreakdown || 1}
              color="#6B7280"
            />
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Breakdown({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: string;
  total: number;
  color: string;
}) {
  const percentage = (parseInt(value) / total) * 100;

  const getIcon = () => {
    // We use a simple includes or match here since Breakdown can receive translated labels
    if (color === '#10B981') return <CheckCircle size={16} color={color} />;
    if (color === '#F59E0B') return <Clock size={16} color={color} />;
    if (color === '#6B7280') return <AlertCircle size={16} color={color} />;
    return null;
  };

  const getBackgroundColor = () => {
    return color + '15';
  };

  return (
    <View className="flex-row justify-between items-center mb-4">
      <View className="flex-row items-center flex-1">
        <View
          className="w-9 h-9 rounded-full justify-center items-center mr-3"
          style={{ backgroundColor: getBackgroundColor() }}
        >
          {getIcon()}
        </View>
        <View className="flex-1">
          <Text className="text-sm font-antigravity-semibold text-[#111827] mb-1.5">{label}</Text>
          <View className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{ width: `${percentage}%`, backgroundColor: color }}
            />
          </View>
        </View>
      </View>
      <View className="items-end ml-3">
        <Text className="text-lg font-antigravity-bold text-[#111827]">{value}</Text>
        <Text className="text-[11px] text-[#6B7280] font-antigravity-semibold mt-0.5">
          {percentage.toFixed(0)}%
        </Text>
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
