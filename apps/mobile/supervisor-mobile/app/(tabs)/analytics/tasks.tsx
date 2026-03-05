import React, { useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car } from 'lucide-react-native';

type TabType = 'daily' | 'weekly' | 'monthly';

interface CarStat {
  id: string;
  type: string;
  count: number;
}

const DATA: Record<TabType, { total: number; cars: CarStat[] }> = {
  daily: {
    total: 25,
    cars: [
      { id: '1', type: 'SUV', count: 12 },
      { id: '2', type: 'Sedan', count: 8 },
      { id: '3', type: 'Hatchback', count: 5 },
    ],
  },
  weekly: {
    total: 140,
    cars: [
      { id: '1', type: 'SUV', count: 62 },
      { id: '2', type: 'Sedan', count: 48 },
      { id: '3', type: 'Hatchback', count: 30 },
    ],
  },
  monthly: {
    total: 560,
    cars: [
      { id: '1', type: 'SUV', count: 260 },
      { id: '2', type: 'Sedan', count: 190 },
      { id: '3', type: 'Hatchback', count: 110 },
    ],
  },
};

export default function TaskSummaryScreen() {
  const [tab, setTab] = useState<TabType>('daily');
  const current = DATA[tab];

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB] p-5">
      {/* HEADER */}
      <Text className="text-2xl font-antigravity-bold mb-4 text-[#1E3A8A]">Task Details</Text>

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

      {/* TOTAL TASKS CARD */}
      <View className="bg-white rounded-3xl p-6 items-center mb-7 shadow-sm border border-white">
        <View className="w-11 h-11 rounded-full bg-[#E0F2FE] justify-center items-center mb-2">
          <Car size={22} color="#2563EB" />
        </View>

        <Text className="text-xs text-[#6B7280] mb-1.5 font-antigravity-medium">
          Total Cars Cleaned
        </Text>
        <Text className="text-4xl font-antigravity-bold text-[#2563EB]">{current.total}</Text>
      </View>

      {/* CARS CLEANED */}
      <Text className="text-lg font-antigravity-bold mb-3.5 text-[#111827]">Cars Cleaned</Text>

      <FlatList
        data={current.cars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="flex-row items-center bg-white rounded-2xl p-[18px] mb-3.5 shadow-sm border border-white">
            <View className="w-11 h-11 rounded-full bg-[#E0F2FE] justify-center items-center mr-3.5">
              <Car size={20} color="#2563EB" />
            </View>

            <Text className="flex-1 text-base font-antigravity-bold text-[#1F2937]">
              {item.type} Cleaned
            </Text>

            <View className="bg-[#DBEAFE] px-3.5 py-1.5 rounded-full">
              <Text className="text-base font-antigravity-bold text-[#2563EB]">{item.count}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
