import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './tokenStorage';

const BASE_URL = 'http://10.10.3.21:3033';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

/* ================= AUTH EXCLUDED ROUTES ================= */

const AUTH_EXCLUDED_URLS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];

/* ================= REQUEST INTERCEPTOR ================= */

api.interceptors.request.use(
  async (config) => {
    const isAuthExcluded = AUTH_EXCLUDED_URLS.some((url) => config.url?.includes(url));

    if (isAuthExcluded) return config;

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

    const isAuthExcluded = AUTH_EXCLUDED_URLS.some((url) => originalRequest?.url?.includes(url));

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthExcluded) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();

        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });

        const { accessToken, refreshToken: newRefresh } = response.data;

        await saveTokens(accessToken, newRefresh);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        console.error('REFRESH FAILED:', refreshError.response?.data || refreshError.message);

        await clearTokens();

        // OPTIONAL: redirect to login
        // window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
