import SidebarWrapper from './Components/SidebarWrapper';
import './globals.css';
import MainWrapper from './Components/MainWrapper';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './Components/Contexts/SocketContext';

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
        <SocketProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10B981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#EF4444',
                },
              },
            }}
          /> 
          <SidebarWrapper />
          <MainWrapper>{children}</MainWrapper>
        </SocketProvider>
      </body>
    </html>
  );
}