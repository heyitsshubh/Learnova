interface SidebarmenuProps {
  open: boolean;
  onClose: () => void;
  onCreateAssignment?: () => void;
  onAnnouncement?: () => void;
}

export default function Sidebarmenu({ open, onClose, onCreateAssignment,onAnnouncement }: SidebarmenuProps) {
  if (!open) return null;

  const items = [
    { label: 'Attendence' },
    { label: 'Create Meet' },
    { label: 'Create Assignment', action: onCreateAssignment },
    { label: 'Make Announcement', action: onAnnouncement },
  ];

  return (
    <div className="fixed bottom-24 right-8 z-50">
      <div className="w-64 bg-[#333333] text-white rounded-lg shadow-lg flex flex-col relative">
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
    onClick={() => {
      if (item.action) {
        item.action();
      } else {
        onClose();
      }
    }}
  >
    {item.label}
  </div>
))}
        </div>
      </div>
    </div>
  );
}