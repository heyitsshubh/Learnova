'use client';

import { useEffect, useState } from 'react';
import { fetchMeetingsByClass } from '../services/meet';
import Image from 'next/image';
import { FaPlus } from 'react-icons/fa';
import ScheduleMeetModal from '../Components/Classroom/Schedulemeet';

interface Meeting {
  _id: string;
  title: string;
  description?: string;
  scheduledDate: string;
  duration: number;
  classId: { _id: string; className: string; subject: string } | string;
  scheduledBy: { _id: string; name: string; email: string };
  maxParticipants?: number;
  isPrivate?: boolean;
  status?: string;
}

export default function MeetPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);


  const handlePlusClick = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleScheduled = () => {
    setShowModal(false);
    // Refresh meetings after scheduling
    fetchMeetings();
  };

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

  const classId = typeof window !== 'undefined' ? localStorage.getItem('currentClassId') || '' : '';

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
            {meetings.map((meeting) => (
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
                  Date:{' '}
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
                <div className="text-xs text-gray-500 mb-1">
                  {/* Duration: {meeting.duration} min */}
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  {/* Scheduled By: {meeting.scheduledBy?.name} */}
                </div>
                <div className="text-xs text-gray-500">
                  Max Participants: {meeting.maxParticipants || 'N/A'}
                  {meeting.isPrivate && (
                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded">
                      Private
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Floating Plus Button */}
      <button
        className="fixed bottom-8 right-8 z-50 p-4 rounded-full bg-gray-800 hover:bg-gray-700 text-white shadow-lg transition-colors"
        title="Schedule Meeting"
        onClick={handlePlusClick}
      >
        <FaPlus className="text-2xl" />
      </button>
      {/* Schedule Meet Modal */}
      {showModal && (
        <ScheduleMeetModal
          open={showModal}
          onClose={handleModalClose}
          classId={classId}
          onScheduled={handleScheduled}
        />
      )}
    </div>
  );
}