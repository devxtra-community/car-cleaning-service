// apps/mobile/Worker_App/app/(tabs)/_layout.tsx

import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, Text, Platform, Dimensions, Pressable, Animated } from 'react-native';
import { Home, User, PieChart } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';

const ACTIVE = '#ffffff'; // White for active text
const INACTIVE = '#9ca3af'; // Gray for inactive
const { width } = Dimensions.get('window');
const CONTAINER_WIDTH = width * 0.9;
const TAB_COUNT = 3;
const TAB_WIDTH = CONTAINER_WIDTH / TAB_COUNT;

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="Analytics" />
      <Tabs.Screen name="Homepage" />
      <Tabs.Screen name="Profile" />
      <Tabs.Screen name="AddJob" />
      <Tabs.Screen name="AfterWash" options={{ href: null }} />
      <Tabs.Screen name="Attendance" options={{ href: null }} />
      <Tabs.Screen name="JobLogs" options={{ href: null }} />
      <Tabs.Screen name="Penalties" options={{ href: null }} />
      <Tabs.Screen name="Wallet" options={{ href: null }} />
      <Tabs.Screen name="PaymentSummary" options={{ href: null }} />
    </Tabs>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTabBar(props: any) {
  const router = useRouter();
  const pathname = usePathname();

  const routeIndexMap: Record<string, number> = {
    '/Analytics': 0,
    '/Homepage': 1,
    '/Profile': 2,
  };

  const activeIndex = routeIndexMap[pathname] ?? 1;
  // Fix: Use useState for stable initialization instead of useRef during render
  const [slideAnim] = useState(() => new Animated.Value(activeIndex * TAB_WIDTH));

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeIndex * TAB_WIDTH,
      useNativeDriver: true,
      friction: 9,
      tension: 60,
    }).start();
  }, [activeIndex, slideAnim]);

  const hiddenScreens = [
    '/AddJob',
    '/AfterWash',
    '/Attendance',
    '/JobLogs',
    '/Penalties',
    '/Wallet',
    '/PaymentSummary',
  ];
  if (hiddenScreens.includes(pathname)) return null;

  return (
    <View className="absolute bottom-8 w-full items-center">
      <BlurView
        intensity={Platform.OS === 'ios' ? 30 : 100}
        tint="light"
        className="overflow-hidden rounded-full shadow-xl shadow-blue-900/20"
        style={{ width: CONTAINER_WIDTH, height: 72 }}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
          className="absolute w-full h-full"
        />
        <View className="flex-row items-center w-full h-full relative">
          {/* Active Pill with Gradient */}
          <Animated.View
            style={{
              width: TAB_WIDTH,
              height: 56,
              paddingHorizontal: 8,
              transform: [{ translateX: slideAnim }],
              position: 'absolute',
              left: 0,
            }}
          >
            <LinearGradient
              colors={['#0EA5E9', '#0284C7']}
              className="w-full h-full rounded-[20px] shadow-lg shadow-blue-400"
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          </Animated.View>

          {/* Tabs */}
          <TabButton
            label="Stats"
            icon={<PieChart size={22} />}
            active={activeIndex === 0}
            onPress={() => router.push('/Analytics')}
          />

          <TabButton
            label="Home"
            icon={<Home size={22} />}
            active={activeIndex === 1}
            onPress={() => router.push('/Homepage')}
          />

          <TabButton
            label="Profile"
            icon={<User size={22} />}
            active={activeIndex === 2}
            onPress={() => router.push('/Profile')}
          />
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
