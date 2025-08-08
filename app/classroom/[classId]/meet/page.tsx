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
// Replace isClassCreator with:
const isMeetingCreator = (meeting: Meeting) => {
  return (
    meeting.scheduledBy &&
    meeting.scheduledBy._id &&
    currentUserId &&
    String(meeting.scheduledBy._id).trim() === String(currentUserId).trim()
  );
};

// In your map:


  return (
    <div className="flex p-6">
      <div className="flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Schedule Meetings</h1>
            <p className="text-sm text-gray-500">
              {/* {userName ? `${userName} / ${classid}` : 'Classroom'} */}
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
                <div key={meeting._id} className="border rounded-lg p-4 bg-white shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold">{meeting.title}</h2>
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                      {typeof meeting.classId === 'object'
                        ? meeting.classId.className
                        : ''}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {meeting.description}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {' '}
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
                  <div className="text-xs text-gray-500">
                    Max Participants: {meeting.maxParticipants || 'N/A'}
                    {meeting.isPrivate && (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded">
                        Private
                      </span>
                    )}
                  </div>
                  {/* Start/Join Lecture Button */}
                  <div className="mt-4">
                    {started ? (
                      creator ? (
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
                          onClick={() => router.push(`/meet/lecture/${meeting._id}?role=host`)}
                        >
                          Start Lecture
                        </button>
                      ) : (
                        <button
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
                          onClick={() => router.push(`/meet/lecture/${meeting._id}?role=participant`)}
                        >
                          Join Lecture
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-gray-400">Meeting not started yet</span>
                    )}
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