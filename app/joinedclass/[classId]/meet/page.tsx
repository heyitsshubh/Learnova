'use client';

import { useEffect, useState } from 'react';
import { fetchMeetingsByClass } from '../../../services/meet';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaLock, FaCheckCircle, FaHourglassHalf, FaUsers, FaCalendarAlt, FaClock, FaUser, FaVideo } from 'react-icons/fa';
import { useSocket } from '../../../Components/Contexts/SocketContext';

// Utility: Parse a "YYYY-MM-DDTHH:mm" string as IST
function parseAsIST(dateString: string) {
  const [datePart, timePart] = dateString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  // Create a Date object in IST (local time as IST)
  return new Date(year, month - 1, day, hour, minute);
}

interface Meeting {
  _id: string;
  title: string;
  description?: string;
  scheduledDate: string;
  duration: number;
  classId: { _id: string; className: string; subject: string; createdBy: string } | string;
  scheduledBy: { _id: string; name: string; email: string };
  maxParticipants?: number;
  isPrivate?: boolean;
  status?: string;
}

export default function MeetPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [lectureAvailable, setLectureAvailable] = useState<{ [meetingId: string]: boolean }>({});
  const router = useRouter();
  const socket = useSocket();

  const currentUserId =
    typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';

  // For showing current IST time
  const [nowIST, setNowIST] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNowIST(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchMeetings = async () => {
    const classId = localStorage.getItem('currentClassId');
    if (!classId) return setLoading(false);
    try {
      const res = await fetchMeetingsByClass(classId);
      setMeetings(res.meetings || []);
    } catch {
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Listen for lectureStarted event from backend
  useEffect(() => {
    if (!socket?.socket) return;
    const handler = ({ meetingId }: { meetingId: string }) => {
      setLectureAvailable((prev) => ({ ...prev, [meetingId]: true }));
    };
    socket.socket.on('lectureStarted', handler);
    return () => {
      if (socket?.socket) {
        socket.socket.off('lectureStarted', handler);
      }
    };
  }, [socket]);

  // Helper to check if meeting is started (IST)
  const isMeetingStarted = (scheduledDate: string) => {
    const now = new Date();
    const nowIST = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const meetingIST = parseAsIST(scheduledDate);
    return (
      nowIST.getFullYear() > meetingIST.getFullYear() ||
      (nowIST.getFullYear() === meetingIST.getFullYear() &&
        (nowIST.getMonth() > meetingIST.getMonth() ||
          (nowIST.getMonth() === meetingIST.getMonth() && nowIST.getDate() >= meetingIST.getDate())))
    );
  };

  // Helper to check if user is the class creator
  const isClassCreator = (meeting: Meeting) => {
    if (
      typeof meeting.classId === 'object' &&
      meeting.classId.createdBy &&
      currentUserId
    ) {
      return String(meeting.classId.createdBy).trim() === String(currentUserId).trim();
    }
    return false;
  };

  // Handler for joining a lecture (emit join_video_call and redirect to MeetScreen)
  const handleJoinLecture = (meeting: Meeting) => {
    const meetingId = meeting._id;
    const classId = typeof meeting.classId === 'object' ? meeting.classId._id : meeting.classId;
    if (socket?.socket) {
      socket.socket.emit('join_video_call', { classId, meetingId });
    }
    router.push(`/meet/lecture/${meetingId}?role=participant`);
  };

  // Handler for teacher to start lecture (redirect to MeetScreen as host)
  const handleStartLecture = (meeting: Meeting) => {
    router.push(`/meet/lecture/${meeting._id}?role=host`);
  };

  return (
    <div className="flex p-6 bg-gray-50 min-h-screen">
      <div className="flex-1 max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Schedule Meetings</h1>
            <p className="text-lg text-gray-600">Manage and join your classroom meetings</p>
          </div>
        </div>

        {/* Show current IST time */}
        <div className="mb-4 text-right text-gray-600 text-sm">
          Current IST Time: {nowIST.toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata',
          })}
        </div>

        <div className="relative h-48 rounded-2xl overflow-hidden shadow mb-6">
          <Image
            src="/Banner.svg"
            alt="UHV Banner"
            fill
            className="object-cover"
            priority
          />
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-full flex justify-center"></div>
            <div className="text-gray-500 text-lg mb-2">No meetings scheduled.</div>
            <div className="text-gray-400 text-sm">Scheduled meetings will appear here.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => {
              const started = isMeetingStarted(meeting.scheduledDate);

              return (
                <div key={meeting._id} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                  {/* Header with title and class badge */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">{meeting.title}</h2>
                      <p className="text-gray-600 text-sm">{meeting.description}</p>
                    </div>
                    <div className="ml-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {typeof meeting.classId === 'object' ? meeting.classId.className : ''}
                      </span>
                    </div>
                  </div>

                  {/* Meeting details grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <FaCalendarAlt className="w-5 h-5 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-500">Scheduled Date</div>
                          <div className="text-base font-semibold text-gray-800">
                            {parseAsIST(meeting.scheduledDate).toLocaleString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                              timeZone: 'Asia/Kolkata',
                            })}
                          </div>
                          <div className="text-xs text-gray-400">Raw: {meeting.scheduledDate}</div>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <FaUsers className="w-5 h-5 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-500">Max Participants</div>
                          <div className="text-base font-semibold text-gray-800">{meeting.maxParticipants || 'Unlimited'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <FaClock className="w-5 h-5 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-500">Duration</div>
                          <div className="text-base font-semibold text-gray-800">{meeting.duration} minutes</div>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <FaUser className="w-5 h-5 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-500">Scheduled by</div>
                          <div className="text-base font-semibold text-gray-800">{meeting.scheduledBy.name}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status indicators */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {meeting.isPrivate && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          <FaLock className="w-4 h-4 mr-1" /> Private Meeting
                        </span>
                      )}

                      {started && lectureAvailable[meeting._id] ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <FaCheckCircle className="w-4 h-4 mr-1" /> Meeting Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                          <FaHourglassHalf className="w-4 h-4 mr-1" /> Scheduled
                        </span>
                      )}
                    </div>

                    {/* Action button */}
                    <div>
                      {started && lectureAvailable[meeting._id] ? (
                        isClassCreator(meeting) ? (
                          <button
                            className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleStartLecture(meeting)}
                          >
                            <FaVideo className="mr-2" /> Start Lecture
                          </button>
                        ) : (
                          <button
                            className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700"
                            onClick={() => handleJoinLecture(meeting)}
                          >
                            Join Lecture
                          </button>
                        )
                      ) : (
                        <span className="text-sm text-gray-400 italic">Meeting not started yet</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}