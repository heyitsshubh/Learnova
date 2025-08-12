'use client';

import { use } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaBell, FaCog, FaArrowLeft } from 'react-icons/fa';
import { Plus, X } from 'lucide-react';
import { getAssignments } from '../../../../services/assignment';
import RightSidebar2 from '../../../../Components/Classroom/RightSidebar2';
import SubmitAssignment from '../../../../Components/utils/Submit';
import { useSocket } from '../../../../Components/Contexts/SocketContext';

interface Attachment {
  _id: string;
  originalName: string;
  filename: string;
  url: string;
  mimetype: string;
  path?: string;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  instructions: string;
  category: string;
  classId: {
    _id: string;
    className: string;
    subject: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
  attachments: Attachment[];
  hasSubmitted: boolean;
  isOverdue: boolean;
  userSubmission?: {
    content: string;
    submittedAt: string;
    grade: number | null;
    feedback: string;
  };
  subject: string;
  className: string;
}

export default function JoinedAssignmentDetailPage({ params }: { params: Promise<{ classId: string; assignmentId: string }> }) {
  const { classId, assignmentId } = use(params);
  const router = useRouter();

  const [userName, setUserName] = useState('');
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  // Notification logic with socket context
  const { notifications } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!classId || !assignmentId) return;

      setLoading(true);
      try {
        const response = await getAssignments(classId);
        const assignments = response.assignments || [];
        const foundAssignment = assignments.find((assignment: Assignment) => assignment._id === assignmentId);

        if (foundAssignment) {
          setAssignment(foundAssignment);
        } else {
          console.error('Assignment not found');
        }
      } catch (error) {
        console.error('Failed to fetch assignment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [classId, assignmentId]);

  const handlePreviewAttachment = (attachment: Attachment) => {
    setPreviewAttachment(attachment);
  };

  const getFileUrl = (attachment: Attachment) => {
    const baseUrl = 'https://project2-zphf.onrender.com';

    if (attachment.path) {
      const cleanPath = attachment.path.startsWith('/') ? attachment.path.slice(1) : attachment.path;
      return `${baseUrl}/${cleanPath}`;
    }

    if (attachment.url) {
      if (attachment.url.startsWith('http')) {
        return attachment.url;
      } else {
        const cleanUrl = attachment.url.startsWith('/') ? attachment.url.slice(1) : attachment.url;
        return `${baseUrl}/${cleanUrl}`;
      }
    }

    if (attachment.filename) {
      return `${baseUrl}/uploads/assignments/${attachment.filename}`;
    }

    return `${baseUrl}/uploads/assignments/default.png`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading assignment...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Assignment not found</div>
      </div>
    );
  }

  return (
    <div className="flex p-6 gap-6">
      <div className="flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <FaArrowLeft className="text-xl text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">{assignment.title}</h1>
              <p className="text-sm text-gray-500">
                {userName ? `${userName} / ${assignment.className}` : assignment.className}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
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

        <div className="relative h-48 rounded-2xl overflow-hidden shadow mb-6">
          <Image
            src="/Banner.svg"
            alt="UHV Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-opacity-30 flex items-center justify-center"></div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Image
              src="/books.svg"
              alt="Assignment"
              width={60}
              height={60}
              className="rounded"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{assignment.title}</h2>
              <p className="text-gray-600">{assignment.subject}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-gray-500">
                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="text-right">
              {assignment.hasSubmitted ? (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  Submitted
                </span>
              ) : assignment.isOverdue ? (
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                  Overdue
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  Pending
                </span>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 mb-4">{assignment.description}</p>

            {assignment.instructions && (
              <>
                <h3 className="font-semibold mb-2">Instructions</h3>
                <p className="text-gray-700 mb-4">{assignment.instructions}</p>
              </>
            )}

            {assignment.attachments && assignment.attachments.length > 0 && (
              <>
                <h3 className="font-semibold mb-2">Attachments</h3>
                <div className="space-y-4">
                  {assignment.attachments.map((attachment, index) => {
                    const isImage = attachment.mimetype?.startsWith('image/');
                    const isPDF = attachment.mimetype === 'application/pdf';
                    const fileUrl = getFileUrl(attachment);

                    return (
                      <div key={attachment._id || index} className="p-4 bg-gray-50 rounded shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Image src="/books.svg" alt="File" width={20} height={20} />
                          <span className="text-sm font-medium">
                            {attachment.originalName || attachment.filename || `Attachment ${index + 1}`}
                          </span>
                          <button
                            onClick={() => handlePreviewAttachment(attachment)}
                            className="text-blue-600 hover:text-blue-800 hover:underline text-xs ml-auto"
                          >
                            {isImage ? 'View Image' : isPDF ? 'View PDF' : 'View File'}
                          </button>
                        </div>
                        {isImage && (
                          <div className="mt-2">
                            <Image
                              src={fileUrl}
                              alt={attachment.originalName || attachment.filename || 'Attachment image'}
                              width={800}
                              height={300}
                              className="max-w-full h-48 object-cover rounded border cursor-pointer"
                              onClick={() => handlePreviewAttachment(attachment)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="hidden lg:block lg:w-64">
        <RightSidebar2 classId={classId} />
      </div>
      {!assignment.hasSubmitted && (
        <button
          className="fixed bottom-6 right-6 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
          style={{ backgroundColor: 'rgba(73, 73, 73, 1)' }}
          onClick={() => setSubmitModalOpen(true)}
        >
          <Plus className="w-6 h-6 " />
        </button>
      )}
      {submitModalOpen && (
        <SubmitAssignment
          assignmentId={assignmentId}
          classId={classId}
          onClose={() => setSubmitModalOpen(false)}
        />
      )}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-5xl max-h-5xl w-full h-5/6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold truncate">
                {previewAttachment.originalName || previewAttachment.filename}
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                onClick={() => setPreviewAttachment(null)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="h-full overflow-auto">
              {previewAttachment.mimetype?.startsWith('image/') ? (
                <div className="flex justify-center items-center h-full">
                  <Image
                    src={getFileUrl(previewAttachment)}
                    alt={previewAttachment.originalName || previewAttachment.filename || 'Preview image'}
                    width={800}
                    height={600}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : previewAttachment.mimetype === 'application/pdf' ? (
                <iframe
                  src={getFileUrl(previewAttachment)}
                  title="PDF Preview"
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <Image src="/books.svg" alt="File" width={64} height={64} className="mb-4" />
                  <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                  <p className="text-sm text-gray-500 mb-4">File type: {previewAttachment.mimetype}</p>
                  <a
                    href={getFileUrl(previewAttachment)}
                    download={previewAttachment.originalName || previewAttachment.filename}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
                      <div className="mt-4 flex justify-center">
              <a
                href={getFileUrl(previewAttachment)}
                download={previewAttachment.originalName || previewAttachment.filename}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}