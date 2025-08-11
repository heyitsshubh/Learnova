import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const assignmentStatusData = [
  { name: 'Pending', value: 7, color: '#facc15' },
  { name: 'Overdue', value: 2, color: '#f87171' },
  { name: 'Not Completed', value: 4, color: '#a3a3a3' }
];

export default function AssignmentStatusBarChart() {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col h-full">
      <h3 className="text-base font-semibold text-gray-700 mb-4">Assignments Status</h3>
      <div className="flex-1 flex items-center">
        <ResponsiveContainer width="100%" height={140}>
          <BarChart
            data={assignmentStatusData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            barCategoryGap={18}
          >
            <XAxis type="number" hide domain={[0, 'dataMax + 2']} />
            <YAxis
              dataKey="name"
              type="category"
              width={110}
              tick={{ fontSize: 14, fill: '#374151', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={{ borderRadius: 8, fontSize: 13 }}
            />
            <Bar dataKey="value" barSize={22} radius={[8, 8, 8, 8]}>
              {assignmentStatusData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
              {assignmentStatusData.map((entry, idx) => (
                <text
                  key={entry.name + '-label'}
                  x={entry.value * 3.2 + 120}
                  y={30 + idx * 40}
                  textAnchor="start"
                  alignmentBaseline="middle"
                  fontSize={14}
                  fill="#374151"
                  fontWeight={600}
                  style={{ pointerEvents: 'none' }}
                >
                  {entry.value}
                </text>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}