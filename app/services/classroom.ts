import axios, { AxiosError } from 'axios';
import { refreshAccessToken } from '../utils/token';

const API_URL = 'https://project2-zphf.onrender.com/api/class/';

const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

const getTokenOrRefresh = async () => {
  let token = localStorage.getItem('accessToken');
  if (!token) {
    try {
      token = await refreshAccessToken();
    } catch {
      redirectToLogin();
      throw new Error('No access token found.');
    }
  }
  return token;
};

export const createClass = async (formData: {
  className: string;
  subject: string;
  privacy: 'public' | 'private';
}) => {
  const token = await getTokenOrRefresh();
  try {
    const response = await axios.post(API_URL, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    if (err.response?.status === 401) {
      const newToken = await refreshAccessToken();
      const response = await axios.post(API_URL, formData, {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      return response.data;
    }
    throw error;
  }
};

export const joinClassByCode = async (classCode: string) => {
  const token = await getTokenOrRefresh();
  try {
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
  } catch (error) {
    const err = error as AxiosError;
    if (err.response?.status === 401) {
      const newToken = await refreshAccessToken();
      const res = await axios.post(
        'https://project2-zphf.onrender.com/api/class/join-by-code',
        { classCode },
        { headers: { Authorization: `Bearer ${newToken}` } }
      );
      return res.data;
    }
    throw error;
  }
};

export const getJoinedClasses = async (userId: string) => {
  const token = await getTokenOrRefresh();
  try {
    const res = await axios.get(
      `https://project2-zphf.onrender.com/api/class/all?userId=${userId}&filter=joined`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (error) {
    const err = error as AxiosError;
    if (err.response?.status === 401) {
      const newToken = await refreshAccessToken();
      const res = await axios.get(
        `https://project2-zphf.onrender.com/api/class/all?userId=${userId}&filter=joined`,
        { headers: { Authorization: `Bearer ${newToken}` } }
      );
      return res.data;
    }
    throw error;
  }
};

export const getCreatedClasses = async (userId: string) => {
  const token = await getTokenOrRefresh();
  try {
    const res = await axios.get(
      `https://project2-zphf.onrender.com/api/class/all?userId=${userId}&filter=created`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (error) {
    const err = error as AxiosError;
    if (err.response?.status === 401) {
      const newToken = await refreshAccessToken();
      const res = await axios.get(
        `https://project2-zphf.onrender.com/api/class/all?userId=${userId}&filter=created`,
        { headers: { Authorization: `Bearer ${newToken}` } }
      );
      return res.data;
    }
    throw error;
  }
};

export const deleteClass = async (classId: string) => {
  const token = await getTokenOrRefresh();
  try {
    const res = await axios.delete(
      `https://project2-zphf.onrender.com/api/class/${classId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (error) {
    const err = error as AxiosError;
    if (err.response?.status === 401) {
      const newToken = await refreshAccessToken();
      const res = await axios.delete(
        `https://project2-zphf.onrender.com/api/class/${classId}`,
        { headers: { Authorization: `Bearer ${newToken}` } }
      );
      return res.data;
    }
    throw error;
  }
};

export const getClassmates = async (classId: string) => {
  if (!classId) throw new Error('classId is required');
  const token = await getTokenOrRefresh();
  try {
    const res = await axios.get(
      `/api/class/classmates/${classId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data.classmates;
  } catch (error) {
    const err = error as AxiosError;
    if (err.response?.status === 401) {
      const newToken = await refreshAccessToken();
      const res = await axios.get(
        `/api/class/classmates/${classId}`,
        { headers: { Authorization: `Bearer ${newToken}` } }
      );
      return res.data.classmates;
    }
    throw error;
  }
};

export const leaveClass = async (classId: string) => {
  const token = await getTokenOrRefresh();
  try {
    const res = await axios.post(
      'https://project2-zphf.onrender.com/api/class/leave',
      { classId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (error) {
    const err = error as AxiosError;
    if (err.response?.status === 401) {
      const newToken = await refreshAccessToken();
      const res = await axios.post(
        'https://project2-zphf.onrender.com/api/class/leave',
        { classId },
        { headers: { Authorization: `Bearer ${newToken}` } }
      );
      return res.data;
    }
    throw error;
  }
};
