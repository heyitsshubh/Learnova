import axios from 'axios';

const API_URL = 'https://project2-zphf.onrender.com/api/class/';

export const createClass = async (formData: {
  className: string;
  subject: string;
  privacy: 'public' | 'private';
}) => {
  const token = localStorage.getItem('accessToken'); // make sure this is set

  if (!token) {
    throw new Error('No access token found.');
  }

  const response = await axios.post(API_URL, formData, {
    headers: {
      Authorization: `Bearer ${token}`, 
    },
  });

  return response.data;
};

export const joinClassByCode = async (classCode: string) => {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('Not authenticated');

  const res = await axios.post(
    'https://project2-zphf.onrender.com/api/class/join-by-code',
    { classCode },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data; // Adjust based on your API's response
};

export const getJoinedClasses = async (userId: string) => {
  const token = localStorage.getItem('accessToken');
  const res = await axios.get(
    `https://project2-zphf.onrender.com/api/class/all?userId=${userId}&filter=joined`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data; // Should return { classes: [...] }
};

export const getCreatedClasses = async (userId: string) => {
  const token = localStorage.getItem('accessToken');
  const res = await axios.get(
    `https://project2-zphf.onrender.com/api/class/all?userId=${userId}&filter=created`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

