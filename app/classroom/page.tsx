'use client';

import AppLayout from '../Components/AppLayout';
import ClassCard from '../Components/Classroom/ClassCard';
import CreateClassModal from '../Components/Classroom/CreateClassModal';
import JoinClassModal from '../Components/Classroom/JoinClassModal';
import RightSidebar from '../Components/Classroom/RightSidebar';
import { FaSearch } from 'react-icons/fa';
import {  useState } from 'react';
import { Plus } from 'lucide-react';
import { createClass, getClassByCode } from '../services/classroom';

export default function ClassroomPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const filters = [ 'Joined', 'Created', 'Pending Assignment', 'Favourites'];

  const handleJoinClass = (classCode: string) => {
    console.log('Joining class with code:', classCode);
  };

const handleCreateClass = async (formData: {
  className: string;
  subject: string;
  privacy: 'public' | 'private';
}): Promise<string> => {
  try {
    setLoading(true);
    const result = await createClass(formData);
    console.log('Class created:', result); // Debugging

    const classCode = result.class?.classCode; // Access classCode correctly
    if (!classCode) {
      throw new Error('Class code is undefined.');
    }

    console.log('Class Code:', classCode); // Debugging

    const fetched = await getClassByCode(classCode);
    if (fetched?.class) {
      setClasses((prev) => [fetched.class, ...prev]);
    } else {
      console.error('Class not found.');
    }

    setModalOpen(false);
    return classCode;
  } catch (error) {
    console.error('Failed to create class:', error);
    throw new Error('Failed to create class');
  }
};

  return (
    <AppLayout>
      <div className="pl-64 pr-6 pt-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Classroom</h1>
            <p className="text-sm text-gray-500">Ayush Jaiswal / classroom</p>
          </div>
          <div className="relative w-66 max-w-md">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-12 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`px-3 py-1 rounded-full text-m border ${
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

        {/* Class Cards */}
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 lg:pr-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <p className="text-black-500 text-center">Loading classes...</p>
              ) : classes.length === 0 ? (
                <p className="text-black-500 text-center">No classes found.</p>
              ) : (
                classes.map((cls) => (
                  <ClassCard
                    key={cls._id}
                    classData={{
                      className: cls.className,
                      subject: cls.subject,
                      createdByName: cls.createdBy?.name,
                      tags: ['UHV', 'Universal'],
                    }}
                  />
                ))
              )}
            </div>
          </div>

          <div className="hidden lg:block lg:w-64">
            <RightSidebar />
          </div>
        </div>

        {/* Floating Create Button */}
        <button
          className="fixed bottom-6 right-6 text-white p-4 rounded-full shadow-lg"
          style={{ backgroundColor: 'rgba(73, 73, 73, 1)' }}
          onClick={() => setModalOpen(true)}
        >
          <Plus />
        </button>

        {/* Modals */}
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