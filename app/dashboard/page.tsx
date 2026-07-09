'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '../Components/ProtectedRoute';
import Link from 'next/link';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import {
  HiOutlineBookOpen,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
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

interface AttendanceDay {
  day: string;
  value: number;
}

// Backend returns week entries shaped like this from /user/attendance/weekly
interface WeeklyAttendanceDay {
  day: string;
  date: string;
  attended: boolean;
  minutes: number;
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

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceDay[]>([]);
  const [attendanceAvg, setAttendanceAvg] = useState(0);

  useEffect(() => {
    axiosInstance
      .get('https://bhattanisha.me/user/dashboard')
      .then(res => setDashboard(res.data))
      .catch(err => console.error('Failed to load dashboard:', err));

    axiosInstance
      .get('https://bhattanisha.me/user/attendance/weekly')
      .then(res => {
        const week: WeeklyAttendanceDay[] = res.data.week ?? [];
        setAttendance(week.map(d => ({ day: d.day, value: d.minutes })));
        const attendedDays = week.filter(d => d.attended).length;
        setAttendanceAvg(week.length ? Math.round((attendedDays / week.length) * 100) : 0);
      })
      .catch(err => console.error('Failed to load attendance:', err));
  }, []);

  const isTeacher = dashboard?.user.role === 'teacher';

  // Role-specific stat cards. The backend now returns a different `stats`
  // shape depending on user.role (see getDashboard), so we branch on that
  // instead of assuming the student shape everywhere.
  const stats = isTeacher
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

  // Donut: completion % for students, grading % for teachers
  const completionPct = isTeacher
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 sm:p-6 bg-[#fafbfc]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-800">
              {isTeacher ? 'Teacher Dashboard' : 'Home'}
            </h1>
            <p className="text-xs text-gray-500">{dashboard?.user.name ?? '...'} / Home</p>
          </div>

          {/* Top stats row */}
          <div className="flex flex-wrap gap-6 mb-6">
            {stats.map(s => (
              <StatCard key={s.id} label={s.label} value={s.value} icon={s.icon} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Assignments status & Attendance */}
            <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
              <AssignmentStatusBarChart />

              <div className="bg-white rounded-xl shadow p-4 flex flex-col min-w-140">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-gray-700">
                    {isTeacher ? 'Class Attendance' : 'Attendance'}
                  </h3>
                  <span className="text-xs text-gray-400">This Week</span>
                </div>
                <div className="h-36 flex items-center justify-center">
                  <ResponsiveContainer width="80%" height={180}>
                    <BarChart data={attendance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 15, fill: '#374151', fontWeight: 600 }}
                      />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: 8, fontSize: 30 }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={44}>
                        {attendance.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill="#3B82F6" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between mt-3">
                  <span className="text-xs text-gray-500">Mon-Sun</span>
                  <span className="text-xs text-teal-600 font-semibold">Avg: {attendanceAvg}%</span>
                </div>
              </div>
            </div>

            {/* Progress & Calendar */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center relative w-full max-w-xs mx-auto">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {isTeacher ? 'GRADING PROGRESS' : 'PROGRESS'}
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
                    <div className="text-xs text-gray-500">{isTeacher ? 'Graded' : 'Completed'}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {isTeacher ? 'Assignments Graded' : 'Assignments Progress'}
                </p>
              </div>
              <Calendar />
            </div>

            {/* Notifications & Todo */}
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