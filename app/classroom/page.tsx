'use client';

import AppLayout from '../Components/AppLayout';
import ClassCard from '../Components/Classroom/ClassCard';
import CreateClassModal from '../Components/Classroom/CreateClassModal';
import RightSidebar from '../Components/Classroom/RightSidebar';
import { useState } from 'react';
import { Plus } from 'lucide-react';



export default function ClassroomPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  const filters = ["All", "Joined", "Created", "Pending Assignment", "Favourites"];

  return (
    <AppLayout>
      <div className="pl-64 pr-6 pt-6"> {/* 👈 Adjusts for fixed sidebar */}

        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Classroom</h1>
            <p className="text-sm text-gray-500">Ayush Jaiswal / classroom</p>
          </div>
          <div className="relative w-66">
            <input
              placeholder="Search"
              className="border rounded px-4 py-2  text-sm w-full"
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex items-center gap-2 mb-6">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`px-3 py-1 rounded-full text-sm border ${
                activeTab === filter ? "bg-[rgba(45,156,219,0.5)] text-white" : "bg-white"
              }`}
              onClick={() => {
                setActiveTab(filter);
                if (filter === "Created") setModalOpen(true);

              }}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Main Class Cards Section */}
          <div className="flex-1 lg:pr-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ClassCard key={i} />
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block lg:w-64">
            <RightSidebar />
          </div>
        </div>
      </div>

      {/* Floating Button */}
      <button
        className="fixed bottom-6 right-6 text-white p-4 rounded-full shadow-lg"
        style={{ backgroundColor: 'rgba(73, 73, 73, 1)' }}
        onClick={() => setModalOpen(true)}
      >
        <Plus />
      </button>

      {/* Create Class Modal */}
      <CreateClassModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </AppLayout>
  );
}
