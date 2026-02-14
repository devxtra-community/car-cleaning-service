import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, Wallet as WalletIcon, CheckCircle, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../src/api/api';
import { useTheme } from '../../contexts/ThemeContext';

type Transaction = {
  id: string;
  type: 'task';
  description: string;
  amount: number;
  date: string;
  isCredit: boolean;
  car_number: string;
};

type WalletData = {
  summary: {
    totalEarnings: number;
    taskTotal: number;
    incentiveTotal: number;
    penaltyTotal: number;
    taskCount?: number;
  };
  transactions: Transaction[];
};

type Period = 'day' | 'week' | 'month';

export default function Wallet() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>('day');
  const [data, setData] = useState<WalletData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchWalletStats = useCallback(async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await api.get(`/workers/wallet?range=${period}&date=${dateStr}`);
      if (res.data && res.data.success) {
        setData(res.data);
      }
    } catch (e) {
      console.error('Wallet fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [period, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      fetchWalletStats();
    }, [fetchWalletStats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWalletStats();
    setRefreshing(false);
  };

  const FilterTab = ({ label, value }: { label: string; value: Period }) => (
    <Pressable
      onPress={() => setPeriod(value)}
      className="flex-1 py-3 rounded-xl border"
      style={{
        backgroundColor: period === value ? colors.primary : colors.cardBackground,
        borderColor: period === value ? colors.primary : colors.border,
      }}
    >
      <Text
        className="text-[10px] font-black text-center uppercase tracking-wide"
        style={{ color: period === value ? '#FFFFFF' : colors.textSecondary }}
      >
        {label}
      </Text>
    </Pressable>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      setLoading(true);
    }
  };

  const TransactionItem = ({ item }: { item: Transaction }) => (
    <View
      className="flex-row items-center justify-between py-4 border-b"
      style={{ borderBottomColor: colors.borderLight }}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: colors.successLight }}
        >
          <CheckCircle size={18} color={colors.success} />
        </View>
        <View className="flex-1">
          <Text className="font-bold text-[12px] mb-0.5" style={{ color: colors.text }}>
            {item.car_number}
          </Text>
          <Text className="text-[10px] font-medium" style={{ color: colors.textTertiary }}>
            {formatDate(item.date)}
          </Text>
        </View>
      </View>
      <Text className="font-black text-[13px]" style={{ color: colors.success }}>
        ₹{item.amount.toFixed(0)}
      </Text>
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Simple Header */}
      <View
        className="pb-4 border-b shadow-sm"
        style={{
          paddingTop: insets.top + 10,
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.border,
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
            My Wallet
          </Text>
          <View className="w-12" />
        </View>

        {/* Date Picker */}
        <View className="px-6 mb-4">
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="p-3 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
            style={{ backgroundColor: colors.background }}
          >
            <Calendar size={18} color={colors.textSecondary} />
            <Text className="font-bold text-[12px]" style={{ color: colors.text }}>
              {formatDisplayDate(selectedDate)}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Period Filters */}
        <View className="flex-row gap-3 px-6">
          <FilterTab label="Today" value="day" />
          <FilterTab label="Week" value="week" />
          <FilterTab label="Month" value="month" />
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
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : data ? (
            <>
              {/* Earnings Summary */}
              <View
                className="rounded-[32px] p-6 mb-6 shadow-sm border"
                style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
              >
                <View className="flex-row items-center gap-3 mb-4">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: colors.successLight }}
                  >
                    <WalletIcon size={20} color={colors.success} />
                  </View>
                  <Text
                    className="text-[11px] font-black uppercase tracking-widest"
                    style={{ color: colors.textSecondary }}
                  >
                    Total Earnings
                  </Text>
                </View>
                <Text
                  className="text-4xl font-black mb-6 tracking-tighter"
                  style={{ color: colors.text }}
                >
                  ₹{data.summary.totalEarnings.toFixed(0)}
                </Text>

                {/* Stats */}
                <View
                  className="flex-row gap-3 pt-4 border-t"
                  style={{ borderTopColor: colors.borderLight }}
                >
                  <View
                    className="flex-1 p-3 rounded-xl"
                    style={{ backgroundColor: colors.background }}
                  >
                    <Text
                      className="text-[10px] font-black uppercase tracking-wide mb-1"
                      style={{ color: colors.textTertiary }}
                    >
                      Jobs
                    </Text>
                    <Text className="text-lg font-black" style={{ color: colors.text }}>
                      {data.summary.taskCount || 0}
                    </Text>
                  </View>
                  <View
                    className="flex-1 p-3 rounded-xl"
                    style={{ backgroundColor: colors.background }}
                  >
                    <Text
                      className="text-[10px] font-black uppercase tracking-wide mb-1"
                      style={{ color: colors.textTertiary }}
                    >
                      Amount
                    </Text>
                    <Text className="text-lg font-black" style={{ color: colors.text }}>
                      ₹{data.summary.taskTotal.toFixed(0)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Jobs List */}
              <View
                className="rounded-[32px] p-6 border shadow-sm mb-8"
                style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <Text
                    className="font-black text-[12px] uppercase tracking-wide"
                    style={{ color: colors.text }}
                  >
                    Completed Jobs
                  </Text>
                  <Text className="text-[10px] font-bold" style={{ color: colors.textTertiary }}>
                    {data.transactions.length} {data.transactions.length === 1 ? 'job' : 'jobs'}
                  </Text>
                </View>

                {data.transactions.length > 0 ? (
                  data.transactions.map((t) => (
                    <TransactionItem key={`${t.type}-${t.id}`} item={t} />
                  ))
                ) : (
                  <View className="py-10 items-center">
                    <WalletIcon size={32} color={colors.textTertiary} />
                    <Text
                      className="text-[11px] font-bold mt-4 uppercase tracking-widest"
                      style={{ color: colors.textSecondary }}
                    >
                      No jobs yet
                    </Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <View
              className="rounded-[32px] p-10 items-center border"
              style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
            >
              <WalletIcon size={32} color={colors.textTertiary} />
              <Text
                className="text-[11px] font-bold mt-4 uppercase tracking-widest"
                style={{ color: colors.textSecondary }}
              >
                No data
              </Text>
            </View>
          )}
          <View className="h-16" />
        </View>
      </ScrollView>
    </View>
  );
}
