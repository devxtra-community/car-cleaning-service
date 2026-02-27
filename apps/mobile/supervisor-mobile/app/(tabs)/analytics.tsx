import { View, Text, ScrollView, Dimensions, Pressable, TouchableOpacity } from 'react-native';
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

// Dimensions available if needed
// const { width } = Dimensions.get('window');

// Topographic Pattern
const TopoPattern = () => (
  <Svg
    height="100%"
    width="100%"
    className="absolute inset-0"
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
    <SafeAreaView className="flex-1 bg-[#F5F7FA]">
      {/* HEADER WITH TOPOGRAPHIC BACKGROUND */}
      <View className="h-[140px] mb-5">
        <LinearGradient colors={['#5AB9E0', '#3DA2CE']} className="flex-1 pt-3 overflow-hidden">
          <TopoPattern />
          <View className="flex-row justify-between items-center px-5 z-10">
            <View>
              <Text className="text-[32px] font-antigravity-bold text-white tracking-tighter">
                Analytics
              </Text>
              <Text className="text-sm text-white/90 font-antigravity-medium mt-1">
                Track your performance metrics
              </Text>
            </View>
            <TouchableOpacity className="w-11 h-11 rounded-full bg-white justify-center items-center shadow-md shadow-[#3DA2CE4C]">
              <Calendar size={20} color="#3DA2CE" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* OVERVIEW CARDS */}
        <View className="px-5">
          {/* TOTAL EARNINGS */}
          <Pressable
            onPress={() => router.push('/(tabs)/analytics/earnings')}
            className="mb-3 rounded-[20px] overflow-hidden shadow-xl shadow-[#3DA2CE4C]"
          >
            <LinearGradient
              colors={['#5AB9E0', '#3DA2CE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-5 min-h-[160px]"
            >
              <View className="flex-row justify-between items-center mb-3">
                <View className="w-12 h-12 rounded-full bg-white/20 justify-center items-center">
                  <DollarSign size={24} color="#fff" strokeWidth={2.5} />
                </View>
                <View className="flex-row items-center bg-white px-2.5 py-1.5 rounded-full">
                  <TrendingUp size={12} color="#10B981" strokeWidth={3} />
                  <Text className="text-[#10B981] text-[12px] font-antigravity-bold ml-1">
                    +12.5%
                  </Text>
                </View>
              </View>
              <Text className="text-4xl font-antigravity-bold text-white mb-1 tracking-tighter">
                ₹1,245
              </Text>
              <Text className="text-base text-white font-antigravity-semibold opacity-95">
                Total Earnings
              </Text>
              <Text className="text-xs text-white opacity-75 mt-0.5">This month</Text>
              <ChevronRight
                size={20}
                color="#fff"
                className="absolute right-5 bottom-5 opacity-50"
              />
            </LinearGradient>
          </Pressable>

          {/* COMPLETED TASKS CARD - NOW FULL WIDTH */}
          <Pressable
            className="mb-3 rounded-2xl overflow-hidden shadow-md shadow-[#3DA2CE26]"
            onPress={() => router.push('/(tabs)/analytics/tasks')}
          >
            <LinearGradient
              colors={['#4FB3D9', '#3DA2CE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-[18px] flex-row justify-between items-center"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-full bg-white/20 justify-center items-center mr-3.5">
                  <CheckCircle size={24} color="#fff" strokeWidth={2.5} />
                </View>
                <View className="flex-1">
                  <Text className="text-[28px] font-antigravity-bold text-white mb-0.5">67</Text>
                  <Text className="text-[13px] text-white font-antigravity-semibold opacity-90">
                    Tasks Completed
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="flex-row items-center bg-white px-2 py-1.5 rounded-xl">
                  <TrendingUp size={10} color="#10B981" />
                  <Text className="text-[#10B981] text-[11px] font-antigravity-bold ml-1">
                    +8.3%
                  </Text>
                </View>
                <ChevronRight size={20} color="#fff" className="opacity-70" />
              </View>
            </LinearGradient>
          </Pressable>

          {/* PENALTY CARD */}
          <Pressable
            onPress={() => router.push('/(tabs)/penalty/penalty-history')}
            className="bg-white rounded-2xl p-4 border-l-4 border-l-[#EF4444] shadow-sm"
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-[#FEE2E2] justify-center items-center mr-3">
                  <AlertCircle size={20} color="#EF4444" strokeWidth={2.5} />
                </View>
                <View className="mt-0.5">
                  <Text className="text-base font-antigravity-bold text-[#111827]">
                    3 Penalties
                  </Text>
                  <Text className="text-xs text-[#6B7280] font-antigravity-medium mt-0.5">
                    Review required
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="flex-row items-center bg-[#FEE2E2] px-2 py-1 rounded-xl mr-2">
                  <Text className="text-[#EF4444] text-[11px] font-antigravity-bold ml-1">
                    -15%
                  </Text>
                </View>
                <ChevronRight size={18} color="#EF4444" />
              </View>
            </View>
          </Pressable>
        </View>

        {/* WEEKLY PERFORMANCE */}
        <View className="mt-6 px-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-antigravity-bold text-[#111827]">Weekly Performance</Text>
            <TouchableOpacity>
              <Text className="text-sm font-antigravity-semibold text-[#3DA2CE]">View All</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-white rounded-[20px] p-5 shadow-sm">
            <View className="flex-row justify-between items-center mb-5">
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-[#3DA2CE] mr-2" />
                <Text className="text-[13px] text-[#6B7280] font-antigravity-medium border-0">
                  Tasks Completed
                </Text>
              </View>
              <Text className="text-xs text-[#6B7280] font-antigravity-semibold">Avg: 9.5/day</Text>
            </View>
            <View className="flex-row justify-between items-end h-[180px]">
              {[
                { day: 'Mon', value: 40, tasks: 8 },
                { day: 'Tue', value: 55, tasks: 11 },
                { day: 'Wed', value: 62, tasks: 12 },
                { day: 'Thu', value: 48, tasks: 9 },
                { day: 'Fri', value: 75, tasks: 15 },
                { day: 'Sat', value: 82, tasks: 16 },
                { day: 'Sun', value: 68, tasks: 13 },
              ].map((item, i) => (
                <TouchableOpacity
                  key={item.day}
                  className="flex-1 items-center justify-end mx-1"
                  activeOpacity={0.7}
                >
                  <Text className="text-[11px] font-antigravity-bold text-[#3DA2CE] mb-1">
                    {item.tasks}
                  </Text>
                  <LinearGradient
                    colors={['#5AB9E0', '#3DA2CE']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    className="w-full max-w-[32px] rounded-lg shadow-sm shadow-[#3DA2CE33]"
                    style={{ height: `${item.value}%` }}
                  />
                  <Text
                    className={`text-[11px] mt-2 font-antigravity-semibold ${
                      i === new Date().getDay() - 1
                        ? 'text-[#3DA2CE] font-antigravity-bold'
                        : 'text-[#9CA3AF]'
                    }`}
                  >
                    {item.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* TASK BREAKDOWN */}
        <View className="mt-6 px-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-antigravity-bold text-[#111827]">Task Breakdown</Text>
            <TouchableOpacity>
              <Text className="text-sm font-antigravity-semibold text-[#3DA2CE]">Details</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-white rounded-[20px] p-5 shadow-sm">
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
    <View className="flex-row justify-between items-center mb-4">
      <View className="flex-row items-center flex-1">
        <View
          className="w-9 h-9 rounded-full justify-center items-center mr-3"
          style={{ backgroundColor: getBackgroundColor() }}
        >
          {getIcon()}
        </View>
        <View className="flex-1">
          <Text className="text-sm font-antigravity-semibold text-[#111827] mb-1.5">{label}</Text>
          <View className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{ width: `${percentage}%`, backgroundColor: color }}
            />
          </View>
        </View>
      </View>
      <View className="items-end ml-3">
        <Text className="text-lg font-antigravity-bold text-[#111827]">{value}</Text>
        <Text className="text-[11px] text-[#6B7280] font-antigravity-semibold mt-0.5">
          {percentage.toFixed(0)}%
        </Text>
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
