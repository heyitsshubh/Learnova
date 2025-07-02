interface SidebarmenuProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebarmenu({ open, onClose }: SidebarmenuProps) {
  if (!open) return null;

  const items = [
    'Attendence',
    'Create Meet',
    'Create Assignment',
    'Test',
    'Make Announcement',
  ];

  return (
    <div className="fixed bottom-24 right-8 z-50">
      <div className="w-64 bg-[#333333] text-white rounded-lg shadow-lg flex flex-col">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="py-4 px-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="px-2 py-2 border-b border-gray-700 hover:bg-gray-700 cursor-pointer text-sm last:border-b-0"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}