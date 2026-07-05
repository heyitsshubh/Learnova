'use client';

import { useRef, useState } from 'react';
import { ChevronDown, Image as ImageIcon, Send, X } from 'lucide-react';
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
    userRole === 'student' ? CATEGORY_OPTIONS.filter((item) => item !== 'Announcement') : CATEGORY_OPTIONS;

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
    setFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(45,156,219,0.5)] text-sm font-semibold text-white shadow-sm">
            {getInitials(userName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-800">Start a conversation</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {userRole}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Share a question, upload a resource, or post an update for the community.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share something with the community — a doubt, a resource, an update..."
          className="min-h-[140px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
          maxLength={5000}
        />

        {files.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
              >
                <span className="max-w-[160px] truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(idx)}
                  className="cursor-pointer text-slate-400 transition hover:text-rose-500"
                  type="button"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
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
                onClick={() => setShowCategoryMenu((value) => !value)}
                className={`cursor-pointer inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                  showCategoryMenu
                    ? 'border-transparent bg-[rgba(45,156,219,0.5)] text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:bg-white'
                }`}
                type="button"
              >
                {category}
                <ChevronDown size={12} />
              </button>

              {showCategoryMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowCategoryMenu(false)} />
                  <div className="absolute left-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    {availableCategories.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setCategory(option);
                          setShowCategoryMenu(false);
                        }}
                        className={`cursor-pointer block w-full px-3 py-2 text-left text-xs transition hover:bg-slate-50 ${
                          option === category ? 'font-medium text-blue-600' : 'text-slate-700'
                        }`}
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <span className="text-xs text-slate-400">Up to {MAX_FILES} attachments</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={posting || !content.trim()}
            className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-[rgba(45,156,219,0.5)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[rgba(45,156,219,0.7)] disabled:cursor-not-allowed disabled:bg-slate-300"
            type="button"
          >
            <Send size={13} />
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
