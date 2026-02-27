import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, ScrollView, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  UserCog,
  Calendar,
  ClipboardList,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
} from 'lucide-react-native';
import { router } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { API } from '../../src/api/api';

/* -------------------- DECORATIVE PATTERN -------------------- */
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
      stroke="rgba(14, 165, 233, 0.08)"
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M 0 100 Q 50 85, 100 100 T 200 100 T 300 100 T 400 100"
      stroke="rgba(14, 165, 233, 0.06)"
      strokeWidth="2"
      fill="none"
    />
    <Circle
      cx="320"
      cy="100"
      r="30"
      stroke="rgba(14, 165, 233, 0.08)"
      strokeWidth="2"
      fill="none"
    />
    <Circle
      cx="320"
      cy="100"
      r="45"
      stroke="rgba(14, 165, 233, 0.06)"
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

/* -------------------- ACTION CARD COMPONENT -------------------- */
const ActionCard = ({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) => (
  <Pressable
    className="w-[165px] bg-white rounded-[24px] p-4 items-center border border-[#F1F5F9] shadow-sm active:scale-95 transition-transform"
    onPress={onPress}
  >
    <View className="w-[52px] h-[52px] rounded-[20px] bg-[#E0F2FE] justify-center items-center mb-[10px]">
      {icon}
    </View>
    <Text className="text-sm font-antigravity-bold text-[#1E293B] mb-[2px]">{title}</Text>
    <Text className="text-[11px] text-[#94A3B8] font-antigravity-medium">{subtitle}</Text>
  </Pressable>
);

/* -------------------- MAIN SCREEN -------------------- */
export default function HomePage() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = React.useState<{
    full_name?: string;
    role?: string;
    profile_image?: string;
  } | null>(null);

  const fetchUserProfile = async () => {
    try {
      const res = await API.get('/api/users/me');
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
    }
  };

  React.useEffect(() => {
    fetchUserProfile();
  }, []);

  return (
    <View className="flex-1">
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']} className="absolute inset-0" />
      <TopoPattern />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 20 }}
        style={{ paddingTop: insets.top + 20 }}
      >
        {/* PROFILE HEADER */}
        <View className="flex-row items-center mb-6">
          <View
            className={`w-[60px] h-[60px] rounded-full bg-white justify-center items-center mr-4 shadow-md border-2 border-[#E0F2FE] ${
              user?.profile_image ? 'p-0 overflow-hidden' : ''
            }`}
          >
            {user?.profile_image ? (
              <Image source={{ uri: user.profile_image }} className="w-full h-full" />
            ) : (
              <User size={30} color="#0EA5E9" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-sm text-[#64748B] font-antigravity-medium">Welcome back,</Text>
            <Text className="text-xl font-antigravity-bold text-[#1E293B]">
              {user?.full_name || 'Supervisor'}
            </Text>
          </View>
          <Pressable className="w-12 h-12 rounded-full bg-white justify-center items-center border border-[#F1F5F9]">
            <LayoutGrid size={22} color="#0EA5E9" />
          </Pressable>
        </View>

        {/* EARNINGS CARD CLAY SECTION */}
        <View className="clay-card p-6 mb-6 bg-white border border-[#F1F5F9] shadow-xl">
          <View className="flex-row items-center gap-2 mb-3">
            <TrendingUp size={14} color="#0EA5E9" />
            <Text className="text-[11px] font-antigravity-bold color-[#0EA5E9] uppercase tracking-widest">
              Daily Performance
            </Text>
          </View>

          <View className="flex-row items-baseline mb-4">
            <Text className="text-xl text-[#1E293B] font-antigravity-semibold mr-1">₹</Text>
            <Text className="text-[38px] font-antigravity-bold text-[#1E293B] tracking-tighter">
              5,580
            </Text>
            <View className="bg-[#10B9811A] px-[10px] py-[4px] rounded-xl ml-3">
              <Text className="text-xs font-antigravity-bold text-[#059669]">+12%</Text>
            </View>
          </View>

          <View className="h-[1px] bg-[#94A3B41A] mb-4" />

          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-base font-antigravity-bold text-[#1E293B]">30</Text>
              <Text className="text-[10px] text-[#64748B] font-antigravity-semibold mt-[2px]">
                Jobs Done
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-base font-antigravity-bold text-[#1E293B]">04</Text>
              <Text className="text-[10px] text-[#64748B] font-antigravity-semibold mt-[2px]">
                Pending
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-base font-antigravity-bold text-[#1E293B]">98%</Text>
              <Text className="text-[10px] text-[#64748B] font-antigravity-semibold mt-[2px]">
                Rating
              </Text>
            </View>
          </View>
        </View>

        {/* ACTION BUTTONS REDESIGN */}
        <View className="flex-row gap-3 mb-6">
          <Pressable
            className="flex-[1.6] h-[60px] rounded-[20px] overflow-hidden shadow-lg shadow-[#0EA5E94C]"
            onPress={() => router.push('/(tabs)/supervisor/add-task')}
          >
            <LinearGradient
              colors={['#0EA5E9', '#0284C7']}
              className="flex-1 flex-row items-center px-5 justify-between"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <UserCog size={22} color="#FFF" />
              <Text className="text-white text-base font-antigravity-bold flex-1 ml-3">
                Add Tasks
              </Text>
              <ChevronRight size={18} color="#FFF" opacity={0.6} />
            </LinearGradient>
          </Pressable>

          <Pressable
            className="flex-1 h-[60px] bg-white rounded-[20px] flex-row items-center px-4 border border-[#FEE2E2] gap-[10px]"
            onPress={() => router.push('/(tabs)/penalty/add-penalties')}
          >
            <View className="w-10 h-10 rounded-full bg-[#FEF2F2] justify-center items-center">
              <AlertCircle size={22} color="#EF4444" strokeWidth={2.5} />
            </View>
            <Text className="text-sm font-antigravity-bold text-[#1E293B]">Penalties</Text>
          </Pressable>
        </View>

        {/* QUICK ACTIONS SECTION */}
        <View className="flex-row justify-between items-center mb-5 px-1">
          <Text className="text-xl font-antigravity-bold text-[#1E293B]">Dashboard</Text>
          <Pressable>
            <Text className="text-sm font-antigravity-bold text-[#0EA5E9]">Manage</Text>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap gap-4">
          <ActionCard
            icon={<UserCog size={24} color="#0EA5E9" />}
            title="Live Workers"
            subtitle="Active Crew"
            onPress={() => router.push('/supervisor/live-worker')}
          />

          <ActionCard
            icon={<Calendar size={24} color="#0EA5E9" />}
            title="Attendance"
            subtitle="Check-in/Out"
          />

          <ActionCard
            icon={<ClipboardList size={24} color="#0EA5E9" />}
            title="Task Feed"
            subtitle="History"
            onPress={() => router.push('/(tabs)/supervisor/tasks-summary')}
          />

          <ActionCard
            icon={<AlertCircle size={24} color="#0EA5E9" />}
            title="Support"
            subtitle="Get Help"
          />
        </View>
      </ScrollView>
    </View>
  );
}
