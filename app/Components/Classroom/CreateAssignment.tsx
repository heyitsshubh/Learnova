import { useState } from 'react';
import { X, Upload, File } from 'lucide-react';
import { createAssignment } from '../../services/assignment'; // <-- Import the API
import { toast, Toaster } from 'react-hot-toast';
import { AxiosError } from 'axios';

export default function CreateAssignmentModal({ onClose, classId }: { onClose: () => void; classId: string }) {
  const [assignmentName, setAssignmentName] = useState('');
  const [descriptionName, setDescriptionName] = useState('');
  const [deadline, setDeadline] = useState('2035-06-06');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

const handleCreateAssignment = async () => {
   console.log('assignmentName:', assignmentName);
  console.log('descriptionName:', descriptionName);
  console.log('classId:', classId);
  console.log('deadline:', deadline);
  if (!assignmentName.trim() || !descriptionName.trim() || !classId || classId === '1' || classId === 'undefined') {
    alert('Please fill in assignment name, description, and class ID.');
    return;
  }
    setLoading(true);
    try {
      await createAssignment(
        assignmentName,
        descriptionName,
        classId,
        deadline,
        100,
        '', // instructions
        false,
        'assignment'
      );
      toast.success('Assignment created successfully!');
      setTimeout(onClose, 1500);
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorData = axiosError.response?.data as { message?: string } | undefined;
      const message = errorData?.message || 'Failed to create assignment!';
      toast.error(message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center  bg-opacity-40 z-50">
      <Toaster position="top-center" />
      <div className="bg-[#1f1f1f] w-96 p-5 rounded-md shadow-md relative text-white border border-gray-500">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Create Assignment</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <label className="text-sm mb-1 block">Assignment name</label>
        <input
          type="text"
          value={assignmentName}
          onChange={(e) => setAssignmentName(e.target.value)}
          placeholder="Enter assignment name"
          className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none"
        />

        <label className="text-sm mb-1 block">Description</label>
        <input
          type="text"
          value={descriptionName}
          onChange={(e) => setDescriptionName(e.target.value)}
          placeholder="Enter description"
          className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none"
        />

        <label className="text-sm mb-1 block">Select deadline</label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none"
        />

        <label className="text-sm mb-1 block">Attach documents</label>
        <div className="w-full bg-gray-800 rounded-md h-28 flex items-center justify-center mb-3 cursor-pointer relative">
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileChange}
          />
          <Upload className="w-6 h-6 text-gray-300" />
        </div>

        {file && (
          <div className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded mb-3">
            <div className="flex items-center gap-2">
              <File className="w-4 h-4" />
              <span className="text-sm truncate">{file.name}</span>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-red-400 text-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          className="bg-gray-900 text-sm w-full py-2 rounded border border-gray-600 hover:bg-gray-800 transition"
          onClick={handleCreateAssignment}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create'}
        </button>
      </div>
    </div>
  );
}