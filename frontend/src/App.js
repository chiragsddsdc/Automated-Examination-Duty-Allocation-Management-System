// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/AdminLogin';
import FacultyLogin from './pages/FacultyLogin';
import AdminLayout from './components/AdminLayout';
import FacultyLayout from './components/FacultyLayout';
import AdminDashboard from './pages/admin/Dashboard';
import FacultyManagement from './pages/admin/FacultyManagement';
import ExamSchedules from './pages/admin/ExamSchedules';
import Allocations from './pages/admin/Allocations';
import RunAllocation from './pages/admin/RunAllocation';
import Reports from './pages/admin/Reports';
import AdminNotifications from './pages/admin/Notifications';
import ImportSchedule from './pages/admin/ImportSchedule';
import FacultyDashboard from './pages/faculty/Dashboard';
import MyDuties from './pages/faculty/MyDuties';
import Availability from './pages/faculty/Availability';
import FacultyNotifications from './pages/faculty/Notifications';
import ChangePassword from './pages/faculty/ChangePassword';
import AdminChangePassword from './pages/admin/ChangePassword';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/faculty'} replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <Routes>
      {/* Public landing + login pages */}
      <Route path="/"              element={<LandingPage />} />
      <Route path="/admin-login"   element={user?.role === 'admin'   ? <Navigate to="/admin"   replace /> : <AdminLogin />} />
      <Route path="/faculty-login" element={user?.role === 'faculty' ? <Navigate to="/faculty" replace /> : <FacultyLogin />} />

      {/* Legacy /login redirect → home */}
      <Route path="/login" element={<Navigate to="/" replace />} />

      {/* Protected admin routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="faculty"        element={<FacultyManagement />} />
        <Route path="schedules"      element={<ExamSchedules />} />
        <Route path="import"         element={<ImportSchedule />} />
        <Route path="allocations"    element={<Allocations />} />
        <Route path="run-allocation" element={<RunAllocation />} />
        <Route path="reports"        element={<Reports />} />
        <Route path="notifications"  element={<AdminNotifications />} />
        <Route path="change-password" element={<AdminChangePassword />} />
      </Route>

      {/* Protected faculty routes */}
      <Route path="/faculty" element={<ProtectedRoute role="faculty"><FacultyLayout /></ProtectedRoute>}>
        <Route index element={<FacultyDashboard />} />
        <Route path="duties"          element={<MyDuties />} />
        <Route path="availability"    element={<Availability />} />
        <Route path="notifications"   element={<FacultyNotifications />} />
        <Route path="change-password" element={<ChangePassword />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
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
