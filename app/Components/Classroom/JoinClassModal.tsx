import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (classCode: string) => void; // Callback to handle joining the class
}

const JoinClassModal: React.FC<Props> = ({ isOpen, onClose, onJoin }) => {
  const [classCode, setClassCode] = useState('');

  if (!isOpen) return null;

  const handleJoin = () => {
    if (!classCode.trim()) {
      alert('Please enter a valid class code');
      return;
    }
    onJoin(classCode); // Call the onJoin callback with the class code
    onClose(); // Close the modal after joining
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Join Class</h2>
        <input
          type="text"
          placeholder="Enter class code"
          value={classCode}
          onChange={(e) => setClassCode(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />
        <div className="flex justify-end">
          <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-200 rounded">
            Cancel
          </button>
          <button onClick={handleJoin} className="px-4 py-2 bg-blue-600 text-white rounded">
            Join Class
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinClassModal;