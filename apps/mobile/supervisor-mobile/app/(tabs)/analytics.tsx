import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AnalyticsView() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>Track your performance</Text>
        </View>

        {/* OVERVIEW CARDS */}
        <View style={styles.overviewRow}>
          <View style={[styles.overviewCard, { backgroundColor: '#10B981' }]}>
            <View style={styles.iconCircle}>
              <DollarSign size={20} color="#10B981" />
            </View>
            <Text style={styles.overviewValue}>$1,245</Text>
            <Text style={styles.overviewLabel}>Total Earnings</Text>
            <View style={styles.trendRow}>
              <TrendingUp size={14} color="#fff" />
              <Text style={styles.trendText}>+12.5%</Text>
            </View>
          </View>

          <View style={[styles.overviewCard, { backgroundColor: '#3B82F6' }]}>
            <View style={styles.iconCircle}>
              <CheckCircle size={20} color="#3B82F6" />
            </View>
            <Text style={styles.overviewValue}>67</Text>
            <Text style={styles.overviewLabel}>Completed Tasks</Text>
            <View style={styles.trendRow}>
              <TrendingUp size={14} color="#fff" />
              <Text style={styles.trendText}>+8.3%</Text>
            </View>
          </View>
        </View>

        <View style={styles.overviewRow}>
          <View style={[styles.overviewCard, { backgroundColor: '#F59E0B' }]}>
            <View style={styles.iconCircle}>
              <Clock size={20} color="#F59E0B" />
            </View>
            <Text style={styles.overviewValue}>42h</Text>
            <Text style={styles.overviewLabel}>Total Hours</Text>
            <View style={styles.trendRow}>
              <TrendingUp size={14} color="#fff" />
              <Text style={styles.trendText}>+5.2%</Text>
            </View>
          </View>

          <View style={[styles.overviewCard, { backgroundColor: '#EF4444' }]}>
            <View style={styles.iconCircle}>
              <AlertCircle size={20} color="#EF4444" />
            </View>
            <Text style={styles.overviewValue}>3</Text>
            <Text style={styles.overviewLabel}>Penalties</Text>
            <View style={styles.trendRow}>
              <TrendingDown size={14} color="#fff" />
              <Text style={styles.trendText}>-15.00</Text>
            </View>
          </View>
        </View>

        {/* WEEKLY PERFORMANCE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Performance</Text>
          <View style={styles.chartCard}>
            <View style={styles.barChartContainer}>
              <View style={styles.barChart}>
                <BarColumn label="Mon" value={65} color="#4FB3D9" />
                <BarColumn label="Tue" value={80} color="#4FB3D9" />
                <BarColumn label="Wed" value={75} color="#4FB3D9" />
                <BarColumn label="Thu" value={90} color="#4FB3D9" />
                <BarColumn label="Fri" value={70} color="#4FB3D9" />
                <BarColumn label="Sat" value={45} color="#CBD5E1" />
                <BarColumn label="Sun" value={30} color="#CBD5E1" />
              </View>
            </View>
          </View>
        </View>

        {/* TASK BREAKDOWN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Breakdown</Text>
          <View style={styles.breakdownCard}>
            <TaskBreakdownItem
              label="Completed"
              count={67}
              total={78}
              color="#10B981"
              percentage={86}
            />
            <TaskBreakdownItem
              label="In Progress"
              count={8}
              total={78}
              color="#F59E0B"
              percentage={10}
            />
            <TaskBreakdownItem
              label="Pending"
              count={3}
              total={78}
              color="#6B7280"
              percentage={4}
            />
          </View>
        </View>

        {/* EARNINGS TREND */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Earnings</Text>
          <View style={styles.earningsCard}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>January</Text>
              <Text style={styles.earningsValue}>$425.00</Text>
            </View>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>February</Text>
              <Text style={styles.earningsValue}>$380.00</Text>
            </View>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>March</Text>
              <Text style={styles.earningsValue}>$440.00</Text>
            </View>
            <View style={[styles.earningsRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.earningsLabel, { fontWeight: '700' }]}>Total</Text>
              <Text style={[styles.earningsValue, { fontWeight: '700', color: '#10B981' }]}>
                $1,245.00
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- BAR COLUMN COMPONENT ---------- */

function BarColumn({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.barColumn}>
      <View style={styles.barWrapper}>
        <View
          style={[
            styles.bar,
            {
              height: `${value}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={styles.barLabel}>{label}</Text>
    </View>
  );
}

/* ---------- TASK BREAKDOWN ITEM ---------- */

function TaskBreakdownItem({
  label,
  count,
  total,
  color,
  percentage,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  percentage: number;
}) {
  return (
    <View style={styles.breakdownItem}>
      <View style={styles.breakdownHeader}>
        <View style={styles.breakdownLabelRow}>
          <View style={[styles.colorDot, { backgroundColor: color }]} />
          <Text style={styles.breakdownLabel}>{label}</Text>
        </View>
        <Text style={styles.breakdownCount}>
          {count}/{total}
        </Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },

  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  overviewCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  overviewValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },

  overviewLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },

  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },

  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  barChartContainer: {
    height: 200,
  },

  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },

  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  barWrapper: {
    width: '70%',
    height: 150,
    justifyContent: 'flex-end',
  },

  bar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },

  barLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
  },

  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  breakdownItem: {
    marginBottom: 16,
  },

  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  breakdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  breakdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  breakdownCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },

  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  earningsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  earningsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },

  earningsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});
