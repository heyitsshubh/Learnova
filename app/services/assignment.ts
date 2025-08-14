import axiosInstance from '../lib/axios';
import { getAccessToken } from '../utils/token';

const API_URL = 'https://api.heyitsshubh.me/api/assign';

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

export const createAssignment = async (formData: FormData) => {
  getTokenOrRedirect();

  console.log("Sending assignment FormData:");
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  const res = await axiosInstance.post(
    API_URL,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
};

export const getAssignments = async (classId: string) => {
  getTokenOrRedirect();
  const res = await axiosInstance.get(
    `${API_URL}/class/${classId}`
  );
  return res.data;
};

export const deleteAssignment = async (assignmentId: string) => {
  getTokenOrRedirect();
  const res = await axiosInstance.delete(
    `${API_URL}/${assignmentId}`
  );
  return res.data;
};

export const submitAssignment = async (assignmentId: string, submissionData: FormData) => {
  getTokenOrRedirect();

  console.log("Submitting assignment with data:");
  for (const [key, value] of submissionData.entries()) {
    console.log(key, value);
  }

  const res = await axiosInstance.post(
    `${API_URL}/${assignmentId}/submit`,
    submissionData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
};