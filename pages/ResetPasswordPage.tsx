
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { APP_NAME } from '../constants';

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { resetUserPassword, validateResetToken } = useData();
    const { hashPassword } = useAuth();
    
    const [token, setToken] = useState<string | null>(null);
    const [myceseNumber, setMyceseNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isTokenValidating, setIsTokenValidating] = useState(true);

    useEffect(() => {
        const resetToken = searchParams.get('token');
        if (!resetToken) {
            setError('Token de redefinição inválido ou ausente.');
            addToast('Token de redefinição não encontrado.', 'error');
            setIsTokenValidating(false);
            return;
        }

        const checkToken = async () => {
            const isValid = await validateResetToken(resetToken);
            if (!isValid) {
                setError('O link de redefinição é inválido ou expirou. Por favor, solicite um novo.');
                addToast('Token inválido ou expirado.', 'error');
            }
            setToken(resetToken);
            setIsTokenValidating(false);
        };

        checkToken();
    }, [searchParams, addToast, validateResetToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!token) return;

        if (password !== confirmPassword) {
            addToast('As senhas não coincidem.', 'error');
            return;
        }
        if (!passwordRegex.test(password)) {
            addToast('A nova senha deve ter no mínimo 8 caracteres, incluindo letras e números.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const newPasswordHash = await hashPassword(password);
            const success = await resetUserPassword(token, myceseNumber, newPasswordHash);
            
            if (success) {
                addToast('Senha redefinida com sucesso! Você já pode fazer login.', 'success');
                navigate('/login');
            } else {
                setError('Falha ao redefinir a senha. Verifique se o link não expirou e se os seus dados estão corretos.');
                addToast('Falha ao redefinir a senha.', 'error');
            }
        } catch (err) {
            setError('Ocorreu um erro inesperado.');
            addToast('Ocorreu um erro.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isTokenValidating) {
        return (
            <div className="min-h-screen bg-mycese-bg flex items-center justify-center p-4">
                <i className="fas fa-spinner fa-spin text-mycese-blue text-4xl"></i>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-mycese-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white shadow-2xl rounded-2xl p-8 space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-mycese-blue">Redefinir Senha</h1>
                        <p className="text-mycese-text-light">Para sua segurança, confirme sua identidade e crie uma nova senha.</p>
                    </div>

                    {error ? (
                        <div className="p-4 text-center bg-red-100 text-red-800 rounded-lg">
                            <p>{error}</p>
                            <Link to="/forgot-password" className="font-semibold text-mycese-blue hover:underline mt-2 block">
                                Solicitar um novo link
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Seu Número MyCESE</label>
                                <input
                                    type="text"
                                    placeholder="Ex: MYC-2024-0001"
                                    value={myceseNumber}
                                    onChange={(e) => setMyceseNumber(e.target.value)}
                                    required
                                    className="w-full p-3 bg-gray-100 rounded-lg border-2 border-transparent focus:border-mycese-orange focus:bg-white outline-none transition"
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full p-3 pr-10 bg-gray-100 rounded-lg border-2 border-transparent focus:border-mycese-orange focus:bg-white outline-none transition"
                                />
                                <button type="button" onClick={() => setShowPasswords(p => ({...p, new: !p.new}))} className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700">
                                    <i className={`fas ${showPasswords.new ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full p-3 pr-10 bg-gray-100 rounded-lg border-2 border-transparent focus:border-mycese-orange focus:bg-white outline-none transition"
                                />
                                <button type="button" onClick={() => setShowPasswords(p => ({...p, confirm: !p.confirm}))} className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700">
                                    <i className={`fas ${showPasswords.confirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-mycese-blue text-white font-bold py-3 rounded-lg hover:bg-mycese-blue-dark transition disabled:bg-gray-400 flex items-center justify-center"
                            >
                                {isLoading && <i className="fas fa-spinner fa-spin mr-2"></i>}
                                {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;