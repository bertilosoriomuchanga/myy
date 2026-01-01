
import React, { useState } from 'react';
import { Faculty, UserRole, UserStatus } from '../../types';
import { useData } from '../../hooks/useData';
import { useToast } from '../../hooks/useToast';
import Modal from '../common/Modal';
import { ROLE_NAMES } from '../../constants';
import { generateTemporaryPassword, formatMozambiquePhone } from '../../utils/helpers';
import { countries } from '../../utils/countries';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    countryCode: '+258',
    phoneNumber: '',
    faculty: Faculty.FEN,
    role: UserRole.MEMBER,
  });
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { addUser, users } = useData();
  const { addToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const emailExists = users.some(user => user.email.toLowerCase() === formData.email.toLowerCase());
    if (emailExists) {
        addToast('Este e-mail já está em uso.', 'error');
        setIsLoading(false);
        return;
    }

    const tempPassword = generateTemporaryPassword();
    const unmaskedPhone = formData.phoneNumber.replace(/\D/g, '');
    const fullPhone = `${formData.countryCode}${unmaskedPhone}`;
    try {
        await addUser({
            name: formData.name,
            email: formData.email,
            phone: fullPhone,
            faculty: formData.faculty,
            role: formData.role,
            status: UserStatus.ACTIVE,
            mustChangePassword: true,
        }, tempPassword);
        setGeneratedPassword(tempPassword);
        addToast('Membro criado com sucesso!', 'success');
    } catch (error) {
        addToast('Erro ao criar membro.', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', countryCode: '+258', phoneNumber: '', faculty: Faculty.FEN, role: UserRole.MEMBER });
    setGeneratedPassword(null);
    onClose();
  };

  const inputStyles = "w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-mycese-text-dark focus:bg-white focus:ring-1 focus:ring-mycese-orange focus:border-mycese-orange transition";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Criar Novo Membro">
      {!generatedPassword ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="name" placeholder="Nome Completo" value={formData.name} onChange={handleChange} className={inputStyles} required />
          <input type="email" name="email" placeholder="E-mail" value={formData.email} onChange={handleChange} className={inputStyles} required />
           <div>
              <label className="block mb-1 font-semibold text-sm text-gray-600">Telefone</label>
              <div className="flex items-center gap-2">
                 <select name="countryCode" value={formData.countryCode} onChange={handleChange} className={`${inputStyles} w-auto`}>
                     {countries.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                 </select>
                 <input 
                    type="tel" 
                    name="phoneNumber" 
                    placeholder={formData.countryCode === '+258' ? '8X-XXX-XXXX' : 'Contacto'}
                    value={formData.phoneNumber} 
                    onChange={handleChange} 
                    className={inputStyles} 
                    required 
                    maxLength={formData.countryCode === '+258' ? 11 : undefined}
                  />
              </div>
          </div>
          <select name="faculty" value={formData.faculty} onChange={handleChange} className={inputStyles} required>
            {Object.values(Faculty).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select name="role" value={formData.role} onChange={handleChange} className={inputStyles} required>
            {Object.values(UserRole).map(r => <option key={r} value={r}>{ROLE_NAMES[r]}</option>)}
          </select>
          <div className="text-right pt-4">
            <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 mr-2">Cancelar</button>
            <button type="submit" disabled={isLoading} className="bg-mycese-orange text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition disabled:bg-gray-400">
                {isLoading ? 'Criando...' : 'Criar Membro'}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center">
            <i className="fas fa-check-circle text-green-500 text-4xl mb-4"></i>
            <h4 className="text-xl font-bold">Membro Criado!</h4>
            <p className="text-gray-600 mt-2 mb-4">A senha temporária foi gerada. O usuário deverá alterá-la no primeiro login.</p>
            <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm">Senha Temporária:</p>
                <p className="text-lg font-bold tracking-wider text-mycese-blue">{generatedPassword}</p>
            </div>
            <button onClick={handleClose} className="mt-6 bg-mycese-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-mycese-blue-dark">Fechar</button>
        </div>
      )}
    </Modal>
  );
};

export default AddMemberModal;
