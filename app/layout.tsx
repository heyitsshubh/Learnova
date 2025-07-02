// app/layout.tsx
import SidebarWrapper from './Components/SidebarWrapper';
import './globals.css';

export const metadata = {
  title: 'Your App Name',
  description: 'App description here',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="">
        <SidebarWrapper />
        <main className="">
          {children}
        </main>
      </body>
    </html>
  );
}

