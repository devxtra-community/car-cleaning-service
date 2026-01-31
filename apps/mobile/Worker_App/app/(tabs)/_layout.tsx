import { Tabs } from 'expo-router';
import { View, Text, Pressable, StyleSheet, Animated, Dimensions } from 'react-native';
import { PieChart, Home, User } from 'lucide-react-native';
import { useRef } from 'react';

const ACTIVE = '#f6f8fb';
const INACTIVE = '#9ca3af';
const BG = 'white';

const { width } = Dimensions.get('window');
const TAB_WIDTH = (width * 0.88) / 3;

export default function TabLayout() {
  const translateX = useRef(new Animated.Value(0)).current;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => {
        const activeIndex = state.index;

        // animation INSIDE component render (NOT hook)
        Animated.spring(translateX, {
          toValue: activeIndex * TAB_WIDTH,
          useNativeDriver: true,
        }).start();

        return (
          <View style={styles.wrapper}>
            <View style={styles.container}>
              <Animated.View style={[styles.slider, { transform: [{ translateX }] }]} />

              <Pressable style={styles.tab} onPress={() => navigation.navigate('Analytics')}>
                <PieChart size={22} color={activeIndex === 0 ? ACTIVE : INACTIVE} />
                <Text style={[styles.label, { color: activeIndex === 0 ? ACTIVE : INACTIVE }]}>
                  Analytics
                </Text>
              </Pressable>

              <Pressable style={styles.tab} onPress={() => navigation.navigate('Homepage')}>
                <Home size={22} color={activeIndex === 1 ? ACTIVE : INACTIVE} />
                <Text style={[styles.label, { color: activeIndex === 1 ? ACTIVE : INACTIVE }]}>
                  Home
                </Text>
              </Pressable>

              <Pressable style={styles.tab} onPress={() => navigation.navigate('Profile')}>
                <User size={22} color={activeIndex === 2 ? ACTIVE : INACTIVE} />
                <Text style={[styles.label, { color: activeIndex === 2 ? ACTIVE : INACTIVE }]}>
                  Profile
                </Text>
              </Pressable>
            </View>
          </View>
        );
      }}
    >
      <Tabs.Screen name="Analytics" />
      <Tabs.Screen name="Homepage" />
      <Tabs.Screen name="Profile" />
    </Tabs>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
  },

  container: {
    width: '92%',
    height: 80,
    backgroundColor: BG,
    borderRadius: 40,
    flexDirection: 'row',
    padding: 11, // outer padding
    overflow: 'hidden',
    alignItems: 'center',
  },

  slider: {
    position: 'absolute',
    width: TAB_WIDTH,
    height: 68, // container height minus padding
    backgroundColor: '#1B86C6',
    borderRadius: 34,
    top: 6, // centers vertically
    left: 6, // matches padding
  },

  tab: {
    width: TAB_WIDTH,
    height: 68,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});
