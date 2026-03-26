import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { getAccessToken } from '../src/tokenStorage';

/**
 * Root Index Component
 *
 * This serves as the primary entry point for the application.
 * It performs an initial authentication check and redirects the user
 * to the appropriate section (authenticated tabs or login screen).
 *
 * This prevents the 'no token' errors caused by the dashboard 
 * rendering before the authentication state is fully resolved.
 */
export default function Index() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await getAccessToken();
        setHasToken(!!token);
      } catch (error) {
        console.error('[RootIndex] Auth check failed:', error);
        setHasToken(false);
      }
    }
    checkAuth();
  }, []);

  // Show a clean loading state while checking authentication
  if (hasToken === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (hasToken) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}
