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

interface StudentStats {
  enrolledClasses: number;
  totalAssignments: number;
  completedAssignments: number;
  averageGrade: number;
}

interface TeacherStats {
  classesTaught: number;
  totalStudents: number;
  assignmentsCreated: number;
  pendingGrading: number;
}

interface DashboardData {
  user: {
    name: string;
    email: string;
    role: 'teacher' | 'student';
    profilePicture?: string;
  };
  classrooms: unknown[];
  postsCount: number;
  unreadNotifications: number;
  recentNotifications: Notification[];
  stats: StudentStats | TeacherStats;
}

type DashboardView = 'teacher' | 'student';

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [activeView, setActiveView] = useState<DashboardView | null>(null);

  useEffect(() => {
    axiosInstance
      .get('https://bhattanisha.me/user/dashboard')
      .then(res => setDashboard(res.data))
      .catch(err => console.error('Failed to load dashboard:', err));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedView = window.localStorage.getItem('learnova-dashboard-view');
    if (savedView === 'teacher' || savedView === 'student') {
      setActiveView(savedView);
      return;
    }

    if (dashboard?.user.role === 'teacher') {
      setActiveView('teacher');
    } else {
      setActiveView('student');
    }
  }, [dashboard]);

  const isTeacher = dashboard?.user.role === 'teacher';
  const selectedView = activeView ?? (isTeacher ? 'teacher' : 'student');
  const isTeacherView = selectedView === 'teacher';

  const handleViewChange = (view: DashboardView) => {
    setActiveView(view);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('learnova-dashboard-view', view);
    }
  };

  const stats = isTeacherView
    ? (() => {
        const s = dashboard?.stats as TeacherStats | undefined;
        return [
          {
            id: 'classes',
            label: 'Classes Taught',
            value: s?.classesTaught ?? 0,
            icon: <HiOutlineBookOpen className="w-7 h-7 text-blue-500" />,
          },
          {
            id: 'students',
            label: 'Total Students',
            value: s?.totalStudents ?? 0,
            icon: <HiOutlineUserGroup className="w-7 h-7 text-green-500" />,
          },
          {
            id: 'assignments',
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
        ];
      })()
    : (() => {
        const s = dashboard?.stats as StudentStats | undefined;
        return [
          {
            id: 'classes',
            label: 'My Classes',
            value: s?.enrolledClasses ?? 0,
            icon: <HiOutlineBookOpen className="w-7 h-7 text-blue-500" />,
          },
          {
            id: 'assignments',
            label: 'Assignments',
            value: s?.totalAssignments ?? 0,
            icon: <HiOutlineClipboardList className="w-7 h-7 text-yellow-500" />,
          },
          {
            id: 'posts',
            label: 'My Posts',
            value: dashboard?.postsCount ?? 0,
            icon: <HiOutlineUsers className="w-7 h-7 text-green-500" />,
          },
        ];
      })();

  const completionPct = isTeacherView
    ? (() => {
        const s = dashboard?.stats as TeacherStats | undefined;
        const created = s?.assignmentsCreated ?? 0;
        const pending = s?.pendingGrading ?? 0;
        return created > 0 ? Math.round(((created - pending) / created) * 100) : 0;
      })()
    : (() => {
        const s = dashboard?.stats as StudentStats | undefined;
        const total = s?.totalAssignments ?? 0;
        const completed = s?.completedAssignments ?? 0;
        return total > 0 ? Math.round((completed / total) * 100) : 0;
      })();

  const donutData = [
    { name: 'Completed', value: completionPct },
    { name: 'Remaining', value: 100 - completionPct },
  ];

  const focusItems = isTeacherView
    ? [
        { title: 'Review pending submissions', detail: '6 assignments need feedback today' },
        { title: 'Prepare your next class', detail: 'Topic outline is ready for review' },
        { title: 'Check class updates', detail: '2 new announcements were posted' },
      ]
    : [
        { title: 'Continue your study plan', detail: '2 lessons left in your current module' },
        { title: 'Finish upcoming assignments', detail: '3 tasks are due this week' },
        { title: 'Join your next session', detail: 'Live class starts in 45 minutes' },
      ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 sm:p-6 bg-[#fafbfc]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">
                {isTeacherView ? 'Teacher Dashboard' : 'Student Dashboard'}
              </h1>
              <p className="text-xs text-gray-500">
                {dashboard?.user.name ?? '...'} / {isTeacherView ? 'Teaching view' : 'Learning view'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => handleViewChange('teacher')}
                  disabled={!isTeacher}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    isTeacherView && isTeacher
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50'
                  }`}
                >
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => handleViewChange('student')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    !isTeacherView ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Student
                </button>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {isTeacherView ? 'Pinned: Teacher' : 'Pinned: Student'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mb-6">
            {stats.map(s => (
              <StatCard key={s.id} label={s.label} value={s.value} icon={s.icon} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
              <AssignmentStatusBarChart />

              <div className="bg-white rounded-xl shadow p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-700">
                    {isTeacherView ? 'Teaching focus' : 'Learning focus'}
                  </h3>
                  <span className="text-xs text-gray-400">Today</span>
                </div>
                <div className="space-y-3">
                  {focusItems.map(item => (
                    <div key={item.title} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 rounded-full bg-blue-100 p-1.5 text-blue-600">
                          {isTeacherView ? <HiOutlineAcademicCap className="h-4 w-4" /> : <HiOutlineSparkles className="h-4 w-4" />}
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
                  {isTeacherView ? 'Keep your classes moving forward.' : 'Stay on top of your next milestones.'}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center relative w-full max-w-xs mx-auto">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {isTeacherView ? 'GRADING PROGRESS' : 'PROGRESS'}
                </h3>
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
                    <div className="text-xs text-gray-500">{isTeacherView ? 'Graded' : 'Completed'}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {isTeacherView ? 'Assignments Graded' : 'Assignments Progress'}
                </p>
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
              <TodoList />
            </div>
          </div>
          <div className="h-12" />
        </div>
      </div>
    </ProtectedRoute>
  );
}