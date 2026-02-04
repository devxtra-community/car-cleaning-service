import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Auth first */}
      <Stack.Screen name="(auth)/login" />

      {/* App after login */}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
