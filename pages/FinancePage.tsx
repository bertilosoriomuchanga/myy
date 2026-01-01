
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { UserRole, Payment, PaymentStatus, User, Faculty } from '../types';
import Card from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import { MONTHLY_QUOTA, ROLE_NAMES } from '../constants';
import { useToast } from '../hooks/useToast';
import MemberPaymentPortal from '../components/finance/MemberPaymentPortal';
import { formatDateTime } from '../utils/helpers';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const getStatusChip = (status: PaymentStatus) => {
    switch(status) {
        case PaymentStatus.PAID: return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Pago</span>;
        case PaymentStatus.PENDING: return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">Pendente</span>;
        case PaymentStatus.OVERDUE: return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">Atrasado</span>;
        case PaymentStatus.AWAITING_CONFIRMATION: return <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-200 rounded-full">Aguardando</span>;
    }
};

const AdminCfoFinanceView: React.FC = () => {
    const { users, payments: initialPayments, updatePaymentStatus, deletePayment, getMonthlyDelinquency } = useData();
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
    const dropdownRefs = useRef<{[key: string]: HTMLTableCellElement | null}>({});
    const exportDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeDropdown && dropdownRefs.current[activeDropdown] && !dropdownRefs.current[activeDropdown]?.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
                setExportDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDropdown]);
    
    const monthlyDelinquency = useMemo(() => getMonthlyDelinquency(), [getMonthlyDelinquency]);

    const confirmationRate = useMemo(() => {
        const paymentsWithProof = initialPayments.filter(p => p.proof);
        if (paymentsWithProof.length === 0) return 100;
        const confirmedCount = paymentsWithProof.filter(p => p.status === PaymentStatus.PAID).length;
        return parseFloat(((confirmedCount / paymentsWithProof.length) * 100).toFixed(1));
    }, [initialPayments]);

    const stats = useMemo(() => {
        const activeUsers = users.filter(u => u.status === 'ACTIVE');
        const now = new Date(2026, 5, 15); // Fixed date for demo consistency
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        let uniqueOverdueUsers = new Set<string>();
        let totalOverdueAmount = 0;

        activeUsers.forEach(user => {
            const userPayments = initialPayments.filter(p => p.userId === user.id);
            for (let m = 1; m < currentMonth; m++) {
                const payment = userPayments.find(p => p.year === currentYear && p.month === m);
                if (!payment || payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.OVERDUE) {
                    uniqueOverdueUsers.add(user.id);
                    totalOverdueAmount += MONTHLY_QUOTA[user.role] || 0;
                }
            }
        });

        const totalPaidThisMonth = initialPayments.filter(p => p.year === currentYear && p.month === currentMonth && p.status === PaymentStatus.PAID)
            .reduce((sum, p) => sum + p.amount, 0);

        return { totalPaidThisMonth, totalOverdueAmount, uniqueOverdueUsers: uniqueOverdueUsers.size };
    }, [initialPayments, users]);

    const filteredPayments = useMemo(() => {
        return initialPayments.filter(p => {
            const user = users.find(u => u.id === p.userId);
            if (!user) return false;
            
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = user.name.toLowerCase().includes(searchLower) || user.email.toLowerCase().includes(searchLower);
            const matchesStatus = statusFilter ? p.status === statusFilter : true;
            const matchesRole = roleFilter ? user.role === roleFilter : true;
            
            return matchesSearch && matchesStatus && matchesRole;
        }).sort((a,b) => {
            const dateA = a.proof?.submittedAt || a.paidAt || '1970-01-01';
            const dateB = b.proof?.submittedAt || b.paidAt || '1970-01-01';
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
    }, [initialPayments, users, searchTerm, statusFilter, roleFilter]);

    const handleConfirm = async (id: string) => { 
        await updatePaymentStatus(id, PaymentStatus.PAID);
        addToast('Pagamento confirmado!', 'success');
        setActiveDropdown(null); 
    };
    const handleReject = async (id: string) => { 
        await updatePaymentStatus(id, PaymentStatus.PENDING);
        addToast('Pagamento rejeitado.', 'info'); 
        setActiveDropdown(null); 
    };
    const handleDelete = (id: string) => { 
        if(window.confirm('Tem certeza?')) { 
            deletePayment(id); 
            addToast('Pagamento removido.', 'success');
            setActiveDropdown(null); 
        }
    };
    const handleRevert = async (id: string) => {
        if (window.confirm('Tem certeza que deseja reverter este pagamento para "Aguardando Confirmação"?')) {
            await updatePaymentStatus(id, PaymentStatus.AWAITING_CONFIRMATION);
            addToast('Decisão revertida. O pagamento aguarda nova avaliação.', 'info');
            setActiveDropdown(null);
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Relatório Financeiro MyCESE", 14, 16);
        // Fix: Cast doc to any to use the autoTable plugin, avoiding module augmentation issues.
        (doc as any).autoTable({
            head: [['Membro', 'Período', 'Valor (MZN)', 'Status', 'Método', 'Data Submissão']],
            body: filteredPayments.map(p => {
                const user = users.find(u => u.id === p.userId);
                return [
                    user?.name || 'N/A',
                    `${p.month}/${p.year}`,
                    p.amount.toFixed(2),
                    p.status,
                    p.method || 'N/A',
                    p.proof?.submittedAt ? formatDateTime(p.proof.submittedAt) : 'N/A'
                ];
            }),
            startY: 20
        });
        doc.save('relatorio_financeiro.pdf');
    };

    const exportToExcel = () => {
        const data = filteredPayments.map(p => {
            const user = users.find(u => u.id === p.userId);
            return {
                'Membro': user?.name || 'N/A',
                'Período': `${p.month}/${p.year}`,
                'Valor (MZN)': p.amount.toFixed(2),
                'Status': p.status,
                'Método': p.method || 'N/A',
                'Data Submissão': p.proof?.submittedAt ? formatDateTime(p.proof.submittedAt) : 'N/A'
            };
        });
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Finanças');
        XLSX.writeFile(workbook, 'relatorio_financeiro.xlsx');
    };

    const exportToWord = () => {
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
            "xmlns:w='urn:schemas-microsoft-com:office:word' "+
            "xmlns='http://www.w3.org/TR/REC-html40'>"+
            "<head><meta charset='utf-8'><title>Relatório Financeiro</title></head><body>";
        const footer = "</body></html>";
        let table = '<h1>Relatório Financeiro MyCESE</h1><table border="1"><thead><tr>' +
            '<th>Membro</th><th>Período</th><th>Valor (MZN)</th><th>Status</th><th>Método</th><th>Data Submissão</th>' +
            '</tr></thead><tbody>';

        filteredPayments.forEach(p => {
            const user = users.find(u => u.id === p.userId);
            table += `<tr>
                <td>${user?.name || 'N/A'}</td>
                <td>${p.month}/${p.year}</td>
                <td>${p.amount.toFixed(2)}</td>
                <td>${p.status}</td>
                <td>${p.method || 'N/A'}</td>
                <td>${p.proof?.submittedAt ? formatDateTime(p.proof.submittedAt) : 'N/A'}</td>
            </tr>`;
        });
        table += '</tbody></table>';

        const source = header + table + footer;
        const file = new Blob([source], { type: 'application/msword' });
        saveAs(file, 'relatorio_financeiro.doc');
    };


    return (
        <div>
            <h1 className="text-3xl font-bold text-mycese-text-dark mb-6">Gestão Financeira</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard icon="fa-cash-register" label="Arrecadado este Mês" value={`MZN ${stats.totalPaidThisMonth.toFixed(2)}`} color="bg-green-500" />
                <StatCard icon="fa-exclamation-triangle" label="Membros em Atraso" value={stats.uniqueOverdueUsers} color="bg-red-500" />
                <StatCard icon="fa-file-invoice-dollar" label="Valor Total em Atraso" value={`MZN ${stats.totalOverdueAmount.toFixed(2)}`} color="bg-yellow-500" />
                 <StatCard icon="fa-check-double" label="Taxa de Confirmação" value={`${confirmationRate}%`} color="bg-blue-500" />
            </div>

            <Card title="Análise de Inadimplência Mensal (Últimos 6 meses)" className="mb-6">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyDelinquency}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="paid" name="Quotas Pagas" stackId="a" fill="#4ade80" />
                        <Bar dataKey="overdue" name="Quotas em Atraso" stackId="a" fill="#f87171" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            <Card title="Histórico Geral de Transações">
                <div className="mb-4 flex flex-col md:flex-row gap-4 items-center">
                     <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border rounded-lg md:flex-1"
                    />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full md:w-auto p-2 border rounded-lg">
                        <option value="">Todos os Status</option>
                        {Object.values(PaymentStatus).map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <select name="role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full md:w-auto p-2 border rounded-lg">
                        <option value="">Todos os Perfis</option>
                        {Object.values(UserRole).map((role) => (
                            <option key={role} value={role}>{ROLE_NAMES[role]}</option>
                        ))}
                    </select>
                     <div className="relative" ref={exportDropdownRef}>
                        <button onClick={() => setExportDropdownOpen(!exportDropdownOpen)} className="w-full md:w-auto bg-mycese-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-mycese-blue-dark transition">
                            <i className="fas fa-download mr-2"></i> Exportar
                        </button>
                        {exportDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10">
                                <button onClick={exportToPDF} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i className="fas fa-file-pdf mr-2 text-red-500"></i>PDF</button>
                                <button onClick={exportToExcel} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i className="fas fa-file-excel mr-2 text-green-500"></i>Excel</button>
                                <button onClick={exportToWord} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i className="fas fa-file-word mr-2 text-blue-500"></i>Word</button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left p-3">Membro</th>
                                <th className="text-left p-3">Período</th>
                                <th className="text-left p-3">Valor</th>
                                <th className="text-left p-3">Status</th>
                                <th className="text-left p-3">Método/Detalhes</th>
                                <th className="text-left p-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map(p => {
                                const user = users.find(u => u.id === p.userId);
                                return (
                                <tr key={p.id} className="border-t hover:bg-gray-50">
                                    <td className="p-3">{user?.name || 'Usuário não encontrado'}</td>
                                    <td className="p-3">{p.month}/{p.year}</td>
                                    <td className="p-3">MZN {p.amount.toFixed(2)}</td>
                                    <td className="p-3">{getStatusChip(p.status)}</td>
                                    <td className="p-3 text-xs">
                                        <p className="font-semibold">{p.method || 'N/A'}</p>
                                        {p.proof && <p>Ficheiro: {p.proof.fileName}</p>}
                                        {p.proof?.submittedAt && <p>Enviado: {formatDateTime(p.proof.submittedAt)}</p>}
                                        {p.paidAt && <p>Confirmado: {formatDateTime(p.paidAt)}</p>}
                                        {p.proof?.fileContent && (
                                            <a href={p.proof.fileContent} target="_blank" rel="noopener noreferrer" className="text-mycese-blue hover:underline font-semibold block mt-1">
                                                <i className="fas fa-eye mr-1"></i> Ver Comprovativo
                                            </a>
                                        )}
                                    </td>
                                    <td className="p-3 relative" ref={el => dropdownRefs.current[p.id] = el}>
                                         <button onClick={() => setActiveDropdown(activeDropdown === p.id ? null : p.id)} className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">
                                            Ações <i className="fas fa-chevron-down text-xs ml-1"></i>
                                         </button>
                                        {activeDropdown === p.id && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                                                {p.status === PaymentStatus.AWAITING_CONFIRMATION && (
                                                    <>
                                                    <button onClick={() => handleConfirm(p.id)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Confirmar</button>
                                                    <button onClick={() => handleReject(p.id)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Rejeitar</button>
                                                    </>
                                                )}
                                                {p.status === PaymentStatus.PAID && p.proof && (
                                                    <button onClick={() => handleRevert(p.id)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Reverter Decisão</button>
                                                )}
                                                 <button onClick={() => handleDelete(p.id)} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Remover</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};


const FinancePage: React.FC = () => {
    const { user } = useAuth();

    if (!user) return null;

    const showAdminCfoView = user.role === UserRole.ADMIN || user.role === UserRole.CFO;

    return (
        <div>
            {/* Personal Finance View for ALL users */}
            <h1 className="text-3xl font-bold text-mycese-text-dark mb-6">Minhas Finanças</h1>
            <MemberPaymentPortal />

            {/* Admin/CFO Finance Management View */}
            {showAdminCfoView && (
                <div className="mt-12">
                    <AdminCfoFinanceView />
                </div>
            )}
        </div>
    );
};

export default FinancePage;
