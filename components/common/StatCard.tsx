
import React from 'react';
import Card from './Card';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  return (
    <Card className="flex items-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mr-6 ${color}`}>
        <i className={`fas ${icon} text-white text-2xl`}></i>
      </div>
      <div>
        <p className="text-3xl font-bold text-mycese-text-dark">{value}</p>
        <p className="text-mycese-text-light">{label}</p>
      </div>
    </Card>
  );
};

export default StatCard;
