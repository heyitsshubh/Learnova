import axios from 'axios';
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
  const token = getTokenOrRedirect();

  console.log("Sending assignment FormData:");
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  const res = await axios.post(
    API_URL,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
};

export const getAssignments = async (classId: string) => {
  const token = getTokenOrRedirect();
  const res = await axios.get(
    `${API_URL}/class/${classId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
};

export const deleteAssignment = async (assignmentId: string) => {
  const token = getTokenOrRedirect();
  const res = await axios.delete(
    `${API_URL}/${assignmentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
};

export const submitAssignment = async (assignmentId: string, submissionData: FormData) => {
  const token = getTokenOrRedirect();

  console.log("Submitting assignment with data:");
  for (const [key, value] of submissionData.entries()) {
    console.log(key, value);
  }

  const res = await axios.post(
    `${API_URL}/${assignmentId}/submit`,
    submissionData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
};