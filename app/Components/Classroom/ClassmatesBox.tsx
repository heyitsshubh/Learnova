import { useEffect, useState } from 'react';
import { getClassmates } from '../../services/classroom'; 
import Image from 'next/image';

interface Classmate {
  name: string;
}

interface ApiClassmate {
  name: string;
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
        console.log(data);
        // If data is an array, use it directly
        const mapped: Classmate[] = (Array.isArray(data) ? data : data.classmates || []).map((c: ApiClassmate) => ({
          name: c.name,
        }));
        setClassmates(mapped);
      } catch {
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
      <hr className="mb-3 border-t border-gray-200" />
      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
         <ul className="space-y-4">
        {classmates.map((person, idx) => (
          <li key={idx} className="flex items-center space-x-4">
            <Image
              src={'/profilee.svg'} // fallback to a default avatar
              alt={person.name}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div>
              <p className="text-m font-medium">{person.name}</p>
              <p className="text-xs text-gray-500 truncate w-40"></p>
            </div>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}