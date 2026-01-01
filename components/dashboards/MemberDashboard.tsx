
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import Card from '../common/Card';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/helpers';
import { PaymentStatus } from '../../types';

const MemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const { events, getUserPayments } = useData();

  if (!user) return null;

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);
  
  const userPayments = getUserPayments(user.id);
  const latestPayment = userPayments[0];
  let financialStatus = "Em dia";
  let statusColor = "text-green-500";

  const currentMonthPending = userPayments.find(p => p.month === new Date().getMonth() + 1 && p.year === new Date().getFullYear() && p.status === PaymentStatus.PENDING);
  const overdue = userPayments.find(p => p.status === PaymentStatus.OVERDUE);

  if (overdue) {
    financialStatus = "Em Atraso";
    statusColor = "text-red-500";
  } else if (currentMonthPending) {
    financialStatus = "Pendente";
    statusColor = "text-yellow-500";
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Personal Info */}
      <div className="lg:col-span-2">
        <Card title="Minhas Informações">
            <div className="space-y-4">
                <div>
                    <p className="text-sm text-mycese-text-light">Número MyCESE</p>
                    <p className="font-semibold text-mycese-blue text-lg">{user.myceseNumber}</p>
                </div>
                <div>
                    <p className="text-sm text-mycese-text-light">Nome Completo</p>
                    <p className="font-semibold text-mycese-text-dark">{user.name}</p>
                </div>
                 <div>
                    <p className="text-sm text-mycese-text-light">Email</p>
                    <p className="font-semibold text-mycese-text-dark">{user.email}</p>
                </div>
                <div>
                    <p className="text-sm text-mycese-text-light">Faculdade</p>
                    <p className="font-semibold text-mycese-text-dark">{user.faculty}</p>
                </div>
                 <Link to="/profile" className="inline-block mt-4 text-mycese-orange hover:underline">
                    Ver e editar perfil completo <i className="fas fa-arrow-right ml-1"></i>
                </Link>
            </div>
        </Card>
      </div>

      {/* Financial Status & Events */}
      <div className="space-y-8">
          <Card title="Situação Financeira">
            <div className="text-center">
                <p className={`text-2xl font-bold ${statusColor}`}>{financialStatus}</p>
                <p className="text-sm text-mycese-text-light mt-2">
                    {latestPayment ? `Última quota: ${latestPayment.month}/${latestPayment.year}` : 'Nenhum pagamento registrado.'}
                </p>
                <Link to="/finance" className="inline-block mt-4 text-mycese-orange hover:underline text-sm">
                    Ver histórico de pagamentos
                </Link>
            </div>
          </Card>
          <Card title="Próximos Eventos">
            {upcomingEvents.length > 0 ? (
                <ul className="space-y-4">
                    {upcomingEvents.map(event => (
                        <li key={event.id} className="border-b pb-2 last:border-b-0">
                            <p className="font-semibold text-mycese-text-dark">{event.title}</p>
                            <p className="text-sm text-mycese-text-light">{formatDate(event.date)}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-mycese-text-light text-center">Nenhum evento agendado.</p>
            )}
             <Link to="/events" className="inline-block mt-4 text-mycese-orange hover:underline text-sm">
                Ver todos os eventos
            </Link>
          </Card>
      </div>
    </div>
  );
};

export default MemberDashboard;
