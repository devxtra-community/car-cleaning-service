import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Car, Info, MapPin, User, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../src/api/api';
import { useLanguage } from '../contexts/LanguageContext';

interface LiveWorker {
  id: string;
  cleaner_id: string;
  full_name: string;
  status: 'working' | 'idle';
  car_number?: string;
  car_model?: string;
  car_type?: string;
  task_started_at?: string;
}

export default function LiveOperations() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workers, setWorkers] = useState<LiveWorker[]>([]);

  const fetchLiveStatus = async () => {
    try {
      const res = await api.get('/api/supervisor/workers');
      if (res.data.success) {
        setWorkers(res.data.data);
      }
    } catch (error) {
      console.error('Fetch live status error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveStatus();
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <LinearGradient colors={['#E0F2FE', '#F8FAFC']} className="absolute w-full h-full" />

      <View
        className="bg-white px-6 pb-6 rounded-b-[40px] shadow-sm border-b border-gray-100"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl items-center justify-center bg-gray-50 border border-gray-100"
          >
            <ArrowLeft size={24} color="#1E293B" />
          </Pressable>
          <Text className="text-xl font-bold text-[#1E293B]">Live Operations</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />
        }
      >
        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#0EA5E9" />
          </View>
        ) : workers.length === 0 ? (
          <View className="items-center justify-center py-20 bg-white/50 rounded-[32px] border border-dashed border-gray-200">
            <Info size={40} color="#94A3B8" />
            <Text className="text-gray-400 mt-4 font-medium">No workers assigned to you</Text>
          </View>
        ) : (
          workers.map((worker) => (
            <View
              key={worker.id}
              className="bg-white p-5 rounded-[28px] mb-4 shadow-sm border border-gray-100"
            >
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-2xl bg-blue-50 items-center justify-center">
                    <User size={24} color="#0EA5E9" />
                  </View>
                  <View>
                    <Text className="text-lg font-bold text-[#1E293B]">{worker.full_name}</Text>
                    <View className="flex-row items-center gap-1">
                      <View
                        className={`w-2 h-2 rounded-full ${worker.status === 'working' ? 'bg-green-500' : 'bg-gray-300'}`}
                      />
                      <Text className="text-xs text-gray-400 capitalize">{worker.status}</Text>
                    </View>
                  </View>
                </View>
                {worker.task_started_at && (
                  <View className="bg-blue-50 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                    <Clock size={12} color="#0EA5E9" />
                    <Text className="text-[10px] font-bold text-[#0EA5E9]">
                      Started{' '}
                      {new Date(worker.task_started_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                )}
              </View>

              {worker.status === 'working' ? (
                <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <View className="flex-row items-center gap-3 mb-3">
                    <Car size={18} color="#64748B" />
                    <View>
                      <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Active Vehicle
                      </Text>
                      <Text className="text-base font-bold text-[#1E293B]">
                        {worker.car_number} • {worker.car_model}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between">
                    <View className="bg-white/80 px-3 py-2 rounded-xl flex-1 mr-2 flex-row items-center gap-2 border border-gray-100">
                      <Info size={14} color="#0EA5E9" />
                      <Text className="text-xs text-gray-600">{worker.car_type}</Text>
                    </View>
                    <View className="bg-white/80 px-3 py-2 rounded-xl flex-1 flex-row items-center gap-2 border border-gray-100">
                      <MapPin size={14} color="#0EA5E9" />
                      <Text className="text-xs text-gray-600">Level 2</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View className="items-center py-2">
                  <Text className="text-xs text-gray-400 italic">No active task at the moment</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
