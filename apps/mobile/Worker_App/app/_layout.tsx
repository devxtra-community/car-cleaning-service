import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,

        // Smart animation
        animation: 'slide_from_right',

        // Makes it smoother
        animationDuration: 350,

        // iOS style gestures
        gestureEnabled: true,

        // Slight fade while sliding
        presentation: 'card',
      }}
    />
  );
}
