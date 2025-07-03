'use client';

import AppLayout from '../Components/AppLayout';
import ClassCard from '../Components/Classroom/ClassCard';
import CreateClassModal from '../Components/Classroom/CreateClassModal';
import JoinClassModal from '../Components/Classroom/JoinClassModal';
import RightSidebar from '../Components/Classroom/RightSidebar';
import { FaSearch, FaBell, FaCog } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  createClass,
  getCreatedClasses,
  getJoinedClasses,
  joinClassByCode,
  deleteClass,
  leaveClass 
} from '../services/classroom';

interface ClassData {
  _id: string;
  className: string;
  subject: string;
  createdBy?: { name?: string };
}

export default function ClassroomPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [joinedClasses, setJoinedClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') || '');
    }
  }, []);


  const userId = '6841eba5c87625328c5b3c7';

  const filters = ['Joined', 'Created', ];

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const [createdRes, joinedRes] = await Promise.all([
          getCreatedClasses(userId),
          getJoinedClasses(userId),
        ]);
        setClasses(createdRes.classes || []);
        setJoinedClasses(joinedRes.classes || []);
      } catch (error) {
        console.error('Failed to fetch classes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [userId]);

  const handleJoinClass = async (classCode: string) => {
  try {
    setLoading(true);
    const result = await joinClassByCode(classCode);
    console.log('Join class result:', result);
    if (result?.class) {
      const classObj: ClassData = {
        ...result.class,
        _id: result.class._id || result.class.classCode || Math.random().toString(),
      };
      setJoinedClasses((prev) => {
        if (prev.some((cls) => cls._id === classObj._id)) {
          toast.error('You have already joined the class!');
          return prev;
        }
        return [classObj, ...prev];
      });
      setJoinModalOpen(false);
    } else {
      toast.error('Class not found!');
    }
  } catch (error) {
    toast.error('Failed to join class!');
    console.error('Join class error:', error);
  } finally {
    setLoading(false);
  }
};

const handleDeleteClass = async (classId: string) => {
  setLoading(true);
  try {
    await deleteClass(classId);
    setClasses((prev) => prev.filter((cls) => cls._id !== classId));
    setJoinedClasses((prev) => prev.filter((cls) => cls._id !== classId));
     toast.success('Class deleted successfully!');
  } catch (error) {
    console.error('Delete class error:', error);
  } finally {
    setLoading(false);
  }
};

const handleLeaveClass = async (classId: string) => {
  setLoading(true);
  try {
    await leaveClass(classId);
    setJoinedClasses((prev) => prev.filter((cls) => cls._id !== classId));
    toast.success('Left class successfully!');
  } catch (error) {
    toast.error('Failed to leave class!');
    console.error('Leave class error:', error);
  } finally {
    setLoading(false);
  }
};

  const handleCreateClass = async (formData: {
    className: string;
    subject: string;
    privacy: 'public' | 'private';
  }): Promise<string> => {
    try {
      setLoading(true);
      const result = await createClass(formData);
      if (result?.class) {
        const classObj: ClassData = {
          ...result.class,
          _id: result.class._id || result.class.classCode || Math.random().toString(),
        };
        setClasses((prev) => [classObj, ...prev]);
          localStorage.setItem('classCode', result.class.classCode);
        setModalOpen(false);
         toast.success('Class created successfully!'); 
        return result.class.classCode;
      } else {
        throw new Error('Class creation failed.');
      }
    } catch (error) {
      console.error('Failed to create class:', error);
      throw new Error('Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  let displayedClasses: ClassData[] = [];
  if (activeTab === 'Joined') {
    displayedClasses = joinedClasses;
  } else if (activeTab === 'Created') {
    displayedClasses = classes;
  } else if (activeTab === 'All') {
    const all = [...classes, ...joinedClasses];
    displayedClasses = all.filter(
      (cls, idx, arr) => arr.findIndex(c => c._id === cls._id) === idx
    );
  } else {
    displayedClasses = [];
  }

  return (
    <AppLayout>
<div className="pl-64 pr-6 pt-6">
  <div className="flex justify-between items-center mb-6">
    <div>
      <h1 className="text-2xl font-semibold">Classroom</h1>
      <p className="text-sm text-gray-500">
        {userName ? `${userName} / classroom` : 'Classroom'}
      </p>
    </div>
    <div className="flex items-center gap-4">
      <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
        <FaBell className="text-xl text-gray-400" />
      </button>
      <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
        <FaCog className="text-xl text-gray-400" />
      </button>
      <div className="relative w-66 max-w-md">
        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
        <input
          type="text"
          placeholder="Search..."
          className="pl-12 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  </div>


  <div className="flex items-center gap-2 mb-6">
    {filters.map((filter) => (
      <button
        key={filter}
        className={`px-3 py-1 rounded-full text-m border border-gray-300 ${
          activeTab === filter ? 'bg-[rgba(45,156,219,0.5)] text-white' : 'bg-white'
        }`}
        onClick={() => {
          setActiveTab(filter);
          if (filter === 'Created') setModalOpen(true);
          if (filter === 'Joined') setJoinModalOpen(true);
        }}
      >
        {filter}
      </button>
    ))}
  </div>

  <div className="flex flex-col lg:flex-row">
    <div className="flex-1 lg:pr-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-black-500 text-center">Loading classes...</p>
        ) : displayedClasses.length === 0 ? (
          <p className="text-black-500 text-center">
            {activeTab === 'Joined'
              ? 'No joined classes found.'
              : activeTab === 'Created'
              ? 'No created classes found.'
              : 'No classes found.'}
          </p>
        ) : (
          displayedClasses.map((cls) => {
            const isCreated = classes.some((c) => c._id === cls._id);

            return (
              <ClassCard
                key={cls._id}
                classData={{
                  _id: cls._id,
                  className: cls.className,
                  subject: cls.subject,
                  createdByName: cls.createdBy?.name,
                  tags: ['UHV', 'Universal'],
                }}
                onDelete={() =>
                  isCreated
                    ? handleDeleteClass(cls._id)
                    : handleLeaveClass(cls._id)
                }
                deleteLabel={isCreated ? 'Delete' : 'Leave Class'}
       onCardClick={() => {
          if (isCreated) {
            router.push(`/classroom/${cls._id}`);
          } else {
            router.push(`/dashboard/${cls._id}`);
          }
        }}
              />
            );
          })
        )}
      </div>
    </div>
    <div className="hidden lg:block lg:w-64">
      <RightSidebar classId={displayedClasses[0]?._id || ''} />
    </div>
  </div>
  <button
    className="fixed bottom-6 right-6 text-white p-4 rounded-full shadow-lg"
    style={{ backgroundColor: 'rgba(73, 73, 73, 1)' }}
    onClick={() => setModalOpen(true)}
  >
    <Plus />
  </button>

  <CreateClassModal
    isOpen={modalOpen}
    onClose={() => setModalOpen(false)}
    onCreate={handleCreateClass}
  />

  <JoinClassModal
    isOpen={joinModalOpen}
    onClose={() => setJoinModalOpen(false)}
    onJoin={handleJoinClass}
  />
</div>
    </AppLayout>
  );
}