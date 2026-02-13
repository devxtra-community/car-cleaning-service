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
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import api from '../../src/api/api';

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
}: ProfileRowProps) => (
  <Pressable
    onPress={onPress}
    className={`flex-row items-center py-4 ${!isLast ? 'border-b border-gray-50' : ''}`}
  >
    <View className="w-10 h-10 rounded-2xl bg-gray-50 items-center justify-center mr-4">
      {icon}
    </View>
    <View className="flex-1">
      <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
        {label}
      </Text>
      <Text className="text-gray-800 font-bold text-sm" numberOfLines={1}>
        {value}
      </Text>
    </View>
    {hasSwitch ? (
      <Switch value={true} trackColor={{ false: '#767577', true: '#1B86C6' }} />
    ) : (
      <ChevronRight size={16} color="#ccc" />
    )}
  </Pressable>
);

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
    <View className="flex-1 bg-[#F5F7FA]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-b-[48px] shadow-sm overflow-hidden mb-6">
          <LinearGradient
            colors={['#1B86C6', '#0ea5e9']}
            className="h-44 w-full absolute top-0"
            style={{ paddingTop: insets.top }}
          />
          <View className="items-center mt-28 pb-10 px-6">
            <View className="p-1.5 bg-white rounded-[40px] shadow-xl shadow-blue-500/20">
              <Image
                source={{ uri: 'https://i.pravatar.cc/300' }}
                className="w-28 h-28 rounded-[34px]"
              />
            </View>
            <Text className="text-2xl font-black text-gray-900 mt-4 tracking-tighter">
              {user.name}
            </Text>
            <View className="bg-blue-50 px-4 py-1.5 rounded-full mt-2 border border-blue-100">
              <Text className="text-[#1B86C6] font-bold text-[10px] uppercase tracking-widest">
                {user.role}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 mb-32">
          <Text className="text-gray-900 font-black text-lg mb-4 ml-1">Account Details</Text>
          <View className="bg-white rounded-[32px] p-6 shadow-sm mb-8">
            <ProfileRow
              icon={<Mail size={18} color="#1B86C6" />}
              label="Email Address"
              value={user.email}
            />
            <ProfileRow
              icon={<Phone size={18} color="#1B86C6" />}
              label="Phone Number"
              value={user.phone}
            />
            <ProfileRow
              icon={<Shield size={18} color="#1B86C6" />}
              label="Work ID"
              value="WK-2024-089"
              isLast
            />
          </View>

          <Text className="text-gray-900 font-black text-lg mb-4 ml-1">Settings & App</Text>
          <View className="bg-white rounded-[32px] p-6 shadow-sm mb-8">
            <ProfileRow
              icon={<Bell size={18} color="#10b981" />}
              label="Notifications"
              value="Push Alerts Enabled"
              hasSwitch
            />
            <ProfileRow
              icon={<Smartphone size={18} color="#10b981" />}
              label="Device Info"
              value="iPhone 15 Pro"
            />
            <ProfileRow
              icon={<Settings size={18} color="#10b981" />}
              label="Language"
              value="English (India)"
              isLast
            />
          </View>

          <Pressable
            onPress={handleLogout}
            className="bg-red-50 py-5 rounded-[28px] flex-row items-center justify-center gap-2 border border-red-100 shadow-sm shadow-red-500/5"
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="text-[#ef4444] font-black tracking-wide">Logout Securely</Text>
          </Pressable>
          <Text className="text-center text-gray-300 text-[10px] font-bold uppercase mt-8 tracking-[2px]">
            Version 2.4.0 (Stable)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
