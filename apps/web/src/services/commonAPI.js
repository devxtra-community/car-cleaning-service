import axios from 'axios';

export const API = axios.create({
  baseURL: 'http://192.168.1.7:3033',
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      const res = await API.post(
        '/auth/refresh',
        {},
        {
          withCredentials: true,
        }
      );

      window.localStorage.setItem('accessToken', res.data.accessToken);

      original.headers.Authorization = `Bearer ${res.data.accessToken}`;

      return API(original);
    }

    return Promise.reject(err);
  }
);
