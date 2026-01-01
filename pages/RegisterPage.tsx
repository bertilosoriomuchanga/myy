
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import { UserRole, UserStatus, Faculty, User } from '../types';
import { APP_NAME } from '../constants';
import useRateLimiter from '../hooks/useRateLimiter';
import { countries } from '../utils/countries';
import { formatMozambiquePhone } from '../utils/helpers';

const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+258');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [faculty, setFaculty] = useState<Faculty>(Faculty.FEN);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState({ pass: false, confirm: false });
    const [isLoading, setIsLoading] = useState(false);
    const [registeredUser, setRegisteredUser] = useState<User | null>(null);
    
    const { addUser, users } = useData();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const { isBlocked, recordAttempt } = useRateLimiter('register', 3, 5 * 60 * 1000);

    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (countryCode === '+258') {
            const formatted = formatMozambiquePhone(e.target.value);
            setPhoneNumber(formatted);
        } else {
            setPhoneNumber(e.target.value);
        }
    };

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCountryCode = e.target.value;
        setCountryCode(newCountryCode);
        // Clean up phone number when changing country code
        if (newCountryCode === '+258') {
            setPhoneNumber(formatMozambiquePhone(phoneNumber));
        } else {
            setPhoneNumber(phoneNumber.replace(/\D/g, ''));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isBlocked()) {
            addToast('Muitas tentativas de cadastro. Por favor, tente novamente mais tarde.', 'error');
            return;
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

        if (password !== confirmPassword) {
            addToast('As senhas não coincidem.', 'error');
            return;
        }
        if (!passwordRegex.test(password)) {
            addToast('A senha deve ter no mínimo 8 caracteres, incluindo letras e números.', 'error');
            return;
        }

        const emailExists = users.some(user => user.email.toLowerCase() === email.toLowerCase());
        if (emailExists) {
            addToast('Este e-mail já está em uso. Por favor, utilize outro.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            recordAttempt();
            const unmaskedPhone = phoneNumber.replace(/\D/g, '');
            const fullPhone = `${countryCode}${unmaskedPhone}`;
            const newUser = await addUser({
                name,
                email,
                phone: fullPhone,
                faculty,
                role: UserRole.MEMBER,
                status: UserStatus.ACTIVE,
            }, password);
            addToast('Cadastro realizado com sucesso!', 'success');
            setRegisteredUser(newUser);
        } catch (error) {
            console.error(error);
            addToast('Erro ao realizar o cadastro. Tente novamente.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const copyToClipboard = () => {
        if (registeredUser) {
            navigator.clipboard.writeText(registeredUser.myceseNumber);
            addToast('Nº MyCESE copiado!', 'info');
        }
    };

    if (registeredUser) {
        return (
             <div className="min-h-screen bg-mycese-bg flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    <div className="bg-white shadow-2xl rounded-2xl p-8 text-center">
                        <i className="fas fa-check-circle text-5xl text-green-500 mb-4"></i>
                        <h1 className="text-2xl font-bold text-mycese-blue">Bem-vindo, {registeredUser.name.split(' ')[0]}!</h1>
                        <p className="text-mycese-text-light mt-2 mb-4">Seu cadastro foi concluído com sucesso.</p>
                        
                        <div className="bg-gray-100 p-4 rounded-lg my-6">
                            <p className="text-sm font-semibold text-mycese-text-dark">Seu Nº MyCESE é:</p>
                            <div className="flex items-center justify-center gap-4 mt-2">
                                <p className="text-2xl font-bold tracking-wider text-mycese-orange">{registeredUser.myceseNumber}</p>
                                <button onClick={copyToClipboard} title="Copiar" className="text-gray-500 hover:text-mycese-blue">
                                    <i className="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>

                        <div className="text-left text-sm p-4 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-200">
                           <p className="font-bold"><i className="fas fa-exclamation-triangle mr-2"></i>Atenção: Informação Importante</p>
                           <p className="mt-2">O seu Nº MyCESE é o seu identificador único no sistema. Ele é pessoal, intransmissível e confidencial. Não o compartilhe. Recomendamos que o guarde num local seguro.</p>
                        </div>
                        
                        <button onClick={() => navigate('/login')} className="mt-8 w-full bg-mycese-blue text-white font-bold py-3 rounded-lg hover:bg-mycese-blue-dark transition-colors">
                            Prosseguir para o Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    const inputStyles = "w-full p-3 bg-gray-100 rounded-lg border-2 border-transparent focus:border-mycese-orange focus:bg-white outline-none transition";
    return (
        <div className="min-h-screen bg-mycese-bg flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="bg-white shadow-2xl rounded-2xl p-8 space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-mycese-blue">Criar Conta no {APP_NAME}</h1>
                        <p className="text-mycese-text-light">Junte-se à nossa comunidade acadêmica.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} required className={inputStyles} />
                            <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required className={inputStyles} />
                            <div className="flex items-center gap-2">
                                <select value={countryCode} onChange={handleCountryChange} className={`${inputStyles} w-auto`}>
                                    {countries.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                                </select>
                                <input 
                                    type="tel" 
                                    placeholder={countryCode === '+258' ? '8X-XXX-XXXX' : 'Contacto'}
                                    value={phoneNumber} 
                                    onChange={handlePhoneNumberChange}
                                    required 
                                    className={inputStyles} 
                                    maxLength={countryCode === '+258' ? 11 : undefined}
                                />
                            </div>
                            <select value={faculty} onChange={e => setFaculty(e.target.value as Faculty)} required className={inputStyles}>
                                {Object.values(Faculty).map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="relative">
                                    <input type={showPasswords.pass ? 'text' : 'password'} placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required className={`${inputStyles} pr-10`} />
                                    <button type="button" onClick={() => setShowPasswords(p => ({...p, pass: !p.pass}))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                        <i className={`fas ${showPasswords.pass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                                <div className="relative">
                                    <input type={showPasswords.confirm ? 'text' : 'password'} placeholder="Confirmar Senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={`${inputStyles} pr-10`} />
                                    <button type="button" onClick={() => setShowPasswords(p => ({...p, confirm: !p.confirm}))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                        <i className={`fas ${showPasswords.confirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-mycese-orange text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-gray-400 flex items-center justify-center">
                            {isLoading && <i className="fas fa-spinner fa-spin mr-2"></i>}
                            {isLoading ? 'Cadastrando...' : 'Cadastrar'}
                        </button>
                    </form>
                    <div className="text-center text-mycese-text-light">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="font-semibold text-mycese-blue hover:underline">
                            Faça login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
