import React, { useState, useEffect } from 'react';
import { View, Text, Image, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mail,
  Phone,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Settings,
  Smartphone,
  Moon,
  Sun,
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import api from '../../src/api/api';
import { useTheme } from '../../contexts/ThemeContext';

interface ProfileRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
  isLast?: boolean;
  hasSwitch?: boolean;
}

const ProfileRow = ({
  icon,
  label,
  value,
  onPress,
  isLast = false,
  hasSwitch = false,
}: ProfileRowProps) => {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center py-4`}
      style={{ borderBottomColor: colors.borderLight, borderBottomWidth: isLast ? 0 : 1 }}
    >
      <View
        className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
        style={{ backgroundColor: colors.background }}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text
          className="text-[11px] font-bold uppercase tracking-widest mb-0.5"
          style={{ color: colors.textSecondary }}
        >
          {label}
        </Text>
        <Text className="font-bold text-base" numberOfLines={1} style={{ color: colors.text }}>
          {value}
        </Text>
      </View>
      {hasSwitch ? (
        <Switch value={true} trackColor={{ false: colors.border, true: colors.primary }} />
      ) : (
        <ChevronRight size={18} color={colors.textTertiary} />
      )}
    </Pressable>
  );
};

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, toggleTheme, colors } = useTheme();
  const [user, setUser] = useState({
    name: 'Loading...',
    email: '...',
    phone: '...',
    role: 'Worker',
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/workers/dashboard');
        if (res.data) {
          setUser((prev) => ({
            ...prev,
            name: res.data.name,
            email: res.data.email || 'worker@clean.com',
            phone: res.data.phone || '+91 9999999999',
          }));
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to exit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('access_token');
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View
          className="rounded-b-[48px] shadow-sm overflow-hidden mb-6"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            className="h-44 w-full absolute top-0"
            style={{ paddingTop: insets.top }}
          />
          <View className="items-center mt-28 pb-10 px-6">
            <View
              className="p-1.5 rounded-[40px] shadow-xl"
              style={{
                backgroundColor: colors.cardBackground,
                shadowColor: colors.primary,
                shadowOpacity: 0.2,
              }}
            >
              <Image
                source={{ uri: 'https://i.pravatar.cc/300' }}
                className="w-28 h-28 rounded-[34px]"
              />
            </View>
            <Text
              className="text-3xl font-black mt-4 tracking-tighter"
              style={{ color: colors.text }}
            >
              {user.name}
            </Text>
            <View
              className="px-5 py-2 rounded-full mt-3 border"
              style={{ backgroundColor: colors.primaryLight, borderColor: colors.primary }}
            >
              <Text
                className="font-bold text-[11px] uppercase tracking-widest"
                style={{ color: colors.primary }}
              >
                {user.role}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 mb-32">
          <Text className="font-black text-xl mb-4 ml-1" style={{ color: colors.text }}>
            Account Details
          </Text>
          <View
            className="rounded-[32px] p-6 shadow-sm mb-8"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <ProfileRow
              icon={<Mail size={20} color={colors.primary} />}
              label="Email Address"
              value={user.email}
            />
            <ProfileRow
              icon={<Phone size={20} color={colors.primary} />}
              label="Phone Number"
              value={user.phone}
            />
            <ProfileRow
              icon={<Shield size={20} color={colors.primary} />}
              label="Work ID"
              value="WK-2024-089"
              isLast
            />
          </View>

          <Text className="font-black text-xl mb-4 ml-1" style={{ color: colors.text }}>
            Settings & App
          </Text>
          <View
            className="rounded-[32px] p-6 shadow-sm mb-8"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Pressable
              onPress={toggleTheme}
              className="flex-row items-center py-4"
              style={{ borderBottomColor: colors.borderLight, borderBottomWidth: 1 }}
            >
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                style={{ backgroundColor: colors.background }}
              >
                {theme === 'dark' ? (
                  <Sun size={20} color={colors.warning} />
                ) : (
                  <Moon size={20} color={colors.info} />
                )}
              </View>
              <View className="flex-1">
                <Text
                  className="text-[11px] font-bold uppercase tracking-widest mb-0.5"
                  style={{ color: colors.textSecondary }}
                >
                  Appearance
                </Text>
                <Text className="font-bold text-base" style={{ color: colors.text }}>
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </Text>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={theme === 'dark' ? '#FFFFFF' : '#F3F4F6'}
              />
            </Pressable>
            <ProfileRow
              icon={<Bell size={20} color={colors.success} />}
              label="Notifications"
              value="Push Alerts Enabled"
              hasSwitch
            />
            <ProfileRow
              icon={<Smartphone size={20} color={colors.success} />}
              label="Device Info"
              value="iPhone 15 Pro"
            />
            <ProfileRow
              icon={<Settings size={20} color={colors.success} />}
              label="Language"
              value="English (India)"
              isLast
            />
          </View>

          <Pressable
            onPress={handleLogout}
            className="py-5 rounded-[28px] flex-row items-center justify-center gap-2 border shadow-sm"
            style={{
              backgroundColor: colors.dangerLight,
              borderColor: colors.danger,
              shadowColor: colors.danger,
              shadowOpacity: 0.05,
            }}
          >
            <LogOut size={22} color={colors.danger} />
            <Text className="font-black tracking-wide text-base" style={{ color: colors.danger }}>
              Logout Securely
            </Text>
          </Pressable>
          <Text
            className="text-center text-[12px] font-bold uppercase mt-8 tracking-[2px]"
            style={{ color: colors.textTertiary }}
          >
            Version 2.4.0 (Stable)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
