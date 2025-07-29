'use client';

import { use } from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import RightSidebar2 from '../../../../Components/Classroom/RightSidebar2';
import { Plus } from 'lucide-react';
import { FaBell, FaCog } from 'react-icons/fa';
import Sidebarmenu from '../../../../Components/Classroom/Sidebarmenu';
import Announcement from '../../../../Components/Classroom/Announcement';
import { getAssignments } from '../../../../services/assignment';

function MaterialCard({
  title,
  subtitle,
  icon,
  dueDate,
  fileUrl,
  onPreview,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  dueDate?: string;
  fileUrl?: string;
  onPreview?: () => void;
}) {
  return (
    <div
      className="cursor-pointer bg-white p-4 rounded-xl shadow hover:shadow-lg transition flex items-center gap-4"
    >
      <div className="text-3xl text-purple-600 flex-shrink-0">{icon}</div>
      <div className="text-left flex-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
        {dueDate && <p className="text-xs text-gray-400 mt-1">Due: {dueDate}</p>}
        {fileUrl ? (
          <button
            className="text-blue-600 underline flex items-center gap-2 mt-2"
            onClick={onPreview}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <Image src="/books.svg" alt="Attachment" width={24} height={24} />
            View Attached Document
          </button>
        ) : (
          <div className="text-gray-400 text-xs mt-2">No document attached.</div>
        )}
      </div>
    </div>
  );
}

export default function AssignmentListPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const [userName, setUserName] = useState('');
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') || '');
    }
  }, []);

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
      {/* Main Content */}
      <div className="flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Classroom</h1>
            <p className="text-sm text-gray-500">
              {userName ? `${userName} / ${classId}` : 'Classroom'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
              <FaBell className="text-xl text-gray-400" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
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

        {/* Assignments List with MaterialCard */}
        {loading ? (
          <p className="text-gray-400 text-sm">Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <div className="text-red-500">No assignments found.</div>
        ) : (
          <div className="grid grid-rows-1 sm:grid-cols-2 gap-4">
            {assignments.map((assignment: any) => (
              <MaterialCard
                key={assignment._id}
                title={assignment.title}
                subtitle={assignment.description}
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
                fileUrl={assignment.fileUrl || assignment.file || assignment.attachment || assignment.documentUrl}
                onPreview={() =>
                  setPreviewUrl(
                    assignment.fileUrl ||
                      assignment.file ||
                      assignment.attachment ||
                      assignment.documentUrl ||
                      ''
                  )
                }
              />
            ))}
          </div>
        )}

        {/* Document Preview Modal */}
        {previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-4 max-w-3xl w-full relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={() => setPreviewUrl(null)}
              >
                Close
              </button>
              <iframe
                src={previewUrl}
                title="Document Preview"
                width="100%"
                height="500px"
                style={{ border: 'none' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block lg:w-64">
        <RightSidebar2 classId={classId} />
      </div>

      {/* Floating + Button */}
      <button
        className="fixed bottom-6 right-6 text-white p-4 rounded-full shadow-lg"
        style={{ backgroundColor: 'rgba(73, 73, 73, 1)' }}
        onClick={() => setSidebarMenuOpen(true)}
      >
        <Plus />
      </button>

      {/* Side Menu */}
      {sidebarMenuOpen && (
        <Sidebarmenu
          open={sidebarMenuOpen}
          onClose={() => setSidebarMenuOpen(false)}
          onAnnouncement={() => {
            setSidebarMenuOpen(false);
            setAnnouncementOpen(true);
          }}
        />
      )}

      {/* Announcement Modal */}
      {announcementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <Announcement onClose={() => setAnnouncementOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}