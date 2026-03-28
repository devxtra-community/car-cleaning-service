import axios from 'axios';
import SERVER_URL from './serverURL';

export const api = axios.create({
  baseURL: SERVER_URL,
  withCredentials: true, // IMPORTANT for cookies
  timeout: 10000, // 10 seconds timeout
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

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string | null) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Prevent infinite loop
      if (
        originalRequest.url &&
        (originalRequest.url.includes('/auth/refresh') ||
          originalRequest.url.includes('/auth/login'))
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token: string | null) => {
            if (!token) {
              return reject(error);
            }
            // Re-create the request with the new token
            originalRequest._retry = true;
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('Intercepted 401: Attempting token refresh...');
        const res = await api.post('/api/auth/refresh');
        const newAccessToken = res.data.accessToken;

        if (!newAccessToken) {
          throw new Error('No access token in refresh response');
        }

        setAccessToken(newAccessToken);
        isRefreshing = false;
        onRefreshed(newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        setAccessToken(null);
        onRefreshed(null); // reject all subscribers
        localStorage.removeItem('hasSession');
        // Prevent redirect if we are already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
