import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// FORCE METRO REFRESH - Sanitizing keys for SecureStore compatibility

/**
 * A shim for AsyncStorage using Expo SecureStore.
 * This is useful when AsyncStorage (native module) is failing but SecureStore is working.
 */
/**
 * SecureStore keys must only contain alphanumeric characters, ".", "-", and "_".
 * This function sanitizes common AsyncStorage keys (which often start with "@")
 * to be compatible with SecureStore.
 */
const sanitizeKey = (key: string): string => {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
};

const isWeb = Platform.OS === 'web';

const getWebStorage = (): Storage | null => {
  try {
    if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
      return null;
    }
    return globalThis.localStorage;
  } catch {
    return null;
  }
};

const getWebKeys = (key: string): string[] => {
  const safeKey = sanitizeKey(key);
  return safeKey === key ? [key] : [key, safeKey];
};

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    const safeKey = sanitizeKey(key);
    try {
      if (isWeb) {
        const webStorage = getWebStorage();
        if (!webStorage) return null;

        for (const candidateKey of getWebKeys(key)) {
          const value = webStorage.getItem(candidateKey);
          if (value !== null) return value;
        }
        return null;
      }

      return await SecureStore.getItemAsync(safeKey);
    } catch (error) {
      console.error(`[Storage] Error getting item ${safeKey} (original: ${key}):`, error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    const safeKey = sanitizeKey(key);
    try {
      if (isWeb) {
        const webStorage = getWebStorage();
        if (!webStorage) return;

        webStorage.setItem(key, value);
        if (safeKey !== key) {
          webStorage.removeItem(safeKey);
        }
        return;
      }

      await SecureStore.setItemAsync(safeKey, value);
    } catch (error) {
      console.error(`[Storage] Error setting item ${safeKey} (original: ${key}):`, error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    const safeKey = sanitizeKey(key);
    try {
      if (isWeb) {
        const webStorage = getWebStorage();
        if (!webStorage) return;

        for (const candidateKey of getWebKeys(key)) {
          webStorage.removeItem(candidateKey);
        }
        return;
      }

      await SecureStore.deleteItemAsync(safeKey);
    } catch (error) {
      console.error(`[Storage] Error removing item ${safeKey} (original: ${key}):`, error);
    }
  },

  clear: async (): Promise<void> => {
    try {
      const knownKeys = [
        'accessToken',
        'refreshToken',
        'userRole',
        'access_token',
        'refresh_token',
        'user_role',
        '@app_language',
        '@theme_preference',
        '@offline_requests_queue',
      ];

      await Promise.all(knownKeys.map((key) => storage.removeItem(key)));
      console.log('[Storage] Known keys cleared successfully');
    } catch (error) {
      console.error('[Storage] Error clearing storage:', error);
    }
  },
};

export default storage;
