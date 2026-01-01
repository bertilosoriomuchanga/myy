
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { APP_NAME } from '../constants';

const ChangePasswordPage: React.FC = () => {
    const { user, hashPassword, updateCurrentUser } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

        if (!user) {
            addToast('Nenhum usuário logado.', 'error');
            navigate('/login');
            return;
        }

        if (newPassword !== confirmPassword) {
            addToast('As senhas não coincidem.', 'error');
            return;
        }

        if (!passwordRegex.test(newPassword)) {
            addToast('A nova senha deve ter no mínimo 8 caracteres, incluindo letras e números.', 'error');
            return;
        }
        
        setIsLoading(true);
        try {
            const newPasswordHash = await hashPassword(newPassword);
            updateCurrentUser({ passwordHash: newPasswordHash, mustChangePassword: false });
            addToast('Senha alterada com sucesso!', 'success');
            navigate('/dashboard');
        } catch (error) {
            addToast('Erro ao alterar a senha.', 'error');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-mycese-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white shadow-2xl rounded-2xl p-8 space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-mycese-blue">Alterar Senha</h1>
                        <p className="text-mycese-text-light">Por segurança, você deve criar uma nova senha para acessar o {APP_NAME}.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                placeholder="Nova Senha"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full p-3 pr-10 bg-gray-100 rounded-lg border-2 border-transparent focus:border-mycese-orange focus:bg-white outline-none transition"
                            />
                            <button type="button" onClick={() => setShowPasswords(p => ({...p, new: !p.new}))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                <i className={`fas ${showPasswords.new ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                placeholder="Confirmar Nova Senha"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full p-3 pr-10 bg-gray-100 rounded-lg border-2 border-transparent focus:border-mycese-orange focus:bg-white outline-none transition"
                            />
                             <button type="button" onClick={() => setShowPasswords(p => ({...p, confirm: !p.confirm}))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                <i className={`fas ${showPasswords.confirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-mycese-blue text-white font-bold py-3 rounded-lg hover:bg-mycese-blue-dark transition disabled:bg-gray-400 flex items-center justify-center"
                        >
                            {isLoading && <i className="fas fa-spinner fa-spin mr-2"></i>}
                            Definir Nova Senha
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordPage;