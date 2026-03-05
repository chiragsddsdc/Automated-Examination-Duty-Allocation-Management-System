// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import FacultyLayout from './components/FacultyLayout';
import AdminDashboard from './pages/admin/Dashboard';
import FacultyManagement from './pages/admin/FacultyManagement';
import ExamSchedules from './pages/admin/ExamSchedules';
import Allocations from './pages/admin/Allocations';
import RunAllocation from './pages/admin/RunAllocation';
import Reports from './pages/admin/Reports';
import AdminNotifications from './pages/admin/Notifications';
import FacultyDashboard from './pages/faculty/Dashboard';
import MyDuties from './pages/faculty/MyDuties';
import Availability from './pages/faculty/Availability';
import FacultyNotifications from './pages/faculty/Notifications';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/faculty'} replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/faculty'} /> : <Login />} />
      
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="faculty" element={<FacultyManagement />} />
        <Route path="schedules" element={<ExamSchedules />} />
        <Route path="allocations" element={<Allocations />} />
        <Route path="run-allocation" element={<RunAllocation />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<AdminNotifications />} />
      </Route>

      <Route path="/faculty" element={<ProtectedRoute role="faculty"><FacultyLayout /></ProtectedRoute>}>
        <Route index element={<FacultyDashboard />} />
        <Route path="duties" element={<MyDuties />} />
        <Route path="availability" element={<Availability />} />
        <Route path="notifications" element={<FacultyNotifications />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: '8px', background: '#1e293b', color: '#f1f5f9', fontSize: '14px' }
        }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
