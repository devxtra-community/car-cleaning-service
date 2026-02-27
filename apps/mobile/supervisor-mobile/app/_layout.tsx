import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { getAccessToken } from '../src/tokenStorage';
import { usePushNotifications } from '../hooks/usePushNotifications';
import '../global.css';

export default function RootLayout() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  // ✅ ADD THIS LINE - Declare the hook
  const { expoPushToken, sendTokenToBackend } = usePushNotifications();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getAccessToken();

        // We always want to show login first as per user request
        setInitialRoute('(auth)/login');

        // ✅ REGISTER PUSH TOKEN AFTER AUTH CHECK (if token exists)
        if (token && expoPushToken) {
          console.log('📤 Registering supervisor push token...');
          await sendTokenToBackend(expoPushToken, token);
        }
      } catch (err) {
        console.error('❌ Auth check error:', err);
        setInitialRoute('(auth)/login');
      }
    };

    checkAuth();
  }, [expoPushToken, sendTokenToBackend]);

  if (!initialRoute) {
    return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="(auth)/login">
      {/* Auth first */}
      <Stack.Screen name="(auth)/login" />

      {/* App after login */}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
