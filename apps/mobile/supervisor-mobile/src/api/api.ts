import axios from 'axios';

export const API = axios.create({
  baseURL: 'http://10.10.3.182:3033/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});
