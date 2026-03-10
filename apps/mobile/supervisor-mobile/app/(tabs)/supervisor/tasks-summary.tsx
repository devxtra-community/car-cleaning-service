import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { API } from '@/src/api/api';

/* ---------------- TYPES ---------------- */

interface Task {
  id: string;
  car_type: string;
  worker_name: string;
  completed_at: string;
}

/* ---------------- CONSTANTS ---------------- */

const DAILY_TARGET = 12;

/* ---------------- SCREEN ---------------- */

export default function DailyTasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const completed = tasks.length;
  const remaining = Math.max(DAILY_TARGET - completed, 0);
  const progressPercent = (completed / DAILY_TARGET) * 100;

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await API.get('/api/supervisor/tasks?period=daily');
        if (isMounted) {
          setTasks(res.data.data);
        }
      } catch (err) {
        console.log('Failed to load daily tasks', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* DAILY TASK PROGRESS */}
        <View className="bg-white rounded-[28px] p-5 mb-4 shadow-xl border border-white">
          <Text className="text-[11px] font-antigravity-bold text-[#6B7280] text-center uppercase tracking-widest mb-4">
            DAILY TASK PROGRESS
          </Text>

          <View className="items-center my-4">
            <View className="w-[150px] h-[150px] rounded-full bg-[#E6F4FB] justify-center items-center relative">
              {/* Simple progress ring approximation with border */}
              <View
                className="absolute w-[150px] h-[150px] rounded-full border-[10px] border-[#3DA2CE]"
                style={{
                  borderTopColor: 'transparent',
                  transform: [{ rotate: `${progressPercent * 3.6 - 90}deg` }],
                }}
              />
              <View className="w-[110px] h-[110px] rounded-full bg-white justify-center items-center">
                <Text className="text-2xl font-antigravity-bold text-[#1E293B]">
                  {completed}/{DAILY_TARGET}
                </Text>
                <Text className="text-xs text-[#6B7280] font-antigravity-medium">Cars Cleaned</Text>
              </View>
            </View>
          </View>

          <View className="flex-row justify-between mt-4">
            <Stat label="Completed" value={String(completed)} />
            <Stat label="Remaining" value={String(remaining)} />
            <Stat label="Target" value={String(DAILY_TARGET)} />
          </View>
        </View>

        {/* DAILY TARGET */}
        <View className="bg-white rounded-[28px] p-5 mb-4 shadow-lg">
          <Text className="text-base font-antigravity-bold text-[#1E293B]">Daily Task Target</Text>
          <Text className="text-sm text-[#6B7280] font-antigravity-medium my-2">
            Clean {remaining} more cars to reach today’s target
          </Text>

          <View className="h-3 rounded-full bg-[#E5E7EB] overflow-hidden mt-2">
            {(() => {
              const LinearGradientComponent = LinearGradient as any;
              return (
                <LinearGradientComponent
                  colors={['#3DA2CE', '#8ED6F8']}
                  style={{ width: `${progressPercent}%`, height: '100%', borderRadius: 6 } as any}
                />
              );
            })()}
          </View>

          <Text className="text-xs text-[#6B7280] font-antigravity-semibold mt-3 text-right">
            Target: {DAILY_TARGET} cars
          </Text>
        </View>

        {/* PENALTY (OPTIONAL UI) */}
        <View className="bg-[#FEF2F2] rounded-[28px] p-5 mb-4 border border-[#FEE2E2]">
          <View className="flex-row items-center gap-2">
            <AlertCircle size={18} color="#EF4444" />
            <Text className="text-base font-antigravity-bold text-[#B91C1C]">
              Late Arrival Penalty
            </Text>
          </View>
          <Text className="text-xs text-[#991B1B] font-antigravity-medium mt-1">
            Applied today at 9:15 AM
          </Text>
          <Text className="text-base font-antigravity-bold text-[#DC2626] mt-2">-1 Task Count</Text>
        </View>

        {/* TODAY TASKS */}
        <View className="bg-white rounded-[28px] p-5 mb-[100px] shadow-lg">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-base font-antigravity-bold text-[#1E293B]">Today’s Tasks</Text>
            <Text className="text-[11px] text-[#6B7280] font-antigravity-semibold">
              {new Date().toDateString()}
            </Text>
          </View>

          {tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskItem
                key={task.id}
                worker={task.worker_name}
                car={task.car_type}
                time={task.completed_at}
              />
            ))
          ) : (
            <Text className="text-center text-[#9CA3AF] mt-5 text-sm font-antigravity-medium">
              No tasks completed today
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- COMPONENTS ---------------- */

const Stat = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-1 items-center">
    <Text className="text-lg font-antigravity-bold text-[#3DA2CE]">{value}</Text>
    <Text className="text-xs text-[#6B7280] font-antigravity-medium">{label}</Text>
  </View>
);

const TaskItem = ({ worker, car, time }: { worker: string; car: string; time: string }) => (
  <View className="flex-row items-center py-4 border-b border-[#F1F5F9]">
    <View className="w-10 h-10 rounded-full bg-[#E8F4F8] justify-center items-center mr-3">
      <User size={16} color="#3DA2CE" />
    </View>

    <View className="flex-1">
      <Text className="text-sm font-antigravity-bold text-[#1E293B]">{worker}</Text>
      <Text className="text-xs text-[#6B7280] font-antigravity-medium">{car}</Text>
      <Text className="text-[11px] text-[#9CA3AF] font-antigravity-medium">
        Done at {new Date(time).toLocaleTimeString()}
      </Text>
    </View>

    <Text className="text-[11px] text-[#16A34A] font-antigravity-bold">Completed</Text>
  </View>
);
