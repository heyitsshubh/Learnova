'use client';

import { useEffect, useState, useCallback } from 'react';
import { ArrowUpRight, Search, Users, Sparkles } from 'lucide-react';
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

  const pinnedCount = posts.filter((post) => post.isPinned).length;
  const categoryCounts = CATEGORIES.filter((cat) => cat !== 'All').map((cat) => ({
    category: cat,
    count: posts.filter((post) => post.category === cat).length,
  }));

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#fafbfc] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Users size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-slate-800">Community</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    <Sparkles size={11} />
                    Live feed
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Connect, share resources, and collaborate with peers and educators in one focused feed.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:min-w-[280px]">
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Posts</p>
                <p className="text-lg font-semibold text-slate-800">{posts.length}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Pinned</p>
                <p className="text-lg font-semibold text-slate-800">{pinnedCount}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Filters</p>
                <p className="text-lg font-semibold text-slate-800">{CATEGORIES.length - 1}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-5">
              <CreatePost userName={userName} userRole={userRole} onPostCreated={handlePostCreated} />

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <form onSubmit={handleSearchSubmit} className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search posts, resources, or discussions..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                    />
                  </form>

                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as 'newest' | 'mostLiked')}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 outline-none transition focus:border-blue-200 focus:bg-white"
                  >
                    <option value="newest">Newest</option>
                    <option value="mostLiked">Most liked</option>
                  </select>
                </div>

                <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`cursor-pointer shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        category === cat
                          ? 'border-transparent bg-[rgba(45,156,219,0.5)] text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 '
                      }`}
                      type="button"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400 shadow-sm">
                  Loading community posts...
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                  <Users size={36} className="mx-auto mb-3 text-slate-300" />
                  <h2 className="text-base font-semibold text-slate-800">No posts yet</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Be the first to start a discussion, share a resource, or post an announcement.
                  </p>
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
                <div className="pt-2 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                  >
                    {loadingMore ? 'Loading...' : 'Load more'}
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              )}
            </div>

            <aside className="hidden xl:flex flex-col gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">Community at a glance</h3>
                <p className="mt-1 text-xs text-slate-500">A quick summary of what is happening right now.</p>

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Latest posts</span>
                      <span className="font-semibold text-slate-800">{posts.length}</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Pinned posts</span>
                      <span className="font-semibold text-slate-800">{pinnedCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">Categories</h3>
                <div className="mt-4 space-y-2">
                  {categoryCounts.map(({ category: cat, count }) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition ${
                        category === cat
                          ? 'bg-[rgba(45,156,219,0.5)] text-white'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold shadow-sm ${category === cat ? 'bg-white/20 text-white' : 'bg-white text-slate-500'}`}>
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">Posting tips</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-500">
                  <li>Keep posts short and specific so people can respond quickly.</li>
                  <li>Use attachments for notes, references, or screenshots.</li>
                  <li>Pin important updates so they stay easy to find.</li>
                </ul>
              </div>
            </aside>
          </div>

          <div className="h-12" />
        </div>
      </div>
    </ProtectedRoute>
  );
}
