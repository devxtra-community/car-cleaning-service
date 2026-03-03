import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../src/api/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

type AttendanceDay = {
  date: string;
  check_in_time: string;
};

export default function Attendance() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calendar, setCalendar] = useState<AttendanceDay[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [totalDays, setTotalDays] = useState(0);
  const { t } = useLanguage();

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await api.get(`/attendance/calendar?month=${currentMonth}&year=${currentYear}`);
      if (res.data && res.data.success) {
        setCalendar(res.data.calendar || []);
        setCreatedAt(res.data.createdAt || null);
        setTotalDays(res.data.totalDays || 0);
      }
    } catch (e: unknown) {
      const error = e as { response?: { status?: number } };
      if (error.response?.status === 401) {
        console.log('Not authenticated for calendar fetch');
      } else {
        console.error('Calendar fetch error:', e);
      }
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useFocusEffect(
    useCallback(() => {
      fetchCalendar();
    }, [fetchCalendar])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCalendar();
    setRefreshing(false);
  };

  const getDaysInMonth = () => {
    return new Date(currentYear, currentMonth, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    return new Date(currentYear, currentMonth - 1, 1).getDay();
  };

  const isMarked = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendar.some((att) => att.date.startsWith(dateStr));
  };

  const isPastDate = (day: number) => {
    const date = new Date(currentYear, currentMonth - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const canGoBack = () => {
    if (!createdAt) return true;
    const creationDate = new Date(createdAt);
    const currentDate = new Date(currentYear, currentMonth - 1, 1);
    return currentDate > creationDate;
  };

  const changeMonth = (delta: number) => {
    if (delta < 0 && !canGoBack()) {
      return;
    }

    let newMonth = currentMonth + delta;
    let newYear = currentYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setLoading(true);
  };

  const getMonthName = () => {
    return new Date(currentYear, currentMonth - 1).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth();
    const firstDay = getFirstDayOfMonth();
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} className="w-[14.28%] aspect-square" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const marked = isMarked(day);
      const past = isPastDate(day);
      const isToday =
        day === new Date().getDate() &&
        currentMonth === new Date().getMonth() + 1 &&
        currentYear === new Date().getFullYear();

      days.push(
        <View key={day} className="w-[14.28%] aspect-square p-1">
          <View
            className={`flex-1 rounded-xl items-center justify-center border ${isToday ? 'border-[#0EA5E9] border-2' : 'border-white/50'
              }`}
            style={{
              backgroundColor: marked
                ? '#10B981' // Success Green
                : past
                  ? '#EF4444' // Danger Red
                  : '#F0F9FF', // Default light blue
              elevation: 2,
              shadowColor: marked || past ? '#000' : '#BFDBFE',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
            }}
          >
            <Text
              className="text-[11px] font-heading mb-0.5"
              style={{
                color: marked || past ? 'white' : '#64748B',
              }}
            >
              {day}
            </Text>
            {past &&
              (marked ? (
                <CheckCircle size={10} color="white" />
              ) : (
                <XCircle size={10} color="white" />
              ))}
          </View>
        </View>
      );
    }

    return days;
  };

  return (
    <View className="flex-1 bg-[#E0F2FE]">
      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      <View
        className="pb-4 rounded-b-[40px] shadow-sm bg-white/80"
        style={{
          paddingTop: insets.top + 10,
        }}
      >
        <View className="px-6 flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => router.push('/(tabs)/Homepage')}
            className="w-10 h-10 rounded-xl items-center justify-center bg-white shadow-sm border border-gray-100"
          >
            <ChevronLeft size={24} color="#1E293B" />
          </Pressable>
          <Text className="text-xl font-heading tracking-tight text-clay-text">{t('attendance.title')}</Text>
          <View className="w-10" />
        </View>

        {/* Month Navigation */}
        <View className="px-6 flex-row items-center justify-between mb-3">
          <Pressable
            onPress={() => changeMonth(-1)}
            disabled={!canGoBack()}
            className="w-10 h-10 rounded-xl items-center justify-center shadow-sm clay-button bg-white"
          >
            <Text
              className="font-heading text-lg"
              style={{ color: canGoBack() ? '#0EA5E9' : '#94A3B8' }}
            >
              ←
            </Text>
          </Pressable>
          <View className="flex-row items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-sm border border-gray-100">
            <CalendarIcon size={16} color="#64748B" />
            <Text className="font-heading text-[13px] text-clay-text">{getMonthName()}</Text>
          </View>
          <Pressable
            onPress={() => changeMonth(1)}
            className="w-10 h-10 rounded-xl items-center justify-center shadow-sm clay-button bg-white"
          >
            <Text className="font-heading text-lg text-[#0EA5E9]">→</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />
        }
      >
        <View className="px-6 pt-6 pb-20">
          {loading && !refreshing ? (
            <View className="mt-20 items-center">
              <ActivityIndicator size="small" color="#0EA5E9" />
            </View>
          ) : (
            <>
              {/* Legend */}
              <View className="flex-row gap-6 mb-8 justify-center">
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded-full bg-[#10B981] shadow-sm" />
                  <Text className="text-[11px] font-label uppercase tracking-wide text-clay-secondary">
                    {t('attendance.present')}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded-full bg-[#EF4444] shadow-sm" />
                  <Text className="text-[11px] font-label uppercase tracking-wide text-clay-secondary">
                    {t('attendance.absent')}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded-full bg-[#F0F9FF] border border-gray-200" />
                  <Text className="text-[11px] font-label uppercase tracking-wide text-clay-secondary">
                    {t('attendance.upcoming')}
                  </Text>
                </View>
              </View>

              {/* Calendar */}
              <View className="clay-card p-5 mb-8 bg-white">
                {/* Week days header */}
                <View className="flex-row mb-4">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <View key={i} className="w-[14.28%] items-center">
                      <Text className="text-[10px] font-heading text-clay-secondary/60">{day}</Text>
                    </View>
                  ))}
                </View>

                {/* Calendar grid */}
                <View className="flex-row flex-wrap">{renderCalendar()}</View>
              </View>

              {/* Stats */}
              <View className="clay-card p-6 bg-white">
                <Text className="text-[11px] font-label uppercase tracking-widest mb-5 text-clay-secondary">
                  {t('attendance.thisMonth')}
                </Text>
                <View className="flex-row gap-4 mb-6">
                  <View className="flex-1 p-4 rounded-3xl bg-[#ECFDF5] items-center justify-center border border-[#10B981]/20">
                    <Text className="text-[10px] font-label uppercase tracking-wide mb-1 text-[#10B981]">
                      {t('attendance.present')}
                    </Text>
                    <Text className="text-3xl font-heading text-[#10B981]">{calendar.length}</Text>
                  </View>
                  <View className="flex-1 p-4 rounded-3xl bg-[#F8FAFC] items-center justify-center border border-gray-100">
                    <Text className="text-[10px] font-label uppercase tracking-wide mb-1 text-clay-secondary">
                      Total Days
                    </Text>
                    <Text className="text-3xl font-heading text-clay-text">{getDaysInMonth()}</Text>
                  </View>
                </View>

                <View className="pt-5 border-t border-gray-100">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-[10px] font-label uppercase tracking-widest text-clay-secondary">
                      {t('attendance.totalAllTime')}
                    </Text>
                    <Text className="text-lg font-heading text-[#0EA5E9]">{totalDays} days</Text>
                  </View>
                  {createdAt && (
                    <Text className="text-[10px] font-body text-clay-secondary/60 text-right">
                      {t('attendance.workerSince', {
                        date: new Date(createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric',
                        }),
                      })}
                    </Text>
                  )}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
