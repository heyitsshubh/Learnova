import axios from 'axios';
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

export const fetchMessages = async (classId: string): Promise<Message[]> => {
  try {
    const response = await axios.get<ApiResponse>(
      `https://project2-zphf.onrender.com/api/class/${classId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`, // Include token if required
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