// services/auth.ts
import axios from '../lib/axios';

export type UserRole = 'teacher' | 'student';

interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

interface OtpPayload {
  email: string;
  otp: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface forgotpasswordayload {
  email: string;
}

interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export const signup = async (payload: SignupPayload) => {
  const res = await axios.post('/signup', payload);
  return res.data;
};

export const verifyOtp = async (payload: OtpPayload) => {
  const res = await axios.post('/verify-otp', payload);
  return res.data;
};

export const login = async (payload: LoginPayload) => {
  const res = await axios.post('/login', payload);
  return res.data;
};

export const forgotPassword = async (payload: forgotpasswordayload) => {
  const res = await axios.post('/forgot-password', payload);
  return res.data;
};

export const verifyOtpp = async (payload: VerifyOtpPayload) => {
  const res = await axios.post('/otp-verify', payload);
  return res.data;
};

export const resetPassword = async (payload: { newPassword: string }, resetToken: string) => {
  const res = await axios.put('/reset-password', payload, {
    headers: {
      Authorization: `Bearer ${resetToken}`,
    },
  });
  return res.data;
};

export const resendOtp = async (payload: { email: string }) => {
  const res = await axios.post('/resendotp', payload);
  return res.data;
};

export const resend = async (payload: { email: string }) => {
  const res = await axios.post('/otp-verify', payload);
  return res.data;
};

export const getCurrentUserProfile = async () => {
  const endpoints = ['/profile', '/user/profile', '/profile/role', '/user/profile/role'];
  let lastError: unknown;

  for (const endpoint of endpoints) {
    try {
      const res = await axios.get(endpoint);
      return res.data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('Failed to fetch user profile');
};

export const updateUserRole = async (role: UserRole) => {
  const payload = { role };
  const attempts = [
    () => axios.put('/profile', payload),
    () => axios.patch('/profile', payload),
    () => axios.put('/user/profile', payload),
    () => axios.patch('/user/profile', payload),
    () => axios.put('/profile/role', payload),
    () => axios.patch('/profile/role', payload),
    () => axios.put('/user/profile/role', payload),
    () => axios.patch('/user/profile/role', payload),
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const res = await attempt();
      return res.data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('Failed to update user role');
};