'use client';

import { useParams } from 'next/navigation';
import MeetScreen from '../../../../../Components/MeetScreen';

export default function LectureJoinPage() {
  const params = useParams();
  const classId = params.classId as string;

  // Get userId and token from localStorage
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  if (!userId || !token) {
    return <div>Please log in to join the meeting.</div>;
  }

  return <MeetScreen classId={classId} userId={userId} token={token} />;
}