
import React from 'react';
import { useData } from '../../hooks/useData';
import StatCard from '../common/StatCard';
import Card from '../common/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PaymentStatus } from '../../types';

const COLORS = {
  [PaymentStatus.PAID]: '#4ade80',
  [PaymentStatus.PENDING]: '#facc15',
  [PaymentStatus.OVERDUE]: '#f87171',
};

const CfoDashboard: React.FC = () => {
  const { getDashboardStats, getPaymentStatusData, getFinancialSummary } = useData();
  const stats = getDashboardStats();
  const paymentStatusData = getPaymentStatusData();
  const financialSummary = getFinancialSummary();

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon="fa-users" label="Membros Ativos" value={stats.activeMembers} color="bg-mycese-blue" />
        <StatCard icon="fa-dollar-sign" label="Total Arrecadado" value={`MZN ${financialSummary.totalCollected.toFixed(2)}`} color="bg-green-500" />
        <StatCard icon="fa-chart-line" label="Projeção Mensal" value={`MZN ${financialSummary.projectedMonthly.toFixed(2)}`} color="bg-blue-500" />
        <StatCard icon="fa-percent" label="Taxa de Pagamentos" value={`${stats.paymentRate}%`} color="bg-mycese-orange" />
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Payment Status Chart */}
        <Card title="Status de Pagamentos (Quotas)">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {paymentStatusData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as PaymentStatus]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default CfoDashboard;
