'use client';

import { useParams } from 'next/navigation';
import JoinedClass from '../../Components/Classroom/JoinedClass';

export default function JoinedClassPage() {
  const params = useParams();
  console.log('params:', params); // <-- Add this line

  // Try both keys
  const classId = (params.ClassId as string) || (params.classId as string) || '';

  const classData = {
    _id: classId,
    className: 'Joined Class',
    subject: 'Subject Name',
    createdBy: { name: 'Teacher Name' },
  };

  return <JoinedClass classData={classData} />;
}