'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '../Components/ProtectedRoute';
import Link from 'next/link';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  HiOutlineBookOpen,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineAcademicCap,
  HiOutlineCalendar,
  HiOutlineSparkles,
} from 'react-icons/hi';
import StatCard from '../Components/Dashboard/StatCard';
import AssignmentStatusBarChart from '../Components/Dashboard/AssignmentStatusBarChart';
import Calendar from '../Components/Dashboard/Calendar';
import TodoList from '../Components/Dashboard/TodoList';
import axiosInstance from '../lib/axios';

interface Notification {
  _id: string;
  message: string;
  type: string;
  createdAt: string;
}

// Every user can create classrooms (acting as the "teacher" for those) and
// join classrooms created by other users (acting as a "student" there) -
// there is no fixed, account-wide role. The dashboard combines both sides.
interface DashboardStats {
  classesCreated: number;
  totalStudentsTaught: number;
  assignmentsCreated: number;
  pendingGrading: number;
  classesJoined: number;
  totalAssignments: number;
  completedAssignments: number;
  averageGrade: number;
}

interface ClassroomSummary {
  _id: string;
  className: string;
  subject: string;
  classCode?: string;
  createdBy?: { name?: string };
}

interface DashboardData {
  user: {
    name: string;
    email: string;
    profilePicture?: string;
  };
  classrooms: ClassroomSummary[];
  postsCount: number;
  unreadNotifications: number;
  recentNotifications: Notification[];
  stats?: DashboardStats;
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const fetchDashboard = async () => {
    try {
      const dashboardRes = await axiosInstance.get('https://bhattanisha.me/user/dashboard');
      const dashboardPayload = dashboardRes.data ?? {};

      setDashboard({
        ...dashboardPayload,
        classrooms: Array.isArray(dashboardPayload?.classrooms) ? dashboardPayload.classrooms : [],
        recentNotifications: Array.isArray(dashboardPayload?.recentNotifications) ? dashboardPayload.recentNotifications : [],
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    void fetchDashboard();

    const handleRefresh = () => {
      void fetchDashboard();
    };

    window.addEventListener('dashboard:refresh', handleRefresh);
    return () => window.removeEventListener('dashboard:refresh', handleRefresh);
  }, []);

  const s = dashboard?.stats;

  const stats = [
    {
      id: 'classes',
      label: 'My Classes',
      value: (s?.classesCreated ?? 0) + (s?.classesJoined ?? 0),
      icon: <HiOutlineBookOpen className="w-7 h-7 text-blue-500" />,
    },
    {
      id: 'students',
      label: 'Students Across My Classes',
      value: s?.totalStudentsTaught ?? 0,
      icon: <HiOutlineUserGroup className="w-7 h-7 text-green-500" />,
    },
    {
      id: 'assignments-created',
      label: 'Assignments Created',
      value: s?.assignmentsCreated ?? 0,
      icon: <HiOutlineClipboardList className="w-7 h-7 text-yellow-500" />,
    },
    {
      id: 'pending',
      label: 'Pending Grading',
      value: s?.pendingGrading ?? 0,
      icon: <HiOutlineCheckCircle className="w-7 h-7 text-red-500" />,
    },
    {
      id: 'assignments-todo',
      label: 'Assignments To Complete',
      value: s?.totalAssignments ?? 0,
      icon: <HiOutlineAcademicCap className="w-7 h-7 text-purple-500" />,
    },
    {
      id: 'posts',
      label: 'My Posts',
      value: dashboard?.postsCount ?? 0,
      icon: <HiOutlineUsers className="w-7 h-7 text-teal-500" />,
    },
  ];

  // Combined completion: graded-out-of-created assignments plus
  // completed-out-of-assigned work, blended into one progress ring.
  const completionPct = (() => {
    const createdTotal = s?.assignmentsCreated ?? 0;
    const gradedDone = createdTotal > 0 ? createdTotal - (s?.pendingGrading ?? 0) : 0;

    const todoTotal = s?.totalAssignments ?? 0;
    const todoDone = s?.completedAssignments ?? 0;

    const combinedTotal = createdTotal + todoTotal;
    const combinedDone = gradedDone + todoDone;

    return combinedTotal > 0 ? Math.round((combinedDone / combinedTotal) * 100) : 0;
  })();

  const donutData = [
    { name: 'Completed', value: completionPct },
    { name: 'Remaining', value: 100 - completionPct },
  ];

  const focusItems = [
    { title: 'Review pending submissions', detail: `${s?.pendingGrading ?? 0} submissions need feedback in classes you created` },
    { title: 'Finish upcoming assignments', detail: `${s?.totalAssignments ?? 0} tasks pending in classes you've joined` },
    { title: 'Share or use a class code', detail: 'Create a classroom to share, or join one with a code' },
  ];

  const classrooms = dashboard?.classrooms ?? [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 sm:p-6 bg-[#fafbfc]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
              <p className="text-xs text-gray-500">
                {dashboard?.user.name ?? '...'} &middot; classes you created and classes you joined, together
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mb-6">
            {stats.map(st => (
              <StatCard key={st.id} label={st.label} value={st.value} icon={st.icon} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
              <AssignmentStatusBarChart />

              <div className="bg-white rounded-xl shadow p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-700">Focus</h3>
                  <span className="text-xs text-gray-400">Today</span>
                </div>
                <div className="space-y-3">
                  {focusItems.map(item => (
                    <div key={item.title} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 rounded-full bg-blue-100 p-1.5 text-blue-600">
                          <HiOutlineSparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <HiOutlineCalendar className="h-4 w-4" />
                  Stay on top of what you&apos;re teaching and what you&apos;re learning.
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center relative w-full max-w-xs mx-auto">
                <h3 className="text-sm font-medium text-gray-700 mb-3">PROGRESS</h3>
                <div className="flex items-center justify-center relative w-full">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={donutData} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={2}>
                        {donutData.map((entry, idx) => (
                          <Cell key={entry.name} fill={idx === 0 ? '#3B82F6' : '#E5E7EB'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 text-center">
                    <div className="text-3xl font-bold text-blue-600">{completionPct}%</div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">Grading + assignment progress, combined</p>
              </div>
              <Calendar />
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-lg shadow p-4 w-full max-w-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Notifications{' '}
                    <span className="text-xs text-gray-400">({dashboard?.unreadNotifications ?? 0})</span>
                  </h3>
                  <Link href="/notifications" className="text-xs text-blue-500">
                    view all
                  </Link>
                </div>
                <div className="space-y-3">
                  {dashboard?.recentNotifications.length ? (
                    dashboard.recentNotifications.map(n => (
                      <div key={n._id} className="flex items-start space-x-3 bg-gray-50 rounded p-2">
                        <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">🔔</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium capitalize">{n.type}</p>
                          <p className="text-xs text-gray-500">{n.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">No new notifications</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 w-full max-w-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Your classrooms</h3>
                  <Link href="/classroom" className="text-xs text-blue-500">
                    open
                  </Link>
                </div>
                <div className="space-y-2">
                  {classrooms.length ? (
                    classrooms.slice(0, 4).map(cls => (
                      <div key={cls._id} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{cls.className}</p>
                            <p className="text-xs text-slate-500">{cls.subject}</p>
                          </div>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                            {cls.classCode ? 'Code' : 'Joined'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">No classrooms yet</p>
                  )}
                </div>
              </div>

              <TodoList />
            </div>
          </div>
          <div className="h-12" />
        </div>
      </div>
    </ProtectedRoute>
  );
}
