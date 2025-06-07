interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CreateClassModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create Class</h2>
        <input
          type="text"
          placeholder="Enter class name"
          className="w-full border p-2 rounded mb-4"
        />
         <input
          type="text"
          placeholder="Enter subject name"
          className="w-full border p-2 rounded mb-4"
        />
        <select className="w-full border p-2 rounded mb-4">
          <option>Class Privacy</option>
          <option>Anyone with code or link</option>
          <option>Only approved by me</option>
        </select>
        <div className="flex justify-end">
          <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Create class</button>
        </div>
      </div>
    </div>
  );
};

export default CreateClassModal;
