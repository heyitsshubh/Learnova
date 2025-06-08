'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Use usePathname instead of useRouter
import { useState } from 'react';


interface MenuItem {
  name: string;
  path: string;
  icon: string;
  badge?: string;
}

interface ClassItem {
  name: string;
  liked: boolean;
}

interface User {
  name: string;
  initials: string;
}

const Sidebar: React.FC = () => {
  const pathname = usePathname(); // Get the current path

  const [user] = useState<User>({
    name: "Ayush Jaiswal",
  
    initials: "AJ"
  });

  const menuItems: MenuItem[] = [
    { name: 'Home', path: '/dashboard', icon: '' },
    { name: 'Classroom', path: '/classroom', icon: '' },
    { name: 'Community', path: '/community', icon: '' },
    { name: 'Messages', path: '/messages', icon: '' },
    { name: 'Notifications', path: '/notifications', icon: '' }
  ];

  const classes: ClassItem[] = [
    { name: 'UHV', liked: true },
    { name: 'PPS', liked: true },
    { name: 'Yoga', liked: true },
    { name: 'Physical Education 7-1', liked: true },
    { name: 'Chemistry', liked: true },
    { name: 'Laser', liked: true }
  ];

  const isActivePath = (path: string): boolean => {
    return pathname === path; // Compare the current path with the menu item's path
  };

  const formatClassPath = (className: string): string => {
    return `/class/${className.toLowerCase().replace(/\s+/g, '-')}`;
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 text-white flex flex-col z-50"
     style={{ backgroundColor: '#333333' }}>
      {/* Logo Section */}
      <div className="flex items-center justify-center h-16 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">Learnova</h1> {/* Replace with your logo */}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-2 py-4">
        <ul className="space-y-0">
          {menuItems.map((item: MenuItem) => (
            <li key={item.name}>
              <Link 
                href={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActivePath(item.path)
                    ? 'bg-[rgba(187,134,252,0.2)] text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </div>
                {item.badge && (
                  <span 
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      item.badge === 'New' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* My Classes Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-200">My classes</h3>
          <ul className="space-y-0">
            {classes.map((classItem: ClassItem) => (
              <li key={classItem.name}>
                <Link 
                  href={formatClassPath(classItem.name)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors duration-200 ${
                    pathname === formatClassPath(classItem.name)
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span className="font-medium">{classItem.name}</span>
                  {classItem.liked && (
                    <span className="text-pink-500 text-lg"></span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-white">
              {user.initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{user.name}</p>
            {/* <p className="text-sm text-gray-400">{user.role}</p> */}
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" 
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;