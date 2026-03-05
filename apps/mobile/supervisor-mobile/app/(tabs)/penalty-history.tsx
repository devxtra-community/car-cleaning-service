import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, User } from 'lucide-react-native';
import { API } from '@/src/api/api';

type TabType = 'daily' | 'weekly' | 'monthly';

interface PenaltyItem {
  id: string;
  workerName: string;
  count: number;
  totalAmount: number;
}

export default function PenaltyHistory() {
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [penalties, setPenalties] = useState<PenaltyItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPenalties = useCallback(async () => {
    try {
      console.log(` [PENALTY HISTORY] Fetching for period: ${activeTab}`);
      setLoading(true);
      const response = await API.get(`/api/supervisor/penalties?period=${activeTab}`);

      if (response.data.success) {
        setPenalties(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch penalties', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchPenalties();
  }, [fetchPenalties]);

  const Segment = ({ label, type }: { label: string; type: TabType }) => {
    const active = activeTab === type;
    return (
      <TouchableOpacity
        onPress={() => setActiveTab(type)}
        activeOpacity={0.7}
        className={`flex-1 py-2 rounded-lg items-center ${active ? 'bg-white shadow-sm' : ''}`}
      >
        <Text
          className={`text-[13px] font-antigravity-bold ${active ? 'text-[#111827]' : 'text-[#6B7280]'}`}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB] p-4">
      <Text className="text-xl font-antigravity-bold text-[#1E293B] mb-3">Penalty History</Text>

      {/* SEGMENTED TABS */}
      <View className="flex-row bg-[#E5E7EB] rounded-xl p-1 mb-3">
        <Segment label="Daily" type="daily" />
        <Segment label="Weekly" type="weekly" />
        <Segment label="Monthly" type="monthly" />
      </View>

      {/* LIST */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3DA2CE" />
        </View>
      ) : (
        <FlatList
          data={penalties}
          keyExtractor={(item) => item.id || item.workerName}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text className="text-center text-[#9CA3AF] mt-10 text-[13px] font-antigravity-medium">
              No penalties found for this period
            </Text>
          }
          renderItem={({ item }) => (
            <View className="flex-row items-center bg-white rounded-[14px] p-3.5 mb-2.5 shadow-sm border border-white">
              <View className="w-10 h-10 rounded-full bg-[#FEE2E2] justify-center items-center mr-3">
                <AlertCircle size={18} color="#EF4444" />
              </View>

              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <User size={14} color="#6B7280" />
                  <Text className="text-sm font-antigravity-bold text-[#1E293B]">
                    {item.workerName}
                  </Text>
                </View>

                <Text className="text-xs text-[#6B7280] font-antigravity-medium mt-1">
                  {item.count} penalties
                </Text>
              </View>

              <Text className="text-sm font-antigravity-bold text-[#EF4444]">
                ₹{item.totalAmount}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
