import axios from 'axios';
import { getAccessToken } from '../utils/token';

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://your-backend-api.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Authorization token to headers if exists
instance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default instance;
