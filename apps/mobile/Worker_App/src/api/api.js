import axios from 'axios';

export const API = axios.create({
  baseURL: 'http://192.168.1.7:3033',
  headers: {
    'Content-Type': 'application/json',
  },
});
