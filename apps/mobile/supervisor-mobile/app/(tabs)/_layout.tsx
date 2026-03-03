import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { View, Text, Pressable, Animated, Dimensions } from 'react-native';
import { PieChart, Home, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { getAccessToken } from '../../src/tokenStorage';

const { width } = Dimensions.get('window');
const PADDING = 4;
const CONTAINER_WIDTH = width * 0.94;
const TAB_WIDTH = (CONTAINER_WIDTH - PADDING * 2) / 3;

function CustomTabBar({ state, descriptors: _descriptors, navigation }: BottomTabBarProps) {
  const [translateX] = useState(() => new Animated.Value(PADDING));
  const index = state.index;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: PADDING + index * TAB_WIDTH,
      useNativeDriver: true,
    }).start();
  }, [index, translateX]);

  return (
    <View className="absolute bottom-4 w-full items-center">
      <View
        className="w-[94%] h-[72px] bg-white rounded-[36px] flex-row items-center overflow-hidden"
        style={{ padding: PADDING }}
      >
        <Animated.View
          className="absolute bg-[#1B86C6] rounded-[32px]"
          style={{
            width: TAB_WIDTH,
            height: 72 - PADDING * 2,
            top: PADDING,
            transform: [{ translateX }],
          }}
        />

        <Pressable
          className="flex-1 items-center justify-center gap-1 z-10"
          onPress={() => navigation.navigate('analytics')}
        >
          <PieChart size={22} color={index === 0 ? '#fff' : '#9ca3af'} />
          <Text
            className={`text-[10px] font-antigravity-medium ${index === 0 ? 'text-white' : 'text-[#9ca3af]'}`}
          >
            Analytics
          </Text>
        </Pressable>

        <Pressable
          className="flex-1 items-center justify-center gap-1 z-10"
          onPress={() => navigation.navigate('index')}
        >
          <Home size={22} color={index === 1 ? '#fff' : '#9ca3af'} />
          <Text
            className={`text-[10px] font-antigravity-medium ${index === 1 ? 'text-white' : 'text-[#9ca3af]'}`}
          >
            Home
          </Text>
        </Pressable>

        <Pressable
          className="flex-1 items-center justify-center gap-1 z-10"
          onPress={() => navigation.navigate('profile')}
        >
          <User size={22} color={index === 2 ? '#fff' : '#9ca3af'} />
          <Text
            className={`text-[10px] font-antigravity-medium ${index === 2 ? 'text-white' : 'text-[#9ca3af]'}`}
          >
            Profile
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { expoPushToken, sendTokenToBackend } = usePushNotifications();

  useEffect(() => {
    const registerToken = async () => {
      if (expoPushToken) {
        const token = await getAccessToken();
        if (token) {
          await sendTokenToBackend(expoPushToken, token);
        }
      }
    };
    registerToken();
  }, [expoPushToken, sendTokenToBackend]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="profile" />
      {/* New screens — accessible via router.push, not visible in tab bar */}
      <Tabs.Screen name="photo-verify" options={{ href: null }} />
      <Tabs.Screen name="floor-overview" options={{ href: null }} />
      <Tabs.Screen name="collections" options={{ href: null }} />
      <Tabs.Screen name="fraud-review" options={{ href: null }} />
    </Tabs>
  );
}
