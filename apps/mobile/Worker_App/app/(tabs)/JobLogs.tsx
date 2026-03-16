import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, Calendar, X, Clock, Car } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient as _LinearGradient } from 'expo-linear-gradient';
const LinearGradient = _LinearGradient as any;
import { BlurView } from 'expo-blur';
import api from '../../src/api/api';
import { useLanguage } from '../../contexts/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type Task = {
  id: string;
  cleaner_id: string;
  owner_name: string;
  owner_phone: string;
  car_number: string;
  car_model: string;
  car_color: string;
  car_type: string;
  car_image_url: string;
  before_photo_url?: string;
  after_photo_url?: string;
  after_wash_image_url?: string;
  final_price: number;
  payment_method?: string;
  created_at: string;
  completed_at: string;
  status: string;
};

// ─── Sub-components (defined OUTSIDE the screen component so they are never
//     remounted on re-render, which was causing the flicker / loading loop) ────

function TaskCard({ task, onPress }: { task: Task; onPress: (t: Task) => void }) {
  const { t } = useLanguage();
  const timeStr = new Date(task.completed_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Pressable
      onPress={() => onPress(task)}
      className="clay-card p-5 mb-4 border-none shadow-sm bg-white"
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full items-center justify-center bg-[#E0F2FE]">
            <Car size={16} color="#0EA5E9" />
          </View>
          <View>
            <Text className="font-heading text-lg text-clay-text">{task.car_number}</Text>
          </View>
        </View>
        <View className="px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#10B981]/20">
          <Text className="font-bold text-[10px] text-[#10B981] uppercase">
            {t('addJob.completed')}
          </Text>
        </View>
      </View>

      <View className="border-t border-gray-100 my-2" />

      <View className="flex-row justify-between items-center mt-2">
        <View>
          <Text className="text-[10px] font-label uppercase text-clay-secondary/80 mb-1">
            {t('jobLogs.details')}
          </Text>
          <Text className="font-heading text-sm text-clay-text">
            {task.car_color} {task.car_model}
          </Text>
          <Text className="text-[11px] font-body text-clay-secondary">{task.owner_name}</Text>
        </View>

        <View className="items-end">
          <Text className="text-[10px] font-label uppercase text-clay-secondary/80 mb-1">
            {t('jobLogs.earned')}
          </Text>
          <Text className="font-heading text-xl text-[#0EA5E9]">₹{task.final_price}</Text>
          <View className="flex-row items-center gap-1 mt-1">
            <Clock size={10} color="#94A3B8" />
            <Text className="text-[10px] text-clay-secondary">{timeStr}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t } = useLanguage();
  return (
    <View className="flex-row py-3 border-b border-gray-100">
      <Text className="text-[11px] font-label uppercase w-28 tracking-wide text-clay-secondary">
        {label}
      </Text>
      <Text className="text-[13px] font-heading flex-1 text-clay-text">{value}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

/** Returns today's date as a YYYY-MM-DD string in local time. */
function todayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Formats a YYYY-MM-DD string for display. */
function displayDate(dateStr: string) {
  // Use local date for display
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function JobLogs() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Store the date as a plain ISO string (YYYY-MM-DD) — avoids object
  // reference instability that was triggering infinite useFocusEffect loops.
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const [loading, setLoading] = useState(false); // starts FALSE — no ghost spinner
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { t } = useLanguage();

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchTaskLogs = useCallback(async (dateStr: string) => {
    try {
      setLoading(true);
      console.log(`[JobLogs] Fetching tasks for date: ${dateStr}`);
      const res = await api.get(`/workers/task-logs?date=${dateStr}`);
      console.log(
        `[JobLogs] API response success: ${res.data?.success}, count: ${res.data?.tasks?.length || 0}`
      );
      if (res.data?.success) {
        setTasks(res.data.tasks || []);
      } else {
        setTasks([]);
      }
    } catch (e) {
      console.error('Task logs fetch error:', e);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []); // no deps — stable forever

  // Re-fetch every time the screen comes into focus or the date changes.
  useFocusEffect(
    useCallback(() => {
      fetchTaskLogs(selectedDateStr);
    }, [selectedDateStr, fetchTaskLogs])
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTaskLogs(selectedDateStr);
    setRefreshing(false);
  }, [selectedDateStr, fetchTaskLogs]);

  const changeDate = useCallback((days: number) => {
    setSelectedDateStr((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDateChange = useCallback((_event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDateStr(date.toISOString().split('T')[0]);
    }
  }, []);

  const openDetail = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowDetail(true);
  }, []);

  const closeDetail = useCallback(() => setShowDetail(false), []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-[#E0F2FE]">
      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      {/* ─ Header ─ */}
      <View
        className="pb-4 rounded-b-[40px] shadow-sm bg-white/80"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="px-6 flex-row items-center justify-between mb-4">
          {/* Use router.back() — not router.replace — so Android/iOS navigation
              state stays clean and doesn't trigger a re-mount loop. */}
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl items-center justify-center bg-white shadow-sm border border-gray-100"
          >
            <ChevronLeft size={24} color="#1E293B" />
          </Pressable>
          <Text className="text-xl font-heading tracking-tight text-clay-text">
            {t('jobLogs.title')}
          </Text>
          <View className="w-10" />
        </View>

        {/* ─ Date Picker Row ─ */}
        <View className="px-6 mb-2">
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => changeDate(-1)}
              className="w-10 h-10 rounded-xl items-center justify-center shadow-sm clay-button bg-white"
            >
              <Text className="font-heading text-lg text-[#0EA5E9]">←</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="flex-1 p-3 rounded-xl flex-row items-center justify-center gap-2 shadow-sm clay-button bg-white"
            >
              <Calendar size={18} color="#64748B" />
              <Text className="font-heading text-[13px] text-clay-text">
                {displayDate(selectedDateStr)}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => changeDate(1)}
              className="w-10 h-10 rounded-xl items-center justify-center shadow-sm clay-button bg-white"
            >
              <Text className="font-heading text-lg text-[#0EA5E9]">→</Text>
            </Pressable>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={new Date(selectedDateStr)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>
      </View>

      {/* ─ List ─ */}
      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {loading && !refreshing ? (
          <View className="mt-20 items-center">
            <ActivityIndicator size="small" color="#0EA5E9" />
          </View>
        ) : tasks.length > 0 ? (
          <>
            <Text className="font-label text-[10px] uppercase tracking-widest mb-4 ml-1 text-clay-secondary/80">
              {t(
                tasks.length === 1 ? 'jobLogs.completed_count' : 'jobLogs.completed_count_plural',
                { count: tasks.length }
              )}
            </Text>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onPress={openDetail} />
            ))}
          </>
        ) : (
          <View className="clay-card p-10 items-center justify-center bg-white mt-8">
            <View className="w-16 h-16 rounded-full bg-[#E0F2FE] items-center justify-center mb-4">
              <Calendar size={32} color="#0EA5E9" />
            </View>
            <Text className="font-heading text-lg text-clay-text mb-2">{t('jobLogs.noJobs')}</Text>
            <Text className="text-center font-body text-xs text-clay-secondary">
              {t('jobLogs.noJobsSubtitle')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ─ Detail Modal ─ */}
      <Modal visible={showDetail} animationType="slide" transparent>
        <BlurView intensity={20} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View
            className="flex-1 rounded-t-[40px] mt-24 overflow-hidden bg-[#F0F9FF]"
            style={{ paddingBottom: insets.bottom }}
          >
            {/* Modal Header */}
            <View className="p-6 border-b border-gray-200 flex-row items-center justify-between bg-white/80">
              <Text className="text-xl font-heading tracking-tight text-clay-text">
                {t('jobLogs.jobDetails')}
              </Text>
              <Pressable
                onPress={closeDetail}
                className="w-10 h-10 rounded-full items-center justify-center bg-gray-100"
              >
                <X size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 bg-[#F0F9FF]" showsVerticalScrollIndicator={false}>
              {selectedTask && (
                <View className="p-6">
                  {/* Photos */}
                  <View className="mb-6">
                    <Text className="text-[10px] font-label uppercase tracking-widest mb-3 text-clay-secondary ml-1">
                      {t('jobLogs.photos')}
                    </Text>
                    <View className="flex-row gap-4">
                      {selectedTask.before_photo_url && (
                        <View className="flex-1 clay-card p-3 bg-white">
                          <Text className="text-[9px] font-bold mb-2 uppercase tracking-wide text-clay-secondary text-center">
                            {t('jobLogs.before')}
                          </Text>
                          <Image
                            source={{ uri: selectedTask.before_photo_url }}
                            className="w-full aspect-square rounded-xl bg-gray-100"
                            resizeMode="cover"
                          />
                        </View>
                      )}
                      {(selectedTask.after_wash_image_url || selectedTask.after_photo_url) && (
                        <View className="flex-1 clay-card p-3 bg-white">
                          <Text className="text-[9px] font-bold mb-2 uppercase tracking-wide text-[#10B981] text-center">
                            {t('jobLogs.after')}
                          </Text>
                          <Image
                            source={{
                              uri:
                                selectedTask.after_wash_image_url || selectedTask.after_photo_url,
                            }}
                            className="w-full aspect-square rounded-xl bg-gray-100"
                            resizeMode="cover"
                          />
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Vehicle */}
                  <View className="clay-card p-5 mb-5 bg-white">
                    <Text className="text-[10px] font-label uppercase tracking-widest mb-3 text-clay-primary">
                      {t('jobLogs.vehicleDetails')}
                    </Text>
                    <DetailRow
                      label={t('jobLogs.model')}
                      value={`${selectedTask.car_color} ${selectedTask.car_model}`}
                    />
                    <DetailRow label={t('jobLogs.number')} value={selectedTask.car_number} />
                    <DetailRow label={t('jobLogs.type')} value={selectedTask.car_type} />
                  </View>

                  {/* Customer */}
                  <View className="clay-card p-5 mb-5 bg-white">
                    <Text className="text-[10px] font-label uppercase tracking-widest mb-3 text-clay-primary">
                      {t('jobLogs.customerDetails')}
                    </Text>
                    <DetailRow label={t('jobLogs.name')} value={selectedTask.owner_name} />
                    <DetailRow label={t('jobLogs.phone')} value={selectedTask.owner_phone} />
                  </View>

                  {/* Payment */}
                  <View className="clay-card p-5 mb-8 bg-white">
                    <Text className="text-[10px] font-label uppercase tracking-widest mb-3 text-clay-primary">
                      {t('jobLogs.paymentDetails')}
                    </Text>
                    <DetailRow label={t('jobLogs.amount')} value={`₹${selectedTask.final_price}`} />
                    {selectedTask.payment_method && (
                      <DetailRow label={t('jobLogs.method')} value={selectedTask.payment_method} />
                    )}
                    <DetailRow
                      label={t('jobLogs.completed')}
                      value={new Date(selectedTask.completed_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    />
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}
