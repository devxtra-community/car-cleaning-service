import * as SecureStore from 'expo-secure-store';

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

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    const safeKey = sanitizeKey(key);
    try {
      return await SecureStore.getItemAsync(safeKey);
    } catch (error) {
      console.error(`[Storage] Error getting item ${safeKey} (original: ${key}):`, error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    const safeKey = sanitizeKey(key);
    try {
      await SecureStore.setItemAsync(safeKey, value);
    } catch (error) {
      console.error(`[Storage] Error setting item ${safeKey} (original: ${key}):`, error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    const safeKey = sanitizeKey(key);
    try {
      await SecureStore.deleteItemAsync(safeKey);
    } catch (error) {
      console.error(`[Storage] Error removing item ${safeKey} (original: ${key}):`, error);
    }
  },

  clear: async (): Promise<void> => {
    console.warn('[Storage] clear() not implemented for SecureStore shim');
  },
};

export default storage;
