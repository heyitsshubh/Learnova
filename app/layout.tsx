// app/layout.tsx
import Sidebar from './Components/Sidebar'; // Adjust the path if Sidebar is in a different location
import './globals.css'; // ✅ Tailwind and global styles

export const metadata = {
  title: 'Your App Name',
  description: 'App description here',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="">
        {/* ✅ Sidebar rendered once globally */}
        <Sidebar />

        {/* ✅ Main content with space for sidebar */}
        <main className="ml-64 min-h-screen p-6">
          {children}
        </main>
      </body>
    </html>
  );
}

