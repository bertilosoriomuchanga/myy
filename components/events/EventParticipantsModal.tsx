
import React from 'react';
import { Event } from '../../types';
import { useData } from '../../hooks/useData';
import Modal from '../common/Modal';

interface EventParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

const EventParticipantsModal: React.FC<EventParticipantsModalProps> = ({ isOpen, onClose, event }) => {
  const { users } = useData();
  
  if (!event) return null;

  const participants = users.filter(user => event.participants.includes(user.id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Inscritos em: ${event.title}`}>
      {participants.length > 0 ? (
        <ul className="space-y-2 max-h-96 overflow-y-auto">
          {participants.map(p => (
            <li key={p.id} className="p-2 bg-gray-50 rounded-md flex justify-between items-center">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-gray-500">{p.email}</p>
              </div>
              <span className="text-xs px-2 py-1 bg-gray-200 rounded-full">{p.myceseNumber}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500">Nenhum membro inscrito neste evento ainda.</p>
      )}
    </Modal>
  );
};

export default EventParticipantsModal;
