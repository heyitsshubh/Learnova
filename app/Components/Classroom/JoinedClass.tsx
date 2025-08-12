'use client';

import { useEffect, useState } from 'react';
import { FaBell, FaCog } from 'react-icons/fa';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import RightSidebar2 from './RightSidebar2';
import { getAssignments } from '../../services/assignment';
import { useSocket } from '../Contexts/SocketContext'; // <-- Import your socket context

interface ClassData {
  _id: string;
  className: string;
  subject: string;
  createdBy?: { name?: string };
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
}

export default function JoinedClass({ classData }: { classData: ClassData }) {
  const [userName, setUserName] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const router = useRouter();

  // Notification logic
  const { notifications } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Play notification sound when a new notification arrives
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const lastNotification = notifications[notifications.length - 1];
      if (!lastNotification.isRead) {
        const audio = new window.Audio('/notification.mp3');
        audio.play().catch(() => {});
      }
    }
  }, [notifications]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') || '');
      setCurrentUserId(localStorage.getItem('userId'));
    }
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const count = notifications.filter(
      (n) =>
        !n.isRead &&
        !(n.type === 'message' && n.sender._id === currentUserId)
    ).length;
    setUnreadCount(count);
  }, [notifications, currentUserId]);

  // Fetch assignments from API
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!classData._id) return;
      try {
        const response = await getAssignments(classData._id);
        const assignmentsData = response.assignments || [];
        setAssignments(assignmentsData);
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
        setAssignments([]);
      }
    };

    fetchAssignments();
  }, [classData._id]);

  const handleAssignmentClick = (assignmentId: string) => {
    router.push(`/joinedclass/${classData._id}/assignment/${assignmentId}`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{classData.className}</h1>
            <p className="text-sm text-gray-500">
              {userName ? `${userName} / ${classData.className}` : classData.className}
            </p>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex justify-end mb-2">
              <button
                className="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow transition cursor-pointer"
                onClick={() => router.push(`/joinedclass/${classData._id}/meet`)}
              >
                <span>Scheduled Meets</span>
              </button>
            </div>
            <button
              className="p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer relative"
              onClick={() => router.push('/notifications')}
            >
              <FaBell className="text-xl text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
              onClick={() => router.push('/Settings')}
            >
              <FaCog className="text-xl text-gray-400" />
            </button>
          </div>
        </div>

        {/* Banner */}
        <div className="relative h-48 rounded-2xl overflow-hidden shadow mb-6">
          <Image
            src="/Banner.svg"
            alt="UHV Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-opacity-30 flex items-center justify-center">
            <h2 className="text-white text-2xl font-bold"></h2>
          </div>
        </div>

        {/* Assignments Section */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Assignments</h2>
          {assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center ">
              <Image
                src="/AssignmentAnalytics.svg"
                alt="No assignments"
                width={680}
                height={350}
                className="mb-4"
              />
              <div className="text-gray-400 text-sm">No assignments found.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition flex flex-col cursor-pointer relative"
                  onClick={() => handleAssignmentClick(assignment._id)}
                >
                  {/* Book Icon */}
                  <div className="absolute top-4 right-4">
                    <Image
                      src="/books.svg"
                      alt="Book"
                      width={70}
                      height={70}
                      className="object-contain"
                    />
                  </div>
                  <h3 className="font-semibold">{assignment.title}</h3>
                  <p className="text-sm text-gray-500">{assignment.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block lg:w-64">
        <div className="">
          <RightSidebar2 classId={classData._id} />
        </div>
      </div>
    </div>
  );
}