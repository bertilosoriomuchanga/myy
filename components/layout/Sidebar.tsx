
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { APP_NAME } from '../../constants';

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();
  
  const navLinkClasses = "flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-mycese-blue rounded-lg transition-colors duration-200";
  const activeLinkClasses = "bg-mycese-blue text-white hover:bg-mycese-blue-dark hover:text-white";

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${navLinkClasses} ${activeLinkClasses}` : navLinkClasses;
    
  const menuItems = [
    { to: "/dashboard", icon: "fa-tachometer-alt", text: "Dashboard", roles: Object.values(UserRole) },
    { to: "/members", icon: "fa-users", text: "Membros", roles: [UserRole.ADMIN] },
    { to: "/events", icon: "fa-calendar-alt", text: "Eventos", roles: [UserRole.ADMIN, UserRole.CFO, UserRole.MEMBER] },
    { to: "/finance", icon: "fa-dollar-sign", text: "Financeiro", roles: [UserRole.ADMIN, UserRole.CFO, UserRole.MEMBER] },
    { to: "/reports", icon: "fa-chart-bar", text: "Relatórios", roles: [UserRole.ADMIN, UserRole.CFO] },
    { to: "/backup", icon: "fa-database", text: "Backup & Logs", roles: [UserRole.ADMIN] },
  ];

  return (
    <>
      <aside className={`fixed lg:relative lg:translate-x-0 inset-y-0 left-0 bg-mycese-sidebar w-64 shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-40`}>
        <div className="flex items-center justify-center p-6 bg-mycese-blue text-white">
          <i className="fas fa-university text-3xl mr-3"></i>
          <h1 className="text-2xl font-bold">{APP_NAME}</h1>
        </div>
        <nav className="p-4 space-y-2">
            {menuItems.map(item => (
                user && item.roles.includes(user.role) && (
                    <NavLink key={item.to} to={item.to} className={getNavLinkClass} onClick={() => setSidebarOpen(false)}>
                        <i className={`fas ${item.icon} w-6 text-center mr-3`}></i>
                        <span>{item.text}</span>
                    </NavLink>
                )
            ))}
        </nav>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 bg-black opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}
    </>
  );
};

export default Sidebar;
