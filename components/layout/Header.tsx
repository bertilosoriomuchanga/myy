
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';
import { ROLE_NAMES } from '../../constants';

const breadcrumbNameMap: { [key: string]: string } = {
  '/dashboard': 'Dashboard',
  '/members': 'Gestão de Membros',
  '/events': 'Eventos',
  '/finance': 'Gestão Financeira',
  '/reports': 'Relatórios',
  '/backup': 'Backup e Logs',
  '/profile': 'Meu Perfil',
};


const Header: React.FC<{ sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void; }> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  if (!user) return null;

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600 focus:outline-none lg:hidden mr-4">
                <i className="fas fa-bars text-xl"></i>
            </button>
            <div className="text-sm text-gray-500">
                <Link to="/dashboard" className="hover:text-mycese-orange">Home</Link>
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;
                    return (
                        <span key={to}>
                            <span className="mx-2">/</span>
                            {isLast ? (
                                <span className="text-gray-700 font-medium">{breadcrumbNameMap[to]}</span>
                            ) : (
                                <Link to={to} className="hover:text-mycese-orange">{breadcrumbNameMap[to]}</Link>
                            )}
                        </span>
                    );
                })}
            </div>
        </div>
    <div className="flex items-center gap-4">
      <button onClick={handleRefresh} className="text-gray-600 hover:text-mycese-blue" title="Atualizar dados">
        <i className="fas fa-sync-alt text-lg"></i>
      </button>

      <div className="relative" ref={dropdownRef}>
        <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-mycese-blue text-white flex items-center justify-center font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="hidden md:block text-right">
            <p className="font-semibold text-mycese-text-dark">{user.name}</p>
            <p className="text-xs text-mycese-text-light">{ROLE_NAMES[user.role]}</p>
          </div>
          <i className={`fas fa-chevron-down text-xs text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}></i>
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 animate-fade-in-down">
            <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>
              <i className="fas fa-user-circle w-5 mr-2"></i> Meu Perfil
            </Link>
            <button onClick={logout} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <i className="fas fa-sign-out-alt w-5 mr-2"></i> Logout
            </button>
          </div>
        )}
      </div>
    </div>
    </header>
  );
};

export default Header;