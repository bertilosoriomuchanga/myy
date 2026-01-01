
import { UserRole, Faculty } from './types';

export const APP_NAME = "MyCESE";
export const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export const ROLE_NAMES: { [key in UserRole]: string } = {
  [UserRole.ADMIN]: 'ADMIN (Administrador)',
  [UserRole.CFO]: 'Diretor Financeiro (CFO)',
  [UserRole.MEMBER]: 'Membro Comum',
};

export const FACULTY_NAMES: { [key in Faculty]: string } = {
  [Faculty.FEN]: 'FEN',
  [Faculty.FCT]: 'FCT',
  [Faculty.ESRI]: 'ESRI',
  [Faculty.ESG]: 'ESG',
  [Faculty.ENAP]: 'ENAP',
};

export const MONTHLY_QUOTA: { [key in UserRole]?: number } = {
  [UserRole.MEMBER]: 10,
  [UserRole.CFO]: 35,
  [UserRole.ADMIN]: 50,
};
