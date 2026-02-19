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
import {
  ChevronLeft,
  Wallet as WalletIcon,
  CheckCircle,
  Calendar,
  TrendingUp,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
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
      className={`flex-1 py-3 rounded-xl border ${
        period === value ? 'bg-[#0EA5E9] border-[#0EA5E9]' : 'bg-white border-transparent'
      } clay-button items-center justify-center`}
    >
      <Text
        className={`text-[10px] font-black text-center uppercase tracking-wide ${
          period === value ? 'text-white' : 'text-clay-secondary'
        }`}
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      setLoading(true);
    }
  };

  const TransactionItem = ({ item }: { item: Transaction }) => (
    <View className="flex-row items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <View className="flex-row items-center gap-4 flex-1">
        <View className="w-10 h-10 rounded-full items-center justify-center bg-[#ECFDF5] border border-[#10B981]/20">
          <CheckCircle size={18} color="#10B981" />
        </View>
        <View className="flex-1">
          <Text className="font-heading text-sm text-clay-text mb-0.5">{item.car_number}</Text>
          <Text className="text-[10px] font-body text-clay-secondary">{formatDate(item.date)}</Text>
        </View>
      </View>
      <Text className="font-heading text-base text-[#10B981]">+₹{item.amount.toFixed(0)}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#E0F2FE]">
      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
        className="absolute w-full h-full"
      />

      {/* Simple Header */}
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
          <Text className="text-xl font-heading tracking-tight text-clay-text">My Wallet</Text>
          <View className="w-10" />
        </View>

        {/* Date Picker */}
        <View className="px-6 mb-4">
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="p-3 rounded-xl flex-row items-center justify-center gap-2 shadow-sm clay-button bg-white"
          >
            <Calendar size={18} color="#64748B" />
            <Text className="font-heading text-[13px] text-clay-text">
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
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {loading && !refreshing ? (
          <View className="mt-20 items-center">
            <ActivityIndicator size="small" color="#0EA5E9" />
          </View>
        ) : data ? (
          <>
            {/* Earnings Summary */}
            <View className="clay-card p-6 mb-6 bg-white overflow-hidden relative">
              <LinearGradient
                colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']}
                className="absolute inset-0"
              />
              <View className="flex-row items-center gap-3 mb-6">
                <View className="w-10 h-10 rounded-full bg-[#E0F2FE] items-center justify-center border border-[#0EA5E9]/20">
                  <WalletIcon size={20} color="#0EA5E9" />
                </View>
                <Text className="text-[11px] font-label uppercase tracking-widest text-clay-secondary">
                  Total Earnings
                </Text>
              </View>

              <Text className="text-4xl font-heading mb-8 text-clay-text tracking-tight ml-1">
                ₹{data.summary.totalEarnings.toFixed(0)}
              </Text>

              {/* Stats */}
              <View className="flex-row gap-4 pt-6 border-t border-gray-100">
                <View className="flex-1 p-3 rounded-2xl bg-[#F8FAFC] border border-gray-100">
                  <Text className="text-[10px] font-label uppercase tracking-wide mb-1 text-clay-secondary">
                    Jobs
                  </Text>
                  <Text className="text-xl font-heading text-clay-text">
                    {data.summary.taskCount || 0}
                  </Text>
                </View>
                <View className="flex-1 p-3 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/20">
                  <Text className="text-[10px] font-label uppercase tracking-wide mb-1 text-[#10B981]">
                    Amount
                  </Text>
                  <Text className="text-xl font-heading text-[#10B981]">
                    ₹{data.summary.taskTotal.toFixed(0)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Jobs List */}
            <View className="clay-card p-6 bg-white mb-8">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="font-heading text-[13px] uppercase tracking-wide text-clay-text">
                  Completed Jobs
                </Text>
                <View className="bg-[#E0F2FE] px-2 py-1 rounded-md">
                  <Text className="text-[10px] font-bold text-[#0EA5E9]">
                    {data.transactions.length} jobs
                  </Text>
                </View>
              </View>

              {data.transactions.length > 0 ? (
                <View>
                  {data.transactions.map((t) => (
                    <TransactionItem key={`${t.type}-${t.id}`} item={t} />
                  ))}
                </View>
              ) : (
                <View className="py-10 items-center justify-center">
                  <View className="w-12 h-12 rounded-full bg-gray-50 items-center justify-center mb-3">
                    <TrendingUp size={24} color="#94A3B8" />
                  </View>
                  <Text className="text-[11px] font-bold uppercase tracking-widest text-clay-secondary">
                    No transactions yet
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View className="clay-card p-10 items-center justify-center bg-white mt-6">
            <WalletIcon size={32} color="#94A3B8" />
            <Text className="text-[11px] font-bold mt-4 uppercase tracking-widest text-clay-secondary">
              No data
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
