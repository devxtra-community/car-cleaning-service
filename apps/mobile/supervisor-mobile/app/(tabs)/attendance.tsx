import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { API } from '../../src/api/api';
import { useLanguage } from '../../contexts/LanguageContext';

const LG = LinearGradient as any;

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
      const res = await API.get(`/attendance/calendar?month=${currentMonth}&year=${currentYear}`);
      if (res.data && res.data.success) {
        setCalendar(res.data.calendar || []);
        setCreatedAt(res.data.createdAt || null);
        setTotalDays(res.data.totalDays || 0);
      }
    } catch (e: unknown) {
      const error = e as { response?: { status?: number } };
      if (error.response?.status !== 401) {
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

  const getDaysInMonth = () => new Date(currentYear, currentMonth, 0).getDate();
  const getFirstDayOfMonth = () => new Date(currentYear, currentMonth - 1, 1).getDay();

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
    if (delta < 0 && !canGoBack()) return;
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

  const getMonthName = () =>
    new Date(currentYear, currentMonth - 1).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth();
    const firstDay = getFirstDayOfMonth();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} className="w-[14.28%] aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const marked = isMarked(day);
      const past = isPastDate(day);
      const isToday =
        day === new Date().getDate() &&
        currentMonth === new Date().getMonth() + 1 &&
        currentYear === new Date().getFullYear();

      days.push(
        <View key={day} className="w-[14.28%] aspect-square p-0.5">
          <View
            className={`flex-1 rounded-xl items-center justify-center ${
              isToday ? 'border-2 border-[#0EA5E9]' : ''
            } ${marked ? 'bg-[#10B981]' : past ? 'bg-[#EF4444]' : 'bg-[#F0F9FF]'} elevation-sm`}
          >
            <Text
              className={`text-[11px] font-bold ${marked || past ? 'text-white' : 'text-[#64748B]'}`}
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
      <LG colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']} className="absolute w-full h-full" />

      {/* Header */}
      <View className="bg-white/80 rounded-b-[40px] pb-4" style={{ paddingTop: insets.top + 10 }}>
        <View className="px-6 flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl items-center justify-center bg-white border border-[#F1F5F9]"
          >
            <ChevronLeft size={24} color="#1E293B" />
          </Pressable>
          <Text className="text-xl font-bold text-[#1E293B]">{t('attendance.title')}</Text>
          <View className="w-10" />
        </View>

        {/* Month Navigation */}
        <View className="px-6 flex-row items-center justify-between">
          <Pressable
            onPress={() => changeMonth(-1)}
            disabled={!canGoBack()}
            className="w-10 h-10 rounded-xl items-center justify-center bg-white border border-[#F1F5F9]"
          >
            <Text
              className={`text-lg font-bold ${canGoBack() ? 'text-[#0EA5E9]' : 'text-[#94A3B8]'}`}
            >
              ←
            </Text>
          </Pressable>
          <View className="flex-row items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#F1F5F9]">
            <CalendarIcon size={16} color="#64748B" />
            <Text className="text-[13px] font-semibold text-[#334155]">{getMonthName()}</Text>
          </View>
          <Pressable
            onPress={() => changeMonth(1)}
            className="w-10 h-10 rounded-xl items-center justify-center bg-white border border-[#F1F5F9]"
          >
            <Text className="text-lg font-bold text-[#0EA5E9]">→</Text>
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
                {[
                  { color: 'bg-[#10B981]', labelKey: 'attendance.present' },
                  { color: 'bg-[#EF4444]', labelKey: 'attendance.absent' },
                  { color: 'bg-[#F0F9FF]', labelKey: 'attendance.upcoming', border: true },
                ].map((item) => (
                  <View key={item.labelKey} className="flex-row items-center gap-2">
                    <View
                      className={`w-3 h-3 rounded-full ${item.color} ${item.border ? 'border border-[#D1D5DB]' : ''}`}
                    />
                    <Text className="text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
                      {t(item.labelKey)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Calendar */}
              <View className="bg-white rounded-3xl p-5 mb-8 elevation shadow-sm">
                {/* Week headers */}
                <View className="flex-row mb-4">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <View key={i} className="w-[14.28%] items-center">
                      <Text className="text-[10px] font-bold text-[#94A3B8]">{d}</Text>
                    </View>
                  ))}
                </View>
                <View className="flex-row flex-wrap">{renderCalendar()}</View>
              </View>

              {/* Stats */}
              <View className="bg-white rounded-3xl p-6 elevation shadow-sm">
                <Text className="text-[11px] font-bold uppercase tracking-[2px] text-[#94A3B8] mb-5">
                  {t('attendance.thisMonth')}
                </Text>
                <View className="flex-row gap-4 mb-6">
                  <View className="flex-1 p-4 rounded-[20px] bg-[#ECFDF5] items-center border border-[#10B981]/20">
                    <Text className="text-[10px] font-bold uppercase tracking-widest mb-1 text-[#10B981]">
                      {t('attendance.present')}
                    </Text>
                    <Text className="text-[32px] font-extrabold text-[#10B981]">
                      {calendar.length}
                    </Text>
                  </View>
                  <View className="flex-1 p-4 rounded-[20px] bg-[#F8FAFC] items-center border border-[#F1F5F9]">
                    <Text className="text-[10px] font-bold uppercase tracking-widest mb-1 text-[#64748B]">
                      Total Days
                    </Text>
                    <Text className="text-[32px] font-extrabold text-[#334155]">
                      {getDaysInMonth()}
                    </Text>
                  </View>
                </View>

                <View className="pt-5 border-t border-[#F1F5F9]">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-[10px] font-bold uppercase tracking-[2px] text-[#94A3B8]">
                      {t('attendance.totalAllTime')}
                    </Text>
                    <Text className="text-[18px] font-extrabold text-[#0EA5E9]">
                      {totalDays} days
                    </Text>
                  </View>
                  {createdAt && (
                    <Text className="text-[10px] text-[#94A3B8] text-right">
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
