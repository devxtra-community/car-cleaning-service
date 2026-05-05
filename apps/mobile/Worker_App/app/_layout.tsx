import '../global.css';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { initI18n } from '../src/i18n/i18n';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import OfflineBanner from '../components/OfflineBanner';
import NetInfo from '@react-native-community/netinfo';
import { syncQueue } from '../src/api/offlineQueue';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { getAccessToken } from '../src/api/tokenStorage';

export default function RootLayout() {
  usePushNotifications();
  const [hydrated, setHydrated] = useState(false);
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    // 1. Sync on mount if online
    syncQueue();

    // 2. Listen for connection changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('[RootLayout] Connection restored, syncing queue...');
        syncQueue();
      }
    });

    let mounted = true;
    (async () => {
      try {
        await Promise.all([getAccessToken(), initI18n()]);
      } finally {
        if (mounted) setHydrated(true);
      }
    })();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // ✅ Prevent blank screen until fonts AND auth check are done
  if (!hydrated || !fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <SafeAreaProvider>
          <View style={{ flex: 1 }}>
            <OfflineBanner />
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </SafeAreaProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
