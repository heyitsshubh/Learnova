import Image from 'next/image';
import ClassmatesBox from './ClassmatesBox';
import { useEffect, useState } from 'react';
import { getClassmates } from '../../services/classroom'; // Adjust path if needed

const coordinators = [
  { name: 'Arman', msg: 'Hi Sarah, I have scheduled our next lesson...', img: '/avatar1.png' },
  { name: 'Divy', msg: 'Hi Sarah, I have scheduled our next lesson...', img: '/avatar2.png' },
];

export default function RightSidebar({ classId }: { classId: string }) {
  const [classmates, setClassmates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassmates = async () => {
      try {
        const data = await getClassmates(classId);
        setClassmates(data);
      } catch (error) {
        console.error('Failed to fetch classmates:', error);
      } finally {
        setLoading(false);
      }
    };
    if (classId) fetchClassmates();
  }, [classId]);

  return (
    <div className="space-y-6">
      <div className="bg-white border-[1px] border-[#EBEBEB] rounded-lg p-4 shadow-sm">
        <h2 className="text-sm font-semibold mb-2">Class coordinators</h2>
        <ul className="space-y-2">
          {coordinators.map((person, idx) => (
            <li key={idx} className="flex items-center space-x-2">
              <Image
                src={person.img}
                alt={person.name}
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium">{person.name}</p>
                <p className="text-xs text-gray-500 truncate w-40">{person.msg}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Classmates Box */}
      {loading ? (
        <div>Loading classmates...</div>
      ) : (
        <ClassmatesBox classmates={classmates} count={classmates.length} />
      )}
    </div>
  );
}