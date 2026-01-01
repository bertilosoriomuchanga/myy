
import { Dispatch, SetStateAction } from 'react';
import { User, Event, Payment, Log, UserRole, UserStatus, Faculty, PaymentStatus } from '../types';
import { generateMyCESENumber, generateId } from '../utils/helpers';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { MONTHLY_QUOTA } from '../constants';

interface SeedProps {
    setUsers: Dispatch<SetStateAction<User[]>>;
    setEvents: Dispatch<SetStateAction<Event[]>>;
    setPayments: Dispatch<SetStateAction<Payment[]>>;
    setLogs: Dispatch<SetStateAction<Log[]>>;
    hashPassword: (password: string) => Promise<string>;
}

export const seedData = async ({ setUsers, setEvents, setPayments, setLogs, hashPassword }: SeedProps) => {
    const users: User[] = [];
    const payments: Payment[] = [];

    // 1. Create Admin User (ADMIN)
    const adminPasswordHash = await hashPassword('Admin@123');
    // Fix: `generateMyCESENumber` no longer takes arguments or returns a sequence.
    const adminMyceseNumber = generateMyCESENumber();
    const adminUser: User = {
        id: generateId(),
        myceseNumber: adminMyceseNumber,
        name: 'Bertil Osório Muchanga',
        email: 'bertilosoriomuchanga@gmail.com',
        passwordHash: adminPasswordHash,
        phone: faker.phone.number(),
        faculty: Faculty.FEN,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        mustChangePassword: true,
        passwordVersion: 1,
    };
    users.push(adminUser);

    // 2. Create CFO User
    const cfoPasswordHash = await hashPassword('password123');
    // Fix: `generateMyCESENumber` no longer takes arguments or returns a sequence.
    const cfoMyceseNumber = generateMyCESENumber();
    const cfoUser: User = {
        id: generateId(),
        myceseNumber: cfoMyceseNumber,
        name: 'Ana Financeira',
        email: 'cfo@mycese.com',
        passwordHash: cfoPasswordHash,
        phone: faker.phone.number(),
        faculty: Faculty.FEN,
        role: UserRole.CFO,
        status: UserStatus.ACTIVE,
        createdAt: faker.date.past().toISOString(),
        passwordVersion: 1,
    };
    users.push(cfoUser);


    // 3. Create 15 Member Users
    const faculties = Object.values(Faculty);
    for (let i = 0; i < 15; i++) {
        const memberPasswordHash = await hashPassword('password123');
        // Fix: `generateMyCESENumber` no longer takes arguments or returns a sequence.
        const memberMyceseNumber = generateMyCESENumber();
        const memberUser: User = {
            id: generateId(),
            myceseNumber: memberMyceseNumber,
            name: faker.person.fullName(),
            email: faker.internet.email().toLowerCase(),
            passwordHash: memberPasswordHash,
            phone: faker.phone.number(),
            faculty: faker.helpers.arrayElement(faculties),
            role: UserRole.MEMBER,
            status: faker.helpers.arrayElement([UserStatus.ACTIVE, UserStatus.INACTIVE]),
            createdAt: faker.date.past().toISOString(),
            passwordVersion: 1,
        };
        users.push(memberUser);
    }
    
    // 4. Create Financial History
    const currentYear = 2026;
    const currentMonth = new Date().getMonth() + 1;

    users.forEach(user => {
        const quota = MONTHLY_QUOTA[user.role] || 0;
        if (quota === 0) return;

        for (let month = 1; month <= currentMonth; month++) {
            const shouldPay = Math.random() > 0.1; // 90% chance of having a payment record
            if (shouldPay) {
                const outcome = Math.random(); // Determine payment status
                let status: PaymentStatus;
                let proof: Payment['proof'] = undefined;

                if (outcome <= 0.7) { // 70% paid
                    status = PaymentStatus.PAID;
                } else if (outcome <= 0.8) { // 10% awaiting confirmation
                    status = PaymentStatus.AWAITING_CONFIRMATION;
                    proof = { fileName: 'comprovativo_demo.pdf', submittedAt: new Date().toISOString() };
                } else { // 20% not paid
                    status = (month < currentMonth) ? PaymentStatus.OVERDUE : PaymentStatus.PENDING;
                }

                payments.push({
                    id: generateId(),
                    userId: user.id,
                    month,
                    year: currentYear,
                    amount: quota,
                    status,
                    paidAt: status === PaymentStatus.PAID ? faker.date.past().toISOString() : undefined,
                    proof,
                });
            }
        }
    });

    // 5. Create Events
    const events: Event[] = [
        {
            id: generateId(),
            title: 'Debate: "Desigualdade Social em Moçambique"',
            description: 'Debate inaugural do CESE, abordando os desafios e perspectivas da desigualdade social no país.',
            date: faker.date.recent().toISOString(),
            location: 'Auditório Principal - UJC',
            participants: faker.helpers.arrayElements(users.map(u => u.id), 10)
        },
        {
            id: generateId(),
            title: 'Workshop: "Oratória e Argumentação"',
            description: 'Workshop prático para desenvolver habilidades de comunicação, oratória e argumentação.',
            date: faker.date.soon().toISOString(),
            location: 'Sala B201',
            participants: [],
        },
        {
            id: generateId(),
            title: 'Simulação de Conferência Econômica (ONU)',
            description: 'Evento de grande impacto para praticar diplomacia econômica e negociação.',
            date: faker.date.future().toISOString(),
            location: 'Online via Zoom',
            participants: [],
        }
    ];

    // 6. Create initial logs
    const logs: Log[] = [
        {
            id: generateId(),
            timestamp: new Date().toISOString(),
            user: 'System',
            action: 'Sistema iniciado e dados de demonstração carregados.'
        }
    ];

    setUsers(users);
    setEvents(events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setPayments(payments);
    setLogs(logs);
};