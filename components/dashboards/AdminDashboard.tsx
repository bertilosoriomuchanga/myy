
import React from 'react';
import { useData } from '../../hooks/useData';
import StatCard from '../common/StatCard';
import Card from '../common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0A2463', '#FF6B35', '#4ade80', '#facc15', '#60a5fa'];

const AdminDashboard: React.FC = () => {
  const { getDashboardStats, getFacultyDistribution, getMembersEvolution } = useData();
  const stats = getDashboardStats();
  const facultyData = getFacultyDistribution();
  const membersEvolution = getMembersEvolution();

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon="fa-users" label="Membros Ativos" value={stats.activeMembers} color="bg-mycese-blue" />
        <StatCard icon="fa-user-plus" label="Novos Membros (Mês)" value={stats.newMembersThisMonth} color="bg-green-500" />
        <StatCard icon="fa-calendar-check" label="Eventos Realizados" value={stats.eventsHeld} color="bg-mycese-orange" />
        <StatCard icon="fa-percent" label="Taxa de Pagamentos" value={`${stats.paymentRate}%`} color="bg-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Members Evolution Chart */}
        <Card title="Evolução de Membros">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={membersEvolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="members" fill="#0A2463" name="Total de Membros" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Faculty Distribution Chart */}
        <Card title="Distribuição por Faculdade">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={facultyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {facultyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
