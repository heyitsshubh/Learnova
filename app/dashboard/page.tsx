'use client';
import AppLayout from '../Components/AppLayout';
import ProtectedRoute from '../Components/ProtectedRoute';
import Link from 'next/link';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { useState } from 'react';

const stats = [
  { id: 'classes', label: 'My Classes', value: 5 },
  { id: 'assignments', label: 'Assignments', value: 4 },
  { id: 'communities', label: 'Communities', value: 12 }
];

const progressItems = [
  { name: 'UHV', value: 60 },
  { name: 'PPS', value: 95 },
  { name: 'YOGA', value: 60 },
  { name: 'Physical Education', value: 80 },
  { name: 'Chemistry', value: 40 },
  { name: 'Laser', value: 45 }
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

// Calendar component styled as in your image
function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState(new Date());

  // Get the Monday of the current week
  const getMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const monday = getMonday(currentDate);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const handlePrevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };
  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const isSelected = (date: Date) =>
    date.getDate() === selected.getDate() &&
    date.getMonth() === selected.getMonth() &&
    date.getFullYear() === selected.getFullYear();

  return (
    <div className="bg-[#e6f0ef] rounded-xl border border-[#e6f0ef] p-4 mb-4">
      <div className="bg-white rounded-xl p-4 shadow flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handlePrevWeek}
            className="text-gray-500 text-lg px-2 rounded hover:bg-gray-100"
            aria-label="Previous week"
          >
            &lt;
          </button>
          <span className="font-semibold text-gray-700">
            {selected.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={handleNextWeek}
            className="text-gray-500 text-lg px-2 rounded hover:bg-gray-100"
            aria-label="Next week"
          >
            &gt;
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {week.map((date, idx) => (
            <button
              key={idx}
              className={`rounded-full w-8 h-8 flex items-center justify-center transition
                ${isSelected(date)
                  ? 'bg-teal-600 text-white font-bold'
                  : 'bg-gray-100 text-gray-700 hover:bg-teal-100'}
              `}
              onClick={() => setSelected(new Date(date))}
              aria-label={`Select ${date.toDateString()}`}
            >
              {date.getDate()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// To-Do List styled as in your image
function TodoList() {
  const [todos, setTodos] = useState<{ text: string; done: boolean }[]>([
    { text: 'yhyhu', done: true }
  ]);
  const [input, setInput] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setTodos([{ text: input.trim(), done: false }, ...todos]);
      setInput('');
    }
  };

  const toggleDone = (idx: number) => {
    setTodos(todos =>
      todos.map((todo, i) => (i === idx ? { ...todo, done: !todo.done } : todo))
    );
  };

  return (
    <div className="bg-[#e6f0ef] rounded-xl border border-[#e6f0ef] p-4">
      <div className="bg-white rounded-xl p-4 shadow">
        <h3 className="text-base font-medium text-gray-700 mb-2">To-Do List</h3>
        <form onSubmit={handleAdd}>
          <input
            className="w-full border border-gray-400 rounded-md px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-700"
            placeholder="Enter your task here"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
        </form>
        <div className="space-y-2">
          {todos.map((todo, idx) => (
            <div
              key={idx}
              className="flex items-center bg-gray-100 rounded px-3 py-2"
            >
              <button
                className="mr-2"
                onClick={() => toggleDone(idx)}
                aria-label={todo.done ? 'Mark as not done' : 'Mark as done'}
              >
                <span
                  className={`inline-block w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    todo.done
                      ? 'border-teal-600 bg-teal-600 text-white'
                      : 'border-gray-400 bg-white text-gray-400'
                  }`}
                >
                  {todo.done ? '✔' : ''}
                </span>
              </button>
              <span
                className={`flex-1 text-sm ${todo.done ? 'line-through text-gray-400' : 'text-gray-800'}`}
              >
                {todo.text}
              </span>
              <button
                className="ml-2 text-gray-500 hover:text-gray-700"
                onClick={() => setTodos(todos => todos.filter((_, i) => i !== idx))}
                aria-label="Delete"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="#e5e7eb"/>
                  <rect x="9" y="11" width="6" height="2" rx="1" fill="#6b7280"/>
                </svg>
              </button>
              <button
                className="ml-2 text-gray-500 hover:text-gray-700"
                aria-label="More"
                tabIndex={-1}
                disabled
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="2" fill="#6b7280"/>
                  <circle cx="12" cy="6" r="2" fill="#6b7280"/>
                  <circle cx="12" cy="18" r="2" fill="#6b7280"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 min-w-[150px]">
      <p className="text-sm text-gray-500">{label}</p>
      <h3 className="text-3xl font-semibold mt-2">{value}</h3>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div className="h-2 rounded-full" style={{ width: `${value}%`, background: value > 70 ? '#3B82F6' : '#FB923C' }} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="min-h-screen bg-gray-100 p-6">
          <div className="max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-slate-800">Home</h1>
              <p className="text-xs text-gray-500">Ayush Jaiswal / Home</p>
            </div>

            {/* Top stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-6">
              {stats.map((s) => (
                <StatCard key={s.id} label={s.label} value={s.value} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left column: Progress list + big progress donut */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Subject Progress</h3>
                    <div className="space-y-3">
                      {progressItems.map((p) => (
                        <div key={p.name} className="flex items-center justify-between">
                          <div className="text-sm text-gray-600 w-28">{p.name}</div>
                          <div className="flex-1 px-3">
                            <ProgressBar value={p.value} />
                          </div>
                          <div className="w-1z2 text-right text-sm text-gray-700">{p.value}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">PROGRESS</h3>
                    <div className="w-40 h-40 flex items-center justify-center">
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie data={donutData} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={2}>
                            {donutData.map((entry, idx) => (
                              <Cell key={entry.name} fill={idx === 0 ? '#3B82F6' : '#E5E7EB'} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute text-center">
                        <div className="text-2xl font-semibold">65%</div>
                        <div className="text-xs text-gray-500">85%</div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">iCourses | Assignments</p>
                    <p className="text-sm font-medium mt-1">Chemistry</p>
                  </div>
                </div>

                {/* Attendance + Calendar row */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Attendance */}
                  <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Attendance</h3>
                    <div style={{ width: '100%', height: 140 }}>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <XAxis dataKey="day" axisLine={false} tickLine={false} />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {attendanceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill="#3B82F6" />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Calendar */}
                  <Calendar />
                </div>
              </div>

              {/* Right column: Notifications + ToDo */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Notifications <span className="text-xs text-gray-400">(2)</span></h3>
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

                {/* To-Do List as in your image */}
                <TodoList />
              </div>
            </div>

            {/* Footer spacer */}
            <div className="h-12" />
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}