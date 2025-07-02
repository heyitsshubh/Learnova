import Image from 'next/image';
import { useState } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';

interface ClassCardProps {
  classData: {
    className: string;
    subject: string;
    createdByName?: string;
    profilePicture?: string;
    studentsCount?: number;
    tags?: string[];
  };
  onDelete?: () => void; // Optional: callback for delete
}

const ClassCard: React.FC<{ classData: ClassCardProps['classData']; onDelete?: () => void }> = ({
  classData,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="bg-white rounded-md overflow-hidden shadow-sm border relative"
      style={{ width: '306px', height: '251px' }}
    >
      {/* 3-dot menu */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="p-1 rounded-full "
        >
          <BsThreeDotsVertical size={22} className="text-white"  />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg z-20">
            <button
              className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
              onClick={() => {
                setMenuOpen(false);
                onDelete && onDelete();
              }}
            >
              Delete Class
            </button>
          </div>
        )}
      </div>

      {/* Top Image Section */}
      <div className="relative h-2/3 bg-[#001C27] flex justify-end items-center pr-2">
        <Image
          src="/card.svg"
          alt="Class Illustration"
          width={80}
          height={80}
          className="object-contain"
        />

        {/* Tags */}
        {[classData.className, classData.subject].map((tag, index) => (
          <div
            key={index}
            className={`absolute left-4 text-white text-xs font-medium px-14 py-1 rounded mt-8`}
            style={{
              top: `${8 + index * 28}px`,
              backgroundColor:
                index === 0
                  ? 'rgba(13, 64, 89, 0.35)'
                  : 'rgba(45, 156, 219, 0.28)',
              color: index === 0 ? '#05E6F2' : '#FFFFFF',
              width: index === 0 ? '125px' : '170px',
              height: index === 0 ? '24px' : '40px',
              fontSize: index === 0 ? '16px' : '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {tag}
          </div>
        ))}
      </div>

      {/* Bottom Details Section */}
      <div className="p-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[24px] truncate w-[150px] ">
            {classData.className}
          </h3>
          <p className="text-gray-500 text-[16px] mt-1">
            {classData.createdByName}
          </p>
        </div>
        <Image
          src={classData.profilePicture || '/profile.svg'}
          alt="Profile"
          width={60}
          height={60}
          className="rounded-full border border-gray-200"
        />
      </div>
    </div>
  );
};

export default ClassCard;