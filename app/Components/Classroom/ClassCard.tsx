import Image from 'next/image';

const ClassCard = () => {
  return (
    <div
      className="bg-white rounded-md overflow-hidden shadow-sm border"
      style={{ width: '306px', height: '251px' }} // Fixed width and height
    >
      {/* Image Section */}
      <div className="relative h-2/3 bg-[#001C27] flex justify-end items-center pr-2"> {/* Align image to the right */}
        <Image
          src="/card.svg" // ✅ Place your image in the public folder
          alt="Class Illustration"
          width={80} // Reduced width
          height={80} // Reduced height
          className="object-contain"
        />
        {/* UHV Box */}
        <div
          className="absolute top-8 left-4 text-white text-xs font-medium px-2 py-1 rounded"
          style={{ backgroundColor: 'rgba(13, 64, 89, 0.35)' }} // Apply rgba color here
        >
          UHV
        </div>
        {/* Universal Box */}
        <div
          className="absolute top-16 left-4 text-white text-xs font-medium px-2 py-1 rounded"
          style={{ backgroundColor: 'rgba(45, 156, 219, 0.28)' }} // Apply rgba color here
        >
          Universal
        </div>
      </div>

      {/* Details Section */}
         <div className="p-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">UHV</h3>
          <p className="text-gray-700 text-sm">Gopal Babu</p>
        </div>
        <Image
          src="/profile.svg" // ✅ Replace with your profile image path
          alt="Profile"
          width={62} // Profile image size
          height={62}
          className="rounded-full"
        />
      </div>
    </div>
  );
};

export default ClassCard;