import axios, { AxiosError } from 'axios';
import { refreshAccessToken } from '../utils/token';

export const createAssignment = async (formData: FormData) => {
  let token = localStorage.getItem('accessToken');
  if (!token) {
    token = await refreshAccessToken();
  }

  console.log("Sending assignment FormData:");
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  try {
    const res = await axios.post(
      'https://project2-zphf.onrender.com/api/assign',
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Assignment creation error:', axiosError.response?.data || axiosError.message);
    if (axiosError.response?.status === 401) {
      token = await refreshAccessToken();
      const res = await axios.post(
        'https://project2-zphf.onrender.com/api/assign',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return res.data;
    }
    throw error;
  }
};

export const getAssignments = async (classId: string) => {
  let token = localStorage.getItem('accessToken');
  if (!token) {
    token = await refreshAccessToken();
  }
  try {
    const res = await axios.get(
      `https://project2-zphf.onrender.com/api/assign/class/${classId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 401) {
      token = await refreshAccessToken();
      const res = await axios.get(
        `https://project2-zphf.onrender.com/api/assign/class/${classId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return res.data;
    }
    throw error;
  }
};

export const deleteAssignment = async (assignmentId: string) => {
  let token = localStorage.getItem('accessToken');
  if (!token) {
    token = await refreshAccessToken();
  }

  try {
    const res = await axios.delete(
      `https://project2-zphf.onrender.com/api/assign/${assignmentId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Assignment deletion error:', axiosError.response?.data || axiosError.message);
    if (axiosError.response?.status === 401) {
      token = await refreshAccessToken();
      const res = await axios.delete(
        `https://project2-zphf.onrender.com/api/assign/${assignmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return res.data;
    }
    throw error;
  }
};

export const submitAssignment = async (assignmentId: string, submissionData: FormData) => {
  let token = localStorage.getItem('accessToken');
  if (!token) {
    token = await refreshAccessToken();
  }

  console.log("Submitting assignment with data:");
  for (const [key, value] of submissionData.entries()) {
    console.log(key, value);
  }

  try {
    const res = await axios.post(
      `https://project2-zphf.onrender.com/api/assign/${assignmentId}/submit`,
      submissionData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Assignment submission error:', axiosError.response?.data || axiosError.message);
    if (axiosError.response?.status === 401) {
      token = await refreshAccessToken();
      const res = await axios.post(
        `https://project2-zphf.onrender.com/api/assign/${assignmentId}/submit`,
        submissionData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return res.data;
    }
    throw error;
  }
};