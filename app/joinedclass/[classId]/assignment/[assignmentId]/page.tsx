'use client';

import { use } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaBell, FaCog, FaArrowLeft } from 'react-icons/fa';
import { getAssignments } from '../../../../services/assignment';
import RightSidebar2 from '../../../../Components/Classroom/RightSidebar2';

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
  attachments: Array<{
    _id: string;
    originalName: string;
    filename: string;
    url: string;
    mimetype: string;
  }>;
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') || '');
    }
  }, []);

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!classId || !assignmentId) return;
      
      setLoading(true);
      try {
        const response = await getAssignments(classId);
        const assignments = response.assignments || [];
        
        // Find the specific assignment by ID
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
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
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
            {/* <h2 className="text-white text-2xl font-bold">{assignment.title}</h2> */}
          </div>
        </div>

        {/* Assignment Details Card */}
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
                {/* <span className="text-gray-500">Max Marks: {assignment.maxMarks}</span> */}
              </div>
              {/* <p className="text-xs text-gray-400 mt-1">
                Created by: {assignment.createdBy.name}
              </p> */}
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
                <div className="space-y-2">
                  {assignment.attachments.map((attachment, index) => (
                    <div key={attachment._id || index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Image src="/books.svg" alt="File" width={20} height={20} />
                      <span className="text-sm">{attachment.originalName || attachment.filename || `Attachment ${index + 1}`}</span>
                      {attachment.url && (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs ml-auto"
                        >
                          View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Submission Section */}
        {assignment.userSubmission ? (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold mb-4">Your Submission</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700">{assignment.userSubmission.content}</p>
              <p className="text-xs text-gray-500 mt-2">
                Submitted on: {new Date(assignment.userSubmission.submittedAt).toLocaleString()}
              </p>
            </div>
            
            {assignment.userSubmission.grade !== null && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Grade</h4>
                <p className="text-lg font-bold text-green-600">
                  {assignment.userSubmission.grade} / {assignment.maxMarks}
                </p>
                {assignment.userSubmission.feedback && (
                  <>
                    <h4 className="font-semibold mb-2 mt-4">Feedback</h4>
                    <p className="text-gray-700">{assignment.userSubmission.feedback}</p>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold mb-4">Submit Assignment</h3>
            <p className="text-gray-600 mb-4">You haven't submitted this assignment yet.</p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Submit Assignment
            </button>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block lg:w-64">
        <RightSidebar2 classId={classId} />
      </div>
    </div>
  );
}