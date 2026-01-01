
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { PaymentStatus, UserRole } from '../../types';
import { MONTHLY_QUOTA } from '../../constants';
import SubmitPaymentModal from './SubmitPaymentModal';

interface StatusInfo {
  text: string;
  bg: string;
  text_color: string;
  border: string;
  icon?: string;
  animation?: string;
}

const MemberPaymentPortal: React.FC = () => {
  const { user } = useAuth();
  const { getUserPayments } = useData();
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) return null;
  
  const currentYear = 2026;
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const userPayments = getUserPayments(user.id);
  const userQuota = MONTHLY_QUOTA[user.role] || 0;

  const getMonthStatus = (month: number) => {
    const payment = userPayments.find(p => p.year === currentYear && p.month === month);
    if (payment) return payment.status;
    if (new Date(currentYear, month, 1) < new Date()) return PaymentStatus.OVERDUE;
    return PaymentStatus.PENDING;
  };
  
  const handleMonthSelect = (month: number) => {
    const status = getMonthStatus(month);
    if (status === PaymentStatus.PAID || status === PaymentStatus.AWAITING_CONFIRMATION) return;
    
    setSelectedMonths(prev => 
        prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  const getStatusInfo = (status: PaymentStatus): StatusInfo => {
    switch (status) {
      case PaymentStatus.PAID: return { text: 'Pago', bg: 'bg-green-100', text_color: 'text-green-800', border: 'border-green-300' };
      case PaymentStatus.AWAITING_CONFIRMATION: return { text: 'Em Verificação', bg: 'bg-orange-100', text_color: 'text-orange-800', border: 'border-orange-400', icon: 'fas fa-hourglass-half', animation: 'animate-pulse' };
      case PaymentStatus.OVERDUE: return { text: 'Em Atraso', bg: 'bg-red-100', text_color: 'text-red-800', border: 'border-red-300' };
      default: return { text: 'Pendente', bg: 'bg-yellow-100', text_color: 'text-yellow-800', border: 'border-yellow-300' };
    }
  };

  const monthsToPay = selectedMonths.map(m => ({
    month: m,
    year: currentYear,
    amount: userQuota,
  }));

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Portal de Pagamento de Quotas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {months.map(month => {
            const status = getMonthStatus(month);
            const statusInfo = getStatusInfo(status);
            const isSelected = selectedMonths.includes(month);
            const isClickable = status !== PaymentStatus.PAID && status !== PaymentStatus.AWAITING_CONFIRMATION;

            return (
              <div
                key={month}
                onClick={() => isClickable && handleMonthSelect(month)}
                className={`p-4 border-2 rounded-lg text-center ${statusInfo.border} ${statusInfo.bg} ${isClickable ? 'cursor-pointer hover:shadow-lg' : 'cursor-not-allowed opacity-70'} ${isSelected ? 'ring-2 ring-mycese-orange' : ''} transition-all ${statusInfo.animation || ''}`}
              >
                <p className="font-bold text-lg">{new Date(currentYear, month - 1, 1).toLocaleString('pt-BR', { month: 'long' })}</p>
                <p className={`text-sm font-semibold ${statusInfo.text_color}`}>
                  {statusInfo.icon && <i className={`${statusInfo.icon} mr-1`}></i>}
                  {statusInfo.text}
                </p>
              </div>
            );
          })}
        </div>
        {selectedMonths.length > 0 && (
          <div className="mt-6 text-center bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold">{selectedMonths.length} mês(es) selecionado(s) para pagamento.</p>
            <p className="text-lg">Total: <span className="font-bold">MZN {(selectedMonths.length * userQuota).toFixed(2)}</span></p>
            <button onClick={() => setIsModalOpen(true)} className="mt-4 bg-mycese-orange text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90">
              Pagar Quota(s)
            </button>
          </div>
        )}
      </div>
      <SubmitPaymentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        user={user}
        monthsToPay={monthsToPay}
      />
    </>
  );
};

export default MemberPaymentPortal;