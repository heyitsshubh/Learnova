import React, { useState } from 'react';
import { X } from 'lucide-react';
import { scheduleMeet } from '../../services/meet';
import { toast } from 'react-hot-toast';

interface ScheduleMeetModalProps {
  open: boolean;
  onClose: () => void;
  classId: string;
  onScheduled?: () => void;
}

const ScheduleMeetModal: React.FC<ScheduleMeetModalProps> = ({
  open,
  onClose,
  classId,
  onScheduled,
}) => {
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState(''); // Use datetime-local
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
      console.log('Submitting meeting:', {
    title,
    dateTime,
    description,
    duration,
    maxParticipants,
    isPrivate,
    classId,
  });

    if (!title || !dateTime || !duration) {
      toast.error('Please fill all required fields.');
      return;
    }
    if (Number(duration) < 15) {
      toast.error('Duration must be at least 15 minutes.');
      return;
    }
    if (maxParticipants && Number(maxParticipants) < 2) {
      toast.error('Max Participants must be at least 2.');
      return;
    }
    setLoading(true);
    try {
      const res = await scheduleMeet({
        title,
        description,
        classId,
        scheduledDate: dateTime, // Send full datetime string
        duration: Number(duration),
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        isPrivate,
      });

      if (res && res.success) {
        toast.success('Meeting scheduled successfully!');
        if (onScheduled) onScheduled();
        setTitle('');
        setDateTime('');
        setDescription('');
        setDuration('');
        setMaxParticipants('');
        setIsPrivate(false);
        onClose();
      } else {
        toast.error(res?.message || 'Failed to schedule meet');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to schedule meet');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-opacity-40 z-50">
      <div className="bg-[rgba(51,51,51,1)] rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Schedule Meet</h2>
          <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Meeting Title"
            style={{ backgroundColor: 'rgba(165, 159, 159, 0.35)', color: 'white' }}
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            style={{ backgroundColor: 'rgba(165, 159, 159, 0.35)', color: 'white' }}
            onChange={e => setDescription(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <input
            type="datetime-local"
            value={dateTime}
            style={{ backgroundColor: 'rgba(165, 159, 159, 0.35)', color: 'white' }}
            onChange={e => setDateTime(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="number"
            placeholder="Duration (minutes)"
            min={15}
            style={{ backgroundColor: 'rgba(165, 159, 159, 0.35)', color: 'white' }}
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            placeholder="Max Participants"
            min={2}
            style={{ backgroundColor: 'rgba(165, 159, 159, 0.35)', color: 'white' }}
            value={maxParticipants}
            onChange={e => setMaxParticipants(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="flex items-center text-white">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={e => setIsPrivate(e.target.checked)}
              className="mr-2"
            />
            Private Meeting
          </label>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Scheduling...' : 'Schedule'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ScheduleMeetModal;