
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { INACTIVITY_TIMEOUT } from '../constants';
import { useToast } from './useToast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hashPassword: (password: string) => Promise<string>;
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
  updateCurrentUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { addToast } = useToast();

    const hashPassword = useCallback(async (password: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }, []);

    const verifyPassword = useCallback(async (password: string, hash: string): Promise<boolean> => {
        const passwordHash = await hashPassword(password);
        return passwordHash === hash;
    }, [hashPassword]);

    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        const users: User[] = JSON.parse(localStorage.getItem('mycese_users') || '[]');
        const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (foundUser && await verifyPassword(password, foundUser.passwordHash)) {
            sessionStorage.setItem('mycese_user', JSON.stringify(foundUser));
            setUser(foundUser);
            if (foundUser.mustChangePassword) {
                navigate('/change-password');
            } else {
                navigate('/dashboard');
            }
            return true;
        }
        return false;
    }, [navigate, verifyPassword]);

    const logout = useCallback(() => {
        setUser(null);
        sessionStorage.removeItem('mycese_user');
        navigate('/login');
    }, [navigate]);

    const updateCurrentUser = (userData: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...userData };
            setUser(updatedUser);
            sessionStorage.setItem('mycese_user', JSON.stringify(updatedUser));

            // Also update in the main users list in localStorage
            const users: User[] = JSON.parse(localStorage.getItem('mycese_users') || '[]');
            const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
            localStorage.setItem('mycese_users', JSON.stringify(updatedUsers));
        }
    };
    
    useEffect(() => {
        try {
            const storedUser = sessionStorage.getItem('mycese_user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse user from session storage", error);
            sessionStorage.removeItem('mycese_user');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        let inactivityTimer: number;

        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            if(user) {
                inactivityTimer = window.setTimeout(() => {
                    addToast('Você foi desconectado por inatividade.', 'info');
                    logout();
                }, INACTIVITY_TIMEOUT);
            }
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('scroll', resetTimer);
        window.addEventListener('click', resetTimer);

        resetTimer();

        return () => {
            clearTimeout(inactivityTimer);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('scroll', resetTimer);
            window.removeEventListener('click', resetTimer);
        };
    }, [user, logout, addToast]);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hashPassword, verifyPassword, updateCurrentUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
