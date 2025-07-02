import Image from 'next/image';

interface Classmate {
  name: string;
  msg: string;
  img: string;
}

interface ClassmatesBoxProps {
  classmates: Classmate[];
  count?: number;
}

export default function ClassmatesBox({ classmates, count }: ClassmatesBoxProps) {
  return (
    <div className="bg-white border-[1px] border-[#EBEBEB] rounded-lg p-4 shadow-sm h-96">
      <h2 className="text-sm font-semibold mb-2">
        Classmates <span className="text-blue-500">({count ?? classmates.length})</span>
      </h2>
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
    </div>
  );
}
