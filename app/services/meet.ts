import axiosInstance from '../lib/axios';
import { getAccessToken } from '../utils/token';

export interface ScheduleMeetPayload {
  title: string;
  description?: string;
  classId: string;
  scheduledDate: string;
  duration: number;
  isPrivate?: boolean;
  maxParticipants?: number;
}

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

export const scheduleMeet = async (data: ScheduleMeetPayload) => {
  getTokenOrRedirect();
  try {
    const response = await axiosInstance.post(
      'https://api.heyitsshubh.me/api/meetings/schedule',
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error scheduling meet:', error);
    throw error;
  }
};

export const fetchMeetingsByClass = async (classId: string) => {
  getTokenOrRedirect();
  try {
    const response = await axiosInstance.get(
      `https://api.heyitsshubh.me/api/meetings/class/${classId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching meetings:', error);
    throw error;
  }
};

export const startMeeting = async (meetingId: string) => {
  getTokenOrRedirect();
  try {
    const response = await axiosInstance.post(
      `https://api.heyitsshubh.me/api/meetings/${meetingId}/start`,
      { status: 'active' }
    );
    return response.data;
  } catch (error) {
    console.error('Error starting meeting:', error);
    throw error;
  }
};

export const joinMeeting = async (meetingId: string) => {
  getTokenOrRedirect();
  try {
    const response = await axiosInstance.post(
      `https://api.heyitsshubh.me/api/meetings/${meetingId}/join`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error('Error joining meeting:', error);
    throw error;
  }
};