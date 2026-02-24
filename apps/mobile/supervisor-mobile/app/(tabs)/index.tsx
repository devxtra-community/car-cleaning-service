import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
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
import api from '../../src/api/api';

/* -------------------- DECORATIVE PATTERN -------------------- */
const TopoPattern = () => (
  <Svg
    height="100%"
    width="100%"
    style={StyleSheet.absoluteFillObject}
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
    style={({ pressed }) => [styles.actionItemClay, pressed && styles.actionItemPressed]}
    onPress={onPress}
  >
    <View style={styles.actionIconClayContainer}>{icon}</View>
    <Text style={styles.actionItemTitle}>{title}</Text>
    <Text style={styles.actionItemSubtitle}>{subtitle}</Text>
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
      const res = await api.get('/api/users/me');
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
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']} style={StyleSheet.absoluteFill} />
      <TopoPattern />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
      >
        {/* PROFILE HEADER */}
        <View style={styles.profileSection}>
          <View
            style={[
              styles.avatarClayContainer,
              user?.profile_image && { padding: 0, overflow: 'hidden' },
            ]}
          >
            {user?.profile_image ? (
              <Image
                source={{ uri: user.profile_image }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <User size={30} color="#0EA5E9" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.userNameText}>{user?.full_name || 'Supervisor'}</Text>
          </View>
          <Pressable style={styles.notificationClayBtn}>
            <LayoutGrid size={22} color="#0EA5E9" />
          </Pressable>
        </View>

        {/* EARNINGS CARD CLAY SECTION */}
        <View style={styles.earningsClayCard}>
          <View style={styles.earningsHeader}>
            <TrendingUp size={14} color="#0EA5E9" />
            <Text style={styles.earningsLabel}>Daily Performance</Text>
          </View>

          <View style={styles.earningsMain}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.earningsAmountText}>5,580</Text>
            <View style={styles.earningsTrendBadge}>
              <Text style={styles.trendText}>+12%</Text>
            </View>
          </View>

          <View style={styles.statsDivider} />

          <View style={styles.statsFooter}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>30</Text>
              <Text style={styles.statLabel}>Jobs Done</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>04</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* ACTION BUTTONS REDESIGN */}
        <View style={styles.topActionRow}>
          <Pressable
            style={styles.primaryClayBtn}
            onPress={() => router.push('/(tabs)/supervisor/add-task')}
          >
            <LinearGradient
              colors={['#0EA5E9', '#0284C7']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <UserCog size={22} color="#FFF" />
              <Text style={styles.primaryBtnText}>Add Tasks</Text>
              <ChevronRight size={18} color="#FFF" opacity={0.6} />
            </LinearGradient>
          </Pressable>

          <Pressable
            style={styles.secondaryClayBtn}
            onPress={() => router.push('/(tabs)/penalty/add-penalties')}
          >
            <View style={styles.alertIconCircle}>
              <AlertCircle size={22} color="#EF4444" strokeWidth={2.5} />
            </View>
            <Text style={styles.secondaryBtnText}>Penalties</Text>
          </Pressable>
        </View>

        {/* QUICK ACTIONS SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dashboard</Text>
          <Pressable>
            <Text style={styles.seeAllText}>Manage</Text>
          </Pressable>
        </View>

        <View style={styles.actionsGridRedesign}>
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

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarClayContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#E0F2FE',
  },
  greetingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  notificationClayBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  earningsClayCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  earningsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0EA5E9',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  earningsMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 20,
    color: '#1E293B',
    fontWeight: '600',
    marginRight: 4,
  },
  earningsAmountText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -1,
  },
  earningsTrendBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  statsDivider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    marginBottom: 16,
  },
  statsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  topActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  primaryClayBtn: {
    flex: 1.6,
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginLeft: 12,
  },
  secondaryClayBtn: {
    flex: 1,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 10,
  },
  alertIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0EA5E9',
  },
  actionsGridRedesign: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionItemClay: {
    width: (Dimensions.get('window').width - 40 - 16) / 2,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  actionItemPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: '#F8FAFB',
  },
  actionIconClayContainer: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  actionItemSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
