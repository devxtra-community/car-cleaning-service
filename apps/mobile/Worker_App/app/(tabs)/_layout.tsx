import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { usePushNotifications } from '../../hooks/usePushnotification';

export default function RootLayout() {
  const [hydrated, setHydrated] = useState(false);
  const { expoPushToken, sendTokenToBackend } = usePushNotifications();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const token = await SecureStore.getItemAsync('access_token');

        if (mounted) setHydrated(true);

        if (
          expoPushToken &&
          token &&
          typeof expoPushToken === 'string' &&
          typeof token === 'string'
        ) {
          await sendTokenToBackend(expoPushToken, token);
          console.log('Push token sent to backend');
        }
      } catch (error) {
        console.error('RootLayout error:', error);
        if (mounted) setHydrated(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [expoPushToken, sendTokenToBackend]);

  if (!hydrated) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
