import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as secureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { clearTokens, getRefreshToken, saveTokens } from '../tokenStorage';

export const API = axios.create({
  baseURL: 'http://3.80.46.40',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

API.interceptors.request.use(
  async (config) => {
    // If we're currently refreshing the token, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          config.headers.Authorization = `Bearer ${token}`;
          return config;
        })
        .catch((err) => Promise.reject(err));
    }

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
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.error('[API ERROR] 401 Unauthorized for:', originalRequest.url);

      // Don't retry refresh or login endpoints
      if (
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/login')
      ) {
        await clearTokens();
        router.replace('/(auth)/login');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const { data } = await axios.post('http://3.80.46.40/api/auth/refresh', {
          refreshToken,
        });

        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken || refreshToken;
        await saveTokens(newAccessToken, newRefreshToken);

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        console.error('[API] Token refresh failed, redirecting to login');
        processQueue(refreshError, null);
        await clearTokens();
        router.replace('/(auth)/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
