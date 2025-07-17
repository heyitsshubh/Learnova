import axios from 'axios';

export const createAssignment = async (
  name: string,
  description: string,
  deadline: string,
  file?: File
) => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('deadline', deadline);
  if (file) {
    formData.append('file', file);
  }
  const token = localStorage.getItem('accessToken');
  const res = await axios.post(
    'https://project2-zphf.onrender.com/api/assignment/create',
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