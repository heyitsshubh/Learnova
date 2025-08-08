'use client';

import { useParams } from 'next/navigation';
import MeetScreen from '../../../../../Components/MeetScreen';

export default function LectureJoinPage() {
  const params = useParams();
  const classId = params.classId as string;

  return <MeetScreen classId={classId} />;
}