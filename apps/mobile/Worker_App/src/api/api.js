import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './tokenStorage';

const api = axios.create({
  baseURL: `http://10.10.1.164:8081`,
  timeout: 10000,
});

/* ================= REQUEST INTERCEPTOR ================= */

api.interceptors.request.use(
  async (config) => {
    const accessToken = await getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(`/http://10.10.1.164:8081/auth/refresh`, { refreshToken });

        const { accessToken, refreshToken: newRefresh } = res.data;

        await saveTokens(accessToken, newRefresh);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch (err) {
        await clearTokens();
        // 🔁 navigate to Login screen
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);
