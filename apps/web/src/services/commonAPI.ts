import axios from 'axios';
import SERVER_URL from './serverURL';

export const api = axios.create({
  baseURL: SERVER_URL,
  withCredentials: true,
});

let accessToken: string | null = null;
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

/* ================= REQUEST ================= */

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/* ================= RESPONSE ================= */

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthRoute =
      originalRequest.url?.includes('/api/auth/login') ||
      originalRequest.url?.includes('/api/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      // If refresh already in progress, wait
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (!token) {
              reject(error);
            } else {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            }
          });
        });
      }

      isRefreshing = true;

      try {
        const res = await api.post('/api/auth/refresh');

        const newAccessToken = res.data.accessToken;
        setAccessToken(newAccessToken);

        // Resolve all queued requests
        refreshQueue.forEach((cb) => cb(newAccessToken));
        refreshQueue = [];

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (err) {
        // Refresh failed → logout
        setAccessToken(null);

        refreshQueue.forEach((cb) => cb(null));
        refreshQueue = [];

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
