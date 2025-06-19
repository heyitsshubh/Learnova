'use client';
import React, { useState } from 'react';
import { getUserId } from '../../utils/token';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (formData: {
    className: string;
    subject: string;
    privacy: 'public' | 'private';
    createdBy: string;
  }) => Promise<string>; 
}

const CreateClassModal: React.FC<Props> = ({ isOpen, onClose, onCreate }) => {
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [error, setError] = useState<string | null>(null);
  const [createdClassCode, setCreatedClassCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const createdBy = getUserId(); 
    if (!createdBy) {
      setError('User not authenticated. Please log in again.');
      return;
    }

    if (!className || !subject) {
      setError('All fields are required.');
      return;
    }

    try {
      setError(null);
      const classCode = await onCreate({ className, subject, privacy, createdBy });
      setCreatedClassCode(classCode); // Show generated class code
    } catch (err) {
      setError('Failed to create class. Please try again.');
    }
  };

  const handleClose = () => {
    setClassName('');
    setSubject('');
    setPrivacy('public');
    setError(null);
    setCreatedClassCode(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[rgba(51,51,51,0.04)] flex justify-center items-center z-50">
      <div className="bg-[rgba(51,51,51,1)] p-6 rounded-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-white">Create Class</h2>
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        {!createdClassCode ? (
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Enter class name"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full border p-2 rounded mb-4 text-white"
            />
            <input
              type="text"
              placeholder="Enter subject name"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border p-2 rounded mb-4 text-white"
            />
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as 'public' | 'private')}
              className="w-full border p-2 rounded mb-4"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="mr-2 px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-700 text-white rounded"
              >
                Create Class
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-green-600 font-semibold mb-4">
              Class created successfully!
            </p>
            <p className="text-sm mb-2">Share this class code with others to join:</p>
            <div className="text-lg font-mono bg-gray-100 px-4 py-2 rounded inline-block mb-4">
              {createdClassCode}
            </div>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateClassModal;
