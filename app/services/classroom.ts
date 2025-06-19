
import axios from 'axios';

export const createClass = async (data: {
  className: string;
  subject: string;
  privacy: 'public' | 'private';
  createdBy: string;
}) => {
  const token = localStorage.getItem('accessToken'); 

  const response = await axios.post(
    'https://project2-zphf.onrender.com/api/class',
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`, 
      },
    }
  );

  return response.data;
};
