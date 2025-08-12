'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { FaHome, FaBook, FaUsers, FaCog, FaBell, FaBars } from 'react-icons/fa';

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
  const [isOpen, setIsOpen] = useState(false); // mobile menu state
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
      if (logoutBtnRef.current && !logoutBtnRef.current.contains(e.target as Node)) {
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
    { name: 'Settings', path: '/Settings', icon: <FaCog /> }
  ];

  const isActivePath = (path: string): boolean => pathname === path;

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-[#333333] text-white px-4 py-3">
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
        <button onClick={() => setIsOpen(!isOpen)}>
          <FaBars size={20} />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 text-white flex flex-col z-50 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ backgroundColor: '#333333' }}
      >
        {/* Logo */}
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

        {/* Menu */}
  
<nav className="flex-1 px-4 py-4">
  <ul className="space-y-7">
    {menuItems.map((item) => (
      <li key={item.name}>
        <Link
          href={item.path}
          onClick={() => setIsOpen(false)} // close on mobile click
          className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${
            isActivePath(item.path)
              ? 'bg-[#BB86FC33] text-white'
              : 'text-gray-300 hover:bg-[#6C47B933] hover:text-white hover:scale-[1.08] shadow-sm'
          }`}
          style={{
            boxShadow: isActivePath(item.path)
              ? '0 2px 8px 0 #BB86FC33'
              : undefined,
          }}
        >
          <div className="flex items-center space-x-3">
            <span className="text-lg group-hover:scale-120 transition-transform duration-200">{item.icon}</span>
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


        {/* User Info */}
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
            {/* <div ref={logoutBtnRef} className="relative"></div> */}
           <button
  className="text-gray-400 hover:text-white transition-colors relative cursor-pointer"
  onClick={() => setShowLogout((v) => !v)}
  tabIndex={0}
>
  ⋮
  {showLogout && (
    <div
      className="absolute top-0 w-32 bg-white text-gray-800 rounded shadow-lg z-50 "
      onClick={(e) => e.stopPropagation()}
    >
   <button
  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 cursor-pointer"
  onClick={() => {
    localStorage.clear();
    setShowLogout(false);
    setIsOpen(false);
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

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;