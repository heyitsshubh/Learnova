import React, { useState } from 'react';
import {X} from 'lucide-react';

interface ScheduleMeetModalProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (data: { title: string; date: string;  description: string }) => void;
}

const ScheduleMeetModal: React.FC<ScheduleMeetModalProps> = ({ open, onClose, onSchedule }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date ) {
      alert('Please fill all required fields.');
      return;
    }
    onSchedule({ title, date,  description });
    setTitle('');
    setDate('');
  
    setDescription('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center  bg-opacity-40 z-50">
      <div className="bg-[rgba(51,51,51,1)] rounded-lg shadow-lg p-6 w-full max-w-md relative">
         <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Create Assignment</h2>
          <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Meeting Title"
           style={{backgroundColor: 'rgba(165, 159, 159, 0.35)',color: 'white'}}
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            style={{backgroundColor: 'rgba(165, 159, 159, 0.35)',color: 'white'}}    
            onChange={e => setDescription(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
            <input
            type="date"
            value={date}
            style={{backgroundColor: 'rgba(165, 159, 159, 0.35)',color: 'white'}}
            onChange={e => setDate(e.target.value)}
             className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Schedule
          </button>
        </form>
      </div>
    </div>
  );
};

export default ScheduleMeetModal;