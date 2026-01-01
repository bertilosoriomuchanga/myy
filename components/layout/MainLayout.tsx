
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { useToast } from '../../hooks/useToast';

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { users, addLog } = useData();
  const { addToast } = useToast();

  useEffect(() => {
    if (user) {
      const liveUser = users.find(u => u.id === user.id);
      if (liveUser && liveUser.passwordVersion !== user.passwordVersion) {
        addToast('Sua sessão expirou por razões de segurança. Por favor, faça login novamente.', 'info');
        addLog(
            'Sessão do usuário invalidada automaticamente',
            user.email,
            { 
                status: 'SUCCESS', // The invalidation is a successful security action
                userAgent: navigator.userAgent 
            }
        );
        logout();
      }
    }
  }, [user, users, logout, addToast, addLog]);


  return (
    <div className="flex h-screen bg-mycese-bg">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-mycese-bg">
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;