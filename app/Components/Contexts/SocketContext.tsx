// 'use client';

// import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
// import io, { Socket } from 'socket.io-client';

// interface User {
//   _id: string;
//   name: string;
//   email: string;
//   role: 'teacher' | 'student';
// }

// interface NotificationItem {
//   _id: string;
//   content: string;
//   sender: User;
//   classId: string;
//   timestamp: string;
//   type: 'message' | 'announcement' | 'assignment' | 'general' | 'question';
//   isRead?: boolean;
// }

// interface SocketContextType {
//   socket: Socket | null;
//   notifications: NotificationItem[];
//   activeUsers: any[];
//   isConnected: boolean;
//   joinClass: (classId: string, userId: string, userName: string, userRole: string) => void;
//   sendMessage: (classId: string, content: string, type?: string) => void;
//   sendAnnouncement: (classId: string, message: string, urgent?: boolean) => void;
//   askQuestion: (classId: string, question: string, isAnonymous?: boolean) => void;
//   notifyAssignment: (classId: string, assignmentId: string, title: string, dueDate?: string) => void;
//   markNotificationAsRead: (notificationId: string) => void;
//   clearNotifications: () => void;
// }

// const SocketContext = createContext<SocketContextType | undefined>(undefined);

// interface SocketProviderProps {
//   children: ReactNode;
// }

// export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
//   const [socket, setSocket] = useState<Socket | null>(null);
//   const [notifications, setNotifications] = useState<NotificationItem[]>([]);
//   const [activeUsers, setActiveUsers] = useState<any[]>([]);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isClassJoined, setIsClassJoined] = useState(false);

//   useEffect(() => {
//     if (typeof window === 'undefined') return;

//     const SOCKET_URL = 'https://project2-zphf.onrender.com';
//     const token = localStorage.getItem('accessToken');
//     if (!token) return;

//     const newSocket = io(SOCKET_URL, {
//       autoConnect: false,
//       auth: { token },
//       transports: ['websocket', 'polling'],
//       timeout: 20000,
//       forceNew: true
//     });

//     newSocket.connect();

//     newSocket.on('connect', () => {
//       setIsConnected(true);
//       const classId = localStorage.getItem('currentClassId');
//       const userId = localStorage.getItem('userId');
//       const userName = localStorage.getItem('userName');
//       const userRole = localStorage.getItem('userRole');

//       if (classId && userId && userName && userRole) {
//         newSocket.emit('joinClass', { classId, userId, userName, userRole });
//         setIsClassJoined(true);
//       }
//     });

//     newSocket.on('connect_error', (error: any) => {
//       setIsConnected(false);
//       setIsClassJoined(false);
//     });

//     newSocket.on('disconnect', () => {
//       setIsConnected(false);
//       setIsClassJoined(false);
//     });

//     newSocket.on('newMessage', (message: NotificationItem) => {
//       setNotifications((prev) => [message, ...prev]);

//       const currentUserId = localStorage.getItem('userId');
//       if (message.sender._id !== currentUserId && Notification.permission === 'granted') {
//         new Notification(`New message from ${message.sender.name}`, {
//           body: message.content,
//           icon: '/profilee.svg',
//         });
//       }
//     });

//     newSocket.on('classMessages', (classMessages: NotificationItem[]) => {
//       setNotifications(classMessages);
//     });

//     newSocket.on('active_users', (users) => {
//       setActiveUsers(users);
//     });

//     newSocket.on('receive_announcement', (announcement: any) => {
//       const notificationData: NotificationItem = {
//         _id: announcement.id,
//         content: announcement.message,
//         sender: {
//           _id: announcement.userId,
//           name: announcement.userName,
//           email: '',
//           role: announcement.userRole
//         },
//         classId: announcement.classId,
//         timestamp: announcement.timestamp,
//         type: 'announcement'
//       };
//       setNotifications((prev) => [notificationData, ...prev]);
//     });

//     newSocket.on('receive_question', (question: any) => {
//       const notificationData: NotificationItem = {
//         _id: question.id,
//         content: question.question,
//         sender: {
//           _id: question.userId,
//           name: question.isAnonymous ? 'Anonymous' : question.userName,
//           email: '',
//           role: question.userRole
//         },
//         classId: question.classId,
//         timestamp: question.timestamp,
//         type: 'question'
//       };
//       setNotifications((prev) => [notificationData, ...prev]);
//     });

//     newSocket.on('assignment_notification', (assignment: any) => {
//       const notificationData: NotificationItem = {
//         _id: assignment.id,
//         content: `New assignment: ${assignment.title}${assignment.dueDate ? ` (Due: ${new Date(assignment.dueDate).toLocaleDateString()})` : ''}`,
//         sender: {
//           _id: 'system',
//           name: assignment.teacherName,
//           email: '',
//           role: 'teacher'
//         },
//         classId: assignment.classId,
//         timestamp: assignment.timestamp,
//         type: 'assignment'
//       };
//       setNotifications((prev) => [notificationData, ...prev]);
//     });

//     newSocket.on('error', (error: any) => {
//       if (error?.code === 'AUTH_ERROR') return;
//     });

//     setSocket(newSocket);

//     if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
//       Notification.requestPermission();
//     }

//     return () => {
//       newSocket.disconnect();
//       setIsClassJoined(false);
//     };
//   }, []);

//   const joinClass = useCallback((classId: string, userId: string, userName: string, userRole: string) => {
//     if (socket && isConnected) {
//       localStorage.setItem('currentClassId', classId);
//       localStorage.setItem('userId', userId);
//       localStorage.setItem('userName', userName);
//       localStorage.setItem('userRole', userRole);
//       socket.emit('joinClass', { classId, userId, userName, userRole });
//       setIsClassJoined(true);
//     }
//   }, [socket, isConnected]);

//   const sendMessage = useCallback((classId: string, content: string, type: string = 'message') => {
//     if (socket && isConnected && isClassJoined) {
//       socket.emit('sendMessage', { classId, content, type });
//     }
//   }, [socket, isConnected, isClassJoined]);

//   const sendAnnouncement = useCallback((classId: string, message: string, urgent: boolean = false) => {
//     if (socket && isConnected) {
//       socket.emit('send_announcement', { classId, message, urgent });
//     }
//   }, [socket, isConnected]);

//   const askQuestion = useCallback((classId: string, question: string, isAnonymous: boolean = false) => {
//     if (socket && isConnected) {
//       socket.emit('ask_question', { classId, question, isAnonymous });
//     }
//   }, [socket, isConnected]);

//   const notifyAssignment = useCallback((classId: string, assignmentId: string, title: string, dueDate?: string) => {
//     if (socket && isConnected) {
//       socket.emit('notify_assignment', { classId, assignmentId, title, dueDate });
//     }
//   }, [socket, isConnected]);

//   const markNotificationAsRead = useCallback((notificationId: string) => {
//     setNotifications(prev =>
//       prev.map(notif =>
//         notif._id === notificationId
//           ? { ...notif, isRead: true }
//           : notif
//       )
//     );
//   }, []);

//   const clearNotifications = useCallback(() => {
//     setNotifications([]);
//   }, []);

//   const value: SocketContextType = {
//     socket,
//     notifications,
//     activeUsers,
//     isConnected,
//     joinClass,
//     sendMessage,
//     sendAnnouncement,
//     askQuestion,
//     notifyAssignment,
//     markNotificationAsRead,
//     clearNotifications,
//   };

//   return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
// };

// export const useSocket = (): SocketContextType => {
//   const context = useContext(SocketContext);
//   if (!context) {
//     throw new Error('useSocket must be used within a SocketProvider');
//   }
//   return context;
// };

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

  // Only update the state if the messages have changed
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
    localStorage.setItem('currentClassId', classId);
      socket.emit('joinClass', { classId, userId, userName, userRole });
      console.log('Joined class:', classId);
    }
  };
const sendMessage = (
  classId: string,
  content: string,
  type: 'message' | 'announcement' = 'message'
) => {
  const userId = localStorage.getItem('userId');
 // Retrieve userRole from localStorage

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