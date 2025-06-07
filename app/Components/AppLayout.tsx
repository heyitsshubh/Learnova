import Sidebar from './Sidebar';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar /> {/* Sidebar always visible */}
      <main className="flex-1 p-6">{children}</main> {/* Main content */}
    </div>
  );
};

export default AppLayout;