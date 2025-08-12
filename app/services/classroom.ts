import axios from 'axios';
import { getAccessToken } from '../utils/token';

const API_URL = 'https://project2-zphf.onrender.com/api/class/';

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
  const token = getTokenOrRedirect();
  const response = await axios.post(API_URL, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const joinClassByCode = async (classCode: string) => {
  const token = getTokenOrRedirect();
  const res = await axios.post(
    'https://project2-zphf.onrender.com/api/class/join-by-code',
    { classCode },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
};

export const getJoinedClasses = async (userId: string) => {
  const token = getTokenOrRedirect();
  const res = await axios.get(
    `https://project2-zphf.onrender.com/api/class/all?userId=${userId}&filter=joined`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const getCreatedClasses = async (userId: string) => {
  const token = getTokenOrRedirect();
  const res = await axios.get(
    `https://project2-zphf.onrender.com/api/class/all?userId=${userId}&filter=created`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const deleteClass = async (classId: string) => {
  const token = getTokenOrRedirect();
  const res = await axios.delete(
    `https://project2-zphf.onrender.com/api/class/${classId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const getClassmates = async (classId: string) => {
  if (!classId) throw new Error('classId is required');
  const token = getTokenOrRedirect();
  const res = await axios.get(
    `https://project2-zphf.onrender.com/api/class/classmates/${classId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return Array.isArray(res.data) ? res.data : res.data.classmates;
};

export const leaveClass = async (classId: string) => {
  const token = getTokenOrRedirect();
  const res = await axios.post(
    'https://project2-zphf.onrender.com/api/class/leave',
    { classId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};