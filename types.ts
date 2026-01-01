
export enum UserRole {
  ADMIN = 'ADMIN',
  CFO = 'CFO',
  MEMBER = 'MEMBER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum Faculty {
  FEN = 'Faculdade de Economia e Negócios (FEN)',
  FCT = 'Faculdade de Ciência e Tecnologia (FCT)',
  ESRI = 'Escola Superior de Relações Internacionais (ESRI)',
  ESG = 'Escola Superior de Governança (ESG)',
  ENAP = 'Escola Nacional de Administração Pública (ENAP)',
}

export interface User {
  id: string;
  myceseNumber: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  faculty: Faculty;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  mustChangePassword?: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
  passwordVersion?: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  participants: string[]; // array of user ids
}

export enum PaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  OVERDUE = 'OVERDUE',
  AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION',
}

export interface Payment {
  id: string;
  userId: string;
  month: number; // 1-12
  year: number;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
  method?: 'M-Pesa (Simulado)' | 'Comprovativo Manual';
  proof?: {
    fileName: string;
    submittedAt: string;
    fileContent?: string;
    fileType?: string;
  };
}

export interface Log {
    id: string;
    timestamp: string;
    user: string; // User name or 'System'
    action: string;
    details?: {
        status?: 'SUCCESS' | 'FAILURE';
        emailAttempted?: string;
        userAgent?: string;
    }
}