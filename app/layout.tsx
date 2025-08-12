import SidebarWrapper from './Components/SidebarWrapper';
import './globals.css';
import MainWrapper from './Components/MainWrapper';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './Components/Contexts/SocketContext';
import { ThemeProvider } from './Components/Contexts/ThemeContext'; // <-- import ThemeProvider

import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
});

export const metadata = {
  title: 'Learnova - Learning Management System',
  description: 'A comprehensive learning management system for students and teachers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={poppins.variable}>
        <ThemeProvider> 
          <SocketProvider>
      <Toaster 
  position="top-right"
  toastOptions={{
    duration: 3000,
    style: {
      background: 'rgba(13, 64, 89, 1)',
      color: '#fff',
      borderRadius: '10px',
      fontFamily: 'var(--font-poppins), sans-serif',
      fontSize: '1rem',
      boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)',
      padding: '16px 24px',
      border: '1px solid #e0e0e0',
    },
    success: {
      duration: 3000,
      style: {
        background: 'rgba(13, 64, 89, 1)',
        color: '#fff',
        borderRadius: '10px',
        fontWeight: 600,
        boxShadow: '0 4px 24px 0 rgba(16,185,129,0.15)',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#059669',
      },
    },
    error: {
      duration: 3000,
      style: {
        background: 'rgba(239, 68, 68, 0.7)',
        color: '#fff',
        borderRadius: '10px',
        fontWeight: 600,
        boxShadow: '0 4px 24px 0 rgba(239,68,68,0.15)',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#b91c1c',
      },
    },
  }}
/> 
            <SidebarWrapper  />
            <MainWrapper>{children}</MainWrapper>
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}