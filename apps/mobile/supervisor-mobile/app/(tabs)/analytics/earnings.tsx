import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DollarSign, TrendingUp } from 'lucide-react-native';

type TabType = 'daily' | 'weekly' | 'monthly';

interface ServiceStat {
  id: string;
  type: string;
  count: number;
  amount: number;
  icon: string;
}

const DATA: Record<TabType, { total: number; services: ServiceStat[] }> = {
  daily: {
    total: 2450,
    services: [
      { id: '1', type: 'SUV', count: 3, amount: 1200, icon: '🚙' },
      { id: '2', type: 'Sedan', count: 5, amount: 800, icon: '🚗' },
      { id: '3', type: 'Premium', count: 1, amount: 450, icon: '✨' },
    ],
  },
  weekly: {
    total: 15780,
    services: [
      { id: '1', type: 'SUV', count: 18, amount: 7200, icon: '🚙' },
      { id: '2', type: 'Sedan', count: 32, amount: 5120, icon: '🚗' },
      { id: '3', type: 'Premium', count: 8, amount: 3460, icon: '✨' },
    ],
  },
  monthly: {
    total: 68420,
    services: [
      { id: '1', type: 'SUV', count: 82, amount: 32800, icon: '🚙' },
      { id: '2', type: 'Sedan', count: 145, amount: 23200, icon: '🚗' },
      { id: '3', type: 'Premium', count: 35, amount: 12420, icon: '✨' },
    ],
  },
};

export default function EarningsScreen() {
  const [tab, setTab] = useState<TabType>('daily');
  const current = DATA[tab];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <Text style={styles.title}>Earnings</Text>

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

      {/* TOTAL EARNINGS CARD */}
      <View style={styles.totalCard}>
        <View style={styles.totalIcon}>
          <DollarSign size={22} color="#2563EB" />
        </View>

        <Text style={styles.totalLabel}>Total Earnings</Text>
        <Text style={styles.totalValue}>₹{current.total.toLocaleString()}</Text>

        {/* TREND INDICATOR */}
        <View style={styles.trendContainer}>
          <TrendingUp size={14} color="#10B981" />
          <Text style={styles.trendText}>
            {tab === 'daily' ? '+12.5%' : tab === 'weekly' ? '+8.3%' : '+15.7%'}
          </Text>
        </View>
      </View>

      {/* SERVICE BREAKDOWN */}
      <Text style={styles.sectionTitle}>Service Breakdown</Text>

      <FlatList
        data={current.services}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.serviceCard}>
            <View style={styles.iconWrap}>
              <Text style={styles.serviceIcon}>{item.icon}</Text>
            </View>

            <View style={styles.serviceInfo}>
              <Text style={styles.serviceText}>{item.type} Cleaned</Text>
              <Text style={styles.serviceCount}>{item.count} cars</Text>
            </View>

            <View style={styles.amountBadge}>
              <Text style={styles.amountText}>₹{item.amount.toLocaleString()}</Text>
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

  totalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginBottom: 28,
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

  totalLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },

  totalValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 8,
  },

  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  trendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    color: '#111827',
  },

  serviceCard: {
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

  serviceIcon: {
    fontSize: 22,
  },

  serviceInfo: {
    flex: 1,
  },

  serviceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },

  serviceCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },

  amountBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563EB',
  },
});
