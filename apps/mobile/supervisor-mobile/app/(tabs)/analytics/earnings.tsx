import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
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
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <Text style={styles.title}>Task Details</Text>

      {/* SEGMENTED BAR */}
      <View style={styles.segment}>
        {(['daily', 'weekly', 'monthly'] as TabType[]).map((item) => (
          <Pressable
            key={item}
            onPress={() => setTab(item)}
            style={[styles.segmentItem, tab === item && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, tab === item && styles.segmentTextActive]}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* TOTAL TASKS CARD */}
      <View style={styles.totalCard}>
        <View style={styles.totalIcon}>
          <Car size={22} color="#2563EB" />
        </View>

        <Text style={styles.totalLabel}>Total Cars Cleaned</Text>
        <Text style={styles.totalValue}>{current.total}</Text>
      </View>

      {/* CARS CLEANED */}
      <Text style={styles.sectionTitle}>Cars Cleaned</Text>

      <FlatList
        data={current.cars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.carCard}>
            <View style={styles.iconWrap}>
              <Car size={20} color="#2563EB" />
            </View>

            <Text style={styles.carText}>{item.type} Cleaned</Text>

            <View style={styles.countBadge}>
              <Text style={styles.countText}>{item.count}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
    color: '#1E3A8A',
  },

  segment: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },

  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },

  segmentActive: {
    backgroundColor: '#FFFFFF',
  },

  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  segmentTextActive: {
    color: '#1D4ED8',
  },
  totalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  totalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginBottom: 28,
  },

  totalLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },

  totalValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2563EB',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    color: '#111827',
  },

  carCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  carText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },

  countBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  countText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
});
