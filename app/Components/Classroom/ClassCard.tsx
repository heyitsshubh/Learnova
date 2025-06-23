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
        {[classData.className, classData.subject].map((tag, index) => (
          <div
            key={index}
            className={`absolute left-4 text-white text-xs font-medium px-14 py-1 rounded mt-8`}
            style={{
              top: `${8 + index * 28}px`,
              backgroundColor: index === 0
                ? 'rgba(13, 64, 89, 0.35)'
                : 'rgba(45, 156, 219, 0.28)',
                color: index === 0 ? '#05E6F2' : '#FFFFFF',
                width: index === 0 ? '125px' : '170px', // Different width
                height: index === 0 ? '24px' : '40px',
                fontSize: index === 0 ? '16px' : '14px',
                display: 'flex', // Center text vertically
              alignItems: 'center', // Center text vertically
              justifyContent: 'center', // Center text horizontally
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
