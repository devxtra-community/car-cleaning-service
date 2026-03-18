// apps/mobile/Worker_App/app/(tabs)/_layout.tsx

import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, Text, Platform, Dimensions, Pressable, Animated } from 'react-native';
import { Home, User, PieChart, ShieldAlert, Banknote, LayoutDashboard } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getUserRole, getAccessToken } from '../../src/api/tokenStorage';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';

const ACTIVE = '#ffffff'; // White for active text
const INACTIVE = '#9ca3af'; // Gray for inactive
const { width } = Dimensions.get('window');
const CONTAINER_WIDTH = width * 0.9;

export default function TabLayout() {
  const { expoPushToken, sendTokenToBackend } = usePushNotifications();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndRegister = async () => {
      const r = await getUserRole();
      setRole(r);

      const token = await getAccessToken();
      if (token && expoPushToken) {
        console.log(' [PUSH] Registering token from Worker TabLayout...');
        await sendTokenToBackend(expoPushToken, token);
      }
    };
    checkAuthAndRegister();
  }, [expoPushToken, sendTokenToBackend]);

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar role={role} {...props} />}
    >
      {/* Shared/Always present */}
      <Tabs.Screen name="Profile" />
      <Tabs.Screen name="Homepage" />
      <Tabs.Screen name="Analytics" />

      {/* Supervisor specific */}
      <Tabs.Screen
        name="SupervisorDashboard"
        options={{ href: role === 'supervisor' ? '/(tabs)/SupervisorDashboard' : null }}
      />
      <Tabs.Screen
        name="FraudReview"
        options={{ href: role === 'supervisor' ? '/(tabs)/FraudReview' : null }}
      />
      <Tabs.Screen
        name="Collections"
        options={{ href: role === 'supervisor' ? '/(tabs)/Collections' : null }}
      />

      {/* Detail screens */}
      <Tabs.Screen name="AddJob" options={{ href: null }} />
      <Tabs.Screen name="AfterWash" options={{ href: null }} />
      <Tabs.Screen name="Attendance" options={{ href: null }} />
      <Tabs.Screen name="JobLogs" options={{ href: null }} />
      <Tabs.Screen name="Penalties" options={{ href: null }} />
      <Tabs.Screen name="Wallet" options={{ href: null }} />
      <Tabs.Screen name="PaymentSummary" options={{ href: null }} />
      <Tabs.Screen name="Salary" options={{ href: null }} />
      <Tabs.Screen name="MyRatings" options={{ href: null }} />
    </Tabs>
  );
}

function CustomTabBar({ state, navigation, role }: any) {
  const { t } = useLanguage();
  const isSupervisor = role === 'supervisor';

  const cleanerTabs = [
    {
      name: t('tabs.analytics', { defaultValue: 'Analytics' }),
      icon: <PieChart size={22} />,
      routeName: 'Analytics',
    },
    {
      name: t('tabs.home', { defaultValue: 'Home' }),
      icon: <Home size={22} />,
      routeName: 'Homepage',
    },
    {
      name: t('tabs.profile', { defaultValue: 'Profile' }),
      icon: <User size={22} />,
      routeName: 'Profile',
    },
  ];

  const supervisorTabs = [
    {
      name: t('tabs.dashboard', { defaultValue: 'Dashboard' }),
      icon: <LayoutDashboard size={22} />,
      routeName: 'SupervisorDashboard',
    },
    {
      name: t('tabs.fraud', { defaultValue: 'Fraud' }),
      icon: <ShieldAlert size={22} />,
      routeName: 'FraudReview',
    },
    {
      name: t('tabs.money', { defaultValue: 'Money' }),
      icon: <Banknote size={22} />,
      routeName: 'Collections',
    },
    {
      name: t('tabs.profile', { defaultValue: 'Profile' }),
      icon: <User size={22} />,
      routeName: 'Profile',
    },
  ];

  const tabs = isSupervisor ? supervisorTabs : cleanerTabs;
  const tabCount = tabs.length;
  const tabWidth = CONTAINER_WIDTH / tabCount;

  // Find the exact active tab based on the current Expo router state
  const currentRouteName = state.routes[state.index]?.name;
  const activeIndex = tabs.findIndex((t) => t.routeName === currentRouteName);
  const safeActiveIndex = activeIndex === -1 ? (isSupervisor ? 0 : 1) : activeIndex;

  const [slideAnim] = useState(new Animated.Value(safeActiveIndex * tabWidth));

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: safeActiveIndex * tabWidth,
      useNativeDriver: true,
      friction: 9,
      tension: 60,
    }).start();
  }, [safeActiveIndex, tabWidth, slideAnim]);

  // Hidden screens logic (using state instead of pathname for consistency if possible, but state.routes only contains tab screens)
  const hiddenScreens = [
    'AddJob',
    'AfterWash',
    'Attendance',
    'JobLogs',
    'Penalties',
    'Wallet',
    'PaymentSummary',
    'MyRatings',
    'Salary',
  ];
  if (hiddenScreens.includes(currentRouteName)) return null;

  return (
    <View className="absolute bottom-6 w-full items-center" pointerEvents="box-none">
      <BlurView
        intensity={Platform.OS === 'ios' ? 30 : 100}
        tint="light"
        style={
          {
            width: CONTAINER_WIDTH,
            height: 60,
            overflow: 'hidden',
            borderRadius: 9999,
            elevation: 20,
          } as any
        }
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
          style={{ position: 'absolute', width: '100%', height: '100%' } as any}
        />
        <View className="flex-row items-center w-full h-full relative">
          {/* Active Pill */}
          <Animated.View
            style={{
              width: tabWidth,
              height: 48,
              paddingHorizontal: 2,
              transform: [{ translateX: slideAnim }],
              position: 'absolute',
              left: 0,
            }}
          >
            <LinearGradient
              colors={['#0EA5E9', '#0284C7']}
              style={{ width: '100%', height: '100%', borderRadius: 24, elevation: 10 } as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          </Animated.View>

          {/* Tabs */}
          {tabs.map((tab, idx) => {
            const isFocused = safeActiveIndex === idx;

            const onPress = () => {
              const route = state.routes.find(
                (r: { name: string; key: string }) => r.name === tab.routeName
              );
              if (route) {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(tab.routeName);
                }
              } else {
                navigation.navigate(tab.routeName);
              }
            };

            return (
              <TabButton
                key={tab.routeName}
                label={tab.name}
                icon={tab.icon}
                active={isFocused}
                onPress={onPress}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

function TabButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: React.ReactElement;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1 h-full items-center justify-center z-10">
      <View className="items-center justify-center gap-[4px]">
        {React.cloneElement(icon, {
          color: active ? ACTIVE : INACTIVE,
          strokeWidth: active ? 2.5 : 2,
        } as any)}
        <Text
          className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: active ? ACTIVE : INACTIVE }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
