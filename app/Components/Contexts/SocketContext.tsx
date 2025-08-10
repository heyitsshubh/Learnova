'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    role: 'teacher' | 'student';
  };
  classId: string;
  timestamp: string;
  type: 'message' | 'announcement';
  isRead?: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  messages: Message[];
  notifications: Message[];
  isConnected: boolean;
  joinClass: (classId: string, userId: string, userName: string, userRole: string) => void;
  sendMessage: (classId: string, content: string, type?: 'message' | 'announcement') => void;
  markNotificationAsRead: (messageId: string) => void;
    setNotifications: React.Dispatch<React.SetStateAction<Message[]>>;
  clearNotifications: () => void;
  sendAnnouncement: (classId: string, message: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const newSocket = io('https://project2-zphf.onrender.com', {
      auth: {
        token: localStorage.getItem('accessToken'),
      },
      autoConnect: false,
    });

    const token = localStorage.getItem('accessToken');
    if (token) {
      newSocket.connect();
    }

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('newMessage', (message: Message) => {
      console.log('New message received:', message);
      setMessages(prev => [...prev, message]);

      const currentUserId = localStorage.getItem('userId');
      if (message.sender._id !== currentUserId) {
        setNotifications(prev => [...prev, message]);

        if (typeof window !== 'undefined' && Notification.permission === 'granted') {
          new Notification(`New message from ${message.sender.name}`, {
            body: message.content,
            icon: '/profilee.svg'
          });
        }
      }
    });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newSocket.on('receive_announcement', (announcement: any) => {
    console.log('Announcement received:', announcement);
    setNotifications(prev => [
      ...prev,
      {
        _id: announcement.id || Date.now().toString(),
        content: announcement.message,
        sender: {
          _id: announcement.userId,
          name: announcement.userName,
          email: '', // Add if available
          role: announcement.userRole || 'teacher',
        },
        classId: announcement.classId,
        timestamp: announcement.timestamp || new Date().toISOString(),
        type: 'announcement',
        isRead: false,
      }
    ]);
    // Optionally, show a browser notification
    if (typeof window !== 'undefined' && Notification.permission === 'granted') {
      new Notification(`New Announcement from ${announcement.userName}`, {
        body: announcement.message,
        icon: '/profilee.svg'
      });
    }
  });


newSocket.on('classMessages', (classMessages: Message[]) => {
  console.log('Class messages loaded:', classMessages);
  setMessages((prevMessages) => {
    const isSame = JSON.stringify(prevMessages) === JSON.stringify(classMessages);
    if (!isSame) {
      return classMessages;
    }
    return prevMessages;
  });
});

    newSocket.on('error', (error: unknown) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      newSocket.disconnect();
    };
  }, []);

const joinClass = (classId: string, userId: string, userName: string, userRole: string) => {
  if (socket && isConnected) {
    const isClassCreator = localStorage.getItem('isClassCreator') === 'true';
    const role = isClassCreator ? 'teacher' : userRole;

    localStorage.setItem('currentClassId', classId);
    localStorage.setItem('userId', userId);
    localStorage.setItem('userName', userName);
    socket.emit('joinClass', { classId, userId, userName, userRole: role });
    console.log('Joined class:', { classId, userId, userName, userRole: role });
  }
};
const sendMessage = (
  classId: string,
  content: string,
  type: 'message' | 'announcement' = 'message'
) => {
  const userId = localStorage.getItem('userId')

  if (socket && isConnected && content.trim() && userId ) {
    const messageData = {
      classId,
      content: content.trim(),
      type,
      senderId: userId,
     
    };
    socket.emit('sendMessage', messageData);
    console.log('Message sent:', messageData);
  } else {
    console.error('Failed to send message: Missing required fields.');
  }
};

  const markNotificationAsRead = (messageId: string) => {
    setNotifications(prev => prev.filter(notification => notification._id !== messageId));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };
const sendAnnouncement = (classId: string, message: string, description?: string) => {
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  const userRole = 'teacher'; 

  console.log('sendAnnouncement called with:', {
    classId,
    message,
    description,
    userId,
    userName,
    userRole,
    isConnected,
  });

  if (socket && isConnected && classId && message.trim() && userId && userName) {
    socket.emit('send_announcement', {
      classId,
      message: message.trim(),
      description: description?.trim() || '', 
      userId,
      userName,
      userRole, 
    });
    console.log('Announcement sent:', { classId, message, description });
  } else {
    console.error('Failed to send announcement: Missing required fields.', {
      classId,
      message,
      description,
      userId,
      userName,
      userRole,
      isConnected,
    });
  }
};
  


  return (
    <SocketContext.Provider
      value={{
        socket,
        messages,
        notifications,
        setNotifications,
        isConnected,
        joinClass,
        sendMessage,
        markNotificationAsRead,
        clearNotifications,
        sendAnnouncement,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};