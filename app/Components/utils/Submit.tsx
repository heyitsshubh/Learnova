'use client';

import { useState } from 'react';
import { X, Upload, File } from 'lucide-react';

export default function SubmitAssignment({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    // Handle assignment submission logic here
    console.log('Assignment Title:', message);
    console.log('Description:', description);
    console.log('File:', file);
    
    // TODO: Add API call to submit assignment
    // submitAssignment({ title: message, description, file });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center  bg-opacity-40 z-50">
      <div className="bg-[#1f1f1f] w-96 max-h-[90vh] overflow-y-auto p-5 rounded-md shadow-md relative text-white border border-gray-500">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Submit Assignment</h2>
          <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="text-sm mb-1 block">Assignment Title *</label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter assignment title"
          className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <label className="text-sm mb-1 block">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter assignment description (optional)"
          rows={3}
          className="w-full p-2 bg-gray-700 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        <label className="text-sm mb-1 block">Attach Assignment File *</label>
        <div className="w-full bg-gray-800 rounded-md h-20 flex items-center justify-center mb-3 cursor-pointer relative border-2 border-dashed border-gray-600 hover:border-gray-500 transition">
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
            required
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
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="text-xs text-gray-400 mb-4">
          Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, PPT, PPTX, XLS, XLSX, ZIP, RAR
        </div>

        <button 
          className="bg-blue-600 text-sm w-full py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={!message.trim() || !file}
        >
          Submit Assignment
        </button>
      </div>
    </div>
  );
}