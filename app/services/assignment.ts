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
  category: string,
  file?: File
) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('classId', classId);
  formData.append('dueDate', dueDate);
  formData.append('maxMarks', maxMarks.toString());
  formData.append('instructions', instructions);
  formData.append('allowLateSubmission', allowLateSubmission ? 'true' : 'false');
  formData.append('category', category);
  if (file) {
    formData.append('file', file);
  }
  let token = localStorage.getItem('accessToken');
  if (!token) {
    token = await refreshAccessToken();
  }
  try {
    const res = await axios.post(
      'https://project2-zphf.onrender.com/api/assign',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      token = await refreshAccessToken();
      const res = await axios.post(
        'https://project2-zphf.onrender.com/api/assign',
        formData,
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