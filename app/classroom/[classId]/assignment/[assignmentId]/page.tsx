'use client';

import { use } from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import RightSidebar2 from '../../../../Components/Classroom/RightSidebar2';
import { Plus, ArrowLeft } from 'lucide-react';
import { FaBell, FaCog } from 'react-icons/fa';
import Sidebarmenu from '../../../../Components/Classroom/Sidebarmenu';
import Announcement from '../../../../Components/Classroom/Announcement';
import { getAssignments } from '../../../../services/assignment';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../../../Components/Contexts/SocketContext';

interface Attachment {
  _id: string;
  filename: string;
  originalName?: string;
  path: string;
  url?: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

interface Assignment {
  _id: string;
  title: string;
  // description: string;
  dueDate: string;
  maxMarks: number;
  instructions: string;
  allowLateSubmission: boolean;
  category: string;
  classId: string;
  attachments: Attachment[];
  fileUrl?: string;
  file?: string;
  attachment?: string;
  documentUrl?: string;
}

function MaterialCard({
  // title,
  // subtitle,
  icon,
  dueDate,
  attachments,
}: {
  // title: string;
  // subtitle: string;
  icon: React.ReactNode;
  dueDate?: string;
  attachments?: Attachment[];
}) {
  const hasAttachments = attachments && attachments.length > 0;

  return (
    <div className="cursor-pointer bg-white p-4 rounded-xl shadow hover:shadow-lg transition flex items-center gap-4">
      <div className="text-3xl text-purple-600 flex-shrink-0">{icon}</div>
      <div className="text-left flex-1">
        {/* <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p> */}
        {dueDate && <p className="text-xs text-gray-400 mt-1">Due: {new Date(dueDate).toLocaleDateString()}</p>}
        {hasAttachments ? (
          <div className="mt-2">
            {attachments.map((attachment, index) => (
              <div key={attachment._id || index} className="text-xs text-gray-600">
                📎 {attachment.originalName || attachment.filename}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-xs mt-2">No document attached.</div>
        )}
      </div>
    </div>
  );
}

export default function AssignmentListPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const router = useRouter();
  const { notifications } = useSocket();

  useEffect(() => {
    if (typeof window !== 'undefined') {
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

  useEffect(() => {
    if (classId) {
      setLoading(true);
      getAssignments(classId)
        .then(data => {
          const assignmentsArr = Array.isArray(data) ? data : data.assignments || [];
          setAssignments(assignmentsArr);
        })
        .catch(() => setAssignments([]))
        .finally(() => setLoading(false));
    }
  }, [classId]);

  return (
    <div className="flex p-6 gap-6">
      <div className="flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
              onClick={() => router.back()}
              aria-label="Go back"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Classroom</h1>
              <p className="text-sm text-gray-500"></p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer relative"
              style={{ cursor: 'pointer' }}
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
              style={{ cursor: 'pointer' }}
              onClick={() => router.push('/Settings')}
            >
              <FaCog className="text-xl text-gray-400" />
            </button>
          </div>
        </div>
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
            <h2 className="text-lg font-semibold mb-2">Assignments</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading assignments...</p>
          
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Image
              src="/AssignmentAnalytics.svg"
              alt="No assignments"
              width={300}
              height={200}
              className="mb-4"
            />
            <div className="text-gray-400 text-sm">No assignments found.</div>
          </div>
        ) : (
          <div className="grid grid-rows-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {assignments.map((assignment: Assignment, idx: number) => (
                <motion.div
                  key={assignment._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                >
                  <MaterialCard
                    // title={assignment.title}
                    // subtitle={assignment.description}
                    icon={
                      <Image
                        src="/books.svg"
                        alt={assignment.title}
                        width={70}
                        height={70}
                        className="rounded"
                      />
                    }
                    dueDate={assignment.dueDate}
                    attachments={assignment.attachments}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <div className="hidden lg:block lg:w-64">
        <RightSidebar2 classId={classId} />
      </div>
      <button
        className="fixed bottom-6 right-6 text-white p-4 rounded-full shadow-lg"
        style={{ backgroundColor: 'rgba(73, 73, 73, 1)', cursor: 'pointer' }}
        onClick={() => setSidebarMenuOpen(true)}
      >
        <Plus />
      </button>

      {sidebarMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40"></div>
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <Sidebarmenu
              open={sidebarMenuOpen}
              onClose={() => setSidebarMenuOpen(false)}
              onAnnouncement={() => {
                setSidebarMenuOpen(false);
                setAnnouncementOpen(true);
              }}
            />
          </div>
        </>
      )}
      {announcementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <Announcement onClose={() => setAnnouncementOpen(false)} classId={classId} />
          </div>
        </div>
      )}
          </div>
  );
}