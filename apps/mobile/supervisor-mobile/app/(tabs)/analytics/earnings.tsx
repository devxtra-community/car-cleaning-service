import React, { useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DollarSign, TrendingUp } from 'lucide-react-native';

type TabType = 'daily' | 'weekly' | 'monthly';

interface ServiceStat {
  id: string;
  type: string;
  count: number;
  amount: number;
  icon: string;
}

const DATA: Record<TabType, { total: number; services: ServiceStat[] }> = {
  daily: {
    total: 2450,
    services: [
      { id: '1', type: 'SUV', count: 3, amount: 1200, icon: '🚙' },
      { id: '2', type: 'Sedan', count: 5, amount: 800, icon: '🚗' },
      { id: '3', type: 'Premium', count: 1, amount: 450, icon: '✨' },
    ],
  },
  weekly: {
    total: 15780,
    services: [
      { id: '1', type: 'SUV', count: 18, amount: 7200, icon: '🚙' },
      { id: '2', type: 'Sedan', count: 32, amount: 5120, icon: '🚗' },
      { id: '3', type: 'Premium', count: 8, amount: 3460, icon: '✨' },
    ],
  },
  monthly: {
    total: 68420,
    services: [
      { id: '1', type: 'SUV', count: 82, amount: 32800, icon: '🚙' },
      { id: '2', type: 'Sedan', count: 145, amount: 23200, icon: '🚗' },
      { id: '3', type: 'Premium', count: 35, amount: 12420, icon: '✨' },
    ],
  },
};

export default function EarningsScreen() {
  const [tab, setTab] = useState<TabType>('daily');
  const current = DATA[tab];

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB] p-5">
      {/* HEADER */}
      <Text className="text-2xl font-antigravity-bold mb-4 text-[#1E3A8A]">Earnings</Text>

      {/* SEGMENTED BAR */}
      <View className="flex-row bg-[#E5E7EB] rounded-2xl p-1 mb-5">
        {(['daily', 'weekly', 'monthly'] as TabType[]).map((item) => (
          <Pressable
            key={item}
            onPress={() => setTab(item)}
            className={`flex-1 py-2.5 rounded-xl items-center ${tab === item ? 'bg-white shadow-sm' : ''}`}
          >
            <Text
              className={`text-sm font-antigravity-bold ${tab === item ? 'text-[#1D4ED8]' : 'text-[#6B7280]'}`}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* TOTAL EARNINGS CARD */}
      <View className="bg-white rounded-3xl p-6 items-center mb-7 shadow-sm border border-white">
        <View className="w-11 h-11 rounded-full bg-[#E0F2FE] justify-center items-center mb-2">
          <DollarSign size={22} color="#2563EB" />
        </View>

        <Text className="text-xs text-[#6B7280] mb-1.5 font-antigravity-medium">
          Total Earnings
        </Text>
        <Text className="text-4xl font-antigravity-bold text-[#2563EB] mb-2">
          ₹{current.total.toLocaleString()}
        </Text>

        {/* TREND INDICATOR */}
        <View className="flex-row items-center gap-1 bg-[#D1FAE5] px-2.5 py-1 rounded-xl">
          <TrendingUp size={14} color="#10B981" />
          <Text className="text-xs font-antigravity-bold text-[#10B981]">
            {tab === 'daily' ? '+12.5%' : tab === 'weekly' ? '+8.3%' : '+15.7%'}
          </Text>
        </View>
      </View>

      {/* SERVICE BREAKDOWN */}
      <Text className="text-lg font-antigravity-bold mb-3.5 text-[#111827]">Service Breakdown</Text>

      <FlatList
        data={current.services}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="flex-row items-center bg-white rounded-2xl p-[18px] mb-3.5 shadow-sm border border-white">
            <View className="w-11 h-11 rounded-full bg-[#E0F2FE] justify-center items-center mr-3.5">
              <Text className="text-xl">{item.icon}</Text>
            </View>

            <View className="flex-1">
              <Text className="text-base font-antigravity-bold text-[#1F2937] mb-0.5">
                {item.type} Cleaned
              </Text>
              <Text className="text-xs font-antigravity-medium text-[#6B7280]">
                {item.count} cars
              </Text>
            </View>

            <View className="bg-[#DBEAFE] px-3.5 py-2 rounded-full">
              <Text className="text-base font-antigravity-bold text-[#2563EB]">
                ₹{item.amount.toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
