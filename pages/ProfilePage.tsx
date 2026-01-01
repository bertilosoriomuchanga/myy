
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { ROLE_NAMES } from '../constants';
import { formatDate, parsePhoneNumber, formatMozambiquePhone } from '../utils/helpers';
import { Faculty } from '../types';
import { countries } from '../utils/countries';

const ProfilePage: React.FC = () => {
    const { user, updateCurrentUser, verifyPassword, hashPassword } = useAuth();
    const { updateUser } = useData();
    const { addToast } = useToast();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        faculty: Faculty.FEN,
        countryCode: '+258',
        phoneNumber: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    useEffect(() => {
        if (user) {
            let { countryCode, phoneNumber } = parsePhoneNumber(user.phone);
            if (countryCode === '+258') {
                phoneNumber = formatMozambiquePhone(phoneNumber);
            }
            setFormData({
                name: user.name,
                faculty: user.faculty,
                countryCode,
                phoneNumber
            });
        }
    }, [user]);

    if (!user) return null;

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let newFormData = { ...formData, [name]: value };

        if (name === 'countryCode') {
            if (value === '+258') {
                newFormData.phoneNumber = formatMozambiquePhone(newFormData.phoneNumber);
            } else {
                newFormData.phoneNumber = newFormData.phoneNumber.replace(/\D/g, '');
            }
        }
    
        if (name === 'phoneNumber' && newFormData.countryCode === '+258') {
            newFormData.phoneNumber = formatMozambiquePhone(value);
        }
        
        setFormData(newFormData);
    };

    const handlePasswordDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const unmaskedPhone = formData.phoneNumber.replace(/\D/g, '');
        const fullPhone = `${formData.countryCode}${unmaskedPhone}`;
        const updatedData = {
            name: formData.name,
            faculty: formData.faculty,
            phone: fullPhone
        };
        updateUser(user.id, updatedData); 
        updateCurrentUser(updatedData); 
        addToast('Perfil atualizado com sucesso!', 'success');
        setIsEditModalOpen(false);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            addToast('As novas senhas não coincidem.', 'error');
            return;
        }
        if (!passwordRegex.test(passwordData.newPassword)) {
            addToast('A nova senha deve ter no mínimo 8 caracteres, incluindo letras e números.', 'error');
            return;
        }

        const isCurrentPasswordValid = await verifyPassword(passwordData.currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            addToast('A senha atual está incorreta.', 'error');
            return;
        }

        const newPasswordHash = await hashPassword(passwordData.newPassword);
        const newPasswordVersion = (user.passwordVersion || 1) + 1;
        
        const updatedFields = { 
            passwordHash: newPasswordHash,
            passwordVersion: newPasswordVersion 
        };

        updateUser(user.id, updatedFields);
        updateCurrentUser(updatedFields);
        
        addToast('Senha alterada com sucesso!', 'success');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswords({ current: false, new: false, confirm: false });
        setIsPasswordModalOpen(false);
    };

    const inputStyles = "w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-mycese-text-dark focus:bg-white focus:ring-1 focus:ring-mycese-orange focus:border-mycese-orange transition";

    return (
        <div>
            <h1 className="text-3xl font-bold text-mycese-text-dark mb-6">Meu Perfil</h1>
            <Card>
                <div className="flex flex-col md:flex-row items-center">
                    <div className="w-32 h-32 rounded-full bg-mycese-blue text-white flex items-center justify-center text-5xl font-bold mb-6 md:mb-0 md:mr-8">
                        {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-3xl font-bold text-mycese-text-dark">{user.name}</h2>
                        <p className="text-mycese-text-light">{ROLE_NAMES[user.role]}</p>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                            <span><i className="fas fa-id-card w-6 mr-2 text-mycese-orange"></i>{user.myceseNumber}</span>
                            <span><i className="fas fa-envelope w-6 mr-2 text-mycese-orange"></i>{user.email}</span>
                            <span><i className="fas fa-phone w-6 mr-2 text-mycese-orange"></i>{user.phone}</span>
                            <span><i className="fas fa-university w-6 mr-2 text-mycese-orange"></i>{user.faculty}</span>
                            <span><i className="fas fa-calendar-plus w-6 mr-2 text-mycese-orange"></i>Membro desde: {formatDate(user.createdAt)}</span>
                        </div>
                        <div className="mt-6 space-x-4">
                            <button onClick={() => setIsEditModalOpen(true)} className="bg-mycese-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-mycese-blue-dark transition">Editar Informações</button>
                            <button onClick={() => setIsPasswordModalOpen(true)} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition">Alterar Senha</button>
                        </div>
                    </div>
                </div>
            </Card>
            
            {/* Edit Profile Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Informações">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-semibold">Nome Completo</label>
                        <input type="text" name="name" value={formData.name} onChange={handleFormChange} className={inputStyles} required />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">Telefone</label>
                        <div className="flex items-center gap-2">
                           <select name="countryCode" value={formData.countryCode} onChange={handleFormChange} className={`${inputStyles} w-auto`}>
                               {countries.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                           </select>
                           <input 
                                type="tel" 
                                name="phoneNumber" 
                                value={formData.phoneNumber} 
                                onChange={handleFormChange} 
                                className={inputStyles} 
                                required 
                                maxLength={formData.countryCode === '+258' ? 11 : undefined}
                                placeholder={formData.countryCode === '+258' ? "8X-XXX-XXXX" : undefined}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">Faculdade</label>
                        <select name="faculty" value={formData.faculty} onChange={handleFormChange} className={inputStyles} required>
                            {Object.values(Faculty).map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <div className="text-right">
                        <button type="submit" className="bg-mycese-orange text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Salvar</button>
                    </div>
                </form>
            </Modal>
            
            {/* Change Password Modal */}
            <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Alterar Senha">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="relative">
                        <label className="block mb-1 font-semibold">Senha Atual</label>
                        <input type={showPasswords.current ? 'text' : 'password'} name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordDataChange} className={`${inputStyles} pr-10`} required />
                        <button type="button" onClick={() => setShowPasswords(p => ({...p, current: !p.current}))} className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700">
                            <i className={`fas ${showPasswords.current ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                    </div>
                    <div className="relative">
                        <label className="block mb-1 font-semibold">Nova Senha</label>
                        <input type={showPasswords.new ? 'text' : 'password'} name="newPassword" value={passwordData.newPassword} onChange={handlePasswordDataChange} className={`${inputStyles} pr-10`} required />
                        <button type="button" onClick={() => setShowPasswords(p => ({...p, new: !p.new}))} className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700">
                            <i className={`fas ${showPasswords.new ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                    </div>
                     <div className="relative">
                        <label className="block mb-1 font-semibold">Confirmar Nova Senha</label>
                        <input type={showPasswords.confirm ? 'text' : 'password'} name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordDataChange} className={`${inputStyles} pr-10`} required />
                        <button type="button" onClick={() => setShowPasswords(p => ({...p, confirm: !p.confirm}))} className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700">
                            <i className={`fas ${showPasswords.confirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                    </div>
                    <div className="text-right">
                        <button type="submit" className="bg-mycese-orange text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Alterar Senha</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ProfilePage;
