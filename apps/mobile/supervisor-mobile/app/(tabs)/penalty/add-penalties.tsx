import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import api from '@/src/api/api';

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
      const res = await api.get('/api/supervisor/workers');
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Select Worker</Text>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Search size={18} color="#6B7280" />
          <TextInput
            placeholder="Search worker"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        {/* LOADING */}
        {loading ? (
          <ActivityIndicator size="large" color="#3DA2CE" style={{ marginTop: 20 }} />
        ) : (
          <>
            {/* WORKER LIST */}
            {filteredWorkers.map((worker) => (
              <Pressable
                key={worker.id}
                onPress={() => setSelectedWorker(worker.cleaner_id)}
                style={[
                  styles.workerCard,
                  selectedWorker === worker.cleaner_id && styles.workerActive,
                ]}
              >
                <View style={styles.avatar}>
                  <User size={18} color="#3DA2CE" />
                </View>
                <Text style={styles.workerName}>{worker.full_name}</Text>
              </Pressable>
            ))}

            {filteredWorkers.length === 0 && <Text style={styles.emptyText}>No workers found</Text>}
          </>
        )}

        {/* CONTINUE */}
        <Pressable
          disabled={!selectedWorker}
          style={[styles.continueButton, !selectedWorker && styles.disabled]}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/penalty/confirm-penalty',
              params: { workerId: selectedWorker },
            })
          }
        >
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  workerActive: {
    borderWidth: 2,
    borderColor: '#3DA2CE',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#3DA2CE',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  disabled: {
    opacity: 0.4,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 20,
  },
});
