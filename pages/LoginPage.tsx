
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { APP_NAME } from '../constants';
import useRateLimiter from '../hooks/useRateLimiter';
import { useData } from '../hooks/useData';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const { addLog } = useData();
  const navigate = useNavigate();
  const { isBlocked, recordAttempt } = useRateLimiter('login', 5, 60 * 1000); // 5 attempts in 1 minute

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isBlocked()) {
        addToast('Muitas tentativas de login. Tente novamente mais tarde.', 'error');
        setIsLoading(false);
        addLog(
            'Tentativa de Login Bloqueada (Rate Limit)',
            'System',
            {
                status: 'FAILURE',
                emailAttempted: email,
                userAgent: navigator.userAgent,
            }
        );
        return;
    }

    const success = await login(email, password);
    
    addLog(
        'Tentativa de Login',
        success ? email : 'System',
        {
            status: success ? 'SUCCESS' : 'FAILURE',
            emailAttempted: email,
            userAgent: navigator.userAgent
        }
    );
    
    if (!success) {
      recordAttempt(); // Only record failed attempts
      addToast('E-mail ou senha inválidos.', 'error');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mycese-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-2xl rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <div className="inline-block bg-mycese-blue text-white p-4 rounded-full mb-4">
                <i className="fas fa-university text-4xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-mycese-blue">{APP_NAME}</h1>
            <p className="text-mycese-text-light">Sistema de Gestão de Associação Acadêmica</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
                <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-gray-100 border-2 border-transparent focus:border-mycese-orange focus:bg-white rounded-lg outline-none transition"
                />
            </div>
            <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-3 bg-gray-100 border-2 border-transparent focus:border-mycese-orange focus:bg-white rounded-lg outline-none transition"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
            </div>
            <div className="text-right">
              <Link to="/forgot-password"
                 className="text-sm text-mycese-blue hover:underline">Esqueceu a senha?</Link>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-mycese-blue text-white font-bold py-3 rounded-lg hover:bg-mycese-blue-dark transition-colors disabled:bg-gray-400 flex items-center justify-center"
            >
              {isLoading && <i className="fas fa-spinner fa-spin mr-2"></i>}
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <div className="text-center text-mycese-text-light">
            Não tem uma conta?{' '}
            <Link to="/register" className="font-semibold text-mycese-orange hover:underline">
              Cadastre-se
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;