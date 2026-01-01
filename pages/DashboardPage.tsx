
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import CfoDashboard from '../components/dashboards/CfoDashboard';
import MemberDashboard from '../components/dashboards/MemberDashboard';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return <div>Carregando...</div>;
    }

    const renderDashboard = () => {
        switch (user.role) {
            case UserRole.ADMIN:
                return <AdminDashboard />;
            case UserRole.CFO:
                return <CfoDashboard />;
            case UserRole.MEMBER:
                return <MemberDashboard />;
            default:
                return <MemberDashboard />; // Default to member view for other new roles
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-mycese-text-dark mb-2">Bem-vindo, {user.name.split(' ')[0]}!</h1>
            <p className="text-mycese-text-light mb-8">Este é o seu painel de controle no MyCESE.</p>
            {renderDashboard()}
        </div>
    );
};

export default DashboardPage;
