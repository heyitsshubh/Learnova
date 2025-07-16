'use client';
import AppLayout from '../Components/AppLayout';
import { FaSearch, FaBell, FaCog } from 'react-icons/fa';

const notifications = () => {
  const data = [
    {
      date: 'March 12,2025',
      items: [
        {
          iconColor: 'bg-yellow-100 text-yellow-500',
          title: 'Sports Day Announcement',
          desc: 'The school’s Annual Sports Day will be held on May 12, 2024. Mark your calendars!',
        },
        {
          iconColor: 'bg-gray-100 text-gray-500',
          title: 'Summer holidays',
          desc: 'The school’s Annual Sports Day will be held on May 12, 2024. Mark your calendars!',
        },
        {
          iconColor: 'bg-yellow-100 text-yellow-500',
          title: 'IT-1 UHV Live class',
          desc: 'Class is Live now',
          action: 'Join',
        },
        {
          iconColor: 'bg-yellow-100 text-yellow-500',
          title: 'IT-1 UHV Live class',
          desc: 'Online class has been scheduled for 08/06/2035   05:30 p.m.',
          action: 'Set reminder',
        },
      ],
    },
    {
      date: 'March 22,2025',
      items: [
        {
          iconColor: 'bg-yellow-100 text-yellow-500',
          title: 'Sports Day Announcement',
          desc: 'The school’s Annual Sports Day will be held on May 12, 2024. Mark your calendars!',
        },
        {
          iconColor: 'bg-gray-100 text-gray-500',
          title: 'Summer holidays',
          desc: 'The school’s Annual Sports Day will be held on May 12, 2024. Mark your calendars!',
        },
        {
          iconColor: 'bg-yellow-100 text-yellow-500',
          title: 'IT-1 UHV Live class',
          desc: 'Class is Live now',
          action: 'Join',
        },
        {
          iconColor: 'bg-yellow-100 text-yellow-500',
          title: 'IT-1 UHV Live class',
          desc: 'Online class has been scheduled for 08/06/2035   05:30 p.m.',
          action: 'Set reminder',
        },
      ],
    },
  ];

  return (
    <AppLayout>
      <div className="pl-4 pr-6 pt-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Notifications</h1>
            <p className="text-sm text-gray-500">Ayush Jaiswal / messages</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
              <FaBell className="text-xl text-gray-400" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
              <FaCog className="text-xl text-gray-400" />
            </button>
            <div className="relative w-66 max-w-md">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-12 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        {data.map((section, i) => (
          <div key={i} className="mb-8">
            <p className="text-right font-semibold mb-3">{section.date}</p>
            <div className="space-y-3">
              {section.items.map((item, j) => (
                <div
                  key={j}
                  className="flex items-start gap-3 border rounded-md p-4 bg-white shadow-sm"
                >
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full ${item.iconColor}`}
                  >
                    <span className="text-lg font-bold">🔔</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-gray-500 text-sm">{item.desc}</p>
                  </div>
                  {item.action && (
                    <button
                      className={`text-sm px-3 py-1 rounded-md ${
                        item.action === 'Join'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {item.action}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default notifications;
