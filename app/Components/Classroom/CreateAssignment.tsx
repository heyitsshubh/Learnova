import { useState } from 'react';
import { X, Upload, File } from 'lucide-react';
import { createAssignment } from '../../services/assignment';
import { toast, Toaster } from 'react-hot-toast';
import { AxiosError } from 'axios';

export default function CreateAssignmentModal({ onClose, classId }: { onClose: () => void; classId: string }) {
  const [assignmentName, setAssignmentName] = useState('');
  const [descriptionName, setDescriptionName] = useState('');
  const [deadline, setDeadline] = useState('');
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
    console.log('file:', file);

    if (!assignmentName.trim() || !descriptionName.trim() || !classId || classId === '1' || classId === 'undefined') {
      toast.error('Please fill in assignment name, description, and class ID.');
      return;
    }

    if (!deadline) {
      toast.error('Please select a deadline.');
      return;
    }

    setLoading(true);
    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('title', assignmentName);
      formData.append('description', descriptionName);
      formData.append('classId', classId);
      formData.append('dueDate', deadline);
      formData.append('maxMarks', '100');
      formData.append('instructions', '');
      formData.append('allowLateSubmission', 'false');
      formData.append('category', 'assignment');

      // Add file if selected
      if (file) {
        formData.append('attachments', file);
        console.log('File added to FormData:', file.name, file.size);
      }

      // Log FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      // Pass FormData directly to createAssignment
      const response = await createAssignment(formData);
      console.log('Assignment created:', response);
      
      toast.success('Assignment created successfully!');
      
      // Reset form
      setAssignmentName('');
      setDescriptionName('');
      setDeadline('');
      setFile(null);
      
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

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-opacity-40 z-50">
      <Toaster position="top-center" />
      <div className="bg-[#1f1f1f] w-96 max-h-[90vh] overflow-y-auto p-5 rounded-md shadow-md relative text-white border border-gray-500">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Create Assignment</h2>
          <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="text-sm mb-1 block">Assignment name *</label>
        <input
          type="text"
          value={assignmentName}
          onChange={(e) => setAssignmentName(e.target.value)}
          placeholder="Enter assignment name"
          className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <label className="text-sm mb-1 block">Description *</label>
        <textarea
          value={descriptionName}
          onChange={(e) => setDescriptionName(e.target.value)}
          placeholder="Enter description"
          rows={3}
          className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          required
        />

        <label className="text-sm mb-1 block">Select deadline *</label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          min={today}
          className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <label className="text-sm mb-1 block">Attach documents (Optional)</label>
        <div className="w-full bg-gray-800 rounded-md h-20 flex items-center justify-center mb-3 cursor-pointer relative border-2 border-dashed border-gray-600 hover:border-gray-500 transition">
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx,.xls,.xlsx"
          />
          {file ? (
            <div className="text-center">
              <File className="w-6 h-6 text-green-400 mx-auto mb-1" />
              <span className="text-xs text-green-400">File selected</span>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
              <span className="text-xs text-gray-400">Click to upload</span>
            </div>
          )}
        </div>

        {file && (
          <div className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded mb-3">
            <div className="flex items-center gap-2">
              <File className="w-4 h-4 text-green-400" />
              <span className="text-sm truncate">{file.name}</span>
              <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
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
          className="bg-blue-600 text-sm w-full py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleCreateAssignment}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Assignment'}
        </button>
      </div>
    </div>
  );
}