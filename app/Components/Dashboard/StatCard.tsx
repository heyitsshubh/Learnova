import React from 'react';

export default function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4 w-[260px] h-[120px]">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <h3 className="text-3xl font-semibold mt-1">{value}</h3>
      </div>
    </div>
  );
}