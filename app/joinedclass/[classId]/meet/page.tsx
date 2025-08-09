/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { fetchMeetingsByClass, joinMeeting } from '../../../services/meet';
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
  const [lectureStarted, setLectureStarted] = useState<{ [meetingId: string]: boolean }>({});
  const [nowIST, setNowIST] = useState(new Date());
  const router = useRouter();
  const socket = useSocket();

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNowIST(new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchMeetings = async () => {
    const classId = localStorage.getItem('currentClassId');
    if (!classId) return setLoading(false);

    try {
      const res = await fetchMeetingsByClass(classId);
      setMeetings(res.meetings || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Listen for meeting started event from backend
  useEffect(() => {
    if (!socket?.socket) return;

    const handleMeetingStarted = (data: { meetingId: string; title: string; meetingLink: string }) => {
      console.log('📢 Meeting started:', data);
      setLectureStarted((prev) => ({ ...prev, [data.meetingId]: true }));

      // Show notification to user
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Meeting Started!', {
          body: `${data.title} has started. Click to join!`,
          icon: '/favicon.ico',
        });
      }
    };

    const handleMeetingNotification = (data: unknown) => {
      console.log('📋 Meeting notification:', data);
    };

    socket.socket.on('meeting_started', handleMeetingStarted);
    socket.socket.on('meeting_notification', handleMeetingNotification);

    return () => {
      socket.socket?.off('meeting_started', handleMeetingStarted);
      socket.socket?.off('meeting_notification', handleMeetingNotification);
    };
  }, [socket]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Helper to check if meeting time has arrived (IST)
  const isMeetingStarted = (scheduledDate: string) => {
    const meetingIST = parseAsIST(scheduledDate);
    return nowIST >= meetingIST;
  };

  // Helper to check if user can join (meeting started by teacher)
  const canJoinMeeting = (meeting: Meeting) => {
    const timeStarted = isMeetingStarted(meeting.scheduledDate);
    const teacherStarted = lectureStarted[meeting._id];
    return timeStarted && teacherStarted;
  };

  // Get time until meeting starts
  const getTimeUntilMeeting = (scheduledDate: string) => {
    const meetingIST = parseAsIST(scheduledDate);
    const diff = meetingIST.getTime() - nowIST.getTime();

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Handler for joining a lecture
  const handleJoinLecture = async (meeting: Meeting) => {
    const meetingId = meeting._id;
    const classId = typeof meeting.classId === 'object' ? meeting.classId._id : meeting.classId;

    try {
      // Call the join meeting API
      await joinMeeting(meetingId);

      // Emit join event if socket is available
      if (socket?.socket) {
        socket.socket.emit('join_video_call', { classId, meetingId });
      }

      // Redirect to meeting screen as participant
      router.push(`/classroom/${classId}/meet/lecture/${meetingId}`);
    } catch (error) {
      alert('Failed to join the meeting. Please try again.');
      console.error('Join meeting error:', error);
    }
  };

  return (
    <div className="flex p-6 bg-gray-50 min-h-screen">
      <div className="flex-1 max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Meetings</h1>
            <p className="text-lg text-gray-600">Join your scheduled classroom meetings</p>
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
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
              <div className="text-gray-600 text-lg">Loading meetings...</div>
            </div>
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FaCalendarAlt className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-gray-500 text-lg mb-2">No meetings scheduled.</div>
            <div className="text-gray-400 text-sm">Scheduled meetings will appear here.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => {
              const timeStarted = isMeetingStarted(meeting.scheduledDate);
              const teacherStarted = lectureStarted[meeting._id];
              const canJoin = canJoinMeeting(meeting);
              const timeUntil = getTimeUntilMeeting(meeting.scheduledDate);
              console.log('canJoin', meeting._id, canJoin, { timeStarted, teacherStarted });

              return (
                <div key={meeting._id} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                  {/* Header with title and class badge */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">{meeting.title}</h2>
                      {meeting.description && (
                        <p className="text-gray-600 text-sm">{meeting.description}</p>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col space-y-1">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {typeof meeting.classId === 'object' ? meeting.classId.className : ''}
                      </span>
                      {teacherStarted && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          Live
                        </span>
                      )}
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
                          {timeUntil && (
                            <div className="text-xs text-orange-600 font-medium">
                              Starts in {timeUntil}
                            </div>
                          )}
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

                      {canJoin ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <FaCheckCircle className="w-4 h-4 mr-1" /> Ready to Join
                        </span>
                      ) : timeStarted ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                          <FaHourglassHalf className="w-4 h-4 mr-1" /> Waiting for Teacher
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                          <FaHourglassHalf className="w-4 h-4 mr-1" /> Scheduled
                        </span>
                      )}
                    </div>

                    {/* Action button */}
                    <div>
                      {canJoin ? (
                        <button
                          className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 shadow-md hover:shadow-lg"
                          onClick={() => handleJoinLecture(meeting)}
                        >
                          <FaVideo className="w-4 h-4 mr-2" />
                          Join Meeting
                        </button>
                      ) : timeStarted ? (
                        <button
                          className="inline-flex items-center px-6 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-500 bg-gray-50 cursor-not-allowed"
                          disabled
                        >
                          <FaHourglassHalf className="w-4 h-4 mr-2" />
                          Waiting for Teacher
                        </button>
                      ) : (
                        <button
                          className="inline-flex items-center px-6 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-500 bg-gray-50 cursor-not-allowed"
                          disabled
                        >
                          <FaClock className="w-4 h-4 mr-2" />
                          Not Started
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Additional info for students */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {canJoin ? (
                          <span className="text-green-600 font-medium"> Ready to join when teacher starts</span>
                        ) : timeStarted ? (
                          <span className="text-yellow-600 font-medium">Teacher hasn&#39;t started the meeting yet</span>
                        ) : (
                          <span className="text-gray-500">Meeting will be available at the scheduled time</span>
                        )}
                      </span>
                      {timeUntil && (
                        <span className="text-orange-600 font-medium">
                          Starts in {timeUntil}
                        </span>
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