import AppLayout from '../Components/AppLayout';
import ProtectedRoute from '../Components/ProtectedRoute';

const Dashboard = () => {
  return (
     <ProtectedRoute>
    <AppLayout>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome to your dashboard!</p>
    </AppLayout>
      </ProtectedRoute>
  );
};

export default Dashboard;