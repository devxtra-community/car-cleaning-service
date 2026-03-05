import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import { API } from '@/src/api/api';

interface Worker {
  id: string;
  cleaner_id: string;
  full_name: string;
}

export default function SelectWorkerScreen() {
  const [search, setSearch] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const res = await API.get('/api/supervisor/workers');
      if (res.data.success) {
        setWorkers(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch workers', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkers = useMemo(
    () => workers.filter((w) => w.full_name.toLowerCase().includes(search.toLowerCase())),
    [search, workers]
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text className="text-2xl font-antigravity-bold text-[#1E293B] mb-4">Select Worker</Text>

        {/* SEARCH */}
        <View className="flex-row items-center bg-white rounded-2xl px-3 py-2.5 mb-4 border border-[#F1F5F9] shadow-sm">
          <Search size={18} color="#6B7280" />
          <TextInput
            placeholder="Search worker"
            value={search}
            onChangeText={setSearch}
            className="flex-1 text-sm font-antigravity-medium ml-2"
          />
        </View>

        {/* LOADING */}
        {loading ? (
          <ActivityIndicator size="large" color="#3DA2CE" className="mt-5" />
        ) : (
          <>
            {/* WORKER LIST */}
            {filteredWorkers.map((worker) => (
              <Pressable
                key={worker.id}
                onPress={() => setSelectedWorker(worker.cleaner_id)}
                className={`flex-row items-center bg-white rounded-[18px] p-4 mb-3 border ${
                  selectedWorker === worker.cleaner_id
                    ? 'border-[#3DA2CE] border-2 shadow-sm'
                    : 'border-white shadow-lg shadow-black/5'
                }`}
              >
                <View className="w-9 h-9 rounded-full bg-[#E8F4F8] justify-center items-center mr-3">
                  <User size={18} color="#3DA2CE" />
                </View>
                <Text className="text-base font-antigravity-bold text-[#1E293B]">
                  {worker.full_name}
                </Text>
              </Pressable>
            ))}

            {filteredWorkers.length === 0 && (
              <Text className="text-center text-[#9CA3AF] mt-5 font-antigravity-medium">
                No workers found
              </Text>
            )}
          </>
        )}

        {/* CONTINUE */}
        <Pressable
          disabled={!selectedWorker}
          className={`h-14 rounded-[18px] items-center justify-center mt-6 shadow-lg ${
            !selectedWorker ? 'bg-[#3DA2CE] opacity-40' : 'bg-[#3DA2CE]'
          }`}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/penalty/confirm-penalty',
              params: { workerId: selectedWorker },
            })
          }
        >
          <Text className="text-white text-base font-antigravity-bold">Continue</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
