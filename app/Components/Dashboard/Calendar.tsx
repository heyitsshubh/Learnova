import React, { useState } from 'react';

export default function Calendar() {
  const [currentDate] = useState(new Date());
  const [selected, setSelected] = useState(new Date());

  // Get Monday of current week
  const getMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const monday = getMonday(currentDate);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  // Show only last two dates of the week
  const lastTwoDates = week.slice(-2);

  const isSelected = (date: Date) =>
    date.getDate() === selected.getDate() &&
    date.getMonth() === selected.getMonth() &&
    date.getFullYear() === selected.getFullYear();

  return (
    <div className="bg-white rounded-xl p-4 shadow flex flex-col gap-2 w-full max-w-xs mx-auto min-h-[200px] border border-gray-200">
      <div className="flex items-center justify-center mb-2">
        <span className="font-semibold text-gray-700 text-base">
          {selected.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-0 text-center text-sm text-gray-500 mb-2 border-b border-gray-200">
        {['Sat', 'Sun'].map((d) => (
          <span key={d} className="py-2 border-r last:border-r-0 border-gray-200">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-0 text-center border-t border-gray-200">
        {lastTwoDates.map((date, idx) => (
          <button
            key={idx}
            className={`rounded-none w-full h-16 flex items-center justify-center text-xl font-semibold transition border-r border-b border-gray-200
              ${isSelected(date)
                ? 'bg-teal-600 text-white shadow-lg'
                : 'bg-gray-50 text-gray-700 hover:bg-teal-100'}
              ${idx === 1 ? 'border-r-0' : ''}
            `}
            onClick={() => setSelected(new Date(date))}
            aria-label={`Select ${date.toDateString()}`}
            disabled={date < new Date(new Date().setHours(0,0,0,0))}
            style={date < new Date(new Date().setHours(0,0,0,0)) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {date.getDate()}
          </button>
        ))}
      </div>
      <div className="mt-3 text-center text-base text-teal-600 font-medium">
        {selected.toDateString()}
      </div>
    </div>
  );
}