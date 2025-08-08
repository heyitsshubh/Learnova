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
    return new Date() >= new Date(scheduledDate);
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

  return (
    <div className="flex p-6">
      <div className="flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Schedule Meetings</h1>
            <p className="text-sm text-gray-500">
              Manage and join your classroom meetings
            </p>
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
              const creator = isClassCreator(meeting);

              console.log({
                meetingId: meeting._id,
                started,
                creator,
                currentUserId,
                createdBy: typeof meeting.classId === 'object' ? meeting.classId.createdBy : undefined,
                scheduledDate: meeting.scheduledDate,
              });

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
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Left column */}
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <div className="w-5 h-5 mr-3 flex items-center justify-center">
                          📅
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Scheduled Date</div>
                          <div className="text-sm font-medium text-gray-900">
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
                        <div className="w-5 h-5 mr-3 flex items-center justify-center">
                          👥
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Max Participants</div>
                          <div className="text-sm font-medium text-gray-900">{meeting.maxParticipants || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <div className="w-5 h-5 mr-3 flex items-center justify-center">
                          ⏱️
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Duration</div>
                          <div className="text-sm font-medium text-gray-900">{meeting.duration} minutes</div>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <div className="w-5 h-5 mr-3 flex items-center justify-center">
                          👤
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Scheduled by</div>
                          <div className="text-sm font-medium text-gray-900">{meeting.scheduledBy.name}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status indicators */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {meeting.isPrivate && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          🔒 Private Meeting
                        </span>
                      )}
                      
                      {started ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          🟢 Meeting Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                          ⏳ Scheduled
                        </span>
                      )}
                    </div>

                    {/* Action button */}
                    <div>
                      {started ? (
                        creator ? (
                          <button
                            className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            onClick={() => router.push(`/meet/lecture/${meeting._id}?role=host`)}
                          >
                            Start Lecture
                          </button>
                        ) : (
                          <button
                            className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                            onClick={() => router.push(`/meet/lecture/${meeting._id}?role=participant`)}
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
