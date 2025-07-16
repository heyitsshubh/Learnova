'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import RightSidebar2 from '../../Components/Classroom/RightSidebar2';
import Sidebarmenu from '../../Components/Classroom/Sidebarmenu';
import CreateAssignment from '../../Components/Classroom/CreateAssignment';

function MaterialCard({
  title,
  subtitle,
  icon,
  onClick
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white p-4 rounded-xl shadow hover:shadow-lg transition flex items-center gap-4"
    >
      <div className="text-3xl text-purple-600 flex-shrink-0">{icon}</div>
      <div className="text-left">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

export default function ClassDetailPage() {
  const [userName, setUserName] = useState('');
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false);
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);

  const params = useParams();
  const router = useRouter();

  const classid = params.classid;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') || '');
    }
  }, []);

  return (
    <div className="flex p-6 gap-6">
      {/* Left/Main Section */}
      <div className="flex-1">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-800">Classroom</h1>
          <p className="text-sm text-gray-500">
            {userName ? `${userName} / ${classid}` : 'Classroom'}
          </p>
        </div>

        {/* Banner Image */}
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

        {/* Unit Cards */}
        <div className="grid grid-rows-1 sm:grid-cols-3 gap-4">
          <MaterialCard
            title="Unit 1"
            subtitle="Study Material"
            icon={
              <Image
                src="/books.svg"
                alt="Unit 1"
                width={70}
                height={70}
                className="rounded"
              />
            }
            onClick={() => router.push(`/classroom/${classid}/unit-1`)}
          />

          <MaterialCard
            title="Unit 2"
            subtitle="Study Material"
            icon={
              <Image
                src="/books.svg"
                alt="Unit 2"
                width={70}
                height={70}
                className="rounded"
              />
            }
            onClick={() => router.push(`/classroom/${classid}/unit-2`)}
          />

          <MaterialCard
            title="Previous Year Papers"
            subtitle="Download PDFs"
            icon={
              <Image
                src="/books.svg"
                alt="PDF"
                width={70}
                height={70}
                className="rounded"
              />
            }
            onClick={() => router.push(`/classroom/${classid}/previous-year-papers`)}
          />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block lg:w-64">
        <RightSidebar2 />
      </div>

      {/* Floating Plus Button */}
      <button
        className="fixed bottom-6 right-6 text-white p-4 rounded-full shadow-lg"
        style={{ backgroundColor: 'rgba(73, 73, 73, 1)' }}
        onClick={() => setSidebarMenuOpen(true)}
      >
        <Plus />
      </button>

      {/* Sidebar Menu */}
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

      {/* Create Assignment Modal */}
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
