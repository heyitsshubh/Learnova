import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';

const assignmentStatusData = [
  { status: 'Pending', value: 7 },
  { status: 'Overdue', value: 2 },
  { status: 'Completed', value: 4 }
];

const COLORS = {
  Pending: '#facc15',
  Overdue: '#f87171',
  Completed: '#34d399'
};

export default function AssignmentStatusBarChart() {
  return (
    <div className="bg-white rounded-xl shadow p-4 w-full  mx-auto min-h-[275px] flex flex-col">
      <h3 className="text-base font-semibold text-gray-700 mb-4">Assignments Status</h3>
      <div className="flex-1 ">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={assignmentStatusData}
            margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
          >
            <XAxis
              dataKey="status"
              tick={{ fontSize: 15, fill: '#374151', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 14, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={{ borderRadius: 8, fontSize: 13 }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: 13, marginBottom: 10 }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
              {assignmentStatusData.map((entry) => (
                <Cell key={entry.status} fill={COLORS[entry.status as keyof typeof COLORS]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}