import axiosInstance from '../lib/axios';
import { getAccessToken } from '../utils/token';

const API_URL = 'https://api.heyitsshubh.me/api/community';

const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

const getTokenOrRedirect = () => {
  const token = getAccessToken();
  if (!token) {
    redirectToLogin();
    throw new Error('No access token found.');
  }
  return token;
};

export interface CommunityAuthor {
  _id: string;
  name: string;
  email?: string;
  profilePicture?: string;
  role?: 'student' | 'teacher' | 'admin';
}

export interface CommunityAttachment {
  filename: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
  uploadedAt?: string;
}

export interface CommunityComment {
  _id: string;
  author: CommunityAuthor;
  text: string;
  createdAt: string;
  updatedAt?: string;
}

export type CommunityCategory =
  | 'Discussion'
  | 'Doubt'
  | 'Resource'
  | 'Announcement'
  | 'Project'
  | 'Achievement';

export interface CommunityPost {
  _id: string;
  author: CommunityAuthor;
  content: string;
  category: CommunityCategory;
  attachments: CommunityAttachment[];
  likes: string[];
  comments: CommunityComment[];
  isPinned: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

export interface GetPostsParams {
  category?: CommunityCategory | 'All';
  search?: string;
  sort?: 'newest' | 'mostLiked';
  page?: number;
  limit?: number;
}

export const getPosts = async (params: GetPostsParams = {}) => {
  getTokenOrRedirect();
  const res = await axiosInstance.get(`${API_URL}/posts`, { params });
  return res.data as {
    success: boolean;
    posts: CommunityPost[];
    pagination: { page: number; limit: number; totalPosts: number; totalPages: number };
  };
};

export const getMyPosts = async () => {
  getTokenOrRedirect();
  const res = await axiosInstance.get(`${API_URL}/posts/my`);
  return res.data as { success: boolean; posts: CommunityPost[]; count: number };
};

export const getPostById = async (postId: string) => {
  getTokenOrRedirect();
  const res = await axiosInstance.get(`${API_URL}/posts/${postId}`);
  return res.data as { success: boolean; post: CommunityPost };
};

export const createPost = async (formData: FormData) => {
  getTokenOrRedirect();
  const res = await axiosInstance.post(`${API_URL}/posts`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data as { success: boolean; message: string; post: CommunityPost };
};

export const updatePost = async (
  postId: string,
  data: { content?: string; category?: CommunityCategory }
) => {
  getTokenOrRedirect();
  const res = await axiosInstance.put(`${API_URL}/posts/${postId}`, data);
  return res.data as { success: boolean; message: string; post: CommunityPost };
};

export const deletePost = async (postId: string) => {
  getTokenOrRedirect();
  const res = await axiosInstance.delete(`${API_URL}/posts/${postId}`);
  return res.data as { success: boolean; message: string };
};

export const toggleLike = async (postId: string) => {
  getTokenOrRedirect();
  const res = await axiosInstance.post(`${API_URL}/posts/${postId}/like`);
  return res.data as { success: boolean; liked: boolean; likesCount: number };
};

export const togglePin = async (postId: string) => {
  getTokenOrRedirect();
  const res = await axiosInstance.post(`${API_URL}/posts/${postId}/pin`);
  return res.data as { success: boolean; isPinned: boolean };
};

export const addComment = async (postId: string, text: string) => {
  getTokenOrRedirect();
  const res = await axiosInstance.post(`${API_URL}/posts/${postId}/comments`, { text });
  return res.data as { success: boolean; comment: CommunityComment; commentsCount: number };
};

export const deleteComment = async (postId: string, commentId: string) => {
  getTokenOrRedirect();
  const res = await axiosInstance.delete(`${API_URL}/posts/${postId}/comments/${commentId}`);
  return res.data as { success: boolean; commentsCount: number };
};
