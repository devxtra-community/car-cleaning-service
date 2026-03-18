import { View, Text, Image, FlatList, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API } from '@/src/api/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface Worker {
  id: string;
  full_name: string;
  phone?: string;
  profile_image?: string;
}

export default function WorkersList() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await API.get('/workers');
        setWorkers(response.data);
      } catch {
        console.error('Error fetching workers');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F5F7FA]">
        <ActivityIndicator size="large" color="#3DA2CE" />
        <Text className="mt-3 text-sm text-[#6B7280] font-antigravity-medium">
          {t('addJob.loadingWorkers', { defaultValue: 'Loading workers...' })}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA]">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-xl font-antigravity-bold text-[#2C2C2C]">
          {t('supervisor.workers', { defaultValue: 'Workers' })}
        </Text>
        <Text className="text-sm text-[#6B7280] font-antigravity-medium mt-1">
          {t('supervisor.workersAssigned', {
            count: workers.length,
            defaultValue: `${workers.length} workers assigned`,
          })}
        </Text>
      </View>

      <FlatList
        data={workers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm border border-[#F1F5F9]">
            <View className="w-12 h-12 rounded-full bg-[#E8F4F8] justify-center items-center mr-3">
              {item.profile_image ? (
                <Image source={{ uri: item.profile_image }} className="w-12 h-12 rounded-full" />
              ) : (
                <Text className="text-lg font-antigravity-bold text-[#3DA2CE]">
                  {item.full_name?.charAt(0) || '?'}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-base font-antigravity-bold text-[#1F2937]">
                {item.full_name}
              </Text>
              {item.phone && (
                <Text className="text-xs text-[#6B7280] font-antigravity-medium mt-0.5">
                  {item.phone}
                </Text>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-center mt-10 text-[#9CA3AF] font-antigravity-medium">
            {t('supervisor.noWorkersFound', { defaultValue: 'No workers found' })}
          </Text>
        }
      />
    </SafeAreaView>
  );
}
