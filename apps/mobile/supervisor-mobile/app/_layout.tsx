import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { getAccessToken } from '../src/tokenStorage';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../lib/nativewind-interop';
import '../global.css';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  const { expoPushToken, sendTokenToBackend } = usePushNotifications();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen after the fonts have loaded (or a fatal error was encountered).
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getAccessToken();

        if (token) {
          setInitialRoute('(tabs)');
          if (expoPushToken) {
            console.log('📤 Registering supervisor push token...');
            await sendTokenToBackend(expoPushToken, token);
          }
        } else {
          setInitialRoute('(auth)/login');
        }
      } catch (err) {
        console.error('❌ Auth check error:', err);
        setInitialRoute('(auth)/login');
      } finally {
        setTokenChecked(true); // Mark token check as complete
      }
    };

    // Only run checkAuth if fonts are loaded and token check hasn't been done yet
    // Or if expoPushToken changes after initial check (e.g., user grants permission later)
    if (fontsLoaded && !tokenChecked) {
      checkAuth();
    } else if (fontsLoaded && tokenChecked && initialRoute === '(tabs)' && expoPushToken) {
      // If already logged in and tokenChecked, but expoPushToken just became available, send it
      const sendPushTokenIfLoggedIn = async () => {
        const token = await getAccessToken();
        if (token && expoPushToken) {
          console.log('📤 Registering supervisor push token (late registration)...');
          await sendTokenToBackend(expoPushToken, token);
        }
      };
      sendPushTokenIfLoggedIn();
    }
  }, [fontsLoaded, expoPushToken, tokenChecked, initialRoute, sendTokenToBackend]);

  useEffect(() => {
    const performNavigation = async () => {
      if (tokenChecked && fontsLoaded && initialRoute) {
        console.log(' [ROUTER] Finalizing navigation to:', initialRoute);
        // We use a small timeout to ensure the Stack is ready
        setTimeout(() => {
          router.replace(initialRoute as any);
        }, 100);
      }
    };
    performNavigation();
  }, [tokenChecked, fontsLoaded, initialRoute]);

  if (!fontsLoaded || !tokenChecked || !initialRoute) {
    return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  }

  return (
    // @ts-expect-error: React 19 types omit implicit children, but it's valid at runtime
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
