'use client';

import { useState } from 'react';
import { X, } from 'lucide-react';

export default function Announcement({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [description, setDescription] = useState('');

  const handleAnnounce = () => {
    // Handle announcement logic here
    
    // TODO: Add API call to create announcement
    // createAnnouncement({ message, description, file });
    
    onClose();
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
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter announcement message"
          className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <label className="text-sm mb-1 block">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter detailed description (optional)"
          rows={3}
          className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />


        <button 
          className="bg-blue-600 text-sm w-full py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAnnounce}
          disabled={!message.trim()}
        >
          Announce
        </button>
      </div>
    </div>
  );
}