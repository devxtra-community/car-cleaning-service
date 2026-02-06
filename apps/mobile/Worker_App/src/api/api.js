/* global console */
import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './tokenStorage';

const api = axios.create({
  baseURL: 'http://10.10.3.21:3033',
  timeout: 30000,
});

/* ================= REQUEST ================= */

api.interceptors.request.use(async (config) => {
  const accessToken = await getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

/* ================= RESPONSE ================= */

api.interceptors.response.use(
  (res) => res,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/api/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();

        console.log('REFRESH TOKEN:', refreshToken);

        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post('http://10.10.3.21:3033/api/auth/refresh', {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefresh } = response.data;

        await saveTokens(accessToken, newRefresh);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch (err) {
        console.log('REFRESH ERROR:', err.response?.data || err.message);
        await clearTokens();
        console.log('Refresh failed → logout');

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
