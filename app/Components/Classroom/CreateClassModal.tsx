interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CreateClassModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-[rgba(51,51,51,1)] p-6 rounded-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4  text-white">Create Class</h2>
        <input
          type="text"
          placeholder="Enter class name"
          style={{backgroundColor: 'rgba(165, 159, 159, 0.35)',color: 'white'}}
          className="w-full border p-2 rounded mb-4"
        />
         <input
          type="text"
          placeholder="Enter subject name"
          style={{backgroundColor: 'rgba(165, 159, 159, 0.35)', color:'white'}}
          className="w-full border p-2 rounded mb-4"
        />
        <select className="w-full border p-2 rounded mb-4"
                  style={{backgroundColor: 'rgba(165, 159, 159, 0.35)', color:'white'}}>
          <option style={{backgroundColor: 'rgba(165, 159, 159, 0.35)'}}>Class Privacy</option>
          <option style={{backgroundColor: 'rgba(165, 159, 159, 0.35)'}}>Anyone with code or link</option>
          <option style={{backgroundColor: 'rgba(165, 159, 159, 0.35)'}}>Only approved by me</option>
        </select>
        <div className="flex justify-end">
          <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button className="px-4 py-2 bg-gray-800 text-white rounded">Create class</button>
        </div>
      </div>
    </div>
  );
};

export default CreateClassModal;
