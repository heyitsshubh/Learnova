import axios from 'axios';
import { refreshAccessToken } from '../utils/token';

export const createAssignment = async (
  title: string,
  description: string,
  classId: string,
  dueDate: string,
  maxMarks: number,
  instructions: string,
  allowLateSubmission: boolean,
  category: string
) => {
  let token = localStorage.getItem('accessToken');
  if (!token) {
    token = await refreshAccessToken();
  }

  const payload = {
    title,
    description,
    classId,
    dueDate,
    maxMarks,
    instructions,
    allowLateSubmission,
    category,
  };

  console.log("Sending assignment:", payload);

  try {
    const res = await axios.post(
      'https://project2-zphf.onrender.com/api/assign/',
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return res.data;
  } catch (error: any) {
    console.error('Assignment creation error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      token = await refreshAccessToken();
      const res = await axios.post(
        'https://project2-zphf.onrender.com/api/assign/',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
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
  } catch (error: any) {
    if (error.response?.status === 401) {
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

export const getAssignmentDetails = async (assignmentId: string) => {
  let token = localStorage.getItem('accessToken');
  if (!token) {
    token = await refreshAccessToken();
  }
  const res = await axios.get(
    `https://project2-zphf.onrender.com/api/assign/${assignmentId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return res.data;
};