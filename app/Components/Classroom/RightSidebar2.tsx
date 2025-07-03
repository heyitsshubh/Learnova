import Image from 'next/image';
import { FiVideo, FiSend, FiPaperclip } from 'react-icons/fi';
import { FaSearch, } from 'react-icons/fa';
import ClassmatesBox from './ClassmatesBox';

const classmates = [
  { name: 'Shubh', msg: 'Hi Sarah, I have scheduled our next lesson...', img: '/avatar4.png' },
];

export default function RightSidebar() {
  return (
    <div className="space-y-6 mt-2">
        <div className="flex items-center gap-4">
          <div className="relative w-66 max-w-md">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-12 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Notification and Settings Icons */}
          
        </div>
      {/* Chat Box */}
      <div className="bg-white border-[1px] border-[#EBEBEB] rounded-lg shadow-sm">
        {/* Header with Avatar + Name + Video icon */}
        <div className="flex items-center justify-between bg-[#F5F6FF] px-2 py-1 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Image
              src="/avatar1.png"
              alt="Armaan"
              width={28}
              height={28}
              className="rounded-full object-cover"
            />
            <span className="text-sm font-medium">Armaan</span>
          </div>
          <FiVideo className="text-gray-500" />
        </div>

        {/* Chat content placeholder */}
        <div className="h-32 px-3 py-2 text-sm text-gray-400">
          {/* Chat messages will appear here */}
        </div>

        {/* Ask Query input section */}
        <div className="flex items-center bg-[#f2f2f2] px-2 py-2 rounded-b-lg">
          <FiPaperclip className="text-gray-500 mr-2 cursor-pointer" />
          <input
            type="text"
            placeholder="Ask Query"
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <FiSend className="text-gray-600 ml-2 cursor-pointer hover:text-black" />
        </div>
      </div>

      {/* Classmates Box - Do not modify */}
       <ClassmatesBox classId="1" />
    </div>
  );
}
