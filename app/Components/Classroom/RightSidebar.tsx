import Image from 'next/image';

const coordinators = [
  { name: 'Arman', msg: 'Hi Sarah, I have scheduled our next lesson...', img: '/avatar1.png' },
  { name: 'Divy', msg: 'Hi Sarah, I have scheduled our next lesson...', img: '/avatar2.png' },
 
];

const classmates = [
  { name: 'Shubh', msg: 'Hi Sarah, I have scheduled our next lesson...', img: '/avatar4.png' },
 
];

export default function RightSidebar() {
  return (
    <div className="space-y-6">
      {/* Class Coordinators Box */}
      <div className="bg-white border rounded-lg p-4 shadow-sm">
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
      <div className="bg-white border rounded-lg p-4 shadow-sm h-96">
        <h2 className="text-sm font-semibold mb-2">
          Classmates <span className="text-blue-500">(80)</span>
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
    </div>
  );
}
