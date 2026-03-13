import { Tabs, Redirect } from 'expo-router';
import { View, Text, Platform, Dimensions, Pressable, Animated } from 'react-native';
import { Home, User, PieChart } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import React from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { getAccessToken } from '../../src/tokenStorage';
import { useLanguage } from '../../contexts/LanguageContext';

const ACTIVE = '#ffffff'; // White for active text
const INACTIVE = '#9ca3af'; // Gray for inactive
const { width } = Dimensions.get('window');
const CONTAINER_WIDTH = width * 0.9;

function CustomTabBar({ state, _descriptors, navigation }: any) {
  const { t } = useLanguage();
  const tabs = [
    {
      name: t('tabs.analytics', { defaultValue: 'Analytics' }),
      icon: <PieChart size={22} />,
      routeName: 'analytics',
    },
    {
      name: t('tabs.home', { defaultValue: 'Home' }),
      icon: <Home size={22} />,
      routeName: 'index',
    },
    {
      name: t('tabs.profile', { defaultValue: 'Profile' }),
      icon: <User size={22} />,
      routeName: 'profile',
    },
  ];

  const tabCount = tabs.length;
  const tabWidth = CONTAINER_WIDTH / tabCount;

  // Find the exact active tab based on the current Expo router state
  const currentRouteName = state.routes[state.index]?.name;
  const activeIndex = tabs.findIndex((t) => t.routeName === currentRouteName);
  const safeActiveIndex = activeIndex === -1 ? 1 : activeIndex; // Fallback to Home

  const [animatedValue] = useState(new Animated.Value(safeActiveIndex * tabWidth));

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: safeActiveIndex * tabWidth,
      useNativeDriver: true,
      friction: 9,
      tension: 60,
    }).start();
  }, [safeActiveIndex, tabWidth, animatedValue]);

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
              transform: [{ translateX: animatedValue }],
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

export default function TabLayout() {
  const { expoPushToken, sendTokenToBackend } = usePushNotifications();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthAndRegister = async () => {
      const token = await getAccessToken();
      if (!token) {
        console.log(' [AUTH] No token found in TabLayout, redirecting...');
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);

      if (expoPushToken) {
        console.log(' [PUSH] Registering token from TabLayout...');
        await sendTokenToBackend(expoPushToken, token);
      }
    };
    checkAuthAndRegister();
  }, [expoPushToken, sendTokenToBackend]);

  if (isAuthenticated === false) {
    return <Redirect href="/(auth)/login" />;
  }

  // Still checking auth
  if (isAuthenticated === null) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
      tabBar={(props: any) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="profile" />
      {/* New screens — accessible via router.push, not visible in tab bar */}
      <Tabs.Screen name="photo-verify" options={{ href: null }} />
      <Tabs.Screen name="floor-overview" options={{ href: null }} />
      <Tabs.Screen name="collections" options={{ href: null }} />
      <Tabs.Screen name="fraud-review" options={{ href: null }} />
      <Tabs.Screen name="salary" options={{ href: null }} />
      <Tabs.Screen name="attendance" options={{ href: null }} />
      <Tabs.Screen name="wallet" options={{ href: null }} />
    </Tabs>
  );
}
