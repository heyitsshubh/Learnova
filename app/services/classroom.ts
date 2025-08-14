import axiosInstance from '../lib/axios';
import { getAccessToken } from '../utils/token';

const API_URL = 'https://api.heyitsshubh.me/api/class/';

const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

const getTokenOrRedirect = () => {
  const token = getAccessToken();
  if (!token) {
    redirectToLogin();
    throw new Error('No access token found.');
  }
  return token;
};

export const createClass = async (formData: {
  className: string;
  subject: string;
  privacy: 'public' | 'private';
}) => {
  getTokenOrRedirect(); // Just to check and redirect if needed
  const response = await axiosInstance.post(API_URL, formData);
  return response.data;
};

export const joinClassByCode = async (classCode: string) => {
  getTokenOrRedirect();
  const res = await axiosInstance.post(
    'https://api.heyitsshubh.me/api/class/join-by-code',
    { classCode }
  );
  return res.data;
};

export const getJoinedClasses = async (userId: string) => {
  getTokenOrRedirect();
  const res = await axiosInstance.get(
    `https://api.heyitsshubh.me/api/class/all?userId=${userId}&filter=joined`
  );
  return res.data;
};

export const getCreatedClasses = async (userId: string) => {
  getTokenOrRedirect();
  const res = await axiosInstance.get(
    `https://api.heyitsshubh.me/api/class/all?userId=${userId}&filter=created`
  );
  return res.data;
};

export const deleteClass = async (classId: string) => {
  getTokenOrRedirect();
  const res = await axiosInstance.delete(
    `https://api.heyitsshubh.me/api/class/${classId}`
  );
  return res.data;
};

export const getClassmates = async (classId: string) => {
  if (!classId) throw new Error('classId is required');
  getTokenOrRedirect();
  const res = await axiosInstance.get(
    `https://api.heyitsshubh.me/api/class/classmates/${classId}`
  );
  return Array.isArray(res.data) ? res.data : res.data.classmates;
};

export const leaveClass = async (classId: string) => {
  getTokenOrRedirect();
  const res = await axiosInstance.post(
    'https://api.heyitsshubh.me/api/class/leave',
    { classId }
  );
  return res.data;
};