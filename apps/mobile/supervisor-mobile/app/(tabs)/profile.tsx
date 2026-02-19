import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import api from '../../src/api/api';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { User, Settings, HelpCircle, LogOut, ChevronRight, MapPin } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { clearTokens } from '../../src/tokenStorage';

const { width } = Dimensions.get('window');

// Topographic Pattern for Header
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
      stroke="rgba(255,255,255,0.12)"
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M 0 100 Q 50 85, 100 100 T 200 100 T 300 100 T 400 100"
      stroke="rgba(255,255,255,0.1)"
      strokeWidth="2"
      fill="none"
    />
    <Circle cx="320" cy="100" r="30" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
  </Svg>
);

export default function ProfileView() {
  const [user, setUser] = React.useState<{
    full_name?: string;
    role?: string;
    profile_image?: string;
    building_name?: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/api/users/me');
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await clearTokens();
            await SecureStore.deleteItemAsync('user_role');
            router.replace('/(auth)/login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HEADER SECTION */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#0EA5E9', '#0284C7']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <TopoPattern />

          <View style={styles.profileInfoClay}>
            <View style={styles.avatarClayBorder}>
              <View style={styles.avatarClayContainer}>
                {user?.profile_image ? (
                  <Image source={{ uri: user.profile_image }} style={styles.avatarImage} />
                ) : (
                  <User size={40} color="#0EA5E9" />
                )}
              </View>
            </View>

            <Text style={styles.nameText}>{user?.full_name || 'Supervisor'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'SUPERVISOR'}</Text>
            </View>

            {user?.building_name && (
              <View style={styles.locationContainer}>
                <MapPin size={14} color="#64748B" />
                <Text style={styles.locationText}>{user.building_name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* MENU SECTION */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>ACCOUNT SETTINGS</Text>

          <MenuItem
            onPress={() => router.push('/(tabs)/profile/edit-profile')}
            icon={<User size={20} color="#0EA5E9" />}
            title="Personal Details"
            subtitle="Updates Name, Photo & Info"
          />

          <MenuItem
            icon={<Settings size={20} color="#0EA5E9" />}
            title="App Preferences"
            subtitle="Notifications & Mode"
          />

          <Text style={styles.sectionLabel}>SUPPORT & INFO</Text>

          <MenuItem
            icon={<HelpCircle size={20} color="#0EA5E9" />}
            title="Help Center"
            subtitle="FAQs & Support"
          />

          <MenuItem
            onPress={handleLogout}
            icon={<LogOut size={20} color="#EF4444" />}
            title="Logout"
            subtitle="Securely exit app"
            danger
          />
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- MENU ITEM COMPONENT ---------- */

function MenuItem({
  icon,
  title,
  subtitle,
  danger,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItemClay, pressed && styles.menuItemPressed]}
      onPress={onPress}
    >
      <View style={[styles.menuIconContainer, danger && { backgroundColor: '#FEF2F2' }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuTitle, danger && { color: '#EF4444' }]}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={18} color="#94A3B8" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  headerContainer: {
    height: 320,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  profileInfoClay: {
    marginTop: 80,
    width: width - 48,
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarClayBorder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: '#F0F9FF',
    marginTop: -70,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarClayContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    marginTop: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0EA5E9',
    letterSpacing: 1.2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  menuSection: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginTop: 10,
  },
  menuItemClay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  menuItemPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#F8FAFB',
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
});
