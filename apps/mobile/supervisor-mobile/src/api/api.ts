import axios from 'axios';
import * as secureStore from 'expo-secure-store';

export const API = axios.create({
  baseURL: 'http://10.10.3.182:3033/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

API.interceptors.request.use(async (config) => {
  const token = await secureStore.getItemAsync('access_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
