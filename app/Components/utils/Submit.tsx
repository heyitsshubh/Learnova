'use client';

import { useState } from 'react';
import { X, Upload, File, CheckCircle } from 'lucide-react';
import { submitAssignment } from '../../services/assignment';

interface SubmitAssignmentProps {
  onClose: () => void;
  assignmentId: string;
  classId: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export default function SubmitAssignment({ onClose, assignmentId }: SubmitAssignmentProps) {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!description.trim() && !file) {
      setError('Please provide either a description or attach a file');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Use FormData to match backend schema: content and attachments
      const formData = new FormData();
      
      // Add content field
      if (description.trim()) {
        formData.append('content', description.trim());
      } else {
        formData.append('content', 'Assignment submission'); // Default content if only file
      }
      
      // Add file as attachment
      if (file) {
        formData.append('attachments', file);
      }

      console.log('FormData being sent:');
      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      await submitAssignment(assignmentId, formData);

      // Show success toast
      setShowSuccessToast(true);

      // Close modal and refresh page after a delay
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Submit error:', error);
      const apiError = error as ApiError;
      setError(apiError.response?.data?.message || apiError.message || 'Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-right duration-300">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <CheckCircle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Assignment Submitted Successfully!</p>
              <p className="text-sm opacity-90">Your assignment has been submitted.</p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
        <div className="bg-[#1f1f1f] w-96 max-h-[90vh] overflow-y-auto p-5 rounded-md shadow-md relative text-white border border-gray-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Submit Assignment</h2>
            <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded" disabled={isSubmitting}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="bg-red-600 text-white p-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Success message when submitting */}
          {showSuccessToast && (
            <div className="bg-green-600 text-white p-3 rounded mb-4 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Assignment submitted successfully!
            </div>
          )}

          <label className="text-sm mb-1 block">Assignment Content</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter your assignment submission text (optional if file is attached)"
            rows={4}
            className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            disabled={isSubmitting || showSuccessToast}
          />

          <label className="text-sm mb-1 block">Attach Assignment File (Optional)</label>
          <div className="w-full bg-gray-800 rounded-md h-20 flex items-center justify-center mb-3 cursor-pointer relative border-2 border-dashed border-gray-600 hover:border-gray-500 transition">
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
              disabled={isSubmitting || showSuccessToast}
            />
            {file ? (
              <div className="text-center">
                <File className="w-6 h-6 text-green-400 mx-auto mb-1" />
                <span className="text-xs text-green-400">File selected</span>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <span className="text-xs text-gray-400">Click to upload assignment</span>
              </div>
            )}
          </div>

          {file && (
            <div className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded mb-3">
              <div className="flex items-center gap-2">
                <File className="w-4 h-4 text-green-400" />
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-gray-400">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-gray-400 hover:text-red-400 text-sm"
                disabled={isSubmitting || showSuccessToast}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="text-xs text-gray-400 mb-4">
            Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, PPT, PPTX, XLS, XLSX, ZIP, RAR<br/>
            <span className="text-yellow-400">Note: You must provide either content or attach a file.</span>
          </div>

          <button 
            className="bg-blue-600 text-sm w-full py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            onClick={handleSubmit}
            disabled={(!description.trim() && !file) || isSubmitting || showSuccessToast}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : showSuccessToast ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submitted!
              </>
            ) : (
              'Submit Assignment'
            )}
          </button>
        </div>
      </div>
    </>
  );
}