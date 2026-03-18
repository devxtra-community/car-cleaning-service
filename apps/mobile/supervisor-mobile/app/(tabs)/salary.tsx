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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { API } from '../../src/api/api';
import { getAccessToken } from '../../src/tokenStorage';
import { useLanguage } from '../../contexts/LanguageContext';
import { jwtDecode } from 'jwt-decode';

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

const STATUS: Record<string, { labelKey: string; color: string; bg: string; dot: string }> = {
  paid: { labelKey: 'salary.status.paid', color: '#059669', bg: '#D1FAE5', dot: '#10B981' },
  finalized: {
    labelKey: 'salary.status.finalized',
    color: '#2563EB',
    bg: '#DBEAFE',
    dot: '#3B82F6',
  },
  locked: { labelKey: 'salary.status.locked', color: '#7C3AED', bg: '#EDE9FE', dot: '#8B5CF6' },
  draft: { labelKey: 'salary.status.draft', color: '#D97706', bg: '#FEF3C7', dot: '#F59E0B' },
  in_progress: {
    labelKey: 'salary.status.in_progress',
    color: '#0284C7',
    bg: '#E0F2FE',
    dot: '#38BDF8',
  },
  pending: { labelKey: 'salary.status.pending', color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' },
};

const LG = LinearGradient as any;

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
      const res = await API.get(`/salary/user/${userId}/timeline`);
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
      console.error('Salary timeline fetch failed', e);
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

  const MonthChip = ({ item }: { item: MonthSalary }) => {
    const isSelected = selected?.salary_month === item.salary_month;
    const s = STATUS[item.status] ?? STATUS.pending;
    return (
      <TouchableOpacity
        onPress={() => selectEntry(item)}
        className={`items-center justify-center px-4 py-2 rounded-2xl min-w-[56px] ${
          isSelected
            ? 'bg-[#0C4A6E]'
            : item.is_current_month
              ? 'bg-[#F0F9FF] border border-[#38BDF8]'
              : 'bg-[#F8FAFC]'
        }`}
        activeOpacity={0.8}
      >
        <Text className={`text-[13px] font-bold ${isSelected ? 'text-white' : 'text-[#334155]'}`}>
          {MONTH_SHORT[item.month - 1]}
        </Text>
        <View
          className="w-[5px] h-[5px] rounded-full mt-1"
          style={{ backgroundColor: isSelected ? '#fff' : s.dot }}
        />
        {item.is_current_month && (
          <Text
            className={`text-[8px] font-extrabold mt-0.5 uppercase tracking-widest ${isSelected ? 'text-white/70' : 'text-[#0284C7]'}`}
          >
            {t('salary.now')}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const fullStrip: (MonthSalary | number)[] = Array.from({ length: 12 }, (_, i) => {
    const m = monthsForYear.find((x) => x.month === i + 1);
    return m ?? i + 1;
  });

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Gradient Header */}
      <LG
        colors={['#0C4A6E', '#0369A1', '#38BDF8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 20 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-2 self-start"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className="text-[22px] text-white mr-1">‹</Text>
          <Text className="text-sm text-white/85 font-semibold">{t('common.back')}</Text>
        </TouchableOpacity>

        <Text className="text-[11px] text-white/65 tracking-[2px] uppercase">
          {t('salary.earningsOverview')}
        </Text>
        <Text className="text-[28px] font-extrabold text-white mt-0.5">{t('tabs.salary')}</Text>

        {/* Year tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4"
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
              className={`px-4 py-1.5 rounded-full ${year === y ? 'bg-white' : 'bg-white/15'}`}
            >
              <Text
                className={`text-[13px] font-semibold ${year === y ? 'text-[#0C4A6E]' : 'text-white/90'}`}
              >
                {y}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LG>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {loading ? (
          <View className="mt-16 items-center">
            <ActivityIndicator size="large" color="#0369A1" />
            <Text className="text-[#64748B] mt-3">{t('common.loading')}</Text>
          </View>
        ) : (
          <>
            {/* Month strip */}
            <View className="bg-white border-b border-[#F1F5F9] elevation-2">
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
                      <View className="items-center justify-center px-4 py-2 rounded-2xl min-w-[56px] bg-[#F8FAFC] opacity-35">
                        <Text className="text-[13px] font-medium text-[#CBD5E1]">
                          {MONTH_SHORT[item - 1]}
                        </Text>
                        <View className="w-[5px] h-[5px] rounded-full mt-1 bg-[#E2E8F0]" />
                      </View>
                    );
                  }
                  return <MonthChip item={item} />;
                }}
              />
            </View>

            {selected ? (
              <Animated.View style={{ opacity: fadeAnim }} className="mx-4 mt-2">
                {/* Month header */}
                <View className="flex-row justify-between items-start mb-2.5 mt-4">
                  <View>
                    <Text className="text-[22px] font-extrabold text-[#0F172A]">
                      {t(`common.months.${MONTH_NAMES[selected.month - 1].toLowerCase()}`)}{' '}
                      {selected.year}
                    </Text>
                    {selected.is_current_month && (
                      <View className="mt-1 self-start bg-[#DBEAFE] px-2 py-0.5 rounded-lg">
                        <Text className="text-[10px] text-[#1D4ED8] font-bold">
                          {t('salary.currentMonth')}
                        </Text>
                      </View>
                    )}
                  </View>
                  {(() => {
                    const s = STATUS[selected.status] ?? STATUS.pending;
                    return (
                      <View
                        className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                        style={{ backgroundColor: s.bg }}
                      >
                        <View
                          className="w-[7px] h-[7px] rounded-full"
                          style={{ backgroundColor: s.dot }}
                        />
                        <Text className="text-[12px] font-bold" style={{ color: s.color }}>
                          {t(s.labelKey)}
                        </Text>
                      </View>
                    );
                  })()}
                </View>

                {/* Hero card */}
                <LG
                  colors={['#0C4A6E', '#0284C7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-[20px] p-6 mb-3"
                >
                  <Text className="text-[11px] text-white/65 uppercase tracking-[1.5px] font-semibold">
                    {t('salary.netSalary')}
                  </Text>
                  <Text className="text-[36px] font-extrabold text-white mt-1 mb-3">
                    {fmt(selected.final_salary)}
                  </Text>
                  <View className="flex-row gap-4 flex-wrap">
                    <Text className="text-[12px] text-white/75 font-semibold">
                      {t('salary.base')} {fmt(selected.base_salary)}
                    </Text>
                    <Text className="text-[12px] font-semibold text-[#86EFAC]">
                      +{fmt(selected.incentives)}
                    </Text>
                    <Text className="text-[12px] font-semibold text-[#FCA5A5]">
                      -{fmt(selected.penalties)}
                    </Text>
                  </View>
                </LG>

                {/* Breakdown card */}
                <View className="bg-white rounded-[18px] p-[18px] mb-3 elevation-2 shadow-sm">
                  <Row
                    label={t('salary.baseSalary')}
                    value={fmt(selected.base_salary)}
                    color="text-[#1E293B]"
                  />
                  <View className="h-px bg-[#F1F5F9] my-0.5" />
                  <Row
                    label={`✦ ${t('salary.incentivesEarned')}`}
                    value={`+${fmt(selected.incentives)}`}
                    color="text-[#059669]"
                  />
                  <View className="h-px bg-[#F1F5F9] my-0.5" />
                  <Row
                    label={`✦ ${t('salary.penaltiesDeducted')}`}
                    value={`-${fmt(selected.penalties)}`}
                    color="text-[#DC2626]"
                  />
                  <View className="h-px bg-[#F1F5F9] my-0.5" />
                  <Row
                    label={t('salary.netSalary')}
                    value={fmt(selected.final_salary)}
                    color="text-[#0C4A6E]"
                    bold
                  />
                </View>

                {(selected.status === 'in_progress' || selected.status === 'pending') && (
                  <View className="bg-[#FEF9EC] rounded-2xl p-3.5 border border-[#FCD34D]">
                    <Text className="text-[12px] text-[#92400E] leading-[18px]">
                      {selected.status === 'in_progress'
                        ? `⏳ ${t('salary.inProgressNotice')}`
                        : `🕐 ${t('salary.pendingNotice')}`}
                    </Text>
                  </View>
                )}
              </Animated.View>
            ) : (
              <View className="mt-16 items-center px-10">
                <Text className="text-[48px]">📅</Text>
                <Text className="text-[18px] font-bold text-[#334155] mt-3">
                  {t('salary.noData')}
                </Text>
                <Text className="text-[13px] text-[#94A3B8] text-center mt-1.5 leading-5">
                  {t('salary.noDataSubtitle')}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Row({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row justify-between items-center py-2.5">
      <Text
        className={`text-[13px] text-[#64748B] ${bold ? 'font-bold text-[#0C4A6E]' : 'font-medium'}`}
      >
        {label}
      </Text>
      <Text className={`${color} font-bold ${bold ? 'text-[16px] font-extrabold' : 'text-[14px]'}`}>
        {value}
      </Text>
    </View>
  );
}
