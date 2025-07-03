import { useEffect, useState } from 'react';
import { getClassmates } from '../../services/classroom'; // Adjust path if needed

interface Classmate {
  name: string;
}

interface ApiClassmate {
  name: string;
}

interface ApiResponse {
  classmates: ApiClassmate[];
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
        const data: ApiResponse = await getClassmates(classId);
        const mapped: Classmate[] = (data.classmates || []).map((c) => ({
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
      <hr className="mb-3 border-t border-gray-300" />
      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <ul className="space-y-2">
          {classmates.map((person, idx) => (
            <li key={idx} className="text-sm font-medium">
              {person.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}