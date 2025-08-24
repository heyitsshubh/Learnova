'use client';

import ProtectedRoute from '../Components/ProtectedRoute';
import Link from 'next/link';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { HiOutlineBookOpen, HiOutlineClipboardList, HiOutlineUsers } from 'react-icons/hi';
import StatCard from '../Components/Dashboard/StatCard';
import AssignmentStatusBarChart from '../Components/Dashboard/AssignmentStatusBarChart';
import Calendar from '../Components/Dashboard/Calendar';
import TodoList from '../Components/Dashboard/TodoList';

const stats = [
  { id: 'classes', label: 'My Classes', value: 5, icon: <HiOutlineBookOpen className="w-7 h-7 text-blue-500" /> },
  { id: 'assignments', label: 'Assignments', value: 4, icon: <HiOutlineClipboardList className="w-7 h-7 text-yellow-500" /> },
  { id: 'communities', label: 'Communities', value: 12, icon: <HiOutlineUsers className="w-7 h-7 text-green-500" /> }
];

const attendanceData = [
  { day: 'M', value: 50 },
  { day: 'T', value: 75 },
  { day: 'W', value: 60 },
  { day: 'T', value: 80 },
  { day: 'F', value: 90 },
  { day: 'S', value: 40 }
];

const donutData = [
  { name: 'Courses', value: 65 },
  { name: 'Assignments', value: 35 }
];

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 sm:p-6 bg-[#fafbfc]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-800">Home</h1>
            <p className="text-xs text-gray-500">Ayush Jaiswal / Home</p>
          </div>

          {/* Top stats row */}
          <div className="flex flex-wrap gap-6 mb-6">
            {stats.map((s) => (
              <StatCard key={s.id} label={s.label} value={s.value} icon={s.icon} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Subject Progress & Attendance & Quick Links */}
            {/* Left: Subject Progress & Attendance & Quick Links */}
            <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
              {/* Subject Progress */}
              <AssignmentStatusBarChart />

              {/* Attendance */}
              <div className="bg-white rounded-xl shadow p-4 flex flex-col min-w-140">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-gray-700">Attendance</h3>
                  <span className="text-xs text-gray-400">This Week</span>
                </div>
                <div className=" h-36 flex items-center justify-center">
                  <ResponsiveContainer width="80%" height={180}>
                    <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 15, fill: '#374151', fontWeight: 600 }}
                      />
                      <YAxis
                        hide
                        domain={[0, 100]}
                      />
                      <Tooltip
                        cursor={{ fill: '#f3f4f6' }}
                        contentStyle={{ borderRadius: 8, fontSize: 30 }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={44}>
                        {attendanceData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill="#3B82F6" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between mt-3">
                  <span className="text-xs text-gray-500">Mon-Sat</span>
                  <span className="text-xs text-teal-600 font-semibold">Avg: 65%</span>
                </div>
              </div>
            </div>
            {/* Progress & Calendar */}
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
                    <div className="text-3xl font-bold text-blue-600">65%</div>
                    <div className="text-xs text-gray-500">Courses</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">iCourses | Assignments</p>
                <p className="text-sm font-medium mt-1">Chemistry</p>
              </div>
              <Calendar />
            </div>

            {/* Notifications & Todo */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-lg shadow p-4 w-full max-w-xs ">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Notifications <span className="text-xs text-gray-400">(2)</span>
                  </h3>
                  <Link href="#" className="text-xs text-blue-500">view all</Link>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 bg-gray-50 rounded p-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">🔔</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Sports Day Announcement</p>
                      <p className="text-xs text-gray-500">The school’s Annual Sports Day will be held on May 12, 2024.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 bg-gray-50 rounded p-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">📣</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Summer holidays</p>
                      <p className="text-xs text-gray-500">The school will remain closed from May 25 to Jun 2.</p>
                    </div>
                  </div>
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