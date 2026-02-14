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
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, Calendar, X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../src/api/api';
import { useTheme } from '../../contexts/ThemeContext';

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

export default function JobLogs() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchTaskLogs = async (date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const res = await api.get(`/workers/task-logs?date=${dateStr}`);
      if (res.data && res.data.success) {
        setTasks(res.data.tasks || []);
      }
    } catch (e) {
      console.error('Task logs fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTaskLogs(selectedDate);
    }, [selectedDate])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTaskLogs(selectedDate);
    setRefreshing(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
    setLoading(true);
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      setLoading(true);
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Pressable
      onPress={() => {
        setSelectedTask(task);
        setShowDetail(true);
      }}
      className="p-4 rounded-xl mb-3 border shadow-sm"
      style={{
        backgroundColor: colors.cardBackground,
        borderColor: colors.border,
        shadowColor: colors.shadow,
        shadowOpacity: 0.05,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-4">
          <Text
            className="font-black text-[12px] mb-1 uppercase tracking-tight"
            style={{ color: colors.text }}
          >
            {task.car_color} {task.car_model}
          </Text>
          <Text className="text-[10px] font-bold mb-0.5" style={{ color: colors.textSecondary }}>
            {task.owner_name}
          </Text>
          <Text className="text-[9px] font-medium" style={{ color: colors.textTertiary }}>
            {formatTime(task.completed_at)}
          </Text>
        </View>
        <View className="items-end">
          <View
            className="px-3 py-1.5 rounded-lg mb-1"
            style={{ backgroundColor: colors.successLight }}
          >
            <Text className="font-black text-[12px]" style={{ color: colors.success }}>
              ₹{task.final_price}
            </Text>
          </View>
          <Text
            className="text-[9px] font-bold tracking-wider uppercase"
            style={{ color: colors.textTertiary }}
          >
            {task.car_number}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <View className="flex-row py-3 border-b" style={{ borderBottomColor: colors.borderLight }}>
      <Text
        className="text-[10px] font-black uppercase w-28 tracking-wider"
        style={{ color: colors.textTertiary }}
      >
        {label}
      </Text>
      <Text className="text-[11px] font-bold flex-1" style={{ color: colors.text }}>
        {value}
      </Text>
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View
        className="pb-4 border-b shadow-sm"
        style={{
          paddingTop: insets.top + 10,
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.border,
        }}
      >
        <View className="px-6 flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => router.push('/(tabs)/Homepage')}
            className="w-12 h-12 rounded-xl items-center justify-center shadow-sm"
            style={{ backgroundColor: colors.background }}
          >
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text className="text-lg font-black tracking-tight" style={{ color: colors.text }}>
            Job Logs
          </Text>
          <View className="w-12" />
        </View>

        {/* Date Picker */}
        <View className="px-6 mb-3">
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => changeDate(-1)}
              className="w-10 h-10 rounded-xl items-center justify-center shadow-sm"
              style={{ backgroundColor: colors.background }}
            >
              <Text className="font-black text-lg" style={{ color: colors.primary }}>
                ←
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="flex-1 p-3 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
              style={{ backgroundColor: colors.background }}
            >
              <Calendar size={18} color={colors.textSecondary} />
              <Text className="font-bold text-[12px]" style={{ color: colors.text }}>
                {formatDate(selectedDate)}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => changeDate(1)}
              className="w-10 h-10 rounded-xl items-center justify-center shadow-sm"
              style={{ backgroundColor: colors.background }}
            >
              <Text className="font-black text-lg" style={{ color: colors.primary }}>
                →
              </Text>
            </Pressable>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B86C6" />
        }
      >
        {loading && !refreshing ? (
          <View className="mt-20 items-center">
            <ActivityIndicator size="small" color="#1B86C6" />
          </View>
        ) : tasks.length > 0 ? (
          <>
            <Text
              className="font-bold text-[10px] uppercase tracking-widest mb-4"
              style={{ color: colors.textTertiary }}
            >
              {tasks.length} {tasks.length === 1 ? 'job' : 'jobs'} completed
            </Text>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </>
        ) : (
          <View
            className="rounded-[32px] p-10 items-center border mt-6"
            style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
          >
            <Calendar size={32} color={colors.textTertiary} />
            <Text
              className="text-[11px] font-bold mt-4 uppercase tracking-widest"
              style={{ color: colors.textSecondary }}
            >
              No jobs found
            </Text>
          </View>
        )}
        <View className="h-16" />
      </ScrollView>

      <Modal visible={showDetail} animationType="slide" transparent>
        <View className="flex-1" style={{ backgroundColor: colors.overlay }}>
          <View
            className="flex-1 rounded-t-[40px] mt-20 overflow-hidden"
            style={{ paddingBottom: insets.bottom, backgroundColor: colors.cardBackground }}
          >
            {/* Modal Header */}
            <View
              className="p-6 border-b flex-row items-center justify-between"
              style={{ borderBottomColor: colors.border }}
            >
              <Text className="text-lg font-black tracking-tight" style={{ color: colors.text }}>
                Job Details
              </Text>
              <Pressable
                onPress={() => setShowDetail(false)}
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: colors.background }}
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {selectedTask && (
                <View className="p-6">
                  {/* Images */}
                  <View className="mb-6">
                    <Text
                      className="text-[10px] font-black uppercase tracking-widest mb-3"
                      style={{ color: colors.textSecondary }}
                    >
                      Photos
                    </Text>
                    <View className="flex-row gap-3">
                      {selectedTask.before_photo_url && (
                        <View className="flex-1">
                          <Text
                            className="text-[9px] font-bold mb-2 uppercase tracking-wide"
                            style={{ color: colors.textTertiary }}
                          >
                            BEFORE
                          </Text>
                          <Image
                            source={{ uri: selectedTask.before_photo_url }}
                            className="w-full aspect-square rounded-2xl"
                            resizeMode="cover"
                            style={{ backgroundColor: colors.background }}
                          />
                        </View>
                      )}
                      {(selectedTask.after_wash_image_url || selectedTask.after_photo_url) && (
                        <View className="flex-1">
                          <Text
                            className="text-[9px] font-bold mb-2 uppercase tracking-wide"
                            style={{ color: colors.textTertiary }}
                          >
                            AFTER
                          </Text>
                          <Image
                            source={{
                              uri:
                                selectedTask.after_wash_image_url || selectedTask.after_photo_url,
                            }}
                            className="w-full aspect-square rounded-2xl"
                            resizeMode="cover"
                            style={{ backgroundColor: colors.background }}
                          />
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Vehicle Details Table */}
                  <View
                    className="rounded-[24px] p-5 mb-5 shadow-sm border"
                    style={{ backgroundColor: colors.background, borderColor: colors.borderLight }}
                  >
                    <Text
                      className="text-[10px] font-black uppercase tracking-widest mb-3"
                      style={{ color: colors.textSecondary }}
                    >
                      Vehicle Details
                    </Text>
                    <DetailRow
                      label="Model"
                      value={`${selectedTask.car_color} ${selectedTask.car_model}`}
                    />
                    <DetailRow label="Number" value={selectedTask.car_number} />
                    <DetailRow label="Type" value={selectedTask.car_type} />
                  </View>

                  {/* Customer Details Table */}
                  <View
                    className="rounded-[24px] p-5 mb-5 shadow-sm border"
                    style={{ backgroundColor: colors.background, borderColor: colors.borderLight }}
                  >
                    <Text
                      className="text-[10px] font-black uppercase tracking-widest mb-3"
                      style={{ color: colors.textSecondary }}
                    >
                      Customer Details
                    </Text>
                    <DetailRow label="Name" value={selectedTask.owner_name} />
                    <DetailRow label="Phone" value={selectedTask.owner_phone} />
                  </View>

                  {/* Payment Details Table */}
                  <View
                    className="rounded-[24px] p-5 mb-8 shadow-sm border"
                    style={{ backgroundColor: colors.background, borderColor: colors.borderLight }}
                  >
                    <Text
                      className="text-[10px] font-black uppercase tracking-widest mb-3"
                      style={{ color: colors.textSecondary }}
                    >
                      Payment Details
                    </Text>
                    <DetailRow label="Amount" value={`₹${selectedTask.final_price}`} />
                    {selectedTask.payment_method && (
                      <DetailRow label="Method" value={selectedTask.payment_method} />
                    )}
                    <DetailRow label="Completed" value={formatTime(selectedTask.completed_at)} />
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
