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
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

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
  classCode?: string;
  createdBy?: { name?: string };
}

export default function ClassroomPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
   const [activeTab, setActiveTab] = useState<'Join' | 'Create'>('Create');
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [joinedClasses, setJoinedClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') || '');
    }
  }, []);

  const userId = '';
  const filters = ['Join', 'Create'];

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
        toast.success('Class joined successfully!');
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

  const handleCopyClassCode = async (classCode: string) => {
    try {
      await navigator.clipboard.writeText(classCode);
      toast.success('Class code copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy class code:', error);
      toast.error('Failed to copy class code');
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
      toast.error('Failed to create class!');
      console.error('Failed to create class:', error);
      throw new Error('Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  let displayedClasses: ClassData[] = [];
  if (activeTab === 'Join') {
    displayedClasses = joinedClasses;
  } else if (activeTab === 'Create') {
    displayedClasses = classes;
  } else {
    displayedClasses = [];
  }

  // Empty state component
  const EmptyState = ({ type }: { type: 'join' | 'create' }) => {
  const getEmptyStateContent = () => {
    switch (type) {
      case 'join':
        return {
          image: '/class.svg',
          title: 'No Joined Classes',
          description: "You haven't joined any classes yet.",
          
          buttonAction: () => setJoinModalOpen(true),
        };
      case 'create':
        return {
          image: '/class.svg',
          title: 'No Created Classes',
          description: "You haven't created any classes yet.",
          buttonAction: () => setModalOpen(true),
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 min-h-[400px] ">
      <div className="flex justify-center items-center">
        <Image
          src={content?.image || ''}
          alt={content?.title || ''}
          width={712}
          height={470}
          className="object-contain"
        />
      </div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">{content?.title}</h3>
      <p className="text-gray-500 text-center mb-6 max-w-md">{content?.description}</p>
    </div>
  );
};

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
                <button
              className="p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
              onClick={() => router.push('/notifications')}
            >
              <FaBell className="text-xl text-gray-400" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
              onClick={() => router.push('/Settings')}
            >
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
                setActiveTab(filter as 'Join' | 'Create');
                if (filter === 'Create') setModalOpen(true);
                if (filter === 'Join') setJoinModalOpen(true);
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 lg:pr-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500 text-center"></p>
              </div>
            ) : displayedClasses.length === 0 ? (
              <EmptyState 
                type={
                  activeTab === 'Join' ? 'join' : 'create'
                } 
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
    {displayedClasses.map((cls, idx) => {
      const isCreated = classes.some((c) => c._id === cls._id);

      return (
        <motion.div
          key={cls._id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.4, delay: idx * 0.08 }}
        >
          <ClassCard
            classData={{
              _id: cls._id,
              className: cls.className,
              subject: cls.subject,
              classCode: cls.classCode,
              createdByName: cls.createdBy?.name,
              tags: ['UHV', 'Universal'],
            }}
            onDelete={() =>
              isCreated
                ? handleDeleteClass(cls._id)
                : handleLeaveClass(cls._id)
            }
            onCopyCode={() => handleCopyClassCode(cls.classCode || cls._id)}
            deleteLabel={isCreated ? 'Delete' : 'Leave Class'}
            showCopyCode={isCreated}
            onCardClick={() => {
              if (isCreated) {
                router.push(`/classroom/${cls._id}`);
              } else {
                router.push(`/joinedclass/${cls._id}`);
              }
            }}
          />
        </motion.div>
      );
    })}
  </AnimatePresence>
              </div>
            )}
          </div>
          <div className="hidden lg:block lg:w-64">
            {displayedClasses[0]?._id && (
              <RightSidebar classId={displayedClasses[0]._id} />
            )}
          </div>
        </div>
        
        <button
          className="fixed bottom-6 right-6 text-white p-4 rounded-full shadow-lg"
          style={{ backgroundColor: 'rgba(73, 73, 73, 1)', cursor: 'pointer' }}
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