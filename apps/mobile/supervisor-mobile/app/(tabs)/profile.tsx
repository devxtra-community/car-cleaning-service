import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, HelpCircle, LogOut, CheckCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
const { width } = Dimensions.get('window');

export default function ProfileView() {
  const handleLogout = async () => {
    Alert.alert('Logout', 'are You sure want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('user_role');

          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* HEADER */}
      <LinearGradient colors={['#4FB3D9', '#EAF6FB']} style={styles.header}>
        <Image source={{ uri: 'https://i.pravatar.cc/300?img=12' }} style={styles.avatar} />

        <Text style={styles.name}>MUHD YASIR</Text>
        <Text style={styles.role}>WORKER</Text>
      </LinearGradient>

      {/* MENU */}
      <View style={styles.menu}>
        <MenuItem
          onPress={() => router.push('/(tabs)/profile/edit-profile')}
          icon={<User size={20} color="#4FB3D9" />}
          title="My Account"
          subtitle="Make changes to your account"
        />

        <MenuItem
          icon={<Settings size={20} color="#4FB3D9" />}
          title="Settings"
          subtitle="Manage your device settings"
        />

        <MenuItem
          icon={<HelpCircle size={20} color="#4FB3D9" />}
          title="Need Help?"
          subtitle="Contact Supervisor"
        />

        <MenuItem
          icon={<LogOut size={20} color="#E11D48" />}
          title="Log out"
          subtitle="Secure your account"
          danger
          onPress={handleLogout}
        />
      </View>
    </SafeAreaView>
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
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={styles.iconBox}>{icon}</View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.menuTitle, danger && { color: '#E11D48' }]}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>

      <CheckCircle size={16} color="#CBD5E1" />
    </Pressable>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#fff',
    marginBottom: 12,
  },

  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  role: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: -20,
  },

  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },

  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  statValueNegative: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
  },

  menu: {
    marginTop: 20,
    paddingHorizontal: 20,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF6FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  menuSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
