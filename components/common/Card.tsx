
import React from 'react';

interface CardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, className = '', children }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {title && <h3 className="text-lg font-semibold text-mycese-text-dark mb-4">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
