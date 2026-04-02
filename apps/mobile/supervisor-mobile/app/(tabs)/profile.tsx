import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { API } from '../../src/api/api';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import {
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  MapPin,
  Globe,
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { clearTokens } from '../../src/tokenStorage';
import { useLanguage, Language } from '../../contexts/LanguageContext';

// Topographic Pattern for Header
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
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="2"
        fill="none"
      />
      <PathComponent
        d="M 0 100 Q 50 85, 100 100 T 200 100 T 300 100 T 400 100"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="2"
        fill="none"
      />
      <CircleComponent
        cx="320"
        cy="100"
        r="30"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="2"
        fill="none"
      />
    </SvgComponent>
  );
};

export default function ProfileView() {
  const { width } = useWindowDimensions();
  const [user, setUser] = React.useState<{
    full_name?: string;
    role?: string;
    profile_image?: string;
    building_name?: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { t, language, setLanguage } = useLanguage();

  React.useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await API.get('/api/users/me');
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
      t('profile.logout', { defaultValue: 'Logout' }),
      t('profile.logout_confirm', { defaultValue: 'Are you sure you want to exit?' }),
      [
        { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('profile.logout', { defaultValue: 'Logout' }),
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

  const changeLanguage = () => {
    Alert.alert(
      t('profile.language', { defaultValue: 'Language' }),
      t('profile.selectLanguage', { defaultValue: 'Select your preferred language' }),
      [
        { text: 'English', onPress: () => setLanguage('en') },
        { text: 'Hindi (हिंदी)', onPress: () => setLanguage('hi') },
        { text: 'Arabic (العربية)', onPress: () => setLanguage('ar') },
        { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
      ]
    );
  };

  const getLanguageLabel = (lang: Language) => {
    switch (lang) {
      case 'ar':
        return 'Arabic (العربية)';
      case 'hi':
        return 'Hindi (हिंदी)';
      case 'en':
      default:
        return 'English';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F8FAFB] justify-center items-center">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFB]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HEADER SECTION */}
        <View className="h-[320px] items-center mb-5">
          {(() => {
            const LinearGradientComponent = LinearGradient as any;
            return (
              <LinearGradientComponent
                colors={['#0EA5E9', '#0284C7']}
                className="absolute top-0 inset-x-0 h-[240px] rounded-b-[60px]"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            );
          })()}
          <TopoPattern />

          <View
            className="mt-20 bg-white rounded-[32px] p-6 items-center shadow-xl border border-[#F1F5F9]"
            style={{ width: width - 48 }}
          >
            <View className="w-[104px] h-[104px] rounded-full border-4 border-[#F0F9FF] -mt-[70px] bg-white justify-center items-center">
              <View className="w-[90px] h-[90px] rounded-full bg-[#E0F2FE] justify-center items-center overflow-hidden">
                {user?.profile_image ? (
                  <Image source={{ uri: user.profile_image }} className="w-full h-full" />
                ) : (
                  <User size={40} color="#0EA5E9" />
                )}
              </View>
            </View>

            <Text className="text-[22px] font-antigravity-bold text-[#1E293B] mt-3">
              {user?.full_name || 'Supervisor'}
            </Text>
            <View className="px-3 py-1 rounded-xl bg-[#F0F9FF] mt-[6px]">
              <Text className="text-[10px] font-antigravity-bold text-[#0EA5E9] uppercase tracking-widest">
                {user?.role?.toUpperCase() || 'SUPERVISOR'}
              </Text>
            </View>

            {user?.building_name && (
              <View className="flex-row items-center mt-3 gap-1">
                <MapPin size={14} color="#64748B" />
                <Text className="text-[13px] text-[#64748B] font-antigravity-medium">
                  {user.building_name}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* MENU SECTION */}
        <View className="px-6 pt-[10px]">
          <Text className="text-[11px] font-antigravity-bold text-[#94A3B8] tracking-[1.5px] mb-4 mt-[10px]">
            {t('profile.accountSettings', { defaultValue: 'ACCOUNT SETTINGS' })}
          </Text>

          <MenuItem
            onPress={() => router.push('/(tabs)/profile/edit-profile')}
            icon={<User size={20} color="#0EA5E9" />}
            title={t('profile.personalDetails', { defaultValue: 'Personal Details' })}
            subtitle={t('profile.personalDetailsSubtitle', {
              defaultValue: 'Updates Name, Photo & Info',
            })}
          />

          <MenuItem
            onPress={changeLanguage}
            icon={<Globe size={20} color="#0EA5E9" />}
            title={t('profile.language', { defaultValue: 'Language' })}
            subtitle={getLanguageLabel(language)}
          />

          <MenuItem
            icon={<Settings size={20} color="#0EA5E9" />}
            title={t('profile.appPreferences', { defaultValue: 'App Preferences' })}
            subtitle={t('profile.appPreferencesSubtitle', { defaultValue: 'Notifications & Mode' })}
          />

          <Text className="text-[11px] font-antigravity-bold text-[#94A3B8] tracking-[1.5px] mb-4 mt-[10px]">
            {t('profile.supportInfo', { defaultValue: 'SUPPORT & INFO' })}
          </Text>

          <MenuItem
            icon={<HelpCircle size={20} color="#0EA5E9" />}
            title={t('profile.helpCenter', { defaultValue: 'Help Center' })}
            subtitle={t('profile.helpCenterSubtitle', { defaultValue: 'FAQs & Support' })}
          />

          <MenuItem
            onPress={handleLogout}
            icon={<LogOut size={20} color="#EF4444" />}
            title={t('profile.logout', { defaultValue: 'Logout' })}
            subtitle={t('profile.logoutSubtitle', { defaultValue: 'Securely exit app' })}
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
      className="flex-row items-center bg-white rounded-[24px] p-4 mb-3 border border-[#F1F5F9] shadow-sm"
      onPress={onPress}
    >
      <View
        className={`w-12 h-12 rounded-2xl bg-[#F0F9FF] justify-center items-center mr-4 ${danger ? 'bg-[#FEF2F2]' : ''}`}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text
          className={`text-base font-antigravity-bold text-[#1E293B] ${danger ? 'text-[#EF4444]' : ''}`}
        >
          {title}
        </Text>
        <Text className="text-xs text-[#94A3B8] mt-[2px]">{subtitle}</Text>
      </View>
      <ChevronRight size={18} color="#94A3B8" />
    </Pressable>
  );
}
