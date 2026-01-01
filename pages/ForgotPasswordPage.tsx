
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { useData } from '../hooks/useData';
import { APP_NAME } from '../constants';
import useRateLimiter from '../hooks/useRateLimiter';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [resetLink, setResetLink] = useState<string | null>(null);
    const { addToast } = useToast();
    const { generatePasswordResetToken } = useData();
    const { isBlocked, recordAttempt } = useRateLimiter('forgot_password', 3, 10 * 60 * 1000); // 3 attempts in 10 minutes

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isBlocked()) {
            addToast('Muitas tentativas de recuperação. Por favor, tente novamente mais tarde.', 'error');
            return;
        }
        
        recordAttempt(); // Record every attempt to prevent email enumeration
        setIsLoading(true);
        const token = await generatePasswordResetToken(email);

        if (token) {
            // Em uma aplicação real, um e-mail é enviado. Aqui simulamos o link.
            const currentUrl = window.location.href.split('#')[0];
            const simulatedLink = `${currentUrl}#/reset-password?token=${token}`;
            setResetLink(simulatedLink);
        }
        
        addToast('Se existir uma conta associada a este email, um link de redefinição foi enviado.', 'info');
        setIsSubmitted(true);
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-mycese-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white shadow-2xl rounded-2xl p-8 space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-mycese-blue">Recuperar Senha</h1>
                        <p className="text-mycese-text-light">
                            {isSubmitted ? 'Verificação enviada!' : 'Insira seu e-mail para receber as instruções.'}
                        </p>
                    </div>
                    {isSubmitted ? (
                        <div className="text-mycese-text-light mt-4 p-4 bg-green-100 text-green-800 rounded-lg">
                            <i className="fas fa-check-circle mr-2"></i>
                            <p>Se uma conta com este e-mail existir, um link de recuperação foi enviado. Por favor, verifique sua caixa de entrada e spam.</p>
                            {resetLink && ( // Apenas para fins de demonstração
                                <div className="mt-2 text-left border-t pt-2 mt-2">
                                    <p className="font-semibold text-sm text-gray-700">Apenas para demonstração:</p>
                                    <p className="text-xs text-gray-600">O link abaixo seria enviado por e-mail. Ele expira em 15 minutos. Se não foi você que pediu, ignore esta mensagem.</p>
                                    <Link 
                                        to={`/reset-password?token=${resetLink.split('token=')[1]}`} 
                                        className="text-blue-600 text-sm break-all hover:underline mt-2 block"
                                    >
                                        {resetLink}
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <input
                                type="email"
                                placeholder="Seu e-mail de cadastro"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full p-3 bg-gray-100 rounded-lg border-2 border-transparent focus:border-mycese-orange focus:bg-white outline-none transition"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-mycese-orange text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition flex items-center justify-center"
                            >
                                {isLoading && <i className="fas fa-spinner fa-spin mr-2"></i>}
                                {isLoading ? 'Enviando...' : 'Enviar Instruções'}
                            </button>
                        </form>
                    )}
                    <div className="text-center text-mycese-text-light">
                        Lembrou a senha?{' '}
                        <Link to="/login" className="font-semibold text-mycese-blue hover:underline">
                            Voltar ao Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
