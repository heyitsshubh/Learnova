'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, MoreVertical } from 'lucide-react';
import { FaBell, FaCog } from 'react-icons/fa';
import RightSidebar2 from '../../Components/Classroom/RightSidebar2';
import Sidebarmenu from '../../Components/Classroom/Sidebarmenu';
import CreateAssignment from '../../Components/Classroom/CreateAssignment';
import Announcement from '../../Components/Classroom/Announcement';
import { getAssignments } from '../../services/assignment';
// import { deleteAssignment } from '../../services/assignment'; // Uncomment and implement this

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  instructions: string;
  allowLateSubmission: boolean;
  category: string;
  classId: string;
}

function MaterialCard({
  title,
  subtitle,
  icon,
  onClick,
  onDelete
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick?: () => void;
  onDelete?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative cursor-pointer bg-white p-4 rounded-xl shadow hover:shadow-lg transition flex items-center gap-4">
      <div className="text-3xl text-purple-600 flex-shrink-0" onClick={onClick}>{icon}</div>
      <div className="text-left flex-1" onClick={onClick}>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="relative">
        <button
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((open) => !open);
          }}
        >
          <MoreVertical className="text-xl text-gray-400" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-10">
            <button
              className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                if (onDelete) onDelete();
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClassDetailPage() {
  const [userName, setUserName] = useState('');
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false);
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);

  const params = useParams();
  const router = useRouter();
  const classid = params.classId;

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Handler for deleting an assignment
  const handleDeleteAssignment = async (assignmentId: string) => {
    // TODO: Replace with actual deleteAssignment API call
    // await deleteAssignment(assignmentId);
    setAssignments((prev) => prev.filter(a => a._id !== assignmentId));
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') || '');
    }
  }, []);

  useEffect(() => {
    if (classid) {
      setAssignmentsLoading(true);
      getAssignments(classid as string)
        .then((data) => {
          // Try both possibilities
          if (Array.isArray(data)) {
            setAssignments(data);
          } else if (Array.isArray(data.assignments)) {
            setAssignments(data.assignments);
          } else {
            setAssignments([]);
          }
        })
        .catch(() => setAssignments([]))
        .finally(() => setAssignmentsLoading(false));
    }
  }, [classid, createAssignmentOpen]);

  return (
    <div className="flex p-6 gap-6">
      {/* Left/Main Section */}
      <div className="flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Classroom</h1>
            <p className="text-sm text-gray-500">
              {userName ? `${userName} / ${classid}` : 'Classroom'}
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

        {/* Banner Image */}
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
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Assignments</h2>
          {assignmentsLoading ? (
            <p className="text-gray-400 text-sm">Loading assignments...</p>
          ) : assignments.length === 0 ? (
            <p className="text-gray-400 text-sm">No assignments found.</p>
          ) : (
            <div className="grid grid-rows-1 sm:grid-cols-3 gap-4">
              {assignments.map((assignment: Assignment) => (
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
                  onClick={() => router.push(`/classroom/${classid}/assignment/${assignment._id}`)}
                  onDelete={() => handleDeleteAssignment(assignment._id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block lg:w-64">
        <RightSidebar2 classId={classid as string} />
      </div>

      {/* Floating Plus Button */}
      <button
        className="fixed bottom-6 right-6 text-white p-4 rounded-full shadow-lg"
        style={{ backgroundColor: 'rgba(73, 73, 73, 1)' }}
        onClick={() => setSidebarMenuOpen(true)}
      >
        <Plus />
      </button>

      {/* Sidebar Menu */}
      {sidebarMenuOpen && (
        <Sidebarmenu
          open={sidebarMenuOpen}
          onClose={() => setSidebarMenuOpen(false)}
          onCreateAssignment={() => {
            setSidebarMenuOpen(false);
            setCreateAssignmentOpen(true);
          }}
          onAnnouncement={() => {
            setSidebarMenuOpen(false);
            setAnnouncementOpen(true);
          }}
        />
      )}

      {/* Create Assignment Modal */}
      {createAssignmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <CreateAssignment onClose={() => setCreateAssignmentOpen(false)} classId={classid as string} />
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {announcementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <Announcement onClose={() => setAnnouncementOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}