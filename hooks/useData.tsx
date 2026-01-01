
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Event, Payment, Log, UserRole, UserStatus, Faculty, PaymentStatus } from '../types';
import { generateMyCESENumber, generateId } from '../utils/helpers';
import { seedData } from '../services/seed';
import { useAuth } from './useAuth';
import { MONTHLY_QUOTA, FACULTY_NAMES } from '../constants';

interface DataContextType {
  users: User[];
  events: Event[];
  payments: Payment[];
  logs: Log[];
  loading: boolean;
  addUser: (userData: Omit<User, 'id' | 'myceseNumber' | 'createdAt' | 'passwordHash'>, password: string) => Promise<User>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  addEvent: (eventData: Omit<Event, 'id' | 'participants'>) => Promise<void>;
  updateEvent: (eventId: string, eventData: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  registerForEvent: (eventId: string, userId: string) => Promise<void>;
  unregisterFromEvent: (eventId: string, userId: string) => Promise<void>;
  recordPayment: (paymentData: Omit<Payment, 'id'|'status'|'paidAt'|'proof'|'method'>) => Promise<void>;
  submitPaymentProof: (userId: string, month: number, year: number, amount: number, method: Payment['method'], proofData?: { fileName?: string; fileContent?: string; fileType?: string; }) => Promise<void>;
  updatePaymentStatus: (paymentId: string, newStatus: PaymentStatus) => Promise<void>;
  deletePayment: (paymentId: string) => Promise<void>;
  generatePasswordResetToken: (email: string) => Promise<string | null>;
  resetUserPassword: (token: string, myceseNumber: string, newPasswordHash: string) => Promise<boolean>;
  validateResetToken: (token: string) => Promise<boolean>;
  addLog: (action: string, user?: string, details?: Log['details']) => void;
  getDashboardStats: () => {
    activeMembers: number;
    newMembersThisMonth: number;
    eventsHeld: number;
    paymentRate: number;
  };
  getFacultyDistribution: () => { name: string; value: number }[];
  getPaymentStatusData: () => { name: string; value: number }[];
  getMembersEvolution: () => { name: string; members: number }[];
  getUserPayments: (userId: string) => Payment[];
  getFinancialSummary: () => { totalCollected: number; projectedMonthly: number; projectedAnnual: number };
  getFacultyComparisonStats: () => { name: string; members: number; paymentRate: number; totalCollected: number }[];
  getMonthlyDelinquency: () => { month: string; paid: number; overdue: number }[];
  getMonthlyRevenueVsProjection: () => { month: string; revenue: number; projection: number }[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [users, setUsers] = useLocalStorage<User[]>('mycese_users', []);
    const [events, setEvents] = useLocalStorage<Event[]>('mycese_events', []);
    const [payments, setPayments] = useLocalStorage<Payment[]>('mycese_payments', []);
    const [logs, setLogs] = useLocalStorage<Log[]>('mycese_logs', []);
    const [loading, setLoading] = useState(true);
    const { hashPassword } = useAuth();
    
    useEffect(() => {
        const loadData = async () => {
            try {
                const isSeeded = localStorage.getItem('mycese_seeded');
                if (!isSeeded && hashPassword) {
                    await seedData({ setUsers, setEvents, setPayments, setLogs, hashPassword });
                    localStorage.setItem('mycese_seeded', 'true');
                }
            } catch (error) {
                console.error("Failed to seed data:", error);
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, [hashPassword, setUsers, setEvents, setPayments, setLogs]);

    const addLog = useCallback((action: string, user: string = 'System', details?: Log['details']) => {
        const newLog: Log = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            user,
            action,
            details,
        };
        setLogs(prev => [newLog, ...prev]);
    }, [setLogs]);

    const addUser = useCallback(async (userData: Omit<User, 'id' | 'myceseNumber' | 'createdAt' | 'passwordHash'>, password: string): Promise<User> => {
        const myceseNumber = generateMyCESENumber();
        const passwordHash = await hashPassword(password);
        const newUser: User = {
            ...userData,
            id: generateId(),
            myceseNumber,
            createdAt: new Date().toISOString(),
            passwordHash,
            passwordVersion: 1,
        };
        setUsers(prev => [...prev, newUser]);
        addLog(`Novo usuário criado: ${newUser.name} (${newUser.email})`);
        return newUser;
    }, [hashPassword, setUsers, addLog]);
    
    const updateUser = useCallback(async (userId: string, userData: Partial<User>) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...userData } : u));
        addLog(`Dados do usuário ${userId} atualizados.`);
    }, [setUsers, addLog]);

    const generatePasswordResetToken = useCallback(async (email: string): Promise<string | null> => {
        const lowerCaseEmail = email.toLowerCase();
        let userFound = false;
        let plaintextToken: string | null = null;
        
        const userIndex = users.findIndex(u => u.email.toLowerCase() === lowerCaseEmail);

        if (userIndex !== -1) {
            userFound = true;
            plaintextToken = crypto.randomUUID();
            const tokenHash = await hashPassword(plaintextToken);
            const expires = new Date(Date.now() + 900000).toISOString(); // 15 minutes expiry

            setUsers(prev => {
                const updatedUsers = [...prev];
                updatedUsers[userIndex] = {
                    ...updatedUsers[userIndex],
                    resetPasswordToken: tokenHash,
                    resetPasswordExpires: expires
                };
                return updatedUsers;
            });
        }
        
        addLog(`Tentativa de recuperação de senha para o e-mail: ${lowerCaseEmail}.`);

        return plaintextToken;
    }, [users, setUsers, addLog, hashPassword]);


    const resetUserPassword = useCallback(async (token: string, myceseNumber: string, newPasswordHash: string): Promise<boolean> => {
        const tokenHash = await hashPassword(token);

        const userIndex = users.findIndex(u =>
            u.resetPasswordToken === tokenHash &&
            u.resetPasswordExpires &&
            new Date(u.resetPasswordExpires) > new Date()
        );

        if (userIndex === -1) {
            addLog(
                'Tentativa de redefinição de senha falhou (Token inválido/expirado)',
                'System',
                {
                    status: 'FAILURE',
                    userAgent: navigator.userAgent,
                }
            );
            return false;
        }

        const userToUpdate = users[userIndex];

        if (userToUpdate.myceseNumber.toLowerCase() !== myceseNumber.toLowerCase()) {
            addLog(
                'Tentativa de redefinição de senha falhou (Nº MyCESE incorreto)',
                'System',
                {
                    status: 'FAILURE',
                    emailAttempted: userToUpdate.email,
                    userAgent: navigator.userAgent,
                }
            );
            return false;
        }

        const updatedUser = {
            ...userToUpdate,
            passwordHash: newPasswordHash,
            resetPasswordToken: undefined,
            resetPasswordExpires: undefined,
            mustChangePassword: false,
            passwordVersion: (userToUpdate.passwordVersion || 1) + 1,
        };

        setUsers(prevUsers => {
            const newUsers = [...prevUsers];
            newUsers[userIndex] = updatedUser;
            return newUsers;
        });

        addLog(
            `Senha redefinida com sucesso`,
            userToUpdate.email,
            { status: 'SUCCESS', userAgent: navigator.userAgent }
        );
        return true;
    }, [users, setUsers, addLog, hashPassword]);
    
    const validateResetToken = useCallback(async (token: string): Promise<boolean> => {
        if (!token) return false;
        const tokenHash = await hashPassword(token);
        const user = users.find(u => u.resetPasswordToken === tokenHash && u.resetPasswordExpires && new Date(u.resetPasswordExpires) > new Date());
        return !!user;
    }, [users, hashPassword]);

    const addEvent = useCallback(async (eventData: Omit<Event, 'id'| 'participants'>) => {
        const newEvent: Event = {
            ...eventData,
            id: generateId(),
            participants: [],
        };
        setEvents(prev => [newEvent, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        addLog(`Novo evento criado: ${newEvent.title}`);
    }, [setEvents, addLog]);
    
    const updateEvent = useCallback(async (eventId: string, eventData: Partial<Event>) => {
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...eventData } : e));
        addLog(`Evento ${eventId} atualizado.`);
    }, [setEvents, addLog]);

    const deleteEvent = useCallback(async (eventId: string) => {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        addLog(`Evento ${eventId} removido.`);
    }, [setEvents, addLog]);

    const registerForEvent = useCallback(async (eventId: string, userId: string) => {
        setEvents(prev => prev.map(e => {
            if (e.id === eventId && !e.participants.includes(userId)) {
                return { ...e, participants: [...e.participants, userId] };
            }
            return e;
        }));
        addLog(`Usuário ${userId} inscrito no evento ${eventId}`);
    }, [setEvents, addLog]);

    const unregisterFromEvent = useCallback(async (eventId: string, userId: string) => {
        setEvents(prev => prev.map(e => {
            if (e.id === eventId) {
                return { ...e, participants: e.participants.filter(pId => pId !== userId) };
            }
            return e;
        }));
        addLog(`Usuário ${userId} cancelou inscrição no evento ${eventId}`);
    }, [setEvents, addLog]);
    
    const recordPayment = useCallback(async (paymentData: Omit<Payment, 'id'|'status'|'paidAt'|'proof'|'method'>) => {
        const newPayment: Payment = {
            ...paymentData,
            id: generateId(),
            status: PaymentStatus.PAID,
            paidAt: new Date().toISOString(),
            method: 'Comprovativo Manual'
        };
        setPayments(prev => [...prev, newPayment]);
        addLog(`Pagamento registrado (manual) para ${paymentData.userId}`);
    }, [setPayments, addLog]);

    const submitPaymentProof = useCallback(async (userId: string, month: number, year: number, amount: number, method: Payment['method'], proofData?: { fileName?: string; fileContent?: string; fileType?: string; }) => {
        setPayments(prev => {
            const existingIndex = prev.findIndex(p => p.userId === userId && p.month === month && p.year === year);
            const proof = proofData?.fileName ? { 
                fileName: proofData.fileName, 
                submittedAt: new Date().toISOString(),
                fileContent: proofData.fileContent,
                fileType: proofData.fileType,
            } : undefined;
            
            const newPaymentData: Partial<Payment> = {
                status: PaymentStatus.AWAITING_CONFIRMATION,
                method,
                proof,
            };

            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = {...updated[existingIndex], ...newPaymentData };
                return updated;
            } else {
                const newPayment: Payment = { id: generateId(), userId, month, year, amount, status: PaymentStatus.AWAITING_CONFIRMATION, method, proof };
                return [...prev, newPayment];
            }
        });
        addLog(`Pagamento submetido por ${userId} para ${month}/${year}`);
    }, [setPayments, addLog]);

    const updatePaymentStatus = useCallback(async (paymentId: string, newStatus: PaymentStatus): Promise<void> => {
        setPayments(prev => prev.map(p => {
            if (p.id !== paymentId) return p;

            let updatedPayment = { ...p, status: newStatus };

            switch (newStatus) {
                case PaymentStatus.PAID:
                    updatedPayment.paidAt = new Date().toISOString();
                    break;
                case PaymentStatus.PENDING:
                    const originalStatus = (p.month < (new Date().getMonth() + 1) && p.year <= new Date().getFullYear()) ? PaymentStatus.OVERDUE : PaymentStatus.PENDING;
                    updatedPayment = { 
                        ...updatedPayment, 
                        status: originalStatus, 
                        proof: undefined, 
                        method: undefined, 
                        paidAt: undefined 
                    };
                    break;
                case PaymentStatus.AWAITING_CONFIRMATION:
                    updatedPayment.paidAt = undefined;
                    break;
            }
            return updatedPayment;
        }));
        addLog(`Status do pagamento ${paymentId} atualizado para ${newStatus}`);
    }, [setPayments, addLog]);
    
    const deletePayment = useCallback(async (paymentId: string) => {
        setPayments(prev => prev.filter(p => p.id !== paymentId));
        addLog(`Pagamento ${paymentId} removido.`);
    }, [setPayments, addLog]);

    const getDashboardStats = useCallback(() => {
        const activeMembers = users.filter(u => u.status === UserStatus.ACTIVE).length;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newMembersThisMonth = users.filter(u => new Date(u.createdAt) >= startOfMonth).length;
        const eventsHeld = events.filter(e => new Date(e.date) <= now).length;
        
        const relevantPayments = payments.filter(p => p.status !== PaymentStatus.AWAITING_CONFIRMATION);
        const paidPayments = relevantPayments.filter(p => p.status === PaymentStatus.PAID).length;
        const paymentRate = relevantPayments.length > 0 ? (paidPayments / relevantPayments.length) * 100 : 0;

        return { activeMembers, newMembersThisMonth, eventsHeld, paymentRate: parseFloat(paymentRate.toFixed(1)) };
    }, [users, events, payments]);

    const getFacultyDistribution = useCallback(() => {
        const distribution = users.reduce((acc, user) => {
            acc[user.faculty] = (acc[user.faculty] || 0) + 1;
            return acc;
        }, {} as Record<Faculty, number>);

        return Object.entries(distribution).map(([name, value]) => ({ name: FACULTY_NAMES[name as Faculty] || name, value }));
    }, [users]);
    
    const getPaymentStatusData = useCallback(() => {
        const statusCounts = payments.reduce((acc, payment) => {
            acc[payment.status] = (acc[payment.status] || 0) + 1;
            return acc;
        }, {} as Record<PaymentStatus, number>);
        
        return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    }, [payments]);

    const getMembersEvolution = useCallback(() => {
      const evolution = users
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .reduce((acc, user) => {
          const monthYear = new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
          if (!acc[monthYear]) {
            acc[monthYear] = 0;
          }
          acc[monthYear]++;
          return acc;
        }, {} as Record<string, number>);

        let cumulative = 0;
        return Object.entries(evolution).map(([name, value]) => {
          cumulative += value;
          return { name, members: cumulative };
        });
    }, [users]);

    const getUserPayments = useCallback((userId: string) => {
        return payments.filter(p => p.userId === userId).sort((a,b) => b.year - a.year || b.month - a.month);
    }, [payments]);
    
    const getFinancialSummary = useCallback(() => {
        const totalCollected = payments
            .filter(p => p.status === PaymentStatus.PAID)
            .reduce((sum, p) => sum + p.amount, 0);

        const activeMembers = users.filter(u => u.status === UserStatus.ACTIVE);
        const projectedMonthly = activeMembers.reduce((sum, u) => {
            return sum + (MONTHLY_QUOTA[u.role] || 0);
        }, 0);

        return {
            totalCollected,
            projectedMonthly,
            projectedAnnual: projectedMonthly * 12,
        };
    }, [users, payments]);
    
    const getFacultyComparisonStats = useCallback(() => {
        const facultyStats: Record<string, { totalMembers: number; paidQuotas: number; totalQuotas: number; totalCollected: number }> = {};

        for (const faculty of Object.values(Faculty)) {
            facultyStats[faculty] = { totalMembers: 0, paidQuotas: 0, totalQuotas: 0, totalCollected: 0 };
        }

        for (const user of users) {
            if (facultyStats[user.faculty]) {
                facultyStats[user.faculty].totalMembers++;
            }
        }

        for (const payment of payments) {
            const user = users.find(u => u.id === payment.userId);
            if (user && facultyStats[user.faculty]) {
                facultyStats[user.faculty].totalQuotas++;
                if (payment.status === PaymentStatus.PAID) {
                    facultyStats[user.faculty].paidQuotas++;
                    facultyStats[user.faculty].totalCollected += payment.amount;
                }
            }
        }

        return Object.entries(facultyStats).map(([faculty, stats]) => ({
            name: FACULTY_NAMES[faculty as Faculty] || faculty,
            members: stats.totalMembers,
            paymentRate: stats.totalQuotas > 0 ? parseFloat(((stats.paidQuotas / stats.totalQuotas) * 100).toFixed(1)) : 0,
            totalCollected: stats.totalCollected,
        }));
    }, [users, payments]);
    
    const getMonthlyDelinquency = useCallback(() => {
        const data: { [key: string]: { month: string; paid: number; overdue: number } } = {};
        const demoNow = new Date(2026, 5, 15); // June 15, 2026 for consistent demo data

        for (let i = 5; i >= 0; i--) {
            const date = new Date(demoNow.getFullYear(), demoNow.getMonth() - i, 1);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const monthKey = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('. de','');
            
            data[monthKey] = { month: monthKey, paid: 0, overdue: 0 };

            const activeUsersThisMonth = users.filter(u => new Date(u.createdAt) <= date && u.status === UserStatus.ACTIVE);
            
            activeUsersThisMonth.forEach(user => {
                const payment = payments.find(p => p.userId === user.id && p.year === year && p.month === month);
                if (payment?.status === PaymentStatus.PAID) {
                    data[monthKey].paid++;
                } else {
                     if (new Date(year, month, 1) < new Date(demoNow.getFullYear(), demoNow.getMonth(), 1)) {
                        data[monthKey].overdue++;
                    }
                }
            });
        }
        return Object.values(data);
    }, [users, payments]);

    const getMonthlyRevenueVsProjection = useCallback(() => {
        const data: { [key: string]: { month: string; revenue: number; projection: number } } = {};
        const demoNow = new Date(2026, 5, 15); // June 15, 2026

        for (let i = 5; i >= 0; i--) {
            const date = new Date(demoNow.getFullYear(), demoNow.getMonth() - i, 1);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const monthKey = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('. de','');
            
            data[monthKey] = { month: monthKey, revenue: 0, projection: 0 };
            
            const activeUsersThisMonth = users.filter(u => new Date(u.createdAt) <= date && u.status === UserStatus.ACTIVE);
            data[monthKey].projection = activeUsersThisMonth.reduce((sum, user) => {
                return sum + (MONTHLY_QUOTA[user.role] || 0);
            }, 0);

            data[monthKey].revenue = payments
                .filter(p => p.year === year && p.month === month && p.status === PaymentStatus.PAID)
                .reduce((sum, p) => sum + p.amount, 0);
        }
        
        return Object.values(data);
    }, [users, payments]);

    const value = {
      users, events, payments, logs, loading,
      addUser, updateUser, addEvent, updateEvent, deleteEvent, registerForEvent, unregisterFromEvent, 
      recordPayment, submitPaymentProof, updatePaymentStatus, deletePayment,
      generatePasswordResetToken, resetUserPassword, validateResetToken,
      addLog,
      getDashboardStats, getFacultyDistribution, getPaymentStatusData, getMembersEvolution, getUserPayments,
      getFinancialSummary, getFacultyComparisonStats, getMonthlyDelinquency, getMonthlyRevenueVsProjection,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
