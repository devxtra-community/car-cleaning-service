import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, Text, Pressable, Animated, Dimensions } from 'react-native';
import { PieChart, Home, User } from 'lucide-react-native';
import React, { useRef, useEffect } from 'react';

const ACTIVE = '#ffffff';
const INACTIVE = '#9ca3af';

const { width } = Dimensions.get('window');
const CONTAINER_WIDTH = width * 0.9;
const TAB_WIDTH = CONTAINER_WIDTH / 3;

export default function TabLayout() {
  const translateX = useRef(new Animated.Value(0)).current;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} translateX={translateX} />}
    >
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

interface CustomTabBarProps {
  state: { routes: any[]; index: number };
  translateX: Animated.Value;
}

function CustomTabBar({ translateX }: CustomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const routeIndexMap: Record<string, number> = {
    '/Analytics': 0,
    '/Homepage': 1,
    '/Profile': 2,
  };

  const activeIndex = routeIndexMap[pathname] !== undefined ? routeIndexMap[pathname] : 1;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: activeIndex * TAB_WIDTH,
      useNativeDriver: true,
      friction: 9,
      tension: 60,
    }).start();
  }, [activeIndex, translateX]);

  // Hide tab bar on utility screens
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
    <View className="absolute bottom-6 w-full items-center">
      <View
        style={{ width: CONTAINER_WIDTH }}
        className="h-[72px] bg-white rounded-full flex-row items-center shadow-xl shadow-black/10 px-2"
      >
        {/* Active Indicator */}
        <Animated.View
          style={{
            width: TAB_WIDTH,
            transform: [{ translateX }],
          }}
          className="absolute h-[60px] bg-[#1B86C6] rounded-full left-2"
        />

        {/* Tabs */}
        <TabButton
          label="Stats"
          icon={<PieChart size={20} />}
          active={activeIndex === 0}
          onPress={() => router.push('/Analytics')}
        />

        <TabButton
          label="Home"
          icon={<Home size={20} />}
          active={activeIndex === 1}
          onPress={() => router.push('/Homepage')}
        />

        <TabButton
          label="Profile"
          icon={<User size={20} />}
          active={activeIndex === 2}
          onPress={() => router.push('/Profile')}
        />
      </View>
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
    <Pressable onPress={onPress} className="flex-1 h-[60px] items-center justify-center gap-1">
      {React.cloneElement(icon, {
        color: active ? ACTIVE : INACTIVE,
      } as any)}
      <Text
        className="text-[11px] font-semibold tracking-wide"
        style={{ color: active ? ACTIVE : INACTIVE }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
