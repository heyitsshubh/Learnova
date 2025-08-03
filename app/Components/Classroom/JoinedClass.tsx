'use client';

import { useEffect, useState } from 'react';
import { FaBell, FaCog } from 'react-icons/fa';
import Image from 'next/image';
import RightSidebar2 from './RightSidebar2';

interface ClassData {
  _id: string;
  className: string;
  subject: string;
  createdBy?: { name?: string };
}

export default function JoinedClass({ classData }: { classData: ClassData }) {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') || '');
    }
  }, []);

  // Dummy assignments for layout demo
  const assignments = [
    {
      _id: '1',
      title: 'Assignment 1',
      description: 'Read chapter 1',
      dueDate: '2025-08-01',
    },
    {
      _id: '2',
      title: 'Assignment 2',
      description: 'Submit essay',
      dueDate: '2025-08-05',
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{classData.className}</h1>
            <p className="text-sm text-gray-500">
              {userName ? `${userName} / ${classData.className}` : classData.className}
            </p>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
              <FaBell className="text-xl text-gray-400" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
              <FaCog className="text-xl text-gray-400" />
            </button>
          </div>
        </div>

        {/* Banner */}
        <div className="relative h-48 rounded-2xl overflow-hidden shadow mb-6">
          <Image
            src="/Banner.svg"
            alt="UHV Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-opacity-30 flex items-center justify-center">
            <h2 className="text-white text-2xl font-bold"></h2>
          </div>
        </div>

        {/* Assignments Section */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Assignments</h2>
          {assignments.length === 0 ? (
            <div className="text-red-500">No assignments found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition flex flex-col"
                >
                  <h3 className="font-semibold">{assignment.title}</h3>
                  <p className="text-sm text-gray-500">{assignment.description}</p>
                  <p className="text-xs text-gray-400 mt-1">Due: {assignment.dueDate}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar shifted down */}
      <div className="hidden lg:block lg:w-64">
        <div className="">
          <RightSidebar2 classId={classData._id} />
        </div>
      </div>
    </div>
  );
}