import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  Wallet,
  ClipboardCheck,
  AlertTriangle,
  MapPin,
  User,
  Clock,
  Car,
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../src/api/api';

// const { width } = Dimensions.get('window');

type Job = {
  id: string;
  owner_name: string;
  owner_phone: string;
  car_number: string;
  car_model: string;
  car_color: string;
  car_type: string;
  car_image_url?: string | null;
  building_name?: string;
  floor_number?: string;
};

const QuickAction = ({
  icon,
  title,
  onPress,
  color = '#1B86C6',
}: {
  icon: React.ReactNode;
  title: string;
  onPress?: () => void;
  color?: string;
}) => (
  <Pressable
    onPress={onPress}
    className="flex-1 bg-white p-4 rounded-3xl items-center justify-center gap-2 shadow-sm min-h-[100px]"
  >
    <View
      className="w-10 h-10 rounded-full items-center justify-center"
      style={{ backgroundColor: `${color}1A` }}
    >
      {icon}
    </View>
    <Text className="font-semibold text-gray-700 text-center text-[10px]">{title}</Text>
  </Pressable>
);

const JobDetailRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) => (
  <View className="flex-row items-center justify-between py-2 border-b border-gray-50">
    <View className="flex-row items-center gap-2">
      <View className="w-7 h-7 rounded-full bg-gray-50 items-center justify-center">{icon}</View>
      <Text className="text-gray-400 text-[10px] font-medium">{label}</Text>
    </View>
    <Text className="font-bold text-gray-800 text-xs" numberOfLines={1}>
      {value || 'N/A'}
    </Text>
  </View>
);

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [worker, setWorker] = useState({ name: '', jobsDone: 0, totalRevenue: 0 });
  const [supervisor, setSupervisor] = useState({ name: '', location: '', jobsDoneToday: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/workers/dashboard');
      if (res.data) {
        setWorker({
          name: res.data.name,
          jobsDone: res.data.jobsDone || 0,
          totalRevenue: res.data.totalRevenue || 0,
        });
        setSupervisor({
          name: res.data.supervisor?.name || 'Not assigned',
          location: res.data.supervisor?.location || 'N/A',
          jobsDoneToday: res.data.period?.jobs || 0,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadJob = async () => {
    try {
      const res = await api.get(`/tasks/my?_t=${Date.now()}`);
      setActiveJob(res.data?.[0] || null);
    } catch (e) {
      console.error(e);
      setActiveJob(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadJob(), loadDashboard()]);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadJob(), loadDashboard()]);
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-[#F5F7FA]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B86C6" />
        }
      >
        {/* HEADER SECTION */}
        <View
          className="bg-white rounded-b-[48px] shadow-sm pb-10"
          style={{ paddingTop: insets.top + 10 }}
        >
          <View className="px-6 flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-[2px] mb-1">
                Field Associate
              </Text>
              <Text className="text-[#1B86C6] text-3xl font-black tracking-tighter">
                Hi, {worker.name.split(' ')[0] || 'Worker'}
              </Text>
            </View>
            <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center border border-blue-100/50">
              <User size={22} color="#1B86C6" />
            </View>
          </View>

          {/* STATS MINI CARDS */}
          <View className="px-6 flex-row gap-4">
            <LinearGradient
              colors={['#1B86C6', '#0ea5e9']}
              className="flex-1 p-5 rounded-[32px] shadow-lg shadow-blue-500/20"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center mb-3">
                <ClipboardCheck size={16} color="white" />
              </View>
              <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                Lifetime Jobs
              </Text>
              <Text className="text-white text-2xl font-black">{worker.jobsDone}</Text>
            </LinearGradient>

            <LinearGradient
              colors={['#a7adabff', '#96a19dff']}
              className="flex-1 p-5 rounded-[32px] shadow-lg shadow-green-500/20"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center mb-3">
                <Wallet size={16} color="white" />
              </View>
              <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                Lifetime Earnings
              </Text>
              <Text className="text-white text-2xl font-black">₹{worker.totalRevenue}</Text>
            </LinearGradient>
          </View>
        </View>

        <View className="px-6 -mt-6">
          {/* ACTIVE JOB SECTION */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-3 px-2">
              <Text className="text-gray-800 font-black text-sm uppercase tracking-widest">
                Active Assignment
              </Text>
              {activeJob && (
                <View className="bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
                  <Text className="text-yellow-600 font-bold text-[9px] uppercase">
                    In Progress
                  </Text>
                </View>
              )}
            </View>

            {activeJob ? (
              <View className="bg-white rounded-[40px] overflow-hidden shadow-2xl shadow-blue-500/10 border border-white">
                <View className="h-48 bg-gray-100 relative">
                  {activeJob.car_image_url ? (
                    <Image source={{ uri: activeJob.car_image_url }} className="w-full h-full" />
                  ) : (
                    <View className="w-full h-full items-center justify-center bg-blue-50">
                      <Car size={48} color="#1B86C6" strokeWidth={1} />
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    className="absolute bottom-0 w-full p-6 pt-12"
                  >
                    <View className="flex-row justify-between items-end">
                      <View>
                        <Text className="text-white font-black text-2xl tracking-tighter">
                          {activeJob.car_number}
                        </Text>
                        <Text className="text-white/80 text-[10px] uppercase font-bold tracking-widest">
                          {activeJob.car_type} • {activeJob.car_model}
                        </Text>
                      </View>
                      <View className="bg-[#1B86C6] px-3 py-1.5 rounded-xl border border-white/20">
                        <Text className="text-white font-black text-[10px]">Active</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                <View className="p-6">
                  <JobDetailRow
                    icon={<User size={12} color="#1B86C6" />}
                    label="Customer"
                    value={activeJob.owner_name}
                  />
                  <JobDetailRow
                    icon={<MapPin size={12} color="#1B86C6" />}
                    label="Service Spot"
                    value={`${activeJob.building_name || ''} ${activeJob.floor_number || ''}`}
                  />
                  <JobDetailRow
                    icon={<Clock size={12} color="#1B86C6" />}
                    label="Started"
                    value="Just Now"
                  />

                  <Pressable
                    onPress={() => setShowAlert(true)}
                    className="bg-[#1B86C6] mt-6 py-5 rounded-[24px] items-center shadow-lg shadow-blue-500/30"
                  >
                    <Text className="text-white font-black tracking-widest uppercase text-xs">
                      Mark as Completed
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="bg-white rounded-[40px] p-8 items-center border-2 border-gray-100 shadow-sm">
                <View className="w-16 h-16 bg-blue-50 rounded-3xl items-center justify-center mb-4">
                  <Plus size={32} color="#1B86C6" />
                </View>
                <Text className="text-gray-900 font-black text-lg">No Active Jobs</Text>
                <Text className="text-gray-400 text-center text-xs mt-1 mb-6">
                  Ready to start? Create a new job entry below.
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/AddJob')}
                  className="bg-[#1B86C6] px-10 py-4 rounded-2xl shadow-lg shadow-blue-500/20"
                >
                  <Text className="text-white font-black text-sm"> + Add New job </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* SUPERVISOR & TEAM OVERVIEW */}
          <View className="mb-8">
            <Text className="text-gray-800 font-black text-sm uppercase tracking-widest mb-3 px-2">
              Team Overview
            </Text>

            <View className="bg-white rounded-[32px] p-6 shadow-xl shadow-black/5">
              {/* Header */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                  <View className="w-12 h-12 rounded-2xl bg-blue-50 items-center justify-center border border-blue-100">
                    <User size={24} color="#1B86C6" />
                  </View>

                  <View>
                    <Text className="text-gray-400 text-[9px] font-bold uppercase tracking-[2px] mb-0.5">
                      Supervisor
                    </Text>
                    <Text className="text-gray-900 font-black text-base">{supervisor.name}</Text>
                  </View>
                </View>

                <View className="bg-blue-50 px-4 py-3 rounded-2xl items-center border border-blue-100">
                  <Text className="text-blue-600 font-black text-xl leading-none">
                    {supervisor.jobsDoneToday}
                  </Text>
                  <Text className="text-gray-400 text-[7px] font-black uppercase mt-1">
                    Team Jobs
                  </Text>
                </View>
              </View>

              {/* Location */}
              <View className="flex-row items-center gap-2 mt-4 ml-1">
                <MapPin size={10} color="#10b981" />
                <Text className="text-gray-500 text-[10px] font-bold">
                  Managing: {supervisor.location}
                </Text>
              </View>
            </View>
          </View>

          {/* QUICK ACTIONS GRID */}
          <View className="mb-32">
            <Text className="text-gray-800 font-black text-sm uppercase tracking-widest mb-3 px-2">
              Quick Actions
            </Text>
            <View className="flex-row gap-4">
              <QuickAction
                icon={<Wallet size={20} color="#1B86C6" />}
                title="Wallet"
                onPress={() => {}}
              />
              <QuickAction
                icon={<Clock size={20} color="#10b981" />}
                title="Log"
                color="#10b981"
                onPress={() => router.push('/(tabs)/Analytics')}
              />
              <QuickAction
                icon={<AlertTriangle size={20} color="#ef4444" />}
                title="Help"
                color="#ef4444"
              />
            </View>
          </View>
        </View>

        {/* CUSTOM MODAL */}
        <Modal transparent visible={showAlert} animationType="fade">
          <View className="flex-1 bg-black/70 justify-center items-center p-6">
            <View className="w-full bg-white rounded-[48px] p-8 items-center shadow-2xl relative overflow-hidden">
              {/* Background Accent */}
              <View className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />

              <View className="w-20 h-20 bg-blue-50 rounded-[32px] items-center justify-center mb-6">
                <ClipboardCheck size={36} color="#1B86C6" />
              </View>

              <Text className="text-2xl font-black text-gray-900 tracking-tight text-center">
                Finish Current Job?
              </Text>
              <Text className="text-gray-500 text-center mt-3 mb-8 text-sm px-4 leading-5">
                Great job! Are you ready to confirm completion and record payment details?
              </Text>

              <View className="flex-row gap-4 w-full">
                <Pressable
                  onPress={() => setShowAlert(false)}
                  className="flex-1 py-5 bg-gray-100 rounded-[24px] items-center"
                >
                  <Text className="font-black text-gray-500 uppercase text-[10px] tracking-widest">
                    Go Back
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowAlert(false);
                    router.push({
                      pathname: '/(tabs)/AfterWash',
                      params: { jobId: activeJob?.id, carType: activeJob?.car_type },
                    });
                  }}
                  className="flex-1 py-5 bg-[#1B86C6] rounded-[24px] items-center shadow-lg shadow-blue-500/20"
                >
                  <Text className="font-black text-white uppercase text-[10px] tracking-widest">
                    Complete
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}
