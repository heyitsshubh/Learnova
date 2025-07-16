'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import RightSidebar2 from '../../../Components/Classroom/RightSidebar2';
import { Plus } from 'lucide-react';
import Sidebarmenu from '../../../Components/Classroom/Sidebarmenu';
import CreateAssignment from '../../../Components/Classroom/CreateAssignment';

const unitData: Record<string, string[]> = {
  'unit-1': ['unit1-part1.pdf', 'unit1-part2.pdf', 'assignment1.pdf'],
  'unit-2': ['unit2-part1.pdf', 'unit2-part2.pdf'],
  'previous-year-papers': ['paper1.pdf', 'paper2.pdf']
};

// Card component for PDFs
function PdfCard({ title, filePath }: { title: string; filePath: string }) {
  return (
    <a
      href={filePath}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition flex items-center gap-4"
    >
      <Image
        src="/books.svg"
        alt={title}
        width={70}
        height={70}
        className="rounded"
      />
      <div className="text-left">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">Click to open</p>
      </div>
    </a>
  );
}

export default function UnitPdfPage({
  params
}: {
 params: { classId: string; unit: string };
}) {
  const [userName, setUserName] = useState('');
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false);
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);

  const files = unitData[params.unit];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') || '');
    }
  }, []);

  return (
    <div className="flex p-6 gap-6">
      {/* Main Content */}
      <div className="flex-1">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-800">Classroom</h1>
          <p className="text-sm text-gray-500">
            {userName ? `${userName} / ${params.unit.replace(/-/g, ' ')}` : 'Classroom'}
          </p>
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

        {/* PDF Grid */}
        {files ? (
          <div className="grid grid-rows-1 sm:grid-cols-2 gap-4">
            {files.map((file) => (
              <PdfCard
                key={file}
                title={file.replace('.pdf', '').replace(/-/g, ' ')}
                filePath={`/pdfs/${params.unit}/${file}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-red-500">No material found for this unit.</div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block lg:w-64">
        <RightSidebar2 />
      </div>

      {/* Floating + Button */}
      <button
        className="fixed bottom-6 right-6 text-white p-4 rounded-full shadow-lg"
        style={{ backgroundColor: 'rgba(73, 73, 73, 1)' }}
        onClick={() => setSidebarMenuOpen(true)}
      >
        <Plus />
      </button>

      {/* Side Menu + Create Assignment */}
      {sidebarMenuOpen && (
        <Sidebarmenu
          open={sidebarMenuOpen}
          onClose={() => setSidebarMenuOpen(false)}
          onCreateAssignment={() => {
            setSidebarMenuOpen(false);
            setCreateAssignmentOpen(true);
          }}
        />
      )}

      {createAssignmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <CreateAssignment onClose={() => setCreateAssignmentOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
