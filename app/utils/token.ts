// utils/token.ts

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

// Add functions for resetToken
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