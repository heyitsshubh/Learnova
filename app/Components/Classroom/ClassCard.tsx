import Image from 'next/image';

interface ClassCardProps {
  classData: {
    className: string;
    subject: string;
    createdByName?: string; // Optional
    tags?: string[]; // e.g., ['UHV', 'Universal']
  };
}

const ClassCard: React.FC<{ classData: ClassCardProps['classData'] }> = ({ classData }) => {
  return (
    <div
      className="bg-white rounded-md overflow-hidden shadow-sm border"
      style={{ width: '306px', height: '251px' }}
    >
      {/* Image Section */}
      <div className="relative h-2/3 bg-[#001C27] flex justify-end items-center pr-2">
        <Image
          src="/card.svg"
          alt="Class Illustration"
          width={80}
          height={80}
          className="object-contain"
        />

        {/* Dynamic Tags */}
        {classData?.tags?.map((tag, index) => (
          <div
            key={index}
            className={`absolute top-${8 + index * 8} left-4 text-white text-xs font-medium px-2 py-1 rounded`}
            style={{ backgroundColor: index === 0 ? 'rgba(13, 64, 89, 0.35)' : 'rgba(45, 156, 219, 0.28)' }}
          >
            {tag}
          </div>
        ))}
      </div>

      {/* Details Section */}
      <div className="p-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">{classData.className}</h3>
          <p className="text-gray-700 text-sm">{classData.subject}</p>
        </div>
        <Image
          src="/profile.svg"
          alt="Profile"
          width={62}
          height={62}
          className="rounded-full"
        />
      </div>
    </div>
  );
};

export default ClassCard;
