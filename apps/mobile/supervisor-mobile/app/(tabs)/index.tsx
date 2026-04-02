import React, { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StatusBar,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  User,
  UserCog,
  Calendar,
  ClipboardList,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  DollarSign,
  Wallet,
  MapPin,
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
// expo-location is lazily required inside markAttendance() so the app doesn't
// crash at startup when the native module isn't compiled into the dev client yet.
import { API } from '../../src/api/api';
import { useLanguage } from '../../contexts/LanguageContext';

/* -------------------- DECORATIVE PATTERN -------------------- */
const TopoPattern = () => {
  const SvgComponent = Svg as any;
  const PathComponent = Path as any;
  const CircleComponent = Circle as any;

  return (
    <SvgComponent
      height="100%"
      width="100%"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      pointerEvents="none"
    >
      <PathComponent
        d="M 0 80 Q 50 60, 100 80 T 200 80 T 300 80 T 400 80"
        stroke="rgba(14, 165, 233, 0.08)"
        strokeWidth="2"
        fill="none"
      />
      <PathComponent
        d="M 0 100 Q 50 85, 100 100 T 200 100 T 300 100 T 400 100"
        stroke="rgba(14, 165, 233, 0.06)"
        strokeWidth="2"
        fill="none"
      />
      <CircleComponent
        cx="320"
        cy="100"
        r="30"
        stroke="rgba(14, 165, 233, 0.08)"
        strokeWidth="2"
        fill="none"
      />
      <CircleComponent
        cx="320"
        cy="100"
        r="45"
        stroke="rgba(14, 165, 233, 0.06)"
        strokeWidth="2"
        fill="none"
      />
    </SvgComponent>
  );
};

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
    className="w-[165px] bg-white rounded-[24px] p-4 items-center border border-[#F1F5F9] shadow-sm"
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
  const { t } = useLanguage();
  const [user, setUser] = React.useState<{
    full_name?: string;
    role?: string;
    profile_image?: string;
  } | null>(null);

  const [summary, setSummary] = React.useState<{
    total_earnings: number;
    total_jobs: number;
    avg_rating: number;
    live_workers: number;
    earnings_growth: number;
    pending_jobs: number;
  }>({
    total_earnings: 0,
    total_jobs: 0,
    avg_rating: 0,
    live_workers: 0,
    earnings_growth: 0,
    pending_jobs: 0,
  });

  // ── Attendance modal state ──
  const [showAttendanceModal, setShowAttendanceModal] = React.useState(false);
  const [isMarkingAttendance, setIsMarkingAttendance] = React.useState(false);

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

  const fetchDashboardSummary = async () => {
    try {
      const res = await API.get('/api/supervisor/dashboard-summary');
      if (res.data.success) {
        setSummary(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard summary', error);
    }
  };

  // Check if supervisor has marked attendance today — show popup if not
  const checkAttendanceStatus = async () => {
    try {
      const res = await API.get('/attendance/status');
      if (res.data?.success && !res.data.marked) {
        setShowAttendanceModal(true);
      }
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err.response?.status !== 401) {
        console.error('[Supervisor] Attendance check error:', e);
      }
    }
  };

  // Mark attendance with location verification (same backend endpoint as Worker)
  const markAttendance = async () => {
    try {
      setIsMarkingAttendance(true);

      // Lazy-require expo-location so the app doesn't crash at startup if the
      // native module isn't compiled into the current dev client binary yet.
      let Location: typeof import('expo-location') | null = null;
      try {
        Location = require('expo-location');
      } catch {
        Alert.alert(
          t('common.error', { defaultValue: 'Error' }),
          'Location module not available. Please rebuild the dev client.'
        );
        return;
      }
      // Safe to assert non-null here — we return early above if require() throws
      const ExpoLocation = Location!;

      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('common.error', { defaultValue: 'Error' }),
          t('attendance.locationRequired', {
            defaultValue: 'Location permission is required to mark attendance.',
          })
        );
        return;
      }
      const position = await ExpoLocation.getCurrentPositionAsync({});
      const res = await API.post('/attendance/mark', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      if (res.data?.success) {
        Alert.alert(
          t('common.success', { defaultValue: 'Success' }),
          t('attendance.success_mark', { defaultValue: 'Attendance marked successfully!' })
        );
        setShowAttendanceModal(false);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err.response?.data?.message ||
        t('attendance.failed_mark', { defaultValue: 'Could not mark attendance. Try again.' });
      Alert.alert(t('common.error', { defaultValue: 'Error' }), message);
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  // Re-check on every Home tab focus so the popup won't re-appear once marked
  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      fetchDashboardSummary();
      checkAttendanceStatus();
    }, [])
  );

  return (
    <View className="flex-1">
      <StatusBar barStyle="dark-content" />
      {/* BACKGROUND ELEMENTS */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      >
        {(() => {
          const LinearGradientComponent = LinearGradient as any;
          return (
            <LinearGradientComponent
              colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
              style={{ flex: 1 }}
            />
          );
        })()}
        <View style={{ position: 'absolute', width: '100%', height: '100%' }} pointerEvents="none">
          <TopoPattern />
        </View>
      </View>

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
            <Text className="text-sm text-[#64748B] font-antigravity-medium">
              {t('dashboard.welcomeBack', { defaultValue: 'Welcome back,' })}
            </Text>
            <Text className="text-xl font-antigravity-bold text-[#1E293B]">
              {user?.full_name || t('profile.supervisor', { defaultValue: 'Supervisor' })}
            </Text>
          </View>
          <Pressable className="w-12 h-12 rounded-full bg-white justify-center items-center border border-[#F1F5F9]">
            <LayoutGrid size={22} color="#0EA5E9" />
          </Pressable>
        </View>

        {/* EARNINGS CARD CLAY SECTION */}
        <View
          className="clay-card p-6 mb-6 bg-white border border-[#F1F5F9]"
          style={{
            shadowColor: '#BFDBFE',
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <TrendingUp size={14} color="#0EA5E9" />
            <Text className="text-[11px] font-antigravity-bold text-[#0EA5E9] uppercase tracking-widest">
              {t('supervisor.dailyPerformance', { defaultValue: 'Daily Performance' })}
            </Text>
          </View>

          <View className="flex-row items-baseline mb-4">
            <Text className="text-xl text-[#1E293B] font-antigravity-semibold mr-1">₹</Text>
            <Text className="text-[38px] font-antigravity-bold text-[#1E293B] tracking-tighter">
              {summary.total_earnings.toLocaleString()}
            </Text>
          </View>

          <View className="h-[1px] bg-[#94A3B41A] mb-4" />

          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-base font-antigravity-bold text-[#1E293B]">
                {summary.total_jobs}
              </Text>
              <Text className="text-[10px] text-[#64748B] font-antigravity-semibold mt-[2px]">
                {t('supervisor.jobsDone', { defaultValue: 'Jobs Done' })}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-base font-antigravity-bold text-[#1E293B]">
                {summary.pending_jobs}
              </Text>
              <Text className="text-[10px] text-[#64748B] font-antigravity-semibold mt-[2px]">
                {t('supervisor.pending', { defaultValue: 'Pending' })}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-base font-antigravity-bold text-[#1E293B]">
                {summary.avg_rating > 0 ? summary.avg_rating.toFixed(1) : '5.0'}
              </Text>
              <Text className="text-[10px] text-[#64748B] font-antigravity-semibold mt-[2px]">
                {t('supervisor.rating', { defaultValue: 'Rating' })}
              </Text>
            </View>
          </View>
        </View>

        {/* ACTION BUTTONS REDESIGN */}
        <View className="flex-row gap-3 mb-6">
          <Pressable
            className="flex-[1.6] h-[60px] rounded-[20px] overflow-hidden shadow-lg"
            onPress={() => router.push('/(tabs)/supervisor/add-task')}
          >
            {(() => {
              const LinearGradientComponent = LinearGradient as any;
              return (
                <LinearGradientComponent
                  colors={['#0EA5E9', '#0284C7']}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    justifyContent: 'space-between',
                  }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <UserCog size={22} color="#FFF" />
                  <Text className="text-white text-base font-antigravity-bold flex-1 ml-3">
                    {t('supervisor.addTasks', { defaultValue: 'Add Tasks' })}
                  </Text>
                  <ChevronRight size={18} color="#FFF" opacity={0.6} />
                </LinearGradientComponent>
              );
            })()}
          </Pressable>

          <Pressable
            className="flex-1 h-[60px] bg-white rounded-[20px] flex-row items-center px-4 border border-[#FEE2E2] gap-[10px]"
            onPress={() => router.push('/(tabs)/penalty/add-penalties')}
          >
            <View className="w-10 h-10 rounded-full bg-[#FEF2F2] justify-center items-center">
              <AlertCircle size={22} color="#EF4444" strokeWidth={2.5} />
            </View>
            <Text className="text-sm font-antigravity-bold text-[#1E293B]">
              {t('supervisor.penalties', { defaultValue: 'Penalties' })}
            </Text>
          </Pressable>
        </View>

        {/* QUICK ACTIONS SECTION */}
        <View className="flex-row justify-between items-center mb-5 px-1">
          <Text className="text-xl font-antigravity-bold text-[#1E293B]">
            {t('tabs.dashboard', { defaultValue: 'Dashboard' })}
          </Text>
          <Pressable>
            <Text className="text-sm font-antigravity-bold text-[#0EA5E9]">
              {t('common.manage', { defaultValue: 'Manage' })}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap gap-4 justify-center">
          <ActionCard
            icon={<UserCog size={24} color="#0EA5E9" />}
            title={t('supervisor.liveWorkers', { defaultValue: 'Live Workers' })}
            subtitle={`${summary.live_workers} ${t('supervisor.activeCrew', { defaultValue: 'Active Crew' })}`}
            onPress={() => router.push('/supervisor/live-worker')}
          />

          <ActionCard
            icon={<Calendar size={24} color="#0EA5E9" />}
            title={t('tabs.attendance', { defaultValue: 'Attendance' })}
            subtitle={t('attendance.checkInOut', { defaultValue: 'Check-in/Out' })}
            onPress={() => router.push('/(tabs)/attendance' as any)}
          />

          <ActionCard
            icon={<ClipboardList size={24} color="#0EA5E9" />}
            title={t('supervisor.taskFeed', { defaultValue: 'Task Feed' })}
            subtitle={t('supervisor.history', { defaultValue: 'History' })}
            onPress={() => router.push('/(tabs)/supervisor/tasks-summary')}
          />

          <ActionCard
            icon={<DollarSign size={24} color="#0EA5E9" />}
            title={t('tabs.salary', { defaultValue: 'Salary' })}
            subtitle={t('salary.earningsOverview', { defaultValue: 'Monthly overview' })}
            onPress={() => router.push('/(tabs)/salary' as any)}
          />

          <ActionCard
            icon={<Wallet size={24} color="#0EA5E9" />}
            title={t('tabs.wallet', { defaultValue: 'Team Earnings' })}
            subtitle={t('supervisor.totalEarnings', { defaultValue: 'By day / week / month' })}
            onPress={() => router.push('/(tabs)/wallet' as any)}
          />

          <ActionCard
            icon={<AlertCircle size={24} color="#0EA5E9" />}
            title={t('common.support', { defaultValue: 'Support' })}
            subtitle={t('home.getHelp', { defaultValue: 'Get Help' })}
            onPress={() => router.push('/(tabs)/profile')}
          />
        </View>
      </ScrollView>

      {/* ── ATTENDANCE BOTTOM-SHEET MODAL ── */}
      <Modal visible={showAttendanceModal} animationType="slide" transparent statusBarTranslucent>
        {(() => {
          const BlurViewComponent = BlurView as any;
          return (
            <BlurViewComponent
              intensity={18}
              tint="light"
              style={{ flex: 1, justifyContent: 'flex-end' }}
            >
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderTopLeftRadius: 36,
                  borderTopRightRadius: 36,
                  paddingHorizontal: 24,
                  paddingTop: 16,
                  paddingBottom: 40,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 20,
                  elevation: 20,
                }}
              >
                {/* Drag handle */}
                <View
                  style={{
                    width: 48,
                    height: 4,
                    backgroundColor: '#E2E8F0',
                    borderRadius: 4,
                    alignSelf: 'center',
                    marginBottom: 24,
                  }}
                />

                {/* Icon */}
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: '#F0FDF4',
                    justifyContent: 'center',
                    alignItems: 'center',
                    alignSelf: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Calendar size={32} color="#10B981" />
                </View>

                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '800',
                    color: '#0F172A',
                    textAlign: 'center',
                    marginBottom: 6,
                  }}
                >
                  {t('attendance.markTitle', { defaultValue: "Mark Today's Attendance" })}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: '#64748B',
                    textAlign: 'center',
                    marginBottom: 24,
                    lineHeight: 20,
                  }}
                >
                  {t('attendance.locationNotice', {
                    defaultValue:
                      'Your location will be verified. You must be within the designated area to mark attendance.',
                  })}
                </Text>

                {/* Supervisor name badge */}
                {user?.full_name && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#F8FAFC',
                      borderRadius: 16,
                      padding: 14,
                      marginBottom: 24,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: '#E0F2FE',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}
                    >
                      <User size={20} color="#0EA5E9" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: '#94A3B8',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {t('profile.supervisor', { defaultValue: 'Supervisor' })}
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B' }}>
                        {user.full_name}
                      </Text>
                    </View>
                    <MapPin size={16} color="#10B981" />
                  </View>
                )}

                {/* Action buttons */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable
                    onPress={() => setShowAttendanceModal(false)}
                    style={{
                      flex: 1,
                      height: 52,
                      borderRadius: 18,
                      backgroundColor: '#F1F5F9',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#64748B' }}>
                      {t('common.later', { defaultValue: 'Later' })}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={markAttendance}
                    disabled={isMarkingAttendance}
                    style={{
                      flex: 1,
                      height: 52,
                      borderRadius: 18,
                      backgroundColor: '#10B981',
                      justifyContent: 'center',
                      alignItems: 'center',
                      opacity: isMarkingAttendance ? 0.7 : 1,
                    }}
                  >
                    {isMarkingAttendance ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFF' }}>
                        {t('attendance.markPresent', { defaultValue: 'Mark Present' })}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </BlurViewComponent>
          );
        })()}
      </Modal>
    </View>
  );
}
