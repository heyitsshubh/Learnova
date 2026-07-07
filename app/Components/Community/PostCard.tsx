'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Heart,
  MessageCircle,
  Pin,
  MoreVertical,
  Trash2,
  Pencil,
  Send,
  FileText,
  X,
  Check,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  CommunityPost,
  toggleLike,
  togglePin,
  deletePost,
  updatePost,
  addComment,
  deleteComment,
} from '../../services/community';
import { timeAgo, getInitials } from './timeUtils';

interface PostCardProps {
  post: CommunityPost;
  currentUserId: string;
  currentUserRole: 'student' | 'teacher' | 'admin';
  onUpdated: (post: CommunityPost) => void;
  onDeleted: (postId: string) => void;
}

const CATEGORY_STYLES: Record<string, string> = {
  Discussion: 'bg-blue-50 text-blue-600',
  Doubt: 'bg-amber-50 text-amber-600',
  Resource: 'bg-emerald-50 text-emerald-600',
  Announcement: 'bg-rose-50 text-rose-600',
  Project: 'bg-purple-50 text-purple-600',
  Achievement: 'bg-teal-50 text-teal-600',
};

export default function PostCard({
  post,
  currentUserId,
  currentUserRole,
  onUpdated,
  onDeleted,
}: PostCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [liking, setLiking] = useState(false);

  const isAuthor = post.author?._id === currentUserId;
  const isAdmin = currentUserRole === 'admin';
  const canModerate = currentUserRole === 'teacher' || currentUserRole === 'admin';
  const authorName = post.author?.name || 'Unknown user';

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    const optimistic: CommunityPost = {
      ...post,
      isLiked: !post.isLiked,
      likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
    };
    onUpdated(optimistic);
    try {
      const res = await toggleLike(post._id);
      onUpdated({ ...optimistic, isLiked: res.liked, likesCount: res.likesCount });
    } catch (err) {
      console.error('Failed to toggle like:', err);
      onUpdated(post);
      toast.error('Failed to update like');
    } finally {
      setLiking(false);
    }
  };

  const handlePin = async () => {
    try {
      const res = await togglePin(post._id);
      onUpdated({ ...post, isPinned: res.isPinned });
      toast.success(res.isPinned ? 'Post pinned' : 'Post unpinned');
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      toast.error('Failed to update pin');
    }
    setMenuOpen(false);
  };

  const handleDelete = async () => {
    try {
      await deletePost(post._id);
      onDeleted(post._id);
      toast.success('Post deleted');
    } catch (err) {
      console.error('Failed to delete post:', err);
      toast.error('Failed to delete post');
    }
    setMenuOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }
    try {
      const res = await updatePost(post._id, { content: editContent.trim() });
      onUpdated(res.post);
      setIsEditing(false);
      toast.success('Post updated');
    } catch (err) {
      console.error('Failed to update post:', err);
      toast.error('Failed to update post');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await addComment(post._id, commentText.trim());
      onUpdated({
        ...post,
        comments: [...post.comments, res.comment],
        commentsCount: res.commentsCount,
      });
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await deleteComment(post._id, commentId);
      onUpdated({
        ...post,
        comments: post.comments.filter((c) => c._id !== commentId),
        commentsCount: res.commentsCount,
      });
    } catch (err) {
      console.error('Failed to delete comment:', err);
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${post.isPinned ? 'ring-1 ring-amber-200' : ''}`}>
      {post.isPinned && (
        <div className="flex items-center gap-1 border-b border-amber-100 bg-amber-50 px-4 py-2 text-[11px] font-medium text-amber-700 sm:px-5">
          <Pin size={11} className="fill-amber-500 text-amber-500" />
          Pinned
        </div>
      )}

      <div className="px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-600 text-sm font-semibold text-white">
              {post.author?.profilePicture ? (
                <Image src={post.author.profilePicture} alt={authorName} width={40} height={40} className="h-full w-full object-cover" />
              ) : (
                getInitials(authorName)
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">{authorName}</span>
                {post.author?.role && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                    {post.author.role}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                <span>{timeAgo(post.createdAt)}</span>
                {post.isEdited && <span>edited</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-medium px-2 py-1 rounded-full ${CATEGORY_STYLES[post.category] || 'bg-slate-100 text-slate-600'}`}>
              {post.category}
            </span>

            {(isAuthor || canModerate) && (
              <div className="relative">
                <button onClick={() => setMenuOpen((v) => !v)} className="cursor-pointer rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" type="button">
                  <MoreVertical size={16} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                      {isAuthor && (
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setMenuOpen(false);
                          }}
                          className="cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-50"
                          type="button"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      )}
                      {canModerate && (
                        <button
                          onClick={handlePin}
                          className="cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-50"
                          type="button"
                        >
                          <Pin size={12} /> {post.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                      )}
                      {(isAuthor || isAdmin) && (
                        <button
                          onClick={handleDelete}
                          className="cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-500 transition hover:bg-red-50"
                          type="button"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          {isEditing ? (
            <div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[100px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white"
                maxLength={5000}
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                  type="button"
                >
                  <Check size={12} /> Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(post.content);
                  }}
                  className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                  type="button"
                >
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap break-words">{post.content}</p>
          )}
        </div>

      </div>

      {post.attachments?.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {post.attachments.map((att, idx) => {
            const isImage = att.mimetype?.startsWith('image/');
            return isImage ? (
              <a
                key={idx}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block h-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >
                <Image src={att.url} alt={att.filename} fill className="object-cover" unoptimized />
              </a>
            ) : (
              <a
                key={idx}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 transition hover:bg-slate-100"
              >
                <FileText size={16} className="shrink-0 text-slate-400" />
                <span className="truncate">{att.filename}</span>
              </a>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
        <button
          onClick={handleLike}
          className={`cursor-pointer flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            post.isLiked
              ? 'bg-[rgba(45,156,219,0.5)] text-white'
              : 'text-gray-500 hover:bg-[rgba(45,156,219,0.5)] hover:text-white'
          }`}
          type="button"
        >
          <Heart size={15} className={post.isLiked ? 'fill-white' : ''} />
          {post.likesCount || 0}
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className={`cursor-pointer flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            showComments
              ? 'bg-[rgba(45,156,219,0.5)] text-white'
              : 'text-slate-500 hover:bg-[rgba(45,156,219,0.5)] hover:text-white'
          }`}
          type="button"
        >
          <MessageCircle size={15} />
          {post.commentsCount || 0}
        </button>
      </div>

      {showComments && (
        <div className="mt-4 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:p-4">
          {post.comments.map((comment) => (
            <div key={comment._id} className="flex items-start gap-2 group">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-400 text-[10px] font-semibold text-white">
                {getInitials(comment.author?.name || 'Unknown user')}
              </div>
              <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">{comment.author?.name || 'Unknown user'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">{timeAgo(comment.createdAt)}</span>
                    {(comment.author?._id === currentUserId || isAuthor || isAdmin) && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="cursor-pointer opacity-0 transition group-hover:opacity-100 text-slate-300 hover:text-red-500"
                        type="button"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-600 break-words">{comment.text}</p>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="Write a comment..."
              className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition focus:border-blue-400"
              maxLength={1000}
            />
            <button
              onClick={handleAddComment}
              disabled={submittingComment || !commentText.trim()}
              className="cursor-pointer rounded-full p-2 text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300"
              type="button"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
