// app/layout.tsx
import SidebarWrapper from './Components/SidebarWrapper';
import './globals.css';
import MainWrapper from './Components/MainWrapper';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Your App Name',
  description: 'App description here',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Toaster /> 
        <SidebarWrapper />
        <MainWrapper>{children}</MainWrapper>
      </body>
    </html>
  );
}
