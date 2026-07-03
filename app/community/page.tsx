'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '../Components/ProtectedRoute';
import CreatePost from '../Components/Community/CreatePost';
import PostCard from '../Components/Community/PostCard';
import { getPosts, CommunityPost, CommunityCategory } from '../services/community';

const CATEGORIES: (CommunityCategory | 'All')[] = [
  'All',
  'Discussion',
  'Doubt',
  'Resource',
  'Project',
  'Achievement',
  'Announcement',
];

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState<CommunityCategory | 'All'>('All');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<'newest' | 'mostLiked'>('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<'student' | 'teacher' | 'admin'>('student');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserId(localStorage.getItem('userId') || '');
      setUserName(localStorage.getItem('userName') || '');
      setUserRole((localStorage.getItem('userRole') as 'student' | 'teacher' | 'admin') || 'student');
    }
  }, []);

  const fetchPosts = useCallback(
    async (pageToFetch: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res = await getPosts({
          category,
          search: search || undefined,
          sort,
          page: pageToFetch,
          limit: 10,
        });
        setTotalPages(res.pagination?.totalPages || 1);
        setPosts((prev) => (append ? [...prev, ...(res.posts || [])] : res.posts || []));
      } catch (err) {
        console.error('Failed to fetch community posts:', err);
        toast.error('Failed to load community posts');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category, search, sort]
  );

  useEffect(() => {
    setPage(1);
    fetchPosts(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search, sort]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  };

  const handlePostCreated = (post: CommunityPost) => {
    if (category !== 'All' && post.category !== category) {
      toast.success('Posted! Switch category filter to see it.');
      return;
    }
    setPosts((prev) => [post, ...prev]);
  };

  const handlePostUpdated = (updated: CommunityPost) => {
    setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 sm:p-6 bg-[#fafbfc]">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Community</h1>
              <p className="text-xs text-gray-500">Connect, share resources, and collaborate with peers and educators</p>
            </div>
          </div>

          <CreatePost userName={userName} userRole={userRole} onPostCreated={handlePostCreated} />

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-5 mb-4">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search posts..."
                className="w-full text-sm bg-white border rounded-lg pl-9 pr-3 py-2 outline-none focus:border-blue-400"
              />
            </form>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'newest' | 'mostLiked')}
              className="text-sm bg-white border rounded-lg px-3 py-2 outline-none text-gray-600"
            >
              <option value="newest">Newest</option>
              <option value="mostLiked">Most liked</option>
            </select>
          </div>

          <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition ${
                  category === cat
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
                type="button"
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center text-sm text-gray-400 py-16">Loading community posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <Users size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={userId}
                  currentUserRole={userRole}
                  onUpdated={handlePostUpdated}
                  onDeleted={handlePostDeleted}
                />
              ))}
            </div>
          )}

          {!loading && page < totalPages && (
            <div className="text-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-white border border-blue-200 px-4 py-2 rounded-lg disabled:opacity-50"
                type="button"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}

          <div className="h-12" />
        </div>
      </div>
    </ProtectedRoute>
  );
}
