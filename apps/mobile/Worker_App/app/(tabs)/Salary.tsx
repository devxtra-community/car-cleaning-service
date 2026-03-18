import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import api from '../../src/api/api';
import { getAccessToken } from '../../src/api/tokenStorage';
import { useLanguage } from '../../contexts/LanguageContext';
import { jwtDecode } from 'jwt-decode';

const { width: SW } = Dimensions.get('window');
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

interface MonthSalary {
  salary_month: string;
  year: number;
  month: number;
  base_salary: number;
  incentives: number;
  penalties: number;
  final_salary: number;
  status: 'pending' | 'in_progress' | 'draft' | 'finalized' | 'locked' | 'paid';
  is_current_month: boolean;
  salary_id: string | null;
}

const STATUS: Record<string, { labelKey: string; color: string; dot: string }> = {
  paid: { labelKey: 'salary.status.paid', color: '#059669', dot: '#10B981' },
  finalized: { labelKey: 'salary.status.finalized', color: '#2563EB', dot: '#3B82F6' },
  locked: { labelKey: 'salary.status.locked', color: '#7C3AED', dot: '#8B5CF6' },
  draft: { labelKey: 'salary.status.draft', color: '#D97706', dot: '#F59E0B' },
  in_progress: { labelKey: 'salary.status.in_progress', color: '#0284C7', dot: '#38BDF8' },
  pending: { labelKey: 'salary.status.pending', color: '#6B7280', dot: '#9CA3AF' },
};

function fmt(n: number) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SalaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const [timeline, setTimeline] = useState<MonthSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<MonthSalary | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const stripRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchTimeline = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }
      let decoded: any;
      try {
        decoded = jwtDecode(token);
      } catch {
        setLoading(false);
        return;
      }
      const userId = decoded.id || decoded.userId;
      if (!userId) {
        setLoading(false);
        return;
      }
      const res = await api.get(`/salary/user/${userId}/timeline`);
      if (res.data?.success) {
        const data: MonthSalary[] = res.data.data || [];
        setTimeline(data);
        const now = new Date();
        const cur = data.find(
          (m) => m.year === now.getFullYear() && m.month === now.getMonth() + 1
        );
        selectEntry(cur ?? data[0] ?? null);
        setYear(now.getFullYear());
      }
    } catch (e) {
      console.error('Failed to fetch salary timeline', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const selectEntry = (entry: MonthSalary | null) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setSelected(entry);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTimeline();
    setRefreshing(false);
  };

  const monthsForYear = timeline.filter((m) => m.year === year);
  const availableYears = [...new Set(timeline.map((m) => m.year))].sort();

  // ── Month strip item
  const MonthChip = ({ item }: { item: MonthSalary }) => {
    const isSelected = selected?.salary_month === item.salary_month;
    const s = STATUS[item.status] ?? STATUS.pending;
    return (
      <TouchableOpacity
        onPress={() => selectEntry(item)}
        style={[
          styles.chip,
          isSelected && { backgroundColor: '#0C4A6E', shadowOpacity: 0.18 },
          item.is_current_month && !isSelected && styles.chipCurrent,
        ]}
        activeOpacity={0.8}
      >
        <Text style={[styles.chipMonth, isSelected && { color: '#fff' }]}>
          {MONTH_SHORT[item.month - 1]}
        </Text>
        <View style={[styles.chipDot, { backgroundColor: isSelected ? '#fff' : s.dot }]} />
        {item.is_current_month && (
          <Text style={[styles.chipNow, isSelected && { color: 'rgba(255,255,255,0.7)' }]}>
            {t('salary.now')}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // placeholder chips for months not in data
  const fullStrip: (MonthSalary | number)[] = Array.from({ length: 12 }, (_, i) => {
    const m = monthsForYear.find((x) => x.month === i + 1);
    return m ?? i + 1;
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Gradient header */}
      <LinearGradient
        colors={['#0C4A6E', '#0369A1', '#38BDF8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 20 }}
      >
        {/* Back button row */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
            alignSelf: 'flex-start',
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={{ fontSize: 22, color: '#fff', marginRight: 4 }}>‹</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerSub}>{t('salary.earningsOverview')}</Text>
        <Text style={styles.headerTitle}>{t('tabs.salary')}</Text>

        {/* Year tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 16 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {availableYears.map((y) => (
            <TouchableOpacity
              key={y}
              onPress={() => {
                setYear(y);
                const ym = timeline.find((m) => m.year === y);
                if (ym) selectEntry(ym);
              }}
              style={[styles.yearTab, year === y && styles.yearTabActive]}
            >
              <Text style={[styles.yearTabText, year === y && styles.yearTabTextActive]}>{y}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {loading ? (
          <View style={{ marginTop: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0369A1" />
            <Text style={{ color: '#64748B', marginTop: 12 }}>Loading salary data…</Text>
          </View>
        ) : (
          <>
            {/* ── Month horizontal strip ── */}
            <View style={styles.stripWrapper}>
              <FlatList
                ref={stripRef}
                horizontal
                data={fullStrip}
                keyExtractor={(_, i) => String(i)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 8 }}
                renderItem={({ item }) => {
                  if (typeof item === 'number') {
                    return (
                      <View style={[styles.chip, styles.chipDisabled]}>
                        <Text style={styles.chipMonthDisabled}>{MONTH_SHORT[item - 1]}</Text>
                        <View style={[styles.chipDot, { backgroundColor: '#E2E8F0' }]} />
                      </View>
                    );
                  }
                  return <MonthChip item={item} />;
                }}
              />
            </View>

            {/* ── Selected month detail card ── */}
            {selected ? (
              <Animated.View style={{ opacity: fadeAnim, marginHorizontal: 16, marginTop: 8 }}>
                {/* Month label row */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardMonth}>
                      {t(`common.months.${MONTH_NAMES[selected.month - 1].toLowerCase()}`)}{' '}
                      {selected.year}
                    </Text>
                    {selected.is_current_month && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>{t('salary.currentMonth')}</Text>
                      </View>
                    )}
                  </View>
                  {(() => {
                    const s = STATUS[selected.status] ?? STATUS.pending;
                    return (
                      <View style={[styles.statusBadge, { backgroundColor: s.color + '18' }]}>
                        <View style={[styles.statusDot, { backgroundColor: s.dot }]} />
                        <Text style={[styles.statusText, { color: s.color }]}>{t(s.labelKey)}</Text>
                      </View>
                    );
                  })()}
                </View>

                <LinearGradient
                  colors={['#0C4A6E', '#0284C7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroCard}
                >
                  <Text style={styles.heroLabel}>{t('salary.netSalary')}</Text>
                  <Text style={styles.heroAmount}>{fmt(selected.final_salary)}</Text>
                  <View style={styles.heroSub}>
                    <Text style={styles.heroSubText}>
                      {t('salary.base')} {fmt(selected.base_salary)}
                    </Text>
                    <Text style={[styles.heroSubText, { color: '#86EFAC' }]}>
                      +{fmt(selected.incentives)}
                    </Text>
                    <Text style={[styles.heroSubText, { color: '#FCA5A5' }]}>
                      -{fmt(selected.penalties)}
                    </Text>
                  </View>
                </LinearGradient>

                {/* Breakdown rows */}
                <View style={styles.breakdownCard}>
                  <Row
                    label={t('salary.baseSalary')}
                    value={fmt(selected.base_salary)}
                    valueColor="#1E293B"
                  />
                  <Div />
                  <Row
                    label={`✦ ${t('salary.incentivesEarned')}`}
                    value={`+${fmt(selected.incentives)}`}
                    valueColor="#059669"
                  />
                  <Div />
                  <Row
                    label={`✦ ${t('salary.penaltiesDeducted')}`}
                    value={`-${fmt(selected.penalties)}`}
                    valueColor="#DC2626"
                  />
                  <Div />
                  <Row
                    label={t('salary.netSalary')}
                    value={fmt(selected.final_salary)}
                    valueColor="#0C4A6E"
                    bold
                  />
                </View>

                {selected.final_salary < 0 && (
                  <View
                    style={[
                      styles.notice,
                      { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', marginBottom: 12 },
                    ]}
                  >
                    <Text style={[styles.noticeText, { color: '#991B1B' }]}>
                      {`⚠️ ${t('salary.negativeWarning', { defaultValue: 'Your net salary is negative due to penalties. Please contact your supervisor.' })}`}
                    </Text>
                  </View>
                )}

                {(selected.status === 'in_progress' || selected.status === 'pending') && (
                  <View style={styles.notice}>
                    <Text style={styles.noticeText}>
                      {selected.status === 'in_progress'
                        ? `⏳ ${t('salary.inProgressNotice')}`
                        : `🕐 ${t('salary.pendingNotice')}`}
                    </Text>
                  </View>
                )}
              </Animated.View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyTitle}>{t('salary.noData')}</Text>
                <Text style={styles.emptyText}>{t('salary.noDataSubtitle')}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const Row = ({
  label,
  value,
  valueColor,
  bold,
}: {
  label: string;
  value: string;
  valueColor: string;
  bold?: boolean;
}) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, bold && { fontWeight: '700', color: '#0C4A6E' }]}>{label}</Text>
    <Text
      style={[styles.rowValue, { color: valueColor }, bold && { fontSize: 16, fontWeight: '800' }]}
    >
      {value}
    </Text>
  </View>
);
const Div = () => <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 2 }} />;

const styles = StyleSheet.create({
  headerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 2 },
  yearTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  yearTabActive: { backgroundColor: '#fff' },
  yearTabText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  yearTabTextActive: { color: '#0C4A6E' },

  stripWrapper: {
    backgroundColor: '#fff',
    marginTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    minWidth: 56,
    shadowColor: '#000',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  chipCurrent: { borderWidth: 1.5, borderColor: '#38BDF8', backgroundColor: '#F0F9FF' },
  chipDisabled: { opacity: 0.35 },
  chipMonth: { fontSize: 13, fontWeight: '600', color: '#334155' },
  chipMonthDisabled: { fontSize: 13, fontWeight: '500', color: '#CBD5E1' },
  chipDot: { width: 5, height: 5, borderRadius: 3, marginTop: 4 },
  chipNow: {
    fontSize: 8,
    color: '#0284C7',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    marginTop: 16,
  },
  cardMonth: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  currentBadge: {
    marginTop: 3,
    backgroundColor: '#DBEAFE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentBadgeText: { fontSize: 10, color: '#1D4ED8', fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },

  heroCard: { borderRadius: 20, padding: 24, marginBottom: 12 },
  heroLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  heroAmount: { fontSize: 36, fontWeight: '800', color: '#fff', marginTop: 4, marginBottom: 12 },
  heroSub: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  heroSubText: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },

  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  rowValue: { fontSize: 14, fontWeight: '700' },

  notice: {
    backgroundColor: '#FEF9EC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  noticeText: { fontSize: 12, color: '#92400E', lineHeight: 18 },

  emptyState: { marginTop: 60, alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginTop: 12 },
  emptyText: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 6, lineHeight: 20 },
});
