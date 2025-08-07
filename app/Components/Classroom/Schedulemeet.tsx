import React, { useState } from 'react';

interface ScheduleMeetModalProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (data: { title: string; time: string; description: string }) => void;
}

const ScheduleMeet: React.FC<ScheduleMeetModalProps> = ({ open, onClose, onSchedule }) => {
const [title, setTitle] = useState('');
const [time, setTime] = useState('');
const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !time) {
      alert('Please fill all required fields.');
      return;
    }
    onSchedule({ title,  time, description });
    setTitle('');
    setTime('');
    setDescription('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center  bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-xl font-semibold mb-4">Schedule a Meet</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Meeting Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={3}
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

export default ScheduleMeet;