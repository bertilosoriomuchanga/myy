
import React, { useState, useEffect } from 'react';
import { User, Faculty, UserRole } from '../../types';
import { useData } from '../../hooks/useData';
import { useToast } from '../../hooks/useToast';
import Modal from '../common/Modal';
import { ROLE_NAMES } from '../../constants';
import { countries } from '../../utils/countries';
import { parsePhoneNumber, formatMozambiquePhone } from '../../utils/helpers';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ isOpen, onClose, user }) => {
  const [formData, setFormData] = useState({
    name: '',
    countryCode: '+258',
    phoneNumber: '',
    faculty: Faculty.FEN,
    role: UserRole.MEMBER,
  });

  const { updateUser } = useData();
  const { addToast } = useToast();

  useEffect(() => {
    if (user) {
      let { countryCode, phoneNumber } = parsePhoneNumber(user.phone);
      if (countryCode === '+258') {
        phoneNumber = formatMozambiquePhone(phoneNumber);
      }
      setFormData({
        name: user.name,
        countryCode,
        phoneNumber,
        faculty: user.faculty,
        role: user.role,
      });
    }
  }, [user]);

  if (!user) return null;

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
    const unmaskedPhone = formData.phoneNumber.replace(/\D/g, '');
    const fullPhone = `${formData.countryCode}${unmaskedPhone}`;
    await updateUser(user.id, {
        name: formData.name,
        phone: fullPhone,
        faculty: formData.faculty,
        role: formData.role,
    });
    addToast('Dados do membro atualizados com sucesso!', 'success');
    onClose();
  };
  
  const inputStyles = "w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-mycese-text-dark focus:bg-white focus:ring-1 focus:ring-mycese-orange focus:border-mycese-orange transition";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar Membro: ${user.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-semibold">Nome Completo</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputStyles} required />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Telefone</label>
           <div className="flex items-center gap-2">
               <select name="countryCode" value={formData.countryCode} onChange={handleChange} className={`${inputStyles} w-auto`}>
                   {countries.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
               </select>
               <input 
                  type="tel" 
                  name="phoneNumber" 
                  value={formData.phoneNumber} 
                  onChange={handleChange} 
                  className={inputStyles} 
                  required 
                  maxLength={formData.countryCode === '+258' ? 11 : undefined}
                  placeholder={formData.countryCode === '+258' ? "8X-XXX-XXXX" : undefined}
                />
            </div>
        </div>
        <div>
          <label className="block mb-1 font-semibold">Faculdade</label>
          <select name="faculty" value={formData.faculty} onChange={handleChange} className={inputStyles} required>
            {Object.values(Faculty).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-semibold">Cargo / Escalão</label>
          <select name="role" value={formData.role} onChange={handleChange} className={inputStyles} required>
            {Object.values(UserRole).map(r => <option key={r} value={r}>{ROLE_NAMES[r]}</option>)}
          </select>
        </div>
        <div className="text-right pt-4">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 mr-2">Cancelar</button>
          <button type="submit" className="bg-mycese-orange text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Salvar Alterações</button>
        </div>
      </form>
    </Modal>
  );
};

export default EditMemberModal;
