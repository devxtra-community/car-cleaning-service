import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';

export default function RootLayout() {
  const [hydrated, setHydrated] = useState(false);

  usePushNotifications();

  useEffect(() => {
    let mounted = true;

    (async () => {
      await SecureStore.getItemAsync('access_token');

      if (mounted) {
        setHydrated(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!hydrated) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
