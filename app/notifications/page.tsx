// 'use client';

// import { useState, useEffect } from 'react';
// import AppLayout from '../Components/AppLayout';
// import { FaSearch, FaBell, FaCog, FaUser, FaCalendar } from 'react-icons/fa';
// import { useSocket } from '../Components/Contexts/SocketContext';
// import { X, MessageCircle, Users, BookOpen, HelpCircle } from 'lucide-react';

// interface NotificationItem {
//   _id: string;
//   content: string;
//   sender: {
//     _id: string;
//     name: string;
//     email: string;
//     role: 'teacher' | 'student' | 'system';
//   };
//   classId: string;
//   className?: string;
//   timestamp: string;
//   type: 'message' | 'announcement' | 'assignment' | 'general' | 'question';
//   isRead: boolean;
// }

// const Notifications = () => {
//   const [userName, setUserName] = useState('');
//   const [userId, setUserId] = useState('');
//   const [userRole, setUserRole] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filter, setFilter] = useState<'all' | 'unread' | 'messages' | 'announcements' | 'questions'>('all');

//   const { socket, notifications, markNotificationAsRead, clearNotifications, joinClass } = useSocket();

//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       setUserName(localStorage.getItem('userName') || 'User');
//       setUserId(localStorage.getItem('userId') || 'test-user-id');
//       setUserRole(localStorage.getItem('userRole') || 'student');
//     }
//   }, []);

//   useEffect(() => {
//     if (socket && socket.connected && userId && userName && userRole) {
//       const currentPath = window.location.pathname;
//       if (currentPath.includes('/classroom/')) {
//         const classId = currentPath.split('/classroom/')[1]?.split('/')[0];
//         if (classId) {
//           console.log('Auto-joining class for notifications:', classId);
//           joinClass(classId, userId, userName, userRole);
//         }
//       }
//     }
//   }, [socket, userId, userName, userRole, joinClass]);

//   const filteredNotifications = notifications
//     .filter(notification => !!notification)
//     .map(notification => ({
//       ...notification,
//       isRead: notification.isRead ?? false,
//     }))
//     .filter(notification => {
//       const matchesSearch = notification.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         notification.sender.name.toLowerCase().includes(searchTerm.toLowerCase());

//       let matchesFilter = false;
//       switch (filter) {
//         case 'all':
//           matchesFilter = true;
//           break;
//         case 'unread':
//           matchesFilter = !notification.isRead;
//           break;
//         case 'messages':
//           matchesFilter = notification.type === 'message';
//           break;
//         case 'announcements':
//           matchesFilter = notification.type === 'announcement';
//           break;
//         case 'questions':
//           matchesFilter = notification.type === 'question';
//           break;
//         default:
//           matchesFilter = true;
//       }

//       return matchesSearch && matchesFilter;
//     });

//   const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
//     const date = new Date(notification.timestamp).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });

//     if (!groups[date]) {
//       groups[date] = [];
//     }
//     groups[date].push(notification);
//     return groups;
//   }, {} as Record<string, NotificationItem[]>);

//   const getNotificationIcon = (type: NotificationItem['type'], senderRole: NotificationItem['sender']['role']) => {
//     switch (type) {
//       case 'message':
//         return <MessageCircle className="w-4 h-4" />;
//       case 'announcement':
//         return <FaBell className="w-4 h-4" />;
//       case 'assignment':
//         return <BookOpen className="w-4 h-4" />;
//       case 'question':
//         return <HelpCircle className="w-4 h-4" />;
//       default:
//         return senderRole === 'teacher' ? <FaUser className="w-4 h-4" /> : <Users className="w-4 h-4" />;
//     }
//   };

//   const getIconColor = (type: NotificationItem['type'], isRead: boolean) => {
//     const baseColors = {
//       message: 'bg-blue-100 text-blue-600',
//       announcement: 'bg-yellow-100 text-yellow-600',
//       assignment: 'bg-green-100 text-green-600',
//       question: 'bg-purple-100 text-purple-600',
//       general: 'bg-gray-100 text-gray-600',
//     };

//     if (isRead) {
//       return 'bg-gray-100 text-gray-400';
//     }

//     return baseColors[type] || baseColors.general;
//   };

//   const handleNotificationClick = (notificationId: string) => {
//     markNotificationAsRead(notificationId);
//   };

//   const unreadCount = notifications.filter(n => !n.isRead).length;

//   return (
//     <AppLayout>
//       <div className="pl-4 pr-6 pt-6">
//         <div className="flex justify-between items-center mb-6">
//           <div>
//             <div className="flex items-center gap-3">
//               <h1 className="text-2xl font-semibold">Notifications</h1>
//               {unreadCount > 0 && (
//                 <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
//                   {unreadCount} new
//                 </span>
//               )}
//             </div>
//             <p className="text-sm text-gray-500">{userName} / notifications</p>
//             <p className="text-xs text-gray-400">
//               Socket: {socket?.connected ? 'Connected' : 'Disconnected'} |
//               Total notifications: {notifications.length}
//             </p>
//           </div>
//           <div className="flex items-center gap-4">
//             <button className="p-2 rounded-full hover:bg-gray-200 transition-colors relative">
//               <FaBell className="text-xl text-gray-400" />
//               {unreadCount > 0 && (
//                 <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
//                   {unreadCount > 9 ? '9+' : unreadCount}
//                 </span>
//               )}
//             </button>
//             <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
//               <FaCog className="text-xl text-gray-400" />
//             </button>
//             <div className="relative w-66 max-w-md">
//               <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
//               <input
//                 type="text"
//                 placeholder="Search notifications..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-12 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//           </div>
//         </div>

//         <div className="flex gap-2 mb-6 overflow-x-auto">
//           {[
//             { key: 'all', label: 'All', count: notifications.length },
//             { key: 'unread', label: 'Unread', count: unreadCount },
//             { key: 'messages', label: 'Messages', count: notifications.filter((n) => n.type === 'message').length },
//             { key: 'announcements', label: 'Announcements', count: notifications.filter((n) => n.type === 'announcement').length },
//             { key: 'questions', label: 'Questions', count: notifications.filter((n) => n.type === 'question').length },
//           ].map((tab) => (
//             <button
//               key={tab.key}
//               onClick={() => setFilter(tab.key as 'all' | 'unread' | 'messages' | 'announcements' | 'questions')}
//               className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
//                 filter === tab.key
//                   ? 'bg-blue-600 text-white'
//                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//               }`}
//             >
//               {tab.label} ({tab.count})
//             </button>
//           ))}
//         </div>

//         {unreadCount > 0 && (
//           <div className="flex justify-end mb-4">
//             <button
//               onClick={clearNotifications}
//               className="text-sm text-blue-600 hover:text-blue-800 font-medium"
//             >
//               Mark all as read
//             </button>
//           </div>
//         )}

//         {Object.keys(groupedNotifications).length === 0 ? (
//           <div className="text-center py-12">
//             <FaBell className="mx-auto text-4xl text-gray-300 mb-4" />
//             <h3 className="text-lg font-medium text-gray-600 mb-2">No notifications found</h3>
//             <p className="text-gray-500">
//               {searchTerm ? 'Try adjusting your search terms' : 'New notifications will appear here'}
//             </p>
//             {!socket?.connected && (
//               <p className="text-red-500 text-sm mt-2">
//                 Socket disconnected. Please refresh the page.
//               </p>
//             )}
//           </div>
//         ) : (
//           Object.entries(groupedNotifications)
//             .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
//             .map(([date, items]) => (
//               <div key={date} className="mb-8">
//                 <div className="flex items-center gap-3 mb-4">
//                   <FaCalendar className="text-gray-400" />
//                   <p className="font-semibold text-gray-700">{date}</p>
//                   <div className="flex-1 h-px bg-gray-200"></div>
//                 </div>

//                 <div className="space-y-3">
//                   {items
//                     .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
//                     .map((item) => (
//                       <div
//                         key={item._id}
//                         onClick={() => handleNotificationClick(item._id)}
//                         className={`group flex items-start gap-3 border rounded-lg p-4 bg-white shadow-sm cursor-pointer transition-all hover:shadow-md ${
//                           !item.isRead ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
//                         }`}
//                       >
//                         <div className={`w-10 h-10 flex items-center justify-center rounded-full ${getIconColor(item.type, item.isRead)}`}>
//                           {getNotificationIcon(item.type, item.sender.role)}
//                         </div>
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-center gap-2 mb-1">
//                             <p className="font-semibold text-sm text-gray-800 truncate">
//                               {item.sender.name}
//                             </p>
//                             <span className="text-xs text-gray-500">
//                               {item.sender.role === 'teacher' ? '👨‍🏫' : item.sender.role === 'student' ? '👨‍🎓' : '🤖'}
//                             </span>
//                             {item.type === 'announcement' && (
//                               <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
//                                 📢 Announcement
//                               </span>
//                             )}
//                             {item.type === 'question' && (
//                               <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
//                                 ❓ Question
//                               </span>
//                             )}
//                             {item.className && (
//                               <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
//                                 {item.className}
//                               </span>
//                             )}
//                             {!item.isRead && (
//                               <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
//                             )}
//                           </div>
//                           <p className="text-gray-600 text-sm mb-2 line-clamp-2">
//                             {item.content}
//                           </p>
//                           <div className="flex items-center justify-between">
//                             <p className="text-xs text-gray-400">
//                               {new Date(item.timestamp).toLocaleString()}
//                             </p>
//                             {item.type === 'announcement' && item.content.includes('Live class') && (
//                               <button className="bg-green-100 text-green-700 hover:bg-green-200 text-xs px-3 py-1 rounded">
//                                 {item.content.includes('is starting now') ? 'Join Now' : 'Set Reminder'}
//                               </button>
//                             )}
//                           </div>
//                         </div>
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             handleNotificationClick(item._id);
//                           }}
//                           className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
//                         >
//                           <X className="w-4 h-4 text-gray-400" />
//                         </button>
//                       </div>
//                     ))}
//                 </div>
//               </div>
//             ))
//         )}
//       </div>
//     </AppLayout>
//   );
// };

// export default Notifications;

'use client';

import { useState, useEffect } from 'react';
import AppLayout from '../Components/AppLayout';
import { FaSearch, FaBell, FaCog, FaUser, FaCalendar } from 'react-icons/fa';
import { X, MessageCircle, Users, BookOpen } from 'lucide-react';
import { fetchMessages, } from '../services/message'; // Import fetchMessages

// Define the Message type if not imported from elsewhere
interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    role: 'teacher' | 'student' | 'system';
  };
  classId: string;
  timestamp: string;
  type: 'message' | 'announcement' | 'assignment' | 'general' | 'question';
  isRead?: boolean;
}

interface NotificationItem extends Message {
  className?: string; // Optional class name for display
}

const Notifications = () => {
  const [userName, setUserName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'messages' | 'announcements'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]); // State for notifications

const fetchNotifications = async () => {
  const classId = localStorage.getItem('currentClassId'); // Get the current class ID
  if (!classId) {
    console.error('Class ID is missing.');
    return;
  }

  try {
    const messages = await fetchMessages(classId); // Fetch messages using the API
    const allowedTypes: NotificationItem['type'][] = ['message', 'announcement', 'assignment', 'general', 'question'];
    const formattedMessages = messages.map((msg: any): NotificationItem => ({
      ...msg,
      isRead: false, // Add a default isRead property
      className: 'Class Chat', // Optional: Add a class name for display
      type: allowedTypes.includes(msg.type!) ? msg.type! : 'general',
      sender: {
        _id: msg.sender._id,
        name: msg.sender.name,
        email: msg.sender.email ?? '', // Provide a default value if email is missing
        role: msg.sender.role,
      },
    }));
    setNotifications(formattedMessages);
    console.log('Fetched notifications:', formattedMessages);
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
};

  // Fetch notifications on component load
  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') || 'User');
    }
  }, []);

  // Filter notifications based on search and filter type
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.sender.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'unread' && !notification.isRead) ||
      (filter === 'messages' && notification.type === 'message') ||
      (filter === 'announcements' && notification.type === 'announcement');

    return matchesSearch && matchesFilter;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, NotificationItem[]>);

  const getNotificationIcon = (type: string, senderRole: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-4 h-4" />;
      case 'announcement':
        return <FaBell className="w-4 h-4" />;
      case 'assignment':
        return <BookOpen className="w-4 h-4" />;
      default:
        return senderRole === 'teacher' ? <FaUser className="w-4 h-4" /> : <Users className="w-4 h-4" />;
    }
  };

  const getIconColor = (type: string, isRead: boolean) => {
    const baseColors = {
      message: 'bg-blue-100 text-blue-600',
      announcement: 'bg-yellow-100 text-yellow-600',
      assignment: 'bg-green-100 text-green-600',
      general: 'bg-gray-100 text-gray-600',
    };

    if (isRead) {
      return 'bg-gray-100 text-gray-400';
    }

    return baseColors[type as keyof typeof baseColors] || baseColors.general;
  };

  const handleNotificationClick = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif._id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppLayout>
      <div className="pl-4 pr-6 pt-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{userName} / messages</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-200 transition-colors relative">
              <FaBell className="text-xl text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
              <FaCog className="text-xl text-gray-400" />
            </button>
            <div className="relative w-66 max-w-md">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        {Object.keys(groupedNotifications).length === 0 ? (
          <div className="text-center py-12">
            <FaBell className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No notifications found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'New notifications will appear here'}
            </p>
          </div>
        ) : (
          Object.entries(groupedNotifications)
            .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
            .map(([date, items]) => (
              <div key={date} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <FaCalendar className="text-gray-400" />
                  <p className="font-semibold text-gray-700">{date}</p>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => handleNotificationClick(item._id)}
                      className={`flex items-start gap-3 border rounded-lg p-4 bg-white shadow-sm cursor-pointer transition-all hover:shadow-md ${
                        !item.isRead ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 flex items-center justify-center rounded-full ${getIconColor(
                          item.type || 'general',
                          !!item.isRead
                        )}`}
                      >
                        {getNotificationIcon(item.type || 'general', item.sender.role)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm text-gray-800 truncate">
                            {item.sender.name}
                          </p>
                          <span className="text-xs text-gray-500">
                            {item.sender.role === 'teacher' ? '👨‍🏫' : '👨‍🎓'}
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.content}</p>

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationClick(item._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;