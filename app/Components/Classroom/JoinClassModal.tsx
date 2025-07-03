import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (classCode: string) => void; 
}

const JoinClassModal: React.FC<Props> = ({ isOpen, onClose, onJoin }) => {
  const [classCode, setClassCode] = useState('');

  if (!isOpen) return null;

  const handleJoin = () => {
    if (!classCode.trim()) {
      alert('Please enter a valid class code');
      return;
    }
    onJoin(classCode); 
    onClose(); 
  };

  return (
    <div className="fixed inset-0  bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-[rgba(51,51,51,1)] p-6 rounded-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-white">Join Class</h2>
        <input
          type="text"
          placeholder="Enter class code"
          value={classCode}
            style={{backgroundColor: 'rgba(165, 159, 159, 0.35)',color: 'white'}}
          onChange={(e) => setClassCode(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />
        <div className="flex justify-end">
          <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-200 rounded">
            Cancel
          </button>
          <button onClick={handleJoin} className="px-4 py-2 bg-gray-800 text-white rounded">
            Join Class
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinClassModal;