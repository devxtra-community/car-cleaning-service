import { View, Text, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://10.10.3.182:3033';
interface LiveWorker {
  id: string;
  full_name: string;
  email: string;
  task_id?: string;
  started_at?: string;
}

export default function WorkersScreen() {
  const [workers, setWorkers] = useState<LiveWorker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        console.warn('No token found');
        return;
      }

      const res = await fetch(`${BASE_URL}/api/supervisor/workers`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const json = await res.json();

      if (json.success) {
        setWorkers(json.data);
      } else {
        console.warn('API error:', json.message);
      }
    } catch (err) {
      console.error('Error loading workers', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading workers...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={workers}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20 }}>No workers found</Text>
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
            <Text style={{ color: '#6b7280', fontSize: 12 }}>Role: {item.role}</Text>
          </View>
        )}
      />
    </View>
  );
}
