import axios from 'axios';


export interface ScheduleMeetPayload {
  title: string;
  description?: string;
  classId: string;
  scheduledDate: string;
  duration: number;
  isPrivate?: boolean;
  maxParticipants?: number;
}

export const scheduleMeet = async (data: ScheduleMeetPayload) => {
  try {
    const response = await axios.post(
      'https://project2-zphf.onrender.com/api/meetings/schedule',
      data,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error scheduling meet:', error);
    throw error;
  }
};

export const fetchMeetingsByClass = async (classId: string) => {
  try {
    const response = await axios.get(
      `https://project2-zphf.onrender.com/api/meetings/class/${classId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching meetings:', error);
    throw error;
  }
};

// ...existing imports and code...

export const startMeeting = async (meetingId: string) => {
  try {
    const response = await axios.post(
      `https://project2-zphf.onrender.com/api/meetings/${meetingId}/start`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error starting meeting:', error);
    throw error;
  }
};