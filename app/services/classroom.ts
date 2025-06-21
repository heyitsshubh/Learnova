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

export const getClassByCode = async (classCode: string) => {
  const token = localStorage.getItem('accessToken');

  if (!token) throw new Error('Not authenticated');

  const res = await axios.get(`${API_URL}code/${classCode}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data; // ✅ contains class object
};



