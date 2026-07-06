'use client';

import { useParams } from 'next/navigation';
import MeetScreen from '../../../../../Components/MeetScreen';

export default function LectureJoinPage() {
  const params = useParams();
  const classId = params.classId as string | undefined;
  const meetingId = params.meetingId as string | undefined;

  if (!classId || !meetingId) {
    return <div>Invalid meeting link.</div>;
  }

  return <MeetScreen meetingId={meetingId} classId={classId} />;
}
