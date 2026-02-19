import React, { useState, useEffect } from 'react';
import { View, Text, Image, Pressable, ScrollView, Switch, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mail,
  Phone,
  Bell,
  LogOut,
  ChevronRight,
  Smartphone,
  Moon,
  Sun,
  Shield,
  Globe,
  MapPin,
  User,
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import api from '../../src/api/api';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage, Language } from '../../contexts/LanguageContext';

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
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center py-4`}
      style={{
        borderBottomColor: theme === 'dark' ? '#334155' : '#F1F5F9',
        borderBottomWidth: isLast ? 0 : 1,
      }}
    >
      <View className="w-10 h-10 rounded-xl items-center justify-center mr-4 bg-[#E0F2FE] border border-[#0EA5E9]/20">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-[10px] font-label uppercase tracking-widest mb-0.5 text-clay-secondary/80">
          {label}
        </Text>
        <Text className="font-heading text-sm text-clay-text" numberOfLines={1}>
          {value}
        </Text>
      </View>
      {hasSwitch ? (
        <Switch value={true} trackColor={{ false: '#CBD5E1', true: '#0EA5E9' }} />
      ) : (
        <ChevronRight size={18} color="#94A3B8" />
      )}
    </Pressable>
  );
};

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();

  const [user, setUser] = useState({
    name: 'Loading...',
    email: '...',
    phone: '...',
    role: 'Worker',
    empId: '...',
    photo: 'https://i.pravatar.cc/300',
    supervisor: '...',
    location: '...',
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
            empId: res.data.empId || 'WK-2024-001',
            photo: res.data.profilePhoto || 'https://i.pravatar.cc/300',
            supervisor: res.data.supervisor?.name || 'Not Assigned',
            location: res.data.supervisor?.location || 'N/A',
          }));
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert(t('logout'), t('logout_confirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('refresh_token');
          router.replace('/');
        },
      },
    ]);
  };

  const changeLanguage = () => {
    Alert.alert(t('language'), 'Select your preferred language', [
      { text: 'English', onPress: () => setLanguage('en') },
      { text: 'Hindi (हिंदी)', onPress: () => setLanguage('hi') },
      { text: 'Arabic (العربية)', onPress: () => setLanguage('ar') },
      { text: t('cancel'), style: 'cancel' },
    ]);
  };

  const getLanguageLabel = (lang: Language) => {
    switch (lang) {
      case 'en':
        return 'English';
      case 'hi':
        return 'Hindi (हिंदी)';
      case 'ar':
        return 'Arabic (العربية)';
      default:
        return 'English';
    }
  };

  return (
    <View className="flex-1 bg-[#E0F2FE]">
      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
        className="absolute w-full h-full"
      />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mb-6 relative">
          <LinearGradient
            colors={['#0EA5E9', '#0284C7']}
            className="absolute w-full h-64 rounded-b-[48px]"
            style={{ paddingTop: insets.top }}
          />
          <View className="items-center mt-28 pb-4 px-6">
            <View className="p-1.5 rounded-[40px] shadow-xl bg-white shadow-blue-900/20">
              <Image source={{ uri: user.photo }} className="w-24 h-24 rounded-[34px]" />
            </View>
            <Text className="text-2xl font-black mt-4 tracking-tighter text-clay-text">
              {user.name}
            </Text>
            <View className="px-4 py-1.5 rounded-full mt-2 border border-[#0EA5E9]/20 bg-[#E0F2FE]">
              <Text className="font-bold text-[10px] uppercase tracking-widest text-[#0EA5E9]">
                {user.role}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 mb-32">
          <Text className="font-heading text-lg mb-4 ml-1 text-clay-text">
            {t('account_details')}
          </Text>
          <View className="clay-card p-6 mb-8 bg-white border border-white/60">
            <ProfileRow
              icon={<Mail size={18} color="#0EA5E9" />}
              label={t('email')}
              value={user.email}
            />
            <ProfileRow
              icon={<Phone size={18} color="#0EA5E9" />}
              label={t('phone')}
              value={user.phone}
            />
            <ProfileRow
              icon={<Shield size={18} color="#0EA5E9" />}
              label={t('work_id')}
              value={user.empId}
            />
            <ProfileRow
              icon={<User size={18} color="#0EA5E9" />}
              label={t('supervisor')}
              value={user.supervisor}
            />
            <ProfileRow
              icon={<MapPin size={18} color="#0EA5E9" />}
              label={t('location')}
              value={user.location}
              isLast
            />
          </View>

          <Text className="font-heading text-lg mb-4 ml-1 text-clay-text">
            {t('settings')} & App
          </Text>
          <View className="clay-card p-6 mb-8 bg-white border border-white/60">
            <Pressable
              onPress={toggleTheme}
              className="flex-row items-center py-4"
              style={{ borderBottomColor: '#F1F5F9', borderBottomWidth: 1 }}
            >
              <View className="w-10 h-10 rounded-xl items-center justify-center mr-4 bg-[#E0F2FE] border border-[#0EA5E9]/20">
                {theme === 'dark' ? (
                  <Sun size={18} color="#F59E0B" />
                ) : (
                  <Moon size={18} color="#64748B" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-label uppercase tracking-widest mb-0.5 text-clay-secondary/80">
                  {t('appearance')}
                </Text>
                <Text className="font-heading text-sm text-clay-text">
                  {theme === 'dark' ? t('dark_mode') : t('light_mode')}
                </Text>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: '#CBD5E1', true: '#0EA5E9' }}
                thumbColor={theme === 'dark' ? '#FFFFFF' : '#F3F4F6'}
              />
            </Pressable>

            <ProfileRow
              icon={<Globe size={18} color="#F59E0B" />}
              label={t('language')}
              value={getLanguageLabel(language)}
              onPress={changeLanguage}
            />

            <ProfileRow
              icon={<Bell size={18} color="#10B981" />}
              label={t('notifications')}
              value="Push Alerts Enabled"
              hasSwitch
            />
            <ProfileRow
              icon={<Smartphone size={18} color="#8B5CF6" />}
              label={t('device_info')}
              value={`${Platform.OS === 'ios' ? 'iPhone' : 'Android'} Device`}
              isLast
            />
          </View>

          <Pressable
            onPress={handleLogout}
            className="py-5 rounded-[22px] flex-row items-center justify-center gap-2 border shadow-sm clay-button bg-[#FEF2F2] border-[#FCA5A5]/30"
          >
            <LogOut size={20} color="#EF4444" />
            <Text className="font-heading tracking-wide text-sm text-[#EF4444]">{t('logout')}</Text>
          </Pressable>
          <Text className="text-center text-[10px] font-bold uppercase mt-8 tracking-[2px] text-clay-secondary/50">
            Version 2.4.0 (Stable)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
