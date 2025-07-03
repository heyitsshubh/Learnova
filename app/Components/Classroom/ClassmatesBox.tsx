import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getClassmates } from '../../services/classroom'; // Adjust path if needed

interface Classmate {
  name: string;
  msg: string;
  img: string;
}

interface ClassmatesBoxProps {
  classId: string;
  count?: number;
}

export default function ClassmatesBox({ classId }: ClassmatesBoxProps) {
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassmates = async () => {
      setLoading(true);
      try {
        const data = await getClassmates(classId);
         console.log('Fetched classmates:', data);
       setClassmates(data.classmates);
      } catch (error) {
        setClassmates([]);
      } finally {
        setLoading(false);
      }
    };
    if (classId) fetchClassmates();
  }, [classId]);

  return (
    <div className="bg-white border-[1px] border-[#EBEBEB] rounded-lg p-4 shadow-sm h-96">
      <h2 className="text-sm font-semibold mb-2">
        Classmates <span className="text-blue-500">({classmates.length})</span>
      </h2>
      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <ul className="space-y-2">
          {classmates.map((person, idx) => (
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
      )}
    </div>
  );
}