import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { ChevronLeft, Calendar, X, Clock, Car } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import api from '../../src/api/api';

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
  // const insets = useSafeAreaInsets();
  const insets = useSafeAreaInsets();
  const router = useRouter();
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

  /*
  useFocusEffect(
    useCallback(() => {
      fetchTaskLogs(selectedDate);
    }, [selectedDate])
  );
  */

  React.useEffect(() => {
    fetchTaskLogs(selectedDate);
  }, [selectedDate]);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          <Text className="font-bold text-[10px] text-[#10B981]">COMPLETED</Text>
        </View>
      </View>

      <View className="border-t border-gray-100 my-2" />

      <View className="flex-row justify-between items-center mt-2">
        <View>
          <Text className="text-[10px] font-label uppercase text-clay-secondary/80 mb-1">
            Details
          </Text>
          <Text className="font-heading text-sm text-clay-text">
            {task.car_color} {task.car_model}
          </Text>
          <Text className="text-[11px] font-body text-clay-secondary">{task.owner_name}</Text>
        </View>

        <View className="items-end">
          <Text className="text-[10px] font-label uppercase text-clay-secondary/80 mb-1">
            Earned
          </Text>
          <Text className="font-heading text-xl text-[#0EA5E9]">₹{task.final_price}</Text>
          <View className="flex-row items-center gap-1 mt-1">
            <Clock size={10} color="#94A3B8" />
            <Text className="text-[10px] text-clay-secondary">{formatTime(task.completed_at)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <View className="flex-row py-3 border-b border-gray-100">
      <Text className="text-[11px] font-label uppercase w-28 tracking-wide text-clay-secondary">
        {label}
      </Text>
      <Text className="text-[13px] font-heading flex-1 text-clay-text">{value}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#E0F2FE]">
      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
        className="absolute w-full h-full"
      />

      <View
        className="pb-4 rounded-b-[40px] shadow-sm bg-white/80"
        style={{
          paddingTop: insets.top + 10,
        }}
      >
        <View className="px-6 flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => router.replace('/Homepage')}
            className="w-10 h-10 rounded-xl items-center justify-center bg-white shadow-sm border border-gray-100"
          >
            <ChevronLeft size={24} color="#1E293B" />
          </Pressable>
          <Text className="text-xl font-heading tracking-tight text-clay-text">Job Logs</Text>
          <View className="w-10" />
        </View>

        {/* Date Picker */}
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
                {formatDate(selectedDate)}
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
              {tasks.length} {tasks.length === 1 ? 'job' : 'jobs'} completed
            </Text>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </>
        ) : (
          <View className="clay-card p-10 items-center justify-center bg-white mt-8">
            <View className="w-16 h-16 rounded-full bg-[#E0F2FE] items-center justify-center mb-4">
              <Calendar size={32} color="#0EA5E9" />
            </View>
            <Text className="font-heading text-lg text-clay-text mb-2">No jobs found</Text>
            <Text className="text-center font-body text-xs text-clay-secondary">
              There are no completed jobs for this date.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showDetail} animationType="slide" transparent>
        <BlurView intensity={20} className="flex-1 justify-end">
          <View
            className="flex-1 rounded-t-[40px] mt-24 overflow-hidden bg-[#F0F9FF]"
            style={{ paddingBottom: insets.bottom }}
          >
            {/* Modal Header */}
            <View className="p-6 border-b border-gray-200 flex-row items-center justify-between bg-white/80">
              <Text className="text-xl font-heading tracking-tight text-clay-text">
                Job Details
              </Text>
              <Pressable
                onPress={() => setShowDetail(false)}
                className="w-10 h-10 rounded-full items-center justify-center bg-gray-100"
              >
                <X size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 bg-[#F0F9FF]" showsVerticalScrollIndicator={false}>
              {selectedTask && (
                <View className="p-6">
                  {/* Images */}
                  <View className="mb-6">
                    <Text className="text-[10px] font-label uppercase tracking-widest mb-3 text-clay-secondary ml-1">
                      Photos
                    </Text>
                    <View className="flex-row gap-4">
                      {selectedTask.before_photo_url && (
                        <View className="flex-1 clay-card p-3 bg-white">
                          <Text className="text-[9px] font-bold mb-2 uppercase tracking-wide text-clay-secondary text-center">
                            BEFORE
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
                            AFTER
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

                  {/* Vehicle Details Table */}
                  <View className="clay-card p-5 mb-5 bg-white">
                    <Text className="text-[10px] font-label uppercase tracking-widest mb-3 text-clay-primary">
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
                  <View className="clay-card p-5 mb-5 bg-white">
                    <Text className="text-[10px] font-label uppercase tracking-widest mb-3 text-clay-primary">
                      Customer Details
                    </Text>
                    <DetailRow label="Name" value={selectedTask.owner_name} />
                    <DetailRow label="Phone" value={selectedTask.owner_phone} />
                  </View>

                  {/* Payment Details Table */}
                  <View className="clay-card p-5 mb-8 bg-white">
                    <Text className="text-[10px] font-label uppercase tracking-widest mb-3 text-clay-primary">
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
        </BlurView>
      </Modal>
    </View>
  );
}
