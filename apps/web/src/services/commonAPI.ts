import axios from 'axios';
import SERVER_URL from './serverURL';

export const api = axios.create({
  baseURL: SERVER_URL,
  withCredentials: true, // IMPORTANT for cookies
  timeout: 60000, // 60 seconds timeout
});

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

api.interceptors.request.use((config) => {
  // Don't add Authorization header to login/refresh requests if we are about to refresh
  const isAuthRequest =
    config.url && (config.url.includes('/auth/login') || config.url.includes('/auth/refresh'));

  if (accessToken && !isAuthRequest) {
    if (config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }
  return config;
});

let refreshTokenPromise: Promise<string | null> | null = null;

export const refreshSession = async (): Promise<string | null> => {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    try {
      console.log('[AUTH] Refreshing session...');
      const res = await api.post('/api/auth/refresh');
      const newAccessToken = res.data.accessToken;

      if (!newAccessToken) {
        throw new Error('No access token in refresh response');
      }

      setAccessToken(newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('[AUTH] Refresh failed:', error);
      setAccessToken(null);
      localStorage.removeItem('hasSession');

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return null;
    } finally {
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Prevent infinite loop on auth endpoints
      if (
        originalRequest.url &&
        (originalRequest.url.includes('/auth/refresh') ||
          originalRequest.url.includes('/auth/login'))
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const newToken = await refreshSession();
        if (newToken) {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
