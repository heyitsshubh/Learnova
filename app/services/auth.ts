// services/auth.ts
import axios from '../lib/axios';

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

interface ResetPasswordPayload {

  newPassword: string;
  resetToken: string;

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
      Authorization: `Bearer ${resetToken}`, // Pass the token in the Authorization header
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