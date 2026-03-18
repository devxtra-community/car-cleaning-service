import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './tokenStorage';

const BASE_URL = 'http://3.80.46.40:3030';

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

    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/* ================= RESPONSE INTERCEPTOR ================= */

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthExcluded) {
      // ... existing refresh logic ...
    }

    // --- Offline Queue Handling ---
    const isNetworkError = !error.response && error.code !== 'ECONNABORTED';
    const isWriteMethod = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(originalRequest?.method?.toUpperCase());

    if (isNetworkError && isWriteMethod && !originalRequest?._noQueue) {
      try {
        const { enqueueRequest } = require('./offlineQueue');
        await enqueueRequest({
          url: originalRequest.url,
          method: originalRequest.method,
          data: originalRequest.data,
          headers: originalRequest.headers
        });
        // Return a resolved promise with a special "queued" flag
        return Promise.resolve({ data: { success: true, queued: true, message: 'Request queued for offline sync' } });
      } catch (enqueueErr) {
        console.error('[API] Failed to enqueue request:', enqueueErr);
      }
    }

    console.error('[API Response Error]', {
      url: originalRequest?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);

export default api;
