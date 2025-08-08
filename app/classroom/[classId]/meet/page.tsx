'use client';

import { useEffect, useState } from 'react';
import { fetchMeetingsByClass } from '../../../services/meet';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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

  const router = useRouter();

  const currentUserId =
    typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';

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
    // eslint-disable-next-line
  }, []);

  // Helper to check if meeting is started
  const isMeetingStarted = (scheduledDate: string) => {
    const today = new Date();
    const meetingDate = new Date(scheduledDate);
    // Compare only year, month, and date
    return (
      today.getFullYear() > meetingDate.getFullYear() ||
      (today.getFullYear() === meetingDate.getFullYear() &&
        (today.getMonth() > meetingDate.getMonth() ||
          (today.getMonth() === meetingDate.getMonth() &&
            today.getDate() >= meetingDate.getDate())))
    );
  };

  // Helper to check if user is the class creator
  const isMeetingCreator = (meeting: Meeting) => {
    return (
      meeting.scheduledBy &&
      meeting.scheduledBy._id &&
      currentUserId &&
      String(meeting.scheduledBy._id).trim() === String(currentUserId).trim()
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? mins + 'm' : ''}`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Meetings</h1>
            <p className="text-lg text-gray-600">
              Manage and join your classroom meetings
            </p>
          </div>

          {/* Enhanced Banner */}
          <div className="relative h-64 rounded-3xl overflow-hidden shadow-xl mb-8">
            <Image
              src="/Banner.svg"
              alt="UHV Banner"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 text-lg">Loading meetings...</p>
            </div>
          </div>
        ) : meetings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.5-4.5L15 1M9 14l-4.5 4.5L9 23M12 3v18" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">No meetings scheduled</h2>
            <p className="text-gray-500 text-lg">
              Scheduled meetings will appear here when they are created.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Upcoming Meetings ({meetings.length})
              </h2>
              <div className="text-sm text-gray-500">
                Showing all scheduled meetings
              </div>
            </div>

            {meetings.map((meeting) => {
              const started = isMeetingStarted(meeting.scheduledDate);
              const creator = isMeetingCreator(meeting);

              console.log({
                meetingId: meeting._id,
                started,
                creator,
                currentUserId,
                createdBy: typeof meeting.classId === 'object' ? meeting.classId.createdBy : undefined,
                scheduledDate: meeting.scheduledDate,
              });

              return (
                <div key={meeting._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="p-8">
                    {/* Meeting Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-2xl font-bold text-gray-900">{meeting.title}</h3>
                          {meeting.isPrivate && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                              Private
                            </span>
                          )}
                        </div>
                        
                        {typeof meeting.classId === 'object' && (
                          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 font-medium mb-4">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.84L7.25 9.035 14.394 11.92a1 1 0 00.788-1.84l-7-3z"/>
                              <path d="M3.5 9.89l3.25 1.393a1 1 0 00.788 0l3.25-1.393V13a1 1 0 11-2 0v-.838l-1.25.535a1 1 0 01-.788 0L3.5 11.162V9.89z"/>
                            </svg>
                            {meeting.classId.className} - {meeting.classId.subject}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className={`inline-flex items-center px-4 py-2 rounded-full font-medium text-sm ${
                          started ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            started ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></div>
                          {started ? 'Live Now' : 'Scheduled'}
                        </div>
                      </div>
                    </div>

                    {/* Meeting Description */}
                    {meeting.description && (
                      <div className="mb-6">
                        <p className="text-gray-700 text-lg leading-relaxed">{meeting.description}</p>
                      </div>
                    )}

                    {/* Meeting Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {/* Date & Time */}
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Date & Time</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {new Date(meeting.scheduledDate).toLocaleString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                              timeZone: 'Asia/Kolkata',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Duration</p>
                          <p className="text-lg font-semibold text-gray-900">{formatDuration(meeting.duration)}</p>
                        </div>
                      </div>

                      {/* Participants */}
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Max Participants</p>
                          <p className="text-lg font-semibold text-gray-900">{meeting.maxParticipants || 'Unlimited'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Host Information */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Scheduled by</p>
                          <p className="font-semibold text-gray-900">{meeting.scheduledBy.name}</p>
                          <p className="text-sm text-gray-600">{meeting.scheduledBy.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-center">
                      {started ? (
                        creator ? (
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-3"
                            onClick={() => router.push(`/meet/lecture/${meeting._id}?role=host`)}
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.5-4.5L15 1M9 14l-4.5 4.5L9 23" />
                            </svg>
                            <span>Start Lecture</span>
                          </button>
                        ) : (
                          <button
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-3"
                            onClick={() => router.push(`/meet/lecture/${meeting._id}?role=participant`)}
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            <span>Join Lecture</span>
                          </button>
                        )
                      ) : (
                        <div className="flex items-center space-x-3 text-gray-500">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-lg font-medium">Meeting not started yet</span>
                        </div>
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
