
import React from 'react';
import Card from '../components/common/Card';
import { useData } from '../hooks/useData';
import { formatDateTime } from '../utils/helpers';

const BackupPage: React.FC = () => {
    const { users, events, payments, logs } = useData();

    const handleExport = (data: any, fileName: string) => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = `${fileName}.json`;
        link.click();
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-mycese-text-dark mb-6">Backup e Logs</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Exportação de Dados (Backup)">
                    <div className="space-y-4">
                        <p className="text-gray-600">Faça o download dos dados do sistema em formato JSON.</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                             <button onClick={() => handleExport(users, 'mycese_users')} className="flex-1 bg-mycese-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-mycese-blue-dark transition">
                                <i className="fas fa-users mr-2"></i> Exportar Membros
                            </button>
                            <button onClick={() => handleExport(events, 'mycese_events')} className="flex-1 bg-mycese-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-mycese-blue-dark transition">
                                <i className="fas fa-calendar-alt mr-2"></i> Exportar Eventos
                            </button>
                            <button onClick={() => handleExport(payments, 'mycese_payments')} className="flex-1 bg-mycese-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-mycese-blue-dark transition">
                                <i className="fas fa-dollar-sign mr-2"></i> Exportar Finanças
                            </button>
                        </div>
                    </div>
                </Card>

                <Card title="Importação de Dados">
                     <div className="space-y-4">
                        <p className="text-gray-600">Importe dados de um arquivo JSON. Cuidado: isso irá sobrescrever os dados existentes.</p>
                         <input type="file" accept=".json" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-mycese-blue hover:file:bg-blue-100" />
                    </div>
                </Card>
            </div>
            
            <div className="mt-6">
                <Card title="Log de Atividades do Sistema">
                    <div className="overflow-y-auto h-96">
                        <table className="min-w-full">
                            <thead className="sticky top-0 bg-gray-100">
                                <tr>
                                    <th className="text-left p-2">Data/Hora</th>
                                    <th className="text-left p-2">Usuário</th>
                                    <th className="text-left p-2">Ação</th>
                                    <th className="text-left p-2">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 text-sm">
                                {logs.map(log => (
                                    <tr key={log.id} className="border-t">
                                        <td className="p-2 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                                        <td className="p-2">{log.user}</td>
                                        <td className="p-2">{log.action}</td>
                                        <td className="p-2">
                                            {log.details && (
                                                <div className="flex flex-col">
                                                    {log.details.status && (
                                                        <span className={`font-semibold ${log.details.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
                                                            Status: {log.details.status}
                                                        </span>
                                                    )}
                                                    {log.details.emailAttempted && <span>Email: {log.details.emailAttempted}</span>}
                                                    {log.details.userAgent && <span className="text-xs text-gray-500 truncate" title={log.details.userAgent}>Agent: {log.details.userAgent}</span>}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default BackupPage;