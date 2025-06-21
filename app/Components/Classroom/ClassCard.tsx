import Image from 'next/image';

interface ClassCardProps {
  classData: {
    className: string;
    subject: string;
    createdByName?: string; // optional
    profilePicture?: string;
    studentsCount?: number;
    tags?: string[]; // e.g., ['UHV', 'Universal']
  };
}

const ClassCard: React.FC<{ classData: ClassCardProps['classData'] }> = ({ classData }) => {
  return (
    <div
      className="bg-white rounded-md overflow-hidden shadow-sm border"
      style={{ width: '306px', height: '251px' }}
    >
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
        {classData.tags?.map((tag, index) => (
          <div
            key={index}
            className={`absolute left-4 text-white text-xs font-medium px-2 py-1 rounded`}
            style={{
              top: `${8 + index * 28}px`,
              backgroundColor: index === 0
                ? 'rgba(13, 64, 89, 0.35)'
                : 'rgba(45, 156, 219, 0.28)',
            }}
          >
            {tag}
          </div>
        ))}
      </div>

      {/* Bottom Details Section */}
      <div className="p-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm truncate w-[150px]">
            {classData.className}
          </h3>
          <p className="text-gray-700 text-sm">{classData.subject}</p>
          {classData.createdByName && (
            <p className="text-gray-500 text-xs mt-1">
              By {classData.createdByName}
            </p>
          )}
        </div>
        <Image
          src={classData.profilePicture || '/profile.svg'}
          alt="Profile"
          width={50}
          height={50}
          className="rounded-full border border-gray-200"
        />
      </div>
    </div>
  );
};

export default ClassCard;
