
import React, { useState } from 'react';
import { useData } from '../../hooks/useData';
import { useToast } from '../../hooks/useToast';
import Modal from '../common/Modal';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
  });

  const { addEvent } = useData();
  const { addToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.location) {
        addToast('Por favor, preencha os campos obrigatórios.', 'error');
        return;
    }
    await addEvent({
        ...formData,
        date: new Date(formData.date).toISOString() // Store as ISO string
    });
    addToast('Evento criado com sucesso!', 'success');
    setFormData({ title: '', description: '', date: '', location: '' }); // Reset form
    onClose();
  };

  const inputStyles = "w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-mycese-text-dark focus:bg-white focus:ring-1 focus:ring-mycese-orange focus:border-mycese-orange transition";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Novo Evento">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-semibold">Título do Evento</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputStyles} required />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Descrição</label>
          <textarea name="description" value={formData.description} onChange={handleChange} className={inputStyles} rows={3}></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold">Data e Hora</label>
              <input type="datetime-local" name="date" value={formData.date} onChange={handleChange} className={inputStyles} required />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Localização</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} className={inputStyles} required />
            </div>
        </div>
        <div className="text-right pt-4">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 mr-2">Cancelar</button>
          <button type="submit" className="bg-mycese-orange text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Criar Evento</button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEventModal;
