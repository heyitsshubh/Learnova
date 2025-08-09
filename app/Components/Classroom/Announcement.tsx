'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { useSocket } from '../../Components/Contexts/SocketContext';
import { toast } from 'react-hot-toast';

export default function Announcement({ onClose, classId }: { onClose: () => void, classId: string }) {
  const [message, setMessage] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { sendAnnouncement, socket } = useSocket();

  const handleAnnounce = async () => {
    if (!message.trim()) {
      console.error('Message is required.');
      return;
    }
    if (!classId) {
      console.error('Class ID is missing.');
      return;
    }

    setIsLoading(true);
    
    try {
      const announcementData = {
        message: message.trim(),
        description: description.trim() || undefined,
        classId: classId
      };

      console.log('Sending announcement:', announcementData);
      
      if (sendAnnouncement) {
        sendAnnouncement(classId, message.trim());
      } else if (socket) {
        socket.emit('send_announcement', announcementData);
      }
      toast.success('Announcement sent successfully!'); // <-- Toast on success
      onClose();
    } catch (error) {
      console.error('Failed to send announcement:', error);
      toast.error('Failed to send announcement'); // <-- Toast on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-opacity-40 z-50">
      <div className="bg-[#1f1f1f] w-96 max-h-[90vh] overflow-y-auto p-5 rounded-md shadow-md relative text-white border border-gray-500">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Make Announcement</h2>
          <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <label className="text-sm mb-1 block">Enter Message *</label>
        <input
          type="text"
          value={message}
          style={{backgroundColor: 'rgba(165, 159, 159, 0.35)',color: 'white'}}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter announcement message"
          className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        
        <label className="text-sm mb-1 block">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{backgroundColor: 'rgba(165, 159, 159, 0.35)',color: 'white'}}
          placeholder="Enter detailed description "
          rows={3}
          className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={isLoading}
        />
        
        <button 
          className=" bg-gray-800 text-sm w-full py-2 rounded hover bg-gray-800 transition disabled:opacity-50 cursor-pointer"
          onClick={handleAnnounce}
          disabled={!message.trim() || isLoading}
        >
          {isLoading ? 'Sending...' : 'Announce'}
        </button>
      </div>
    </div>
  );
}