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
}

interface SocketContextType {
  socket: Socket | null;
  messages: Message[];
  notifications: Message[];
  isConnected: boolean;
  joinClass: (classId: string, userId: string, userName: string, userRole: string) => void;
  sendMessage: (classId: string, content: string, type?: 'message' | 'announcement') => void;
  markNotificationAsRead: (messageId: string) => void;
  clearNotifications: () => void;
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

    newSocket.on('classMessages', (classMessages: Message[]) => {
      console.log('Class messages loaded:', classMessages);
      setMessages(classMessages);
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
      socket.emit('joinClass', { classId, userId, userName, userRole });
      console.log('Joined class:', classId);
    }
  };

  const sendMessage = (classId: string, content: string, type: 'message' | 'announcement' = 'message') => {
    if (socket && isConnected && content.trim()) {
      const messageData = {
        classId,
        content: content.trim(),
        type,
      };

      socket.emit('sendMessage', messageData);
      console.log('Message sent:', messageData);
    }
  };

  const markNotificationAsRead = (messageId: string) => {
    setNotifications(prev => prev.filter(notification => notification._id !== messageId));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        messages,
        notifications,
        isConnected,
        joinClass,
        sendMessage,
        markNotificationAsRead,
        clearNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};