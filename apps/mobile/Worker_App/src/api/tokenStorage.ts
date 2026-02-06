import * as SecureStore from 'expo-secure-store';

export const saveTokens = async (access: string, refresh: string) => {
  await SecureStore.setItemAsync('accessToken', access);
  await SecureStore.setItemAsync('refreshToken', refresh);
};

export const getAccessToken = async () => SecureStore.getItemAsync('accessToken');

export const getRefreshToken = async () => SecureStore.getItemAsync('refreshToken');

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
};
