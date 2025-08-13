import React, { useState } from 'react';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState(new Date());

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

  const handlePrevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };
  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const isSelected = (date: Date) =>
    date.getDate() === selected.getDate() &&
    date.getMonth() === selected.getMonth() &&
    date.getFullYear() === selected.getFullYear();

  return (
    <div className="bg-white rounded-xl p-4 shadow flex flex-col gap-2 ml-[-90px] w-[330px] h-[235px]">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={handlePrevWeek}
          className="text-gray-500 text-lg px-2 rounded hover:bg-gray-100"
          aria-label="Previous week"
        >
          &lt;
        </button>
        <span className="font-semibold text-gray-700">
          {selected.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={handleNextWeek}
          className="text-gray-500 text-lg px-2 rounded hover:bg-gray-100"
          aria-label="Next week"
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {week.map((date, idx) => (
          <button
            key={idx}
            className={`rounded-full w-8 h-8 flex items-center justify-center transition
              ${isSelected(date)
                ? 'bg-teal-600 text-white font-bold shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-teal-100'}
            `}
            onClick={() => setSelected(new Date(date))}
            aria-label={`Select ${date.toDateString()}`}
          >
            {date.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}