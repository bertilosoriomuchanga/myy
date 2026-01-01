
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { DataProvider, useData } from './hooks/useData';
import { ToastProvider } from './hooks/useToast';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MembersPage from './pages/MembersPage';
import EventsPage from './pages/EventsPage';
import FinancePage from './pages/FinancePage';
import ReportsPage from './pages/ReportsPage';
import BackupPage from './pages/BackupPage';
import ProfilePage from './pages/ProfilePage';
import MainLayout from './components/layout/MainLayout';
import ChangePasswordPage from './pages/ChangePasswordPage';
import { UserRole } from './types';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';


// Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
const ProtectedRoute: React.FC<{ children: React.ReactElement; roles?: UserRole[] }> = ({ children, roles }) => {
  const { user, loading: authLoading } = useAuth();
  const { loading: dataLoading } = useData();

  if (authLoading || dataLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-mycese-bg">
        <i className="fas fa-spinner fa-spin text-mycese-blue text-4xl"></i>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }
  
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes: React.FC = () => {
    const { user } = useAuth();
    
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />

            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="members" element={
                    <ProtectedRoute roles={[UserRole.ADMIN]}>
                        <MembersPage />
                    </ProtectedRoute>
                } />
                <Route path="events" element={
                    <ProtectedRoute roles={[UserRole.ADMIN, UserRole.MEMBER, UserRole.CFO]}>
                        <EventsPage />
                    </ProtectedRoute>
                }/>
                 <Route path="finance" element={
                    <ProtectedRoute roles={[UserRole.ADMIN, UserRole.CFO, UserRole.MEMBER]}>
                        <FinancePage />
                    </ProtectedRoute>
                }/>
                <Route path="reports" element={
                    <ProtectedRoute roles={[UserRole.ADMIN, UserRole.CFO]}>
                        <ReportsPage />
                    </ProtectedRoute>
                }/>
                <Route path="backup" element={
                    <ProtectedRoute roles={[UserRole.ADMIN]}>
                        <BackupPage />
                    </ProtectedRoute>
                }/>
            </Route>
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <ToastProvider>
      <HashRouter>
        <AuthProvider>
          <DataProvider>
            <AppRoutes />
          </DataProvider>
        </AuthProvider>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;