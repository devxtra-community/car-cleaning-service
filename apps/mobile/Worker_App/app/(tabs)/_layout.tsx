import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, Text, Pressable, Animated, Dimensions } from 'react-native';
import { PieChart, Home, User } from 'lucide-react-native';
import { useRef, useEffect } from 'react';

const ACTIVE = '#f6f8fb';
const INACTIVE = '#9ca3af';

const { width } = Dimensions.get('window');
const CONTAINER_WIDTH = width * 0.92;
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
    </Tabs>
  );
}

interface CustomTabBarProps {
  state: { routes: any[]; index: number };
  translateX: Animated.Value;
}

function CustomTabBar({ state: _state, translateX }: CustomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Map route -> index (keeps slider in sync even on deep links)
  const routeIndexMap: Record<string, number> = {
    '/Analytics': 0,
    '/Homepage': 1,
    '/Profile': 2,
  };

  const activeIndex = routeIndexMap[pathname] !== undefined ? routeIndexMap[pathname] : 0;

  // Animate slider
  useEffect(() => {
    Animated.spring(translateX, {
      toValue: activeIndex * TAB_WIDTH,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [activeIndex, translateX]);

  // Hide tab bar on AddJob screen
  if (pathname === '/AddJob') return null;

  return (
    <View className="absolute bottom-5 w-full items-center">
      <View
        className="h-20 bg-white rounded-full flex-row items-center p-2 overflow-hidden shadow-lg shadow-black/5"
        style={{ width: CONTAINER_WIDTH }}
      >
        {/* Active Slider */}
        <Animated.View
          className="absolute h-[68px] bg-[#1B86C6] rounded-full top-1.5 left-1.5"
          style={{
            width: TAB_WIDTH,
            transform: [{ translateX }],
          }}
        />

        {/* Analytics */}
        <Pressable
          className="flex-1 h-[68px] flex-row justify-center items-center gap-2"
          onPress={() => router.push('/Analytics')}
        >
          <PieChart size={20} color={activeIndex === 0 ? ACTIVE : INACTIVE} />
          <Text
            className="text-[10px] font-black uppercase tracking-tighter"
            style={{ color: activeIndex === 0 ? ACTIVE : INACTIVE }}
          >
            Stats
          </Text>
        </Pressable>

        {/* Home */}
        <Pressable
          className="flex-1 h-[68px] flex-row justify-center items-center gap-2"
          onPress={() => router.push('/Homepage')}
        >
          <Home size={20} color={activeIndex === 1 ? ACTIVE : INACTIVE} />
          <Text
            className="text-[10px] font-black uppercase tracking-tighter"
            style={{ color: activeIndex === 1 ? ACTIVE : INACTIVE }}
          >
            Home
          </Text>
        </Pressable>

        {/* Profile */}
        <Pressable
          className="flex-1 h-[68px] flex-row justify-center items-center gap-2"
          onPress={() => router.push('/Profile')}
        >
          <User size={20} color={activeIndex === 2 ? ACTIVE : INACTIVE} />
          <Text
            className="text-[10px] font-black uppercase tracking-tighter"
            style={{ color: activeIndex === 2 ? ACTIVE : INACTIVE }}
          >
            Profile
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
