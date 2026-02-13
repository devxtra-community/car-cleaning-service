import { View, Text, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://10.10.3.21:3033';

interface LiveWorker {
  id: string;
  full_name: string;
  email: string;
  task_id: string;
  started_at: string;
}

export default function LiveWorkersScreen() {
  const [workers, setWorkers] = useState<LiveWorker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLiveWorkers();
  }, []);

  const loadLiveWorkers = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');

      if (!token) {
        console.warn('No access token found');
        return;
      }

      const res = await fetch(`${BASE_URL}/api/supervisor/workers/live`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (json.success) {
        setWorkers(json.data);
      } else {
        console.warn(json.message);
      }
    } catch (error) {
      console.error('Failed to load live workers', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading live workers...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={workers}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20 }}>No workers are live right now</Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              padding: 14,
              marginBottom: 10,
              backgroundColor: '#fff',
              borderRadius: 12,
            }}
          >
            <Text style={{ fontWeight: '600', fontSize: 16 }}>{item.full_name}</Text>
            <Text style={{ color: '#6b7280' }}>{item.email}</Text>
            <Text style={{ color: '#16a34a', marginTop: 4 }}>● Working on a task</Text>
          </View>
        )}
      />
    </View>
  );
}
