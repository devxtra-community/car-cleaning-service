import storage from '../utils/storage';

const ACCESS_TOKEN_KEYS = ['accessToken', 'access_token'];
const REFRESH_TOKEN_KEYS = ['refreshToken', 'refresh_token'];
const USER_ROLE_KEYS = ['userRole', 'user_role'];

const getFirstStoredValue = async (keys: string[]) => {
  for (const key of keys) {
    const value = await storage.getItem(key);
    if (value) return value;
  }
  return null;
};

export const saveTokens = async (access: string, refresh: string) => {
  await storage.setItem('accessToken', access);
  await storage.setItem('refreshToken', refresh);
  await storage.removeItem('access_token');
  await storage.removeItem('refresh_token');
};

export const saveUserRole = async (role: string) => {
  await storage.setItem('userRole', role);
  await storage.removeItem('user_role');
};

export const getUserRole = async () => getFirstStoredValue(USER_ROLE_KEYS);

export const getAccessToken = async () => getFirstStoredValue(ACCESS_TOKEN_KEYS);

export const getRefreshToken = async () => getFirstStoredValue(REFRESH_TOKEN_KEYS);

export const clearTokens = async () => {
  await Promise.all([
    ...ACCESS_TOKEN_KEYS.map((key) => storage.removeItem(key)),
    ...REFRESH_TOKEN_KEYS.map((key) => storage.removeItem(key)),
    ...USER_ROLE_KEYS.map((key) => storage.removeItem(key)),
  ]);
};
