import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react-native';
import api from '../../src/api/api';
import { useTheme } from '../../contexts/ThemeContext';

type AttendanceDay = {
  date: string;
  check_in_time: string;
};

export default function Attendance() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calendar, setCalendar] = useState<AttendanceDay[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [totalDays, setTotalDays] = useState(0);

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await api.get(`/attendance/calendar?month=${currentMonth}&year=${currentYear}`);
      if (res.data && res.data.success) {
        setCalendar(res.data.calendar || []);
        setCreatedAt(res.data.createdAt || null);
        setTotalDays(res.data.totalDays || 0);
      }
    } catch (e) {
      if ((e as any).response?.status === 401) {
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
    // Prevent going before creation date
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
            className={`flex-1 rounded-xl items-center justify-center border ${
              marked ? '' : past ? '' : ''
            }`}
            style={{
              backgroundColor: marked
                ? colors.successLight
                : past
                  ? colors.dangerLight
                  : colors.background,
              borderColor: marked ? colors.success : past ? colors.danger : colors.border,
              borderWidth: isToday ? 2 : 1,
              ...(isToday ? { borderColor: colors.primary } : {}),
            }}
          >
            <Text
              className="text-[11px] font-bold mb-0.5"
              style={{
                color: marked ? colors.success : past ? colors.danger : colors.textTertiary,
              }}
            >
              {day}
            </Text>
            {past &&
              (marked ? (
                <CheckCircle size={10} color={colors.success} />
              ) : (
                <XCircle size={10} color={colors.danger} />
              ))}
          </View>
        </View>
      );
    }

    return days;
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View
        className="pb-4"
        style={{
          paddingTop: insets.top + 10,
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        }}
      >
        <View className="px-6 flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => router.push('/(tabs)/Homepage')}
            className="w-10 h-10 rounded-xl items-center justify-center shadow-sm"
            style={{ backgroundColor: colors.background }}
          >
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text className="text-lg font-black tracking-tight" style={{ color: colors.text }}>
            Attendance
          </Text>
          <View className="w-10" />
        </View>

        {/* Month Navigation */}
        <View className="px-6 flex-row items-center justify-between mb-3">
          <Pressable
            onPress={() => changeMonth(-1)}
            disabled={!canGoBack()}
            className="w-10 h-10 rounded-xl items-center justify-center shadow-sm"
            style={{ backgroundColor: canGoBack() ? colors.background : colors.cardBackground }}
          >
            <Text
              className="font-black text-lg"
              style={{ color: canGoBack() ? colors.primary : colors.textTertiary }}
            >
              ←
            </Text>
          </Pressable>
          <View
            className="flex-row items-center gap-2 px-4 py-2 rounded-full"
            style={{ backgroundColor: colors.background }}
          >
            <CalendarIcon size={16} color={colors.textSecondary} />
            <Text className="font-bold text-[12px]" style={{ color: colors.text }}>
              {getMonthName()}
            </Text>
          </View>
          <Pressable
            onPress={() => changeMonth(1)}
            className="w-10 h-10 rounded-xl items-center justify-center shadow-sm"
            style={{ backgroundColor: colors.background }}
          >
            <Text className="font-black text-lg" style={{ color: colors.primary }}>
              →
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B86C6" />
        }
      >
        <View className="px-6 pt-4">
          {loading && !refreshing ? (
            <View className="mt-20 items-center">
              <ActivityIndicator size="small" color="#1B86C6" />
            </View>
          ) : (
            <>
              {/* Legend */}
              <View className="flex-row gap-4 mb-6 justify-center">
                <View className="flex-row items-center gap-2">
                  <View
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: colors.successLight, borderColor: colors.success }}
                  />
                  <Text
                    className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: colors.textSecondary }}
                  >
                    Marked
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: colors.dangerLight, borderColor: colors.danger }}
                  />
                  <Text
                    className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: colors.textSecondary }}
                  >
                    Absent
                  </Text>
                </View>
              </View>

              {/* Calendar */}
              <View
                className="rounded-[32px] p-5 shadow-sm mb-6"
                style={{ backgroundColor: colors.cardBackground }}
              >
                {/* Week days header */}
                <View className="flex-row mb-4">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <View key={i} className="w-[14.28%] items-center">
                      <Text
                        className="text-[10px] font-black"
                        style={{ color: colors.textTertiary }}
                      >
                        {day}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Calendar grid */}
                <View className="flex-row flex-wrap">{renderCalendar()}</View>
              </View>

              {/* Stats */}
              <View
                className="rounded-[32px] p-6 shadow-sm mb-8"
                style={{ backgroundColor: colors.cardBackground }}
              >
                <Text
                  className="text-[11px] font-black uppercase tracking-widest mb-4"
                  style={{ color: colors.textSecondary }}
                >
                  This Month
                </Text>
                <View className="flex-row gap-3 mb-6">
                  <View
                    className="flex-1 p-4 rounded-2xl"
                    style={{ backgroundColor: colors.successLight }}
                  >
                    <Text
                      className="text-[10px] font-black uppercase tracking-wide mb-1"
                      style={{ color: colors.success }}
                    >
                      Present
                    </Text>
                    <Text className="text-2xl font-black" style={{ color: colors.success }}>
                      {calendar.length}
                    </Text>
                  </View>
                  <View
                    className="flex-1 p-4 rounded-2xl"
                    style={{ backgroundColor: colors.background }}
                  >
                    <Text
                      className="text-[10px] font-black uppercase tracking-wide mb-1"
                      style={{ color: colors.textSecondary }}
                    >
                      Total Days
                    </Text>
                    <Text className="text-2xl font-black" style={{ color: colors.text }}>
                      {getDaysInMonth()}
                    </Text>
                  </View>
                </View>

                <View className="pt-4 border-t" style={{ borderTopColor: colors.borderLight }}>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text
                      className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color: colors.textSecondary }}
                    >
                      TOTAL ATTENDANCE
                    </Text>
                    <Text className="text-lg font-black" style={{ color: colors.primary }}>
                      {totalDays} days
                    </Text>
                  </View>
                  {createdAt && (
                    <Text className="text-[10px] font-bold" style={{ color: colors.textTertiary }}>
                      Worker since{' '}
                      {new Date(createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  )}
                </View>
              </View>
            </>
          )}
          <View className="h-16" />
        </View>
      </ScrollView>
    </View>
  );
}
