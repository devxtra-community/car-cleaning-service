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
import Svg, { Path, Circle } from 'react-native-svg';
import {
  TrendingUp,
  DollarSign,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Calendar,
  Clock,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Topographic Pattern
const TopoPattern = () => (
  <Svg
    height="100%"
    width="100%"
    style={StyleSheet.absoluteFillObject}
    viewBox="0 0 400 400"
    preserveAspectRatio="xMidYMid slice"
  >
    <Path
      d="M 0 80 Q 50 60, 100 80 T 200 80 T 300 80 T 400 80"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M 0 100 Q 50 85, 100 100 T 200 100 T 300 100 T 400 100"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M 0 120 Q 50 110, 100 120 T 200 120 T 300 120 T 400 120"
      stroke="rgba(255,255,255,0.12)"
      strokeWidth="2"
      fill="none"
    />

    <Circle cx="320" cy="100" r="30" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
    <Circle cx="320" cy="100" r="45" stroke="rgba(255,255,255,0.12)" strokeWidth="2" fill="none" />
    <Circle cx="320" cy="100" r="60" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />

    <Path
      d="M 60 180 Q 40 160, 60 140 Q 80 120, 100 140 Q 120 160, 100 180 Q 80 200, 60 180 Z"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M 50 180 Q 28 160, 50 135 Q 72 110, 110 135 Q 132 160, 110 185 Q 88 210, 50 180 Z"
      stroke="rgba(255,255,255,0.12)"
      strokeWidth="2"
      fill="none"
    />

    <Path
      d="M 0 240 Q 60 220, 120 240 T 240 240 T 360 240 T 400 240"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M 0 260 Q 60 245, 120 260 T 240 260 T 360 260 T 400 260"
      stroke="rgba(255,255,255,0.12)"
      strokeWidth="2"
      fill="none"
    />

    <Circle cx="80" cy="320" r="25" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
    <Circle cx="80" cy="320" r="38" stroke="rgba(255,255,255,0.12)" strokeWidth="2" fill="none" />
  </Svg>
);

export default function AnalyticsView() {
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER WITH TOPOGRAPHIC BACKGROUND */}
      <View style={styles.headerContainer}>
        <LinearGradient colors={['#5AB9E0', '#3DA2CE']} style={styles.headerGradient}>
          <TopoPattern />
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Analytics</Text>
              <Text style={styles.headerSubtitle}>Track your performance metrics</Text>
            </View>
            <TouchableOpacity style={styles.calendarButton}>
              <Calendar size={20} color="#3DA2CE" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* OVERVIEW CARDS */}
        <View style={styles.overviewContainer}>
          {/* TOTAL EARNINGS */}
          <Pressable
            onPress={() => router.push('/(tabs)/analytics/earnings')}
            style={styles.largeCard}
          >
            <LinearGradient
              colors={['#5AB9E0', '#3DA2CE']}
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

          {/* COMPLETED TASKS CARD - NOW FULL WIDTH */}
          <Pressable
            style={styles.completedCard}
            onPress={() => router.push('/(tabs)/analytics/tasks')}
          >
            <LinearGradient
              colors={['#4FB3D9', '#3DA2CE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.completedGradient}
            >
              <View style={styles.completedLeft}>
                <View style={styles.completedIconWrapper}>
                  <CheckCircle size={24} color="#fff" strokeWidth={2.5} />
                </View>
                <View style={styles.completedInfo}>
                  <Text style={styles.completedValue}>67</Text>
                  <Text style={styles.completedLabel}>Tasks Completed</Text>
                </View>
              </View>
              <View style={styles.completedRight}>
                <View style={styles.completedTrendBadge}>
                  <TrendingUp size={10} color="#10B981" />
                  <Text style={styles.completedTrendText}>+8.3%</Text>
                </View>
                <ChevronRight size={20} color="#fff" style={{ opacity: 0.7 }} />
              </View>
            </LinearGradient>
          </Pressable>

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
                    colors={['#5AB9E0', '#3DA2CE']}
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
    backgroundColor: '#F5F7FA',
  },
  headerContainer: {
    height: 140,
    marginBottom: 20,
  },
  headerGradient: {
    flex: 1,
    paddingTop: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  calendarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3DA2CE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  overviewContainer: {
    paddingHorizontal: 20,
  },
  largeCard: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#3DA2CE',
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
  completedCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3DA2CE',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  completedGradient: {
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  completedIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  completedInfo: {
    flex: 1,
  },
  completedValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  completedLabel: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    opacity: 0.9,
  },
  completedRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedTrendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
  },
  completedTrendText: {
    color: '#10B981',
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
    color: '#3DA2CE',
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
    backgroundColor: '#3DA2CE',
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
    color: '#3DA2CE',
    marginBottom: 4,
  },
  bar: {
    width: '100%',
    maxWidth: 32,
    borderRadius: 8,
    shadowColor: '#3DA2CE',
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
    color: '#3DA2CE',
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
