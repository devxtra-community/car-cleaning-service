import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Alert,
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
  CalendarCheck,
  Banknote,
  FileWarning,
  Phone,
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import * as Location from 'expo-location';
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
  wash_time?: number;
  created_at?: string;
};

interface WorkerInfo {
  worker_name: string;
  supervisor_name: string | null;
  building_name: string | null;
}

const QuickAction = ({
  icon,
  title,
  onPress,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  onPress?: () => void;
  color?: string;
}) => {
  const { colors } = useTheme();
  const iconColor = color || colors.primary;

  return (
    <Pressable
      onPress={onPress}
      className="p-3 rounded-[28px] items-center justify-center gap-1.5 shadow-sm min-h-[90px] w-[31%] mb-2.5"
      style={{
        backgroundColor: colors.cardBackground,
        borderColor: colors.border,
        borderWidth: 1,
      }}
    >
      <View
        className="w-9 h-9 rounded-full items-center justify-center"
        style={{ backgroundColor: `${iconColor}10` }}
      >
        {React.cloneElement(icon as React.ReactElement<{ color: string; size: number }>, {
          color: iconColor,
          size: 20,
        })}
      </View>
      <Text
        className="font-bold text-center text-[11px] tracking-tight"
        style={{ color: colors.textSecondary }}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const JobDetailRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) => {
  const { colors } = useTheme();

  return (
    <View
      className="flex-row items-center justify-between py-2"
      style={{ borderBottomColor: colors.borderLight, borderBottomWidth: 1 }}
    >
      <View className="flex-row items-center gap-2">
        <View
          className="w-7 h-7 rounded-full items-center justify-center"
          style={{ backgroundColor: `${colors.primary}15` }}
        >
          {React.cloneElement(icon as React.ReactElement<{ color: string; size: number }>, {
            color: colors.primary,
            size: 14,
          })}
        </View>
        <Text
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: colors.textSecondary }}
        >
          {label}
        </Text>
      </View>
      <Text className="font-extrabold text-[12px]" style={{ color: colors.text }} numberOfLines={1}>
        {value || 'N/A'}
      </Text>
    </View>
  );
};

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [worker, setWorker] = useState({ name: '', jobsDone: 0, totalRevenue: 0 });
  const [supervisor, setSupervisor] = useState({ name: '', location: '', jobsDoneToday: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [workerInfo, setWorkerInfo] = useState<WorkerInfo | null>(null);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/workers/dashboard?range=day'); // Explicitly request day range
      if (res.data) {
        setWorker({
          name: res.data.name,
          jobsDone: res.data.period?.jobs || 0, // Changed to period jobs (Daily)
          totalRevenue: res.data.period?.revenue || 0, // Changed to period revenue (Daily)
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

  const checkAttendanceStatus = async () => {
    try {
      console.log('🔍 Checking attendance status...');
      const res = await api.get('/attendance/status');
      console.log('✅ Attendance status response:', res.data);

      if (res.data && res.data.success) {
        console.log('📌 Attendance marked:', res.data.marked);

        if (!res.data.marked) {
          console.log('📞 Fetching worker info...');
          // Load worker info for the modal
          const infoRes = await api.get('/attendance/worker-info');
          console.log('✅ Worker info response:', infoRes.data);

          if (infoRes.data && infoRes.data.success) {
            setWorkerInfo(infoRes.data.data);
            console.log('🎯 Showing attendance modal!');
            setShowAttendanceModal(true);
          } else {
            console.log('❌ Worker info fetch failed or no data');
          }
        }
      }
    } catch (e) {
      // Silently handle 401 (not authenticated)
      // Don't show attendance modal if there's an auth issue
      if ((e as any).response?.status === 401) {
        console.log('Not authenticated for attendance check');
      } else {
        console.error('Attendance check error:', e);
      }
    }
  };

  const markAttendance = async () => {
    try {
      setIsMarkingAttendance(true);

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to mark attendance');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});

      // Mark attendance
      const res = await api.post('/attendance/mark', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (res.data && res.data.success) {
        Alert.alert('Success', 'Attendance marked successfully!');
        setShowAttendanceModal(false);
      }
    } catch (error) {
      console.error('Mark attendance error:', error);
      const message = (error as any).response?.data?.message || 'Failed to mark attendance';
      Alert.alert('Error', message);
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
      loadJob();
      checkAttendanceStatus();
    }, [])
  );

  // Countdown timer effect
  React.useEffect(() => {
    if (!activeJob?.wash_time || !activeJob?.created_at) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const createdAt = new Date(activeJob.created_at!).getTime();
      const washTimeMs = activeJob.wash_time! * 60 * 1000; // Convert minutes to milliseconds
      const endTime = createdAt + washTimeMs;
      const now = Date.now();
      const remaining = endTime - now;

      if (remaining <= 0) {
        setTimeRemaining(0);
      } else {
        setTimeRemaining(Math.floor(remaining / 1000)); // In seconds
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeJob]);

  const formatTime = (seconds: number | null): string => {
    if (seconds === null || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadJob(), loadDashboard()]);
    setRefreshing(false);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* HEADER SECTION */}
        <View
          className="rounded-b-[40px] shadow-sm pb-8"
          style={{
            paddingTop: insets.top + 10,
            backgroundColor: colors.cardBackground,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
          }}
        >
          <View className="px-6 flex-row justify-between items-center mb-5">
            <View>
              <Text
                className="text-[10px] font-black uppercase tracking-[2.5px] mb-0.5"
                style={{ color: colors.textSecondary }}
              >
                Field Associate
              </Text>
              <Text
                className="text-3xl font-black tracking-tighter"
                style={{ color: colors.primary }}
              >
                Hi, {worker.name.split(' ')[0] || 'Worker'}
              </Text>
            </View>
            <View
              className="w-12 h-12 rounded-2xl items-center justify-center"
              style={{
                backgroundColor: colors.primaryLight,
                borderColor: colors.border,
                borderWidth: 1,
              }}
            >
              <User size={22} color={colors.primary} />
            </View>
          </View>

          {/* STATS MINI CARDS */}
          <View className="px-6 flex-row gap-4">
            <View
              className="flex-1 p-5 rounded-[28px] shadow-md"
              style={{
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOpacity: 0.3,
              }}
            >
              <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center mb-3">
                <ClipboardCheck size={16} color="white" />
              </View>
              <Text className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-0.5">
                Daily Tasks
              </Text>
              <Text className="text-white text-2xl font-black">{worker.jobsDone}</Text>
            </View>

            <View
              className="flex-1 p-5 rounded-[28px] shadow-sm"
              style={{
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                borderWidth: 1,
              }}
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <Wallet size={16} color={colors.primary} />
              </View>
              <Text
                className="text-[10px] font-black uppercase tracking-widest mb-0.5"
                style={{ color: colors.textSecondary }}
              >
                Daily Earnings
              </Text>
              <Text className="text-2xl font-black" style={{ color: colors.primary }}>
                ₹{worker.totalRevenue}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 -mt-5">
          {/* ACTIVE JOB SECTION */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2 px-1">
              <Text
                className="font-black text-[11px] uppercase tracking-[2px] mt-10"
                style={{ color: colors.textSecondary }}
              >
                Active Assignment
              </Text>
              {activeJob && (
                <View
                  className="px-3 py-1 rounded-full border"
                  style={{ backgroundColor: colors.primaryLight, borderColor: colors.primary }}
                >
                  <Text
                    className="font-black text-[10px] uppercase tracking-tighter"
                    style={{ color: colors.primary }}
                  >
                    In Progress
                  </Text>
                </View>
              )}
            </View>

            {activeJob ? (
              <View
                className="rounded-[32px] overflow-hidden shadow-sm border"
                style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
              >
                <View className="h-44 relative" style={{ backgroundColor: colors.background }}>
                  {activeJob.car_image_url ? (
                    <Image source={{ uri: activeJob.car_image_url }} className="w-full h-full" />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Car size={48} color={colors.primary} strokeWidth={1} />
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    className="absolute bottom-0 w-full p-5 pt-12"
                  >
                    <View className="flex-row justify-between items-end">
                      <View>
                        <Text className="text-white font-black text-2xl tracking-tighter">
                          {activeJob.car_number}
                        </Text>
                        <Text className="text-white/90 text-[11px] uppercase font-bold tracking-widest">
                          {activeJob.car_type} • {activeJob.car_model}
                        </Text>
                      </View>
                      <View className="bg-white/20 px-3 py-1.5 rounded-xl border border-white/30 backdrop-blur-md">
                        <Text className="text-white font-black text-[10px] uppercase">Active</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                <View className="p-5">
                  {/* Vehicle Number & Timer Header */}
                  <View
                    className="flex-row items-center justify-between mb-4 pb-4 border-b"
                    style={{ borderBottomColor: colors.border }}
                  >
                    <View>
                      <Text
                        className="text-[9px] font-bold uppercase tracking-widest mb-1"
                        style={{ color: colors.textSecondary }}
                      >
                        Vehicle No.
                      </Text>
                      <Text className="font-black text-xl" style={{ color: colors.text }}>
                        {activeJob.car_number}
                      </Text>
                    </View>
                    <View
                      className="px-5 py-3 rounded-xl border"
                      style={{
                        backgroundColor:
                          timeRemaining !== null && timeRemaining < 300
                            ? colors.dangerLight
                            : colors.primaryLight,
                        borderColor:
                          timeRemaining !== null && timeRemaining < 300
                            ? colors.danger
                            : colors.primary,
                      }}
                    >
                      <Text
                        className="text-[9px] font-bold uppercase tracking-widest text-center mb-0.5"
                        style={{ color: colors.textSecondary }}
                      >
                        Time Left
                      </Text>
                      <Text
                        className="font-black text-2xl text-center"
                        style={{
                          color:
                            timeRemaining !== null && timeRemaining < 300
                              ? colors.danger
                              : colors.primary,
                        }}
                      >
                        {formatTime(timeRemaining)}
                      </Text>
                    </View>
                  </View>

                  {/* Job Details - Crystal Clear Layout */}
                  <View className="gap-3">
                    <JobDetailRow
                      icon={<User size={14} color={colors.primary} />}
                      label="Customer"
                      value={activeJob.owner_name}
                    />
                    <JobDetailRow
                      icon={<Phone size={14} color={colors.success} />}
                      label="Phone"
                      value={activeJob.owner_phone}
                    />
                    <JobDetailRow
                      icon={<Car size={14} color={colors.info} />}
                      label="Model"
                      value={`${activeJob.car_color} ${activeJob.car_model}`}
                    />
                    <JobDetailRow
                      icon={<Car size={14} color={colors.warning} />}
                      label="Type"
                      value={activeJob.car_type}
                    />
                  </View>

                  {/* Complete Button */}
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/AfterWash',
                        params: { jobId: activeJob.id, carType: activeJob.car_type },
                      })
                    }
                    className="mt-6 py-4 rounded-2xl"
                    style={{
                      backgroundColor: colors.primary,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text className="text-white text-center font-black text-[12px] uppercase tracking-widest">
                      Complete Wash
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View
                className="rounded-[32px] p-8 items-center border shadow-sm"
                style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
              >
                <View
                  className="w-14 h-14 rounded-[24px] items-center justify-center mb-4"
                  style={{ backgroundColor: colors.primaryLight }}
                >
                  <Plus size={28} color={colors.primary} />
                </View>
                <Text className="font-extrabold text-base" style={{ color: colors.text }}>
                  No Active Jobs
                </Text>
                <Text
                  className="text-center text-[11px] font-bold mt-1 mb-6 uppercase tracking-wide"
                  style={{ color: colors.textSecondary }}
                >
                  Create a new job entry below
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/AddJob')}
                  className="px-10 py-4 rounded-full shadow-md"
                  style={{
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.2,
                  }}
                >
                  <Text className="text-white font-black text-[12px] uppercase tracking-widest">
                    {' '}
                    + New job{' '}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* SUPERVISOR & TEAM OVERVIEW */}
          <View className="mb-6">
            <Text
              className="font-black text-[11px] uppercase tracking-[2px] mb-2 px-1"
              style={{ color: colors.textSecondary }}
            >
              Team Overview
            </Text>

            <View
              className="rounded-[28px] p-5 shadow-sm border"
              style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center border"
                    style={{
                      backgroundColor: colors.primaryLight,
                      borderColor: `${colors.primary}30`,
                    }}
                  >
                    <User size={24} color={colors.primary} />
                  </View>

                  <View>
                    <Text
                      className="text-[10px] font-bold uppercase tracking-[1.5px] mb-0.5"
                      style={{ color: colors.textSecondary }}
                    >
                      Supervisor
                    </Text>
                    <Text
                      className="font-extrabold text-base tracking-tight"
                      style={{ color: colors.text }}
                    >
                      {supervisor.name}
                    </Text>
                  </View>
                </View>

                <View
                  className="px-4 py-3 rounded-xl items-center border"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    borderColor: `${colors.primary}20`,
                  }}
                >
                  <Text
                    className="font-black text-xl leading-none"
                    style={{ color: colors.primary }}
                  >
                    {supervisor.jobsDoneToday}
                  </Text>
                  <Text
                    className="text-[8px] font-black uppercase mt-0.5 tracking-tighter"
                    style={{ color: colors.textSecondary }}
                  >
                    Team Jobs
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2 mt-4 px-1">
                <MapPin size={12} color={colors.info} />
                <Text
                  className="text-[10px] font-bold uppercase tracking-tight"
                  style={{ color: colors.textSecondary }}
                >
                  Hub: {supervisor.location}
                </Text>
              </View>
            </View>
          </View>

          {/* QUICK ACTIONS GRID */}
          <View className="mb-24">
            <Text
              className="font-black text-[11px] uppercase tracking-[2px] mb-2 px-1"
              style={{ color: colors.textSecondary }}
            >
              Quick Actions
            </Text>
            <View className="flex-row flex-wrap justify-between">
              <QuickAction
                icon={<Wallet />}
                title="MY WALLET"
                color={colors.success}
                onPress={() => router.push('/(tabs)/Wallet')}
              />
              <QuickAction
                icon={<Banknote />}
                title="SALARY"
                color={colors.warning}
                onPress={() => {}}
              />
              <QuickAction
                icon={<Clock />}
                title="JOB LOGS"
                color={colors.primary}
                onPress={() => router.push('/(tabs)/JobLogs')}
              />
              <QuickAction
                icon={<CalendarCheck />}
                title="ATTENDANCE"
                color={colors.warning}
                onPress={() => router.push('/(tabs)/Attendance')}
              />
              <QuickAction
                icon={<AlertTriangle />}
                title="GET HELP"
                color={colors.danger}
                onPress={() => {}}
              />
              <QuickAction
                icon={<FileWarning />}
                title="PENALTIES"
                color={colors.danger}
                onPress={() => router.push('/(tabs)/Penalties')}
              />
            </View>
          </View>
        </View>

        {/* CUSTOM MODAL */}
        <Modal transparent visible={showAlert} animationType="fade">
          <View
            className="flex-1 justify-center items-center p-6"
            style={{ backgroundColor: colors.overlay }}
          >
            <View
              className="w-full rounded-[32px] p-7 items-center shadow-xl border"
              style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
            >
              <View
                className="w-16 h-16 rounded-[24px] items-center justify-center mb-5"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <ClipboardCheck size={32} color={colors.primary} />
              </View>

              <Text
                className="text-2xl font-black tracking-tight text-center"
                style={{ color: colors.text }}
              >
                Finish Current Job?
              </Text>
              <Text
                className="text-center mt-2 mb-7 text-[13px] px-2 font-bold leading-5 uppercase tracking-wide"
                style={{ color: colors.textSecondary }}
              >
                Great job! Proceed to record final payment details.
              </Text>

              <View className="flex-row gap-3 w-full">
                <Pressable
                  onPress={() => setShowAlert(false)}
                  className="flex-1 py-4 rounded-[20px] items-center border"
                  style={{ backgroundColor: colors.background, borderColor: colors.border }}
                >
                  <Text
                    className="font-black uppercase text-[11px] tracking-widest"
                    style={{ color: colors.textSecondary }}
                  >
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
                  className="flex-1 py-4 rounded-[20px] items-center shadow-md"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="font-black text-white uppercase text-[11px] tracking-widest">
                    Complete
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Attendance Modal */}
      <Modal visible={showAttendanceModal} animationType="slide" transparent>
        <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
          <View
            className="rounded-t-3xl p-6"
            style={{
              backgroundColor: colors.cardBackground,
              paddingBottom: insets.bottom + 20,
            }}
          >
            <Text className="font-bold text-lg mb-4 text-center" style={{ color: colors.text }}>
              Mark Today's Attendance
            </Text>

            {workerInfo && (
              <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: colors.background }}>
                <View className="mb-3">
                  <Text
                    className="text-[11px] font-bold uppercase mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    Worker
                  </Text>
                  <Text className="font-bold text-base" style={{ color: colors.text }}>
                    {workerInfo.worker_name}
                  </Text>
                </View>
                <View className="mb-3">
                  <Text
                    className="text-[11px] font-bold uppercase mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    Supervisor
                  </Text>
                  <Text className="font-bold text-base" style={{ color: colors.text }}>
                    {workerInfo.supervisor_name || 'Not assigned'}
                  </Text>
                </View>
                <View>
                  <Text
                    className="text-[11px] font-bold uppercase mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    Building
                  </Text>
                  <Text className="font-bold text-base" style={{ color: colors.text }}>
                    {workerInfo.building_name || 'Not assigned'}
                  </Text>
                </View>
              </View>
            )}

            <Text className="text-[12px] text-center mb-6" style={{ color: colors.textSecondary }}>
              Your location will be verified (must be within 100m of building)
            </Text>

            <View className="flex-row gap-4">
              <Pressable
                onPress={() => setShowAttendanceModal(false)}
                className="flex-1 py-4 rounded-xl"
                style={{ backgroundColor: colors.borderLight }}
                disabled={isMarkingAttendance}
              >
                <Text className="font-bold text-base text-center" style={{ color: colors.text }}>
                  Later
                </Text>
              </Pressable>
              <Pressable
                onPress={markAttendance}
                className="flex-1 py-4 rounded-xl"
                style={{ backgroundColor: colors.success }}
                disabled={isMarkingAttendance}
              >
                {isMarkingAttendance ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-bold text-base text-center">
                    Mark Attendance
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
