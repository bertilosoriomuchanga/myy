import React, { useRef } from 'react';
import Card from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import { useData } from '../hooks/useData';
// Fix: Added LineChart to recharts import to resolve 'Cannot find name' error.
import { Bar, BarChart, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '../hooks/useToast';

const ReportsPage: React.FC = () => {
    const { getFacultyDistribution, getMembersEvolution, getFinancialSummary, getFacultyComparisonStats, getMonthlyRevenueVsProjection } = useData();
    const { addToast } = useToast();
    
    const facultyDistribution = getFacultyDistribution();
    const membersEvolution = getMembersEvolution();
    const financialSummary = getFinancialSummary();
    const facultyComparison = getFacultyComparisonStats();
    const monthlyRevenue = getMonthlyRevenueVsProjection();

    const reportRef = useRef<HTMLDivElement>(null);

    const handleExportPDF = async () => {
        const reportElement = reportRef.current;
        if (!reportElement) return;

        addToast('Gerando PDF... Por favor, aguarde.', 'info');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfMargin = 15;
        const contentWidth = pdfWidth - (pdfMargin * 2);
        let yPos = pdfMargin;

        pdf.setFontSize(22);
        pdf.setTextColor('#0A2463');
        pdf.text("Relatório de Gestão - MyCESE", pdfMargin, yPos);
        yPos += 10;
        pdf.setFontSize(10);
        pdf.setTextColor('#6b7280');
        pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pdfMargin, yPos);
        yPos += 15;
        
        const elementsToPrint = Array.from(reportElement.querySelectorAll('.report-card')) as HTMLElement[];

        for (const element of elementsToPrint) {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * contentWidth) / canvas.width;

            if (yPos + imgHeight > pdf.internal.pageSize.getHeight() - pdfMargin) {
                pdf.addPage();
                yPos = pdfMargin;
            }

            pdf.addImage(imgData, 'PNG', pdfMargin, yPos, contentWidth, imgHeight);
            yPos += imgHeight + 10;
        }

        pdf.save("relatorio_mycese.pdf");
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-mycese-text-dark">Relatórios Avançados</h1>
                <button onClick={handleExportPDF} className="bg-mycese-orange text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition">
                    <i className="fas fa-file-pdf mr-2"></i> Exportar para PDF
                </button>
            </div>
            
            <div ref={reportRef} className="space-y-8">
                {/* Financial Summary Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 report-card">
                    <StatCard icon="fa-sack-dollar" label="Total Arrecadado (Geral)" value={`MZN ${financialSummary.totalCollected.toFixed(2)}`} color="bg-green-500" />
                    <StatCard icon="fa-calendar-day" label="Projeção de Receita Mensal" value={`MZN ${financialSummary.projectedMonthly.toFixed(2)}`} color="bg-blue-500" />
                    <StatCard icon="fa-calendar-alt" label="Projeção de Receita Anual" value={`MZN ${financialSummary.projectedAnnual.toFixed(2)}`} color="bg-mycese-blue" />
                </div>

                {/* Chart Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card title="Distribuição de Membros por Faculdade" className="report-card">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={facultyDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={40} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="value" name="Nº de Membros" fill="#0A2463" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    <Card title="Evolução de Novos Membros (Cumulativo)" className="report-card">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={membersEvolution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="members" name="Total de Membros" stroke="#0A2463" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>
                </div>
                
                <Card title="Receita Mensal vs. Projeção (Últimos 6 meses)" className="report-card">
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={monthlyRevenue}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `MZN ${value.toFixed(2)}`} />
                            <Legend />
                            <Bar dataKey="revenue" name="Receita Realizada" fill="#4ade80" />
                            <Line type="monotone" dataKey="projection" name="Projeção de Receita" stroke="#FF6B35" strokeWidth={2} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </Card>

                {/* Faculty Comparison Table */}
                <Card title="Análise Comparativa por Faculdade" className="report-card">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left font-semibold p-3">Faculdade</th>
                                    <th className="text-center font-semibold p-3">Nº de Membros</th>
                                    <th className="text-center font-semibold p-3">Taxa de Pagamento (%)</th>
                                    <th className="text-right font-semibold p-3">Total Arrecadado (MZN)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {facultyComparison.map(faculty => (
                                    <tr key={faculty.name} className="border-t">
                                        <td className="p-3 font-medium">{faculty.name}</td>
                                        <td className="p-3 text-center">{faculty.members}</td>
                                        <td className="p-3 text-center">{faculty.paymentRate.toFixed(1)}%</td>
                                        <td className="p-3 text-right font-mono">{faculty.totalCollected.toFixed(2)}</td>
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

export default ReportsPage;