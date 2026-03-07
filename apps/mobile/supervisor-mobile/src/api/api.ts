import axios from 'axios';
import * as secureStore from 'expo-secure-store';

export const API = axios.create({
  baseURL: 'http://10.10.1.203:3033',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

API.interceptors.request.use(
  async (config) => {
    try {
      const token = await secureStore.getItemAsync('accessToken');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(
          `[API INTERCEPTOR] Added token to ${config.method?.toUpperCase()} ${config.url}`
        );
      } else {
        console.warn(
          `[API INTERCEPTOR] No token found for ${config.method?.toUpperCase()} ${config.url}`
        );
      }
    } catch (error) {
      console.error('[API INTERCEPTOR] Error fetching token:', error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('[API ERROR] 401 Unauthorized for:', error.config.url);
    }
    return Promise.reject(error);
  }
);

export default API;
