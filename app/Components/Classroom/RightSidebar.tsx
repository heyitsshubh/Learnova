import Image from 'next/image';
import ClassmatesBox from './ClassmatesBox';
import { useEffect, useState } from 'react';

// const coordinators = [
//   { name: 'Arman', msg: 'Hi Sarah, I have scheduled our next lesson...', img: '/avatar1.png' },
//   { name: 'Divy', msg: 'Hi Sarah, I have scheduled our next lesson...', img: '/avatar2.png' },
// ];

export default function RightSidebar({ classId }: { classId: string }) {
  const [userName, setUserName] = useState('');
  const [profileImg, setProfileImg] = useState('/profilee.svg'); // default image

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') || '');
      setProfileImg(localStorage.getItem('profilePicture') || '/profilee.svg');
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white border-[1px] border-[#EBEBEB] rounded-lg p-4 shadow-sm">
        <h2 className="text-sm font-semibold mb-2">Class coordinator</h2>
             <hr className="mb-3 border-t border-gray-300" /> 
        <ul className="space-y-2">
          {/* Show user as first coordinator */}
          <li className="flex items-center space-x-4">
            <Image
              src={profileImg}
              alt={userName}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div>
              <p className="text-m font-medium">{userName || 'You'}</p>
              <p className="text-xs text-gray-500 truncate w-40"></p>
            </div>
          </li>
          {/* Other coordinators */}
          {/* {coordinators.map((person, idx) => (
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
          ))} */}
        </ul>
      </div>

      {/* Classmates Box */}
      <ClassmatesBox classId={classId} />
    </div>
  );
}