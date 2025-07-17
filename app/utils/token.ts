// utils/token.ts
import axios from 'axios';
export const setTokens = (access: string, refresh: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  }
};

export const getAccessToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    redirectToLogin();
    throw new Error('No refresh token found');
  }
  try {
    const res = await axios.post('https://project2-zphf.onrender.com/api/auth/refresh', {
      refreshToken,
    });
    const { accessToken } = res.data;
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      return accessToken;
    }
    redirectToLogin();
    throw new Error('Failed to refresh access token');
  } catch (error) {
    redirectToLogin();
    throw error;
  }
};

const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export const getRefreshToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
};

export const removeTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

export const setResetToken = (resetToken: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('resetToken', resetToken);
  }
};

export const getResetToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('resetToken');
  }
  return null;
};

export const removeResetToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('resetToken');
  }
};

export const setUserId = (userId: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userId', userId);
  }
};

export const getUserId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userId');
  }
  return null;
};

export const removeUserId = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userId');
  }
};