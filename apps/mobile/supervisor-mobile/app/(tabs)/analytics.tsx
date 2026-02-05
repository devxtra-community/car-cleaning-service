import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Calendar,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AnalyticsView() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Analytics</Text>
            <Text style={styles.headerSubtitle}>Track your performance metrics</Text>
          </View>
          <TouchableOpacity style={styles.calendarButton}>
            <Calendar size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* OVERVIEW CARDS */}
        <View style={styles.overviewContainer}>
          {/* TOTAL EARNINGS */}
          <Pressable
            onPress={() => router.push('/(tabs)/analytics/earnings')}
            style={styles.largeCard}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconWrapper}>
                  <DollarSign size={24} color="#fff" strokeWidth={2.5} />
                </View>
                <View style={styles.trendBadge}>
                  <TrendingUp size={12} color="#10B981" strokeWidth={3} />
                  <Text style={styles.trendBadgeText}>+12.5%</Text>
                </View>
              </View>
              <Text style={styles.cardValue}>₹1,245</Text>
              <Text style={styles.cardLabel}>Total Earnings</Text>
              <Text style={styles.cardSubtext}>This month</Text>
              <ChevronRight size={20} color="#fff" style={styles.chevron} />
            </LinearGradient>
          </Pressable>

          {/* SMALL CARDS ROW */}
          <View style={styles.smallCardsRow}>
            {/* COMPLETED TASKS */}
            <Pressable style={styles.smallCard}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.smallGradient}
              >
                <View style={styles.smallIconWrapper}>
                  <CheckCircle size={20} color="#fff" strokeWidth={2.5} />
                </View>
                <Text style={styles.smallCardValue}>67</Text>
                <Text style={styles.smallCardLabel}>Completed</Text>
                <View style={styles.smallTrendRow}>
                  <TrendingUp size={10} color="#fff" />
                  <Text style={styles.smallTrendText}>+8.3%</Text>
                </View>
              </LinearGradient>
            </Pressable>

            {/* TOTAL HOURS */}
            <Pressable style={styles.smallCard}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.smallGradient}
              >
                <View style={styles.smallIconWrapper}>
                  <Clock size={20} color="#fff" strokeWidth={2.5} />
                </View>
                <Text style={styles.smallCardValue}>42h</Text>
                <Text style={styles.smallCardLabel}>Total Hours</Text>
                <View style={styles.smallTrendRow}>
                  <TrendingUp size={10} color="#fff" />
                  <Text style={styles.smallTrendText}>+5.2%</Text>
                </View>
              </LinearGradient>
            </Pressable>
          </View>

          {/* PENALTY CARD */}
          <Pressable
            onPress={() => router.push('/(tabs)/penalty/penalty-history')}
            style={styles.penaltyCard}
          >
            <View style={styles.penaltyContent}>
              <View style={styles.penaltyLeft}>
                <View style={styles.penaltyIconWrapper}>
                  <AlertCircle size={20} color="#EF4444" strokeWidth={2.5} />
                </View>
                <View style={styles.penaltyInfo}>
                  <Text style={styles.penaltyValue}>3 Penalties</Text>
                  <Text style={styles.penaltyLabel}>Review required</Text>
                </View>
              </View>
              <View style={styles.penaltyRight}>
                <View style={styles.penaltyTrendBadge}>
                  <Text style={styles.penaltyTrendText}>-15%</Text>
                </View>
                <ChevronRight size={18} color="#EF4444" />
              </View>
            </View>
          </Pressable>
        </View>

        {/* WEEKLY PERFORMANCE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Performance</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View style={styles.chartLegend}>
                <View style={styles.legendDot} />
                <Text style={styles.legendText}>Tasks Completed</Text>
              </View>
              <Text style={styles.chartAverage}>Avg: 9.5/day</Text>
            </View>
            <View style={styles.barChart}>
              {[
                { day: 'Mon', value: 40, tasks: 8 },
                { day: 'Tue', value: 55, tasks: 11 },
                { day: 'Wed', value: 62, tasks: 12 },
                { day: 'Thu', value: 48, tasks: 9 },
                { day: 'Fri', value: 75, tasks: 15 },
                { day: 'Sat', value: 82, tasks: 16 },
                { day: 'Sun', value: 68, tasks: 13 },
              ].map((item, i) => (
                <TouchableOpacity key={item.day} style={styles.barColumn} activeOpacity={0.7}>
                  <Text style={styles.barValue}>{item.tasks}</Text>
                  <LinearGradient
                    colors={['#3B82F6', '#2563EB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[styles.bar, { height: `${item.value}%` }]}
                  />
                  <Text
                    style={[
                      styles.barLabel,
                      i === new Date().getDay() - 1 && styles.barLabelActive,
                    ]}
                  >
                    {item.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* TASK BREAKDOWN */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Task Breakdown</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>Details</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.breakdownCard}>
            <Breakdown label="Completed" value="67" total={78} color="#10B981" />
            <Breakdown label="In Progress" value="8" total={78} color="#F59E0B" />
            <Breakdown label="Pending" value="3" total={78} color="#6B7280" />
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Breakdown({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: string;
  total: number;
  color: string;
}) {
  const percentage = (parseInt(value) / total) * 100;

  // Generate icon based on label
  const getIcon = () => {
    switch (label) {
      case 'Completed':
        return <CheckCircle size={16} color={color} />;
      case 'In Progress':
        return <Clock size={16} color={color} />;
      case 'Pending':
        return <AlertCircle size={16} color={color} />;
      default:
        return null;
    }
  };

  // Get background color with opacity
  const getBackgroundColor = () => {
    return color + '15';
  };

  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownLeft}>
        <View style={[styles.breakdownIconWrapper, { backgroundColor: getBackgroundColor() }]}>
          {getIcon()}
        </View>
        <View style={styles.breakdownInfo}>
          <Text style={styles.breakdownLabel}>{label}</Text>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]}
            />
          </View>
        </View>
      </View>
      <View style={styles.breakdownRight}>
        <Text style={styles.breakdownValue}>{value}</Text>
        <Text style={styles.breakdownPercentage}>{percentage.toFixed(0)}%</Text>
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  calendarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  overviewContainer: {
    paddingHorizontal: 20,
  },
  largeCard: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  gradientCard: {
    padding: 20,
    minHeight: 160,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trendBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  cardValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -1,
  },
  cardLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    opacity: 0.95,
  },
  cardSubtext: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.75,
    marginTop: 2,
  },
  chevron: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    opacity: 0.5,
  },
  smallCardsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  smallCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginRight: 12,
  },
  smallGradient: {
    padding: 16,
    minHeight: 130,
  },
  smallIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  smallCardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  smallCardLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    opacity: 0.9,
  },
  smallTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  smallTrendText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  penaltyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  penaltyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  penaltyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  penaltyIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  penaltyInfo: {
    marginTop: 2,
  },
  penaltyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  penaltyLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  penaltyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  penaltyTrendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  penaltyTrendText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  chartAverage: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 4,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  bar: {
    width: '100%',
    maxWidth: 32,
    borderRadius: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  barLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
    fontWeight: '600',
  },
  barLabelActive: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  breakdownRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  breakdownPercentage: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
});
