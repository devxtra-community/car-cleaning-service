import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, User } from 'lucide-react-native';
import { fs } from '@/src/theme/scale';
import api from '@/src/api/api';

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
      setLoading(true);
      const response = await api.get(`/api/supervisor/penalties?period=${activeTab}`);

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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Penalty History</Text>

      {/* SEGMENTED TABS */}
      <View style={styles.segmentContainer}>
        <Segment
          label="Daily"
          active={activeTab === 'daily'}
          onPress={() => setActiveTab('daily')}
        />
        <Segment
          label="Weekly"
          active={activeTab === 'weekly'}
          onPress={() => setActiveTab('weekly')}
        />
        <Segment
          label="Monthly"
          active={activeTab === 'monthly'}
          onPress={() => setActiveTab('monthly')}
        />
      </View>

      {/* LIST */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3DA2CE" />
        </View>
      ) : (
        <FlatList
          data={penalties}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No penalties found</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.iconBox}>
                <AlertCircle size={18} color="#EF4444" />
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.workerRow}>
                  <User size={14} color="#6B7280" />
                  <Text style={styles.workerName}>{item.workerName}</Text>
                </View>

                <Text style={styles.penaltyCount}>{item.count} penalties</Text>
              </View>

              <Text style={styles.amount}>₹{item.totalAmount}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Segment({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.segment, active && styles.segmentActive]}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },

  title: {
    fontSize: fs(20),
    fontWeight: '700',
    marginBottom: 12,
  },

  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },

  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },

  segmentActive: {
    backgroundColor: '#FFFFFF',
  },

  segmentText: {
    fontSize: fs(13),
    fontWeight: '600',
    color: '#6B7280',
  },

  segmentTextActive: {
    color: '#111827',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  workerName: {
    fontSize: fs(14),
    fontWeight: '600',
  },

  penaltyCount: {
    fontSize: fs(12),
    color: '#6B7280',
    marginTop: 4,
  },

  amount: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#EF4444',
  },

  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 40,
    fontSize: fs(13),
  },
});
