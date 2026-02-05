import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, User } from 'lucide-react-native';
import { fs } from '@/src/theme/scale';

type TabType = 'daily' | 'weekly' | 'monthly';

interface PenaltyItem {
  id: string;
  workerName: string;
  count: number;
  totalAmount: number;
}

const DATA: Record<TabType, PenaltyItem[]> = {
  daily: [
    { id: '1', workerName: 'Ramesh', count: 1, totalAmount: 100 },
    { id: '2', workerName: 'Anil', count: 2, totalAmount: 200 },
  ],
  weekly: [
    { id: '1', workerName: 'Ramesh', count: 4, totalAmount: 400 },
    { id: '2', workerName: 'Mahesh', count: 3, totalAmount: 300 },
    { id: '3', workerName: 'Anil', count: 5, totalAmount: 500 },
  ],
  monthly: [
    { id: '1', workerName: 'Ramesh', count: 12, totalAmount: 1200 },
    { id: '2', workerName: 'Mahesh', count: 9, totalAmount: 900 },
    { id: '3', workerName: 'Anil', count: 15, totalAmount: 1500 },
  ],
};

export default function PenaltyHistory() {
  const [activeTab, setActiveTab] = useState<TabType>('daily');

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
      <FlatList
        data={DATA[activeTab]}
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
