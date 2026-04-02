import * as SecureStore from 'expo-secure-store';
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
    try {
      const knownKeys = ['access_token', 'refresh_token', 'user_role', 'app_language'];

      await Promise.all(knownKeys.map((key) => storage.removeItem(key)));
      console.log('[Storage] Known keys cleared successfully');
    } catch (error) {
      console.error('[Storage] Error clearing storage:', error);
    }
  },
};

export default storage;
