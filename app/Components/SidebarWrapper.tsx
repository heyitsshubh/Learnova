'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function SidebarWrapper() {
  const pathname = usePathname();
  const hideSidebar = pathname === '/login'|| pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password' 
  || pathname === '/verify' || pathname === '/otp'; 


  if (hideSidebar) return null;
  return <Sidebar />;
}