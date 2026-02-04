/* global console */

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API = axios.create({
  baseURL: 'http://10.10.3.21:3033',
  timeout: 15000,
});

/* ================= REQUEST INTERCEPTOR ================= */

API.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('access_token');

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      console.log('NETWORK ERROR');
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      console.log('401 — Session expired');

      await SecureStore.deleteItemAsync('access_token');

      const { router } = await import('expo-router');
      router.replace('/');
    }

    return Promise.reject(error);
  }
);
