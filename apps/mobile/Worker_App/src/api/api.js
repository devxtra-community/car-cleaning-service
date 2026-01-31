import axios from 'axios';

export const API = axios.create({
  baseURL: 'http://10.10.2.230:3033',
  headers: {
    'Content-Type': 'application/json',
  },
});
