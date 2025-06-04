// services/auth.ts
import axios from '../lib/axios';

interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export const signup = async (payload: SignupPayload) => {
  const res = await axios.post('/signup', payload);
  return res.data;
};

export const verifyOtp = async (payload: VerifyOtpPayload) => {
  const res = await axios.post('/verify-otp', payload);
  return res.data;
};