import axios from 'axios';
import { getAccessToken } from '../utils/token';

export interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    role: string;
  };
  classId: string;
  timestamp: string;
  type?: 'message' | 'announcement';
}

interface ApiResponse {
  messages: {
    _id: string;
    content: string;
    sender: {
      _id: string;
      name: string;
      role: string;
    };
    classId: string;
    timestamp: string;
    type?: 'message' | 'announcement';
  }[];
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

export const fetchMessages = async (classId: string): Promise<Message[]> => {
  try {
    const token = getTokenOrRedirect();
    const response = await axios.get<ApiResponse>(
      `https://api.heyitsshubh.me/api/class/${classId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      return response.data.messages.map((msg) => ({
        _id: msg._id,
        content: msg.content,
        sender: {
          _id: msg.sender._id,
          name: msg.sender.name,
          role: msg.sender.role,
        },
        classId: msg.classId,
        timestamp: msg.timestamp,
        type: msg.type,
      }));
    } else {
      console.error('Failed to fetch messages:', response.statusText);
      return [];
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};