'use client';

import { useRef, useState } from 'react';
import { Image as ImageIcon, Send, X, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createPost, CommunityCategory, CommunityPost } from '../../services/community';
import { getInitials } from './timeUtils';

interface CreatePostProps {
  userName: string;
  userRole: 'student' | 'teacher' | 'admin';
  onPostCreated: (post: CommunityPost) => void;
}

const CATEGORY_OPTIONS: CommunityCategory[] = [
  'Discussion',
  'Doubt',
  'Resource',
  'Project',
  'Achievement',
  'Announcement',
];

const MAX_FILES = 4;

export default function CreatePost({ userName, userRole, onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<CommunityCategory>('Discussion');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const availableCategories =
    userRole === 'student' ? CATEGORY_OPTIONS.filter((c) => c !== 'Announcement') : CATEGORY_OPTIONS;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (files.length + selected.length > MAX_FILES) {
      toast.error(`You can attach up to ${MAX_FILES} files`);
      return;
    }
    setFiles((prev) => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Write something before posting');
      return;
    }
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('category', category);
      files.forEach((file) => formData.append('attachments', file));

      const res = await createPost(formData);
      if (res?.post) {
        onPostCreated(res.post);
        setContent('');
        setFiles([]);
        setCategory('Discussion');
        toast.success('Posted to community');
      }
    } catch (err) {
      console.error('Failed to create post:', err);
      toast.error('Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold shrink-0">
          {getInitials(userName)}
        </div>
        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with the community — a doubt, a resource, an update..."
            className="w-full resize-none border-none outline-none text-sm text-slate-800 placeholder:text-gray-400 min-h-[60px]"
            maxLength={5000}
          />

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {files.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2 py-1 text-xs text-gray-600"
                >
                  <span className="max-w-[140px] truncate">{file.name}</span>
                  <button onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition"
                type="button"
              >
                <ImageIcon size={16} />
                Attach
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                multiple
                hidden
                onChange={handleFileSelect}
              />

              <div className="relative">
                <button
                  onClick={() => setShowCategoryMenu((v) => !v)}
                  className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition"
                  type="button"
                >
                  {category}
                  <ChevronDown size={12} />
                </button>
                {showCategoryMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowCategoryMenu(false)} />
                    <div className="absolute left-0 mt-1 w-40 bg-white border rounded-lg shadow-lg z-20 py-1">
                      {availableCategories.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setCategory(opt);
                            setShowCategoryMenu(false);
                          }}
                          className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${
                            opt === category ? 'text-blue-600 font-medium' : 'text-gray-700'
                          }`}
                          type="button"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={posting || !content.trim()}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition"
              type="button"
            >
              <Send size={13} />
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
