import Image from 'next/image';
import { useState } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { useRouter } from 'next/navigation';

interface ClassCardProps {
  classData: {
    _id: string;
    className: string;
    subject: string;
    classCode?: string;
    createdByName?: string;
    profilePicture?: string;
    studentsCount?: number;
    tags?: string[];
  };
  onDelete?: () => void;
  onCopyCode?: () => void;
  deleteLabel?: string;
  showCopyCode?: boolean;
  onCardClick?: () => void;
}

const ClassCard: React.FC<ClassCardProps> = ({
  classData,
  onDelete,
  onCopyCode,
  deleteLabel,
  showCopyCode = false,
  onCardClick,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.menu-btn')) return;
    if (onCardClick) {
      onCardClick();
    } else {
      router.push(`/classroom/${classData._id}`);
    }
  };

  return (
    <div
      className="bg-white rounded-md overflow-hidden shadow-sm border relative cursor-pointer"
      style={{ width: '306px', height: '251px' }}
      onClick={handleCardClick}
    >
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="p-1 rounded-full menu-btn"
        >
          <BsThreeDotsVertical size={22} className="text-white" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-20">
            {showCopyCode && onCopyCode && (
              <>
                <button
                  className="block w-full text-left px-4 py-2 text-blue-600 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onCopyCode();
                  }}
                >
                  Copy Class Code
                </button>
                {onDelete && <hr className="border-t border-gray-200" />}
              </>
            )}
            {onDelete && (
              <button
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                {deleteLabel || 'Delete Class'}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="relative h-2/3 bg-[#001C27] flex justify-end items-center pr-2">
        <Image
          src="/card.svg"
          alt="Class Illustration"
          width={80}
          height={80}
          className="object-contain"
        />

        <div className="absolute left-4 top-4 flex flex-col gap-2">
          <div
            className="text-xs font-medium rounded"
            style={{
              backgroundColor: 'rgba(13, 64, 89, 0.35)',
              color: '#05E6F2',
              width: '125px',
              height: '32px',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {classData.className}
          </div>
          <div
            className="text-xs font-medium rounded"
            style={{
              backgroundColor: 'rgba(45, 156, 219, 0.28)',
              color: '#FFFFFF',
              width: '170px',
              height: '40px',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {classData.subject}
          </div>
        </div>
      </div>
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