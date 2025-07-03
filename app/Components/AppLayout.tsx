import Sidebar from './Sidebar';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main> 
    </div>
  );
};

export default AppLayout;