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
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient as _LinearGradient } from 'expo-linear-gradient';
const LinearGradient = _LinearGradient as any;
import { BlurView } from 'expo-blur';
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
  Star,
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import * as Location from 'expo-location';
import api from '../../src/api/api';

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
  // Simplified color logic for glass/clay look
  const iconColor = color || '#0EA5E9'; // Sky blue default

  return (
    <Pressable
      onPress={onPress}
      className="clay-button w-[31%] mb-4 p-3 items-center justify-center min-h-[100px] bg-white"
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mb-2 shadow-sm"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        {React.cloneElement(icon as React.ReactElement<{ color: string; size: number }>, {
          color: iconColor,
          size: 22,
        })}
      </View>
      <Text className="font-label text-center text-[10px] tracking-wide text-clay-secondary">
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
  return (
    <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
      <View className="flex-row items-center gap-2">
        <View className="w-6 h-6 rounded-full items-center justify-center bg-clay-background">
          {React.cloneElement(icon as React.ReactElement<{ color: string; size: number }>, {
            color: '#64748B',
            size: 14,
          })}
        </View>
        <Text className="font-label text-[11px] uppercase tracking-wider text-clay-secondary">
          {label}
        </Text>
      </View>
      <Text className="font-heading text-[13px] text-clay-text" numberOfLines={1}>
        {value || 'N/A'}
      </Text>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [worker, setWorker] = useState({ name: '', jobsDone: 0, totalRevenue: 0 });
  const [supervisor, setSupervisor] = useState({
    name: '',
    location: '',
    jobsDoneToday: 0,
    phone: '',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [workerInfo, setWorkerInfo] = useState<WorkerInfo | null>(null);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/workers/dashboard?range=day');
      if (res.data) {
        setWorker({
          name: res.data.name,
          jobsDone: res.data.period?.jobs || 0,
          totalRevenue: res.data.period?.revenue || 0,
        });
        setSupervisor({
          name: res.data.supervisor?.name || t('profile.not_assigned'),
          location: res.data.supervisor?.location || 'N/A',
          jobsDoneToday: res.data.period?.jobs || 0,
          phone: res.data.supervisor?.phone || '',
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
      const res = await api.get('/attendance/status');
      if (res.data && res.data.success && !res.data.marked) {
        const infoRes = await api.get('/attendance/worker-info');
        if (infoRes.data && infoRes.data.success) {
          setWorkerInfo(infoRes.data.data);
          setShowAttendanceModal(true);
        }
      }
    } catch (e: unknown) {
      const error = e as { response?: { status?: number } };
      if (error.response?.status === 401) {
        console.log('Not authenticated for attendance check');
      } else {
        console.error('Attendance check error:', e);
      }
    }
  };

  const markAttendance = async () => {
    try {
      setIsMarkingAttendance(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const res = await api.post('/attendance/mark', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (res.data && res.data.success) {
        Alert.alert(t('common.success'), t('attendance.success_mark'));
        setShowAttendanceModal(false);
      }
    } catch (error: unknown) {
      console.error('Mark attendance error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || t('attendance.failed_mark');
      Alert.alert(t('common.error'), message);
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

  React.useEffect(() => {
    if (!activeJob?.wash_time || !activeJob?.created_at) {
      setTimeRemaining(null);
      return;
    }
    const updateTimer = () => {
      // Ensure the timestamp parses successfully on iOS/Safari by cleaning it up if needed.
      const dateString = activeJob.created_at!.replace(' ', 'T');
      const createdAt = new Date(dateString).getTime();

      // wash_time is in minutes
      const washTimeMs = activeJob.wash_time! * 60 * 1000;
      const endTime = createdAt + washTimeMs;
      const now = Date.now();
      const remaining = endTime - now;

      // Stop at 0 instead of going negative
      if (Number.isNaN(remaining) || remaining <= 0) {
        setTimeRemaining(0);
      } else {
        setTimeRemaining(Math.floor(remaining / 1000));
      }
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeJob]);

  const formatTime = (seconds: number | null): string => {
    if (seconds === null || Number.isNaN(seconds) || seconds <= 0) return '00:00';

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
    <View className="flex-1 bg-[#E0F2FE]">
      {/* Background Gradient for overall soft feel */}
      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HEADER SECTION WITH GLASS EFFECT */}
        <BlurView
          intensity={20}
          tint="light"
          style={{
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
            overflow: 'hidden',
            paddingTop: insets.top + 10,
            paddingBottom: 30,
          }}
        >
          <View className="px-6 flex-row justify-between items-center mb-6">
            <View>
              <Text className="font-label uppercase tracking-[2.5px] text-clay-secondary mb-1">
                {t('home.fieldAssociate', 'Field Associate')}
              </Text>
              <Text className="text-3xl font-heading tracking-tight text-clay-text">
                {t('home.greeting')} {worker.name.split(' ')[0] || t('home.worker', 'Worker')}
              </Text>
            </View>
            <View className="w-12 h-12 rounded-2xl items-center justify-center bg-white border border-white shadow-sm">
              <User size={22} color="#0EA5E9" />
            </View>
          </View>

          {/* STATS CLAY CARDS */}
          <View className="px-6 flex-row gap-4">
            {/* Jobs Done Card */}
            <View className="flex-1 clay-card p-5 bg-[#0EA5E9]">
              <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center mb-3">
                <ClipboardCheck size={16} color="white" />
              </View>
              <Text className="text-white/80 font-label uppercase tracking-widest mb-1">
                {t('home.dailyTasks')}
              </Text>
              <Text className="text-white text-3xl font-heading">{worker.jobsDone}</Text>
            </View>

            {/* Revenue Card */}
            <View className="flex-1 clay-card p-5 bg-white">
              <View className="w-8 h-8 rounded-full items-center justify-center mb-3 bg-[#E0F2FE]">
                <Wallet size={16} color="#0EA5E9" />
              </View>
              <Text className="font-label uppercase tracking-widest mb-1 text-clay-secondary">
                {t('home.dailyEarnings')}
              </Text>
              <Text className="text-3xl font-heading text-[#0EA5E9]">₹{worker.totalRevenue}</Text>
            </View>
          </View>
        </BlurView>

        <View className="px-6 -mt-4">
          {/* ACTIVE JOB SECTION */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-3 px-1">
              <Text className="font-label uppercase tracking-[2px] text-clay-secondary">
                {t('home.activeAssignment')}
              </Text>
              {activeJob && (
                <View className="px-3 py-1 rounded-full bg-[#E0F2FE] border border-[#0EA5E9]/20">
                  <Text className="font-label uppercase text-[#0EA5E9] text-[10px] tracking-wide">
                    {t('home.inProgress', 'In Progress')}
                  </Text>
                </View>
              )}
            </View>

            {activeJob ? (
              <View className="clay-card overflow-hidden">
                <View className="h-48 relative bg-gray-100">
                  {activeJob.car_image_url ? (
                    <Image source={{ uri: activeJob.car_image_url }} className="w-full h-full" />
                  ) : (
                    <View className="w-full h-full items-center justify-center bg-clay-background">
                      <Car size={56} color="#94A3B8" strokeWidth={1.5} />
                    </View>
                  )}
                  {/* Glass overlay for title */}
                  <BlurView
                    intensity={40}
                    tint="dark"
                    style={{
                      position: 'absolute',
                      bottom: 16,
                      left: 16,
                      right: 16,
                      borderRadius: 16,
                      overflow: 'hidden',
                      padding: 16,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View>
                      <Text className="text-white font-heading text-xl tracking-tight">
                        {activeJob.car_number}
                      </Text>
                      <Text className="text-white/80 font-label text-[11px] uppercase tracking-wider">
                        {activeJob.car_type} • {activeJob.car_model}
                      </Text>
                    </View>
                    <View className="bg-white/20 px-3 py-1 rounded-lg">
                      <Text className="text-white font-bold text-[10px] uppercase">Active</Text>
                    </View>
                  </BlurView>
                </View>

                <View className="p-6">
                  {/* Timer Section */}
                  <View className="flex-row items-center justify-between mb-6">
                    <View>
                      <Text className="font-label text-[10px] uppercase tracking-widest mb-1">
                        Time Remaining
                      </Text>
                      <Text
                        className="font-heading text-3xl"
                        style={{
                          color:
                            timeRemaining !== null && timeRemaining > 300
                              ? '#10B981' // Green if > 5 mins
                              : '#EF4444', // Red if <= 5 mins
                        }}
                      >
                        {formatTime(timeRemaining)}
                      </Text>
                    </View>
                    <View className="w-12 h-12 rounded-full items-center justify-center bg-clay-background border border-white">
                      <Clock size={20} color="#64748B" />
                    </View>
                  </View>

                  {/* Job Details */}
                  <View className="gap-3 mb-6">
                    <JobDetailRow
                      icon={<User size={14} color="#0EA5E9" />}
                      label="Customer"
                      value={activeJob.owner_name}
                    />
                    <JobDetailRow
                      icon={<Phone size={14} color="#10B981" />}
                      label="Phone"
                      value={activeJob.owner_phone}
                    />
                    <JobDetailRow
                      icon={<Car size={14} color="#F59E0B" />}
                      label="Details"
                      value={`${activeJob.car_color} ${activeJob.car_model}`}
                    />
                  </View>

                  {/* Complete Button */}
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/AfterWash',
                        params: { jobId: activeJob.id, carType: activeJob.car_type },
                      })
                    }
                    className="clay-button bg-[#0EA5E9] py-4 items-center justify-center"
                  >
                    <Text className="text-white font-heading text-sm uppercase tracking-widest">
                      Complete Wash
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="clay-card p-8 items-center justify-center">
                <View className="w-16 h-16 rounded-3xl items-center justify-center bg-[#E0F2FE] mb-4 shadow-inner">
                  <Plus size={32} color="#0EA5E9" />
                </View>
                <Text className="font-heading text-lg text-clay-text mb-2">
                  {t('home.noActiveJobs')}
                </Text>
                <Text className="text-center font-label text-xs max-w-[200px] leading-5 mb-6">
                  {t('home.readyToWork')}
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/AddJob')}
                  className="clay-button bg-[#0EA5E9] px-8 py-3 w-full"
                >
                  <Text className="text-white font-heading text-xs uppercase tracking-widest text-center">
                    + {t('home.startNewJob')}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* SUPERVISOR & TEAM OVERVIEW */}
          <View className="mb-8">
            <Text className="font-label text-[11px] uppercase tracking-[2px] mb-3 px-1">
              Team Overview
            </Text>

            <View className="clay-card p-5 flex-row items-center justify-between">
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-2xl items-center justify-center bg-[#E0F2FE] border border-white">
                  <User size={24} color="#0EA5E9" />
                </View>
                <View>
                  <Text className="font-label text-[10px] uppercase tracking-[1.5px] mb-0.5">
                    Supervisor
                  </Text>
                  <Text className="font-heading text-base text-clay-text">{supervisor.name}</Text>
                  <View className="flex-row items-center gap-1 mt-1">
                    <MapPin size={10} color="#94A3B8" />
                    <Text className="text-[10px] text-clay-secondary/80">
                      {supervisor.location}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="items-end">
                <Text className="font-heading text-2xl text-[#0EA5E9] leading-6">
                  {supervisor.jobsDoneToday}
                </Text>
                <Text className="font-label text-[9px] uppercase tracking-wide">Team Jobs</Text>
              </View>
            </View>
          </View>

          {/* QUICK ACTIONS GRID */}
          <View className="mb-32">
            <Text className="font-label text-[11px] uppercase tracking-[2px] mb-3 px-1">
              Quick Actions
            </Text>
            <View className="flex-row flex-wrap justify-between">
              <QuickAction
                icon={<Wallet />}
                title="MY WALLET"
                color="#10B981"
                onPress={() => router.push('/(tabs)/Wallet')}
              />
              <QuickAction
                icon={<Clock />}
                title="JOB LOGS"
                color="#0EA5E9"
                onPress={() => router.push('/(tabs)/JobLogs')}
              />
              <QuickAction
                icon={<CalendarCheck />}
                title={t('home.attendance')}
                color="#F59E0B"
                onPress={() => router.push('/(tabs)/Attendance')}
              />
              <QuickAction
                icon={<Star />}
                title={t('common.myRatings')}
                color="#F59E0B"
                onPress={() => router.push('/(tabs)/MyRatings')}
              />
              <QuickAction
                icon={<FileWarning />}
                title="PENALTIES"
                color="#EF4444"
                onPress={() => router.push('/(tabs)/Penalties')}
              />
              <QuickAction
                icon={<AlertTriangle />}
                title="GET HELP"
                color="#8B5CF6"
                onPress={() => {
                  const buttons: {
                    text: string;
                    onPress?: () => void;
                    style?: 'cancel' | 'default' | 'destructive';
                  }[] = [{ text: 'Cancel', style: 'cancel' }];
                  if (supervisor.phone) {
                    buttons.push({
                      text: `Call ${supervisor.name}`,
                      onPress: () => Linking.openURL(`tel:${supervisor.phone}`),
                    });
                  }
                  Alert.alert(
                    'Get Help',
                    supervisor.name && supervisor.name !== 'Not assigned'
                      ? `Your supervisor is ${supervisor.name}${supervisor.phone ? '. Tap below to call them.' : '. Contact them directly for assistance.'}`
                      : 'No supervisor assigned. Please contact your admin for assistance.',
                    buttons
                  );
                }}
              />
              <QuickAction
                icon={<Banknote />}
                title={t('home.salary')}
                color="#6366F1"
                onPress={() => router.push('/(tabs)/Salary')}
              />
            </View>
          </View>
        </View>

        {/* ATTENDANCE MODAL */}
        <Modal visible={showAttendanceModal} animationType="slide" transparent>
          <BlurView intensity={20} style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View className="bg-[#E0F2FE] rounded-t-[40px] p-6 pb-12 shadow-2xl border-t border-white">
              <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
              <Text className="font-heading text-xl text-center mb-6 text-clay-text">
                Mark Today's Attendance
              </Text>

              {workerInfo && (
                <View className="clay-card p-5 mb-6 bg-white">
                  <View className="mb-4">
                    <Text className="font-label text-[10px] uppercase mb-1">Worker</Text>
                    <Text className="font-heading text-base text-clay-text">
                      {workerInfo.worker_name}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <View>
                      <Text className="font-label text-[10px] uppercase mb-1">Supervisor</Text>
                      <Text className="font-heading text-sm text-clay-text">
                        {workerInfo.supervisor_name || 'N/A'}
                      </Text>
                    </View>
                    <View>
                      <Text className="font-label text-[10px] uppercase mb-1">Hub</Text>
                      <Text className="font-heading text-sm text-clay-text">
                        {workerInfo.building_name || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <Text className="text-xs text-center mb-8 text-clay-secondary/80 font-body">
                Your location will be verified. You must be within the designated area (100m radius)
                to mark attendance.
              </Text>

              <View className="flex-row gap-4">
                <Pressable
                  onPress={() => setShowAttendanceModal(false)}
                  className="flex-1 py-4 rounded-2xl bg-white border border-clay-secondary/20 items-center justify-center clay-button"
                >
                  <Text className="font-heading text-sm text-clay-secondary">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={markAttendance}
                  disabled={isMarkingAttendance}
                  className="flex-1 py-4 rounded-2xl bg-[#10B981] items-center justify-center clay-button"
                >
                  {isMarkingAttendance ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="font-heading text-sm text-white">Mark Present</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </BlurView>
        </Modal>
      </ScrollView>
    </View>
  );
}
