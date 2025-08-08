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
    return (
      today.getFullYear() > meetingDate.getFullYear() ||
      (today.getFullYear() === meetingDate.getFullYear() &&
        (today.getMonth() > meetingDate.getMonth() ||
          (today.getMonth() === meetingDate.getMonth() &&
            today.getDate() >= meetingDate.getDate())))
    );
  };

  // Helper to check if user is the meeting creator
  const isMeetingCreator = (meeting: Meeting) => {
    return (
      meeting.scheduledBy &&
      meeting.scheduledBy._id &&
      currentUserId &&
      String(meeting.scheduledBy._id).trim() === String(currentUserId).trim()
    );
  };

  return (
    <div className="flex p-6 bg-gray-50 min-h-screen">
      <div className="flex-1 max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Schedule Meetings</h1>
            <p className="text-lg text-gray-600">
              Manage and join your classroom meetings
            </p>
          </div>
        </div>

        <div className="relative h-56 rounded-2xl overflow-hidden shadow-lg mb-8">
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
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-gray-600 text-xl font-medium mb-2">No meetings scheduled.</div>
            <div className="text-gray-500 text-base">Scheduled meetings will appear here.</div>
          </div>
        ) : (
          <div className="space-y-6">
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
                <div key={meeting._id} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-800 mb-3">{meeting.title}</h2>
                      {meeting.description && (
                        <p className="text-gray-700 text-lg mb-4 leading-relaxed">{meeting.description}</p>
                      )}
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium ml-4">
                      {typeof meeting.classId === 'object'
                        ? meeting.classId.className
                        : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <div className="text-sm font-medium text-gray-500">Scheduled Date</div>
                          <div className="text-base font-semibold text-gray-800">
                            {new Date(meeting.scheduledDate).toLocaleString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                              timeZone: 'Asia/Kolkata',
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                        <div>
                          <div className="text-sm font-medium text-gray-500">Max Participants</div>
                          <div className="text-base font-semibold text-gray-800">{meeting.maxParticipants || 'Unlimited'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <div className="text-sm font-medium text-gray-500">Duration</div>
                          <div className="text-base font-semibold text-gray-800">{meeting.duration} minutes</div>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <div className="text-sm font-medium text-gray-500">Scheduled by</div>
                          <div className="text-base font-semibold text-gray-800">{meeting.scheduledBy.name}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {meeting.isPrivate && (
                    <div className="mb-6">
                      <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-red-100 text-red-700">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Private Meeting
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                      {started ? (
                        <div className="flex items-center text-green-600">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                          <span className="font-medium">Meeting Available</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-500">
                          <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                          <span className="font-medium">Scheduled</span>
                        </div>
                      )}
                    </div>

                    <div>
                      {started ? (
                        creator ? (
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            onClick={() => router.push(`/meet/lecture/${meeting._id}?role=host`)}
                          >
                            Start Lecture
                          </button>
                        ) : (
                          <button
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            onClick={() => router.push(`/meet/lecture/${meeting._id}?role=participant`)}
                          >
                            Join Lecture
                          </button>
                        )
                      ) : (
                        <span className="text-gray-400 font-medium text-lg">Meeting not started yet</span>
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
