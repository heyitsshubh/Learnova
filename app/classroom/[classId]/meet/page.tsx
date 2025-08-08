'use client';

import { useEffect, useState } from 'react';
import { fetchMeetingsByClass } from '../../../services/meet';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  FaCalendarAlt,
  FaUsers,
  FaClock,
  FaUser,
  FaLock,
  FaCheckCircle,
  FaHourglassHalf,
  FaVideo,
  FaSignInAlt,
} from 'react-icons/fa';

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

  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';

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

  const isMeetingStarted = (scheduledDate: string) => {
    const today = new Date();
    const meetingDate = new Date(scheduledDate);
    return (
      today.getFullYear() > meetingDate.getFullYear() ||
      (today.getFullYear() === meetingDate.getFullYear() &&
        (today.getMonth() > meetingDate.getMonth() ||
          (today.getMonth() === meetingDate.getMonth() && today.getDate() >= meetingDate.getDate())))
    );
  };

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
            <p className="text-lg text-gray-600">Manage and join your classroom meetings</p>
          </div>
        </div>

        <div className="relative h-56 rounded-2xl overflow-hidden shadow-lg mb-8">
          <Image src="/Banner.svg" alt="UHV Banner" fill className="object-cover" priority />
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
              <FaCalendarAlt className="w-10 h-10 text-gray-400" />
            </div>
            <div className="text-gray-600 text-xl font-medium mb-2">No meetings scheduled.</div>
            <div className="text-gray-500 text-base">Scheduled meetings will appear here.</div>
          </div>
        ) : (
          <div className="space-y-6">
            {meetings.map((meeting) => {
              const started = isMeetingStarted(meeting.scheduledDate);
              const creator = isMeetingCreator(meeting);

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
                      {typeof meeting.classId === 'object' ? meeting.classId.className : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <FaCalendarAlt className="w-5 h-5 mr-3" />
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

                  {meeting.isPrivate && (
                    <div className="mb-6">
                      <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-red-100 text-red-700">
                        <FaLock className="w-4 h-4 mr-1" /> Private Meeting
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                      {started ? (
                        <div className="flex items-center text-green-600">
                          <FaCheckCircle className="w-5 h-5 mr-2" />
                          <span className="font-medium">Meeting Available</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-500">
                          <FaHourglassHalf className="w-5 h-5 mr-2" />
                          <span className="font-medium">Scheduled</span>
                        </div>
                      )}
                    </div>

                    <div>
                      {started ? (
                        creator ? (
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            onClick={() => router.push(`/meet/lecture/${meeting._id}?role=host`)}
                          >
                            <FaVideo className="mr-2" /> Start Lecture
                          </button>
                        ) : (
                          <button
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            onClick={() => router.push(`/meet/lecture/${meeting._id}?role=participant`)}
                          >
                            <FaSignInAlt className="mr-2" /> Join Lecture
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