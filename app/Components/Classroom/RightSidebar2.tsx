// 'use client';

// import { useEffect, useState } from 'react';
// import Image from 'next/image';
// import { FiVideo, FiSend, FiPaperclip } from 'react-icons/fi';
// import { FaSearch } from 'react-icons/fa';
// import ClassmatesBox from './ClassmatesBox';
// import { useSocket } from '../Contexts/SocketContext';
// import { fetchMessages  } from '../../services/message'; // Import your fetchMessages function

// // Import the Message type from the service to ensure type compatibility
// import type { Message } from '../../services/message';

// export default function RightSidebar2({ classId }: { classId: string }) {
//   const [userName, setUserName] = useState('');
//   const [userId, setUserId] = useState('');
//   const [userRole, setUserRole] = useState('');
//   const [messageInput, setMessageInput] = useState('');
//   const [classMessages, setClassMessages] = useState<Message[]>([]); // State for messages

//   const { socket, notifications, joinClass, sendMessage } = useSocket();

//   // Load user details from localStorage
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const storedUserName = localStorage.getItem('userName') || 'User';
//       const storedUserId = localStorage.getItem('userId') || '';
//       const storedUserRole = localStorage.getItem('userRole') || 'student';
//       setUserName(storedUserName);
//       setUserId(storedUserId);
//       setUserRole(storedUserRole);

//       console.log('Loaded user details from localStorage:', {
//         storedUserName,
//         storedUserId,
//         storedUserRole,
//       });
//     }
//   }, []);

//   // Fetch messages from the API when classId changes
//   useEffect(() => {
//     const loadMessages = async () => {
//       if (classId) {
//         console.log('Fetching messages for classId:', classId);
//         const messages = await fetchMessages(classId);
//         setClassMessages(messages);
//         console.log('Fetched messages:', messages);
//       }
//     };

//     loadMessages();
//   }, [classId]);

//   // Join the class when socket is connected and user details are available
//   useEffect(() => {
//     console.log('Checking conditions for joinClass:', {
//       classId,
//       connected: socket?.connected,
//       userId,
//       userName,
//       userRole,
//     });

//     if (classId && socket?.connected && userId && userName && userRole) {
//       console.log('Attempting to join class:', { classId, userId, userName, userRole });
//       joinClass(classId, userId, userName, userRole);
//     } else {
//       console.log('Waiting for connection or required fields:', {
//         classId,
//         connected: socket?.connected,
//         userId,
//         userName,
//         userRole,
//       });
//     }
//   }, [classId, socket?.connected, userId, userName, userRole, joinClass]);

//   // Handle sending messages
//   const handleSendMessage = () => {
//     if (messageInput.trim() && classId) {
//       console.log('Sending message:', { classId, messageInput });
//       sendMessage(classId, messageInput, 'message');
//       setMessageInput('');
//     } else {
//       console.log('Message input is empty or classId is missing.');
//     }
//   };

//   // Handle "Enter" key press for sending messages
//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   const isConnected = socket?.connected;

//   return (
//     <div className="space-y-6 mt-2">
//       {/* Search Bar */}
//       <div className="flex items-center gap-4">
//         <div className="relative w-66 max-w-md">
//           <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
//           <input
//             type="text"
//             placeholder="Search..."
//             className="pl-12 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>
//       </div>

//       {/* Messages Section */}
//       <div className="bg-white border-[1px] border-[#EBEBEB] rounded-lg shadow-sm">
//         <div className="flex items-center justify-between bg-[#F5F6FF] px-2 py-1 rounded-t-lg">
//           <div className="flex items-center gap-2">
//             <Image
//               src="/profilee.svg"
//               alt={userName}
//               width={28}
//               height={28}
//               className="rounded-full object-cover"
//             />
//             <span className="text-sm font-medium">{userName}</span>
//             <span className="text-xs text-gray-500">
//               {userRole === 'teacher' ? '👨‍🏫' : '👨‍🎓'}
//             </span>
//             {isConnected && (
//               <span className="w-2 h-2 bg-green-500 rounded-full" title="Connected" />
//             )}
//           </div>
//           <FiVideo className="text-gray-500 cursor-pointer hover:text-gray-700" />
//         </div>

//         <div className="h-32 px-3 py-2 text-sm overflow-y-auto">
//           {classMessages.length === 0 ? (
//             <div className="text-gray-400 text-center mt-8">
//               {isConnected ? 'No messages yet' : 'Connecting...'}
//             </div>
//           ) : (
//             <div className="space-y-2">
//               {classMessages.map((message) => (
//                 <div key={message._id} className="text-xs">
//                   <div className="flex items-center gap-1 mb-1">
//                     <span className="font-medium text-gray-700">
//                       {message.sender.name}
//                     </span>
//                     {message.type === 'announcement' && (
//                       <span className="bg-blue-100 text-blue-600 px-1 rounded text-xs">
//                         📢
//                       </span>
//                     )}
//                   </div>
//                   <p className="text-gray-600 break-words">{message.content}</p>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Message Input */}
//         <div className="flex items-center bg-[#f2f2f2] px-2 py-2 rounded-b-lg">
//           <FiPaperclip className="text-gray-500 mr-2 cursor-pointer hover:text-gray-700" />
//           <input
//             type="text"
//             placeholder={isConnected ? 'Ask Query' : 'Connecting...'}
//             value={messageInput}
//             onChange={(e) => setMessageInput(e.target.value)}
//             onKeyPress={handleKeyPress}
//             disabled={!isConnected}
//             className="flex-1 bg-transparent outline-none text-sm disabled:opacity-50"
//           />
//           <button
//             onClick={handleSendMessage}
//             disabled={!isConnected || !messageInput.trim()}
//             className="ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <FiSend className="text-gray-600 cursor-pointer hover:text-black" />
//           </button>
//         </div>
//       </div>

//       {/* Classmates Section */}
//       <ClassmatesBox classId={classId} />
//     </div>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { FiVideo, FiSend, FiPaperclip } from 'react-icons/fi';
import { FaSearch } from 'react-icons/fa';
import ClassmatesBox from './ClassmatesBox';
import { useSocket } from '../Contexts/SocketContext';
import { fetchMessages } from '../../services/message'; // Import the API function
import type { Message } from '../../services/message';

export default function RightSidebar2({ classId }: { classId: string }) {
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [classMessages, setClassMessages] = useState<Message[]>([]); // State for messages

  const { isConnected, joinClass, sendMessage } = useSocket();

  // Load user details from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserName = localStorage.getItem('userName') || 'User';
      const storedUserRole = localStorage.getItem('userRole') || 'student';
      setUserName(storedUserName);
      setUserRole(storedUserRole);
    }
  }, []);

  // Fetch messages from the API when classId changes
  useEffect(() => {
    const loadMessages = async () => {
      if (classId) {
        console.log('Fetching messages for classId:', classId);
        const messages = await fetchMessages(classId);
        setClassMessages(messages);
        console.log('Fetched messages:', messages);
      }
    };

    loadMessages();
  }, [classId]);

  // Join the class when socket is connected
  useEffect(() => {
    if (classId && isConnected) {
      const storedUserName = localStorage.getItem('userName') || 'User';
      const storedUserRole = localStorage.getItem('userRole') || 'student';
      const storedUserId = localStorage.getItem('userId') || '';
      joinClass(classId, storedUserId, storedUserName, storedUserRole);
    }
  }, [classId, isConnected, joinClass]);

  // Handle sending messages
  const handleSendMessage = () => {
    if (!messageInput.trim()) {
      console.error('Message content is required.');
      return;
    }

    if (!classId) {
      console.error('Class ID is missing.');
      return;
    }

    // Send the message with the required format
    const content = messageInput.trim();

    console.log('Sending message:', { classId, content });
    sendMessage(content, classId);
    setMessageInput('');
  };

  // Handle "Enter" key press for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6 mt-2">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative w-66 max-w-md">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-12 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Messages Section */}
      <div className="bg-white border-[1px] border-[#EBEBEB] rounded-lg shadow-sm">
        <div className="flex items-center justify-between bg-[#F5F6FF] px-2 py-1 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Image
              src="/profilee.svg"
              alt={userName}
              width={28}
              height={28}
              className="rounded-full object-cover"
            />
            <span className="text-sm font-medium">{userName}</span>
            <span className="text-xs text-gray-500">
              {userRole === 'teacher' ? '👨‍🏫' : '👨‍🎓'}
            </span>
            {isConnected && (
              <span className="w-2 h-2 bg-green-500 rounded-full" title="Connected" />
            )}
          </div>
          <FiVideo className="text-gray-500 cursor-pointer hover:text-gray-700" />
        </div>

        <div className="h-32 px-3 py-2 text-sm overflow-y-auto">
          {classMessages.length === 0 ? (
            <div className="text-gray-400 text-center mt-8">
              {isConnected ? 'No messages yet' : 'Connecting...'}
            </div>
          ) : (
            <div className="space-y-2">
              {classMessages.map((message) => (
                <div key={message._id} className="text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="font-medium text-gray-700">
                      {message.sender.name}
                    </span>
                    {message.type === 'announcement' && (
                      <span className="bg-blue-100 text-blue-600 px-1 rounded text-xs">
                        📢
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 break-words">{message.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="flex items-center bg-[#f2f2f2] px-2 py-2 rounded-b-lg">
          <FiPaperclip className="text-gray-500 mr-2 cursor-pointer hover:text-gray-700" />
          <input
            type="text"
            placeholder={isConnected ? 'Ask Query' : 'Connecting...'}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isConnected}
            className="flex-1 bg-transparent outline-none text-sm disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!isConnected || !messageInput.trim()}
            className="ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend className="text-gray-600 cursor-pointer hover:text-black" />
          </button>
        </div>
      </div>

      {/* Classmates Section */}
      <ClassmatesBox classId={classId} />
    </div>
  );
}