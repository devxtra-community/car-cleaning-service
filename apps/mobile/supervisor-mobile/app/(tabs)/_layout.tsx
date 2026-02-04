import { Tabs } from 'expo-router';
import { View, Text, Pressable, StyleSheet, Animated, Dimensions } from 'react-native';
import { PieChart, Home, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';

const { width } = Dimensions.get('window');
const PADDING = 4;
const CONTAINER_WIDTH = width * 0.94;
const TAB_WIDTH = (CONTAINER_WIDTH - PADDING * 2) / 3;

interface TabBarProps {
  state: {
    index: number;
    routes: Array<{ key: string; name: string }>;
  };
  navigation: {
    navigate: (name: string) => void;
  };
}

function CustomTabBar({ state, navigation }: TabBarProps) {
  const [translateX] = useState(() => new Animated.Value(PADDING));
  const index = state.index;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: PADDING + index * TAB_WIDTH,
      useNativeDriver: true,
    }).start();
  }, [index, translateX]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Animated.View style={[styles.slider, { transform: [{ translateX }] }]} />

        <Pressable style={styles.tab} onPress={() => navigation.navigate('analytics')}>
          <PieChart size={22} color={index === 0 ? '#fff' : '#9ca3af'} />
          <Text style={{ color: index === 0 ? '#fff' : '#9ca3af' }}>Analytics</Text>
        </Pressable>

        <Pressable style={styles.tab} onPress={() => navigation.navigate('index')}>
          <Home size={22} color={index === 1 ? '#fff' : '#9ca3af'} />
          <Text style={{ color: index === 1 ? '#fff' : '#9ca3af' }}>Home</Text>
        </Pressable>

        <Pressable style={styles.tab} onPress={() => navigation.navigate('profile')}>
          <User size={22} color={index === 2 ? '#fff' : '#9ca3af'} />
          <Text style={{ color: index === 2 ? '#fff' : '#9ca3af' }}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function TabLayout() {
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  container: {
    width: '94%',
    height: 72,
    backgroundColor: '#fff',
    borderRadius: 36,
    flexDirection: 'row',
    padding: PADDING,
    overflow: 'hidden',
  },
  slider: {
    position: 'absolute',
    width: TAB_WIDTH,
    height: 72 - PADDING * 2,
    backgroundColor: '#1B86C6',
    borderRadius: 32,
    top: PADDING,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    zIndex: 1,
  },
});
