'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { FaHome, FaBook, FaUsers,  FaCog,FaBell } from 'react-icons/fa';
import {useRouter}  from 'next/navigation';


interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

interface User {
  name: string;
  initials: string;
}

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);
    const logoutBtnRef = useRef<HTMLDivElement | null>(null);

  const [user, setUser] = useState<User>({
    name: '',
    initials: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('userName') || '';
      setUser({
        name: storedName,
        initials: storedName
          ? storedName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
          : ''
      });
    }
  }, []);

    useEffect(() => {
    if (!showLogout) return;
    const handleClick = (e: MouseEvent) => {
      if (
        logoutBtnRef.current &&
        !logoutBtnRef.current.contains(e.target as Node)
      ) {
        setShowLogout(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [showLogout]);

  const menuItems: MenuItem[] = [
    { name: 'Home', path: '/dashboard', icon: <FaHome /> },
    { name: 'Classroom', path: '/classroom', icon: <FaBook /> },
    { name: 'Community', path: '/community', icon: <FaUsers /> },
    { name: 'Notifications', path: '/notifications', icon: <FaBell /> },
    { name: 'Settings', path: '/Settings', icon: <FaCog/> }
  ];

  const isActivePath = (path: string): boolean => {
    return pathname === path;
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 text-white flex flex-col z-50"
     style={{ backgroundColor: '#333333' }}>

      <div className="h-16 border-b border-gray-700 px-4 flex items-center">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 flex-shrink-0 bg-white rounded-full p-1 flex items-center justify-center">
            <Image
              src="/logooo.svg"
              alt="learnOva Logo"
              width={24}
              height={24}
              className="object-contain"
              style={{ filter: 'brightness(0) saturate(100%)' }}
            />
          </div>
          <h1 className="text-xl font-bold text-white">learnOva</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-7">
          {menuItems.map((item: MenuItem) => (
            <li key={item.name}>
              <Link 
                href={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActivePath(item.path)
                    ? 'bg-[#BB86FC33] text-white'
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
      </nav>
  <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3 relative">
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-white">
              {user.initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{user.name}</p>
          </div>
            <div ref={logoutBtnRef} className="relative"></div>
          <button
            className="text-gray-400 hover:text-white transition-colors relative cursor-pointer"
            onClick={() => setShowLogout((v) => !v)}
            tabIndex={0}
          >
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
            {showLogout && (
              <div
                className="absolute top-0 w-32 bg-white text-gray-800 rounded shadow-lg z-50 "
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 cursor-pointer"
                  onClick={() => {
                    localStorage.clear();
                    router.push('/');
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
     
  );
};

export default Sidebar;