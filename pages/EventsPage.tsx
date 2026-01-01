
import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { UserRole, Event } from '../types';
import Card from '../components/common/Card';
import { formatDateTime } from '../utils/helpers';
import AddEventModal from '../components/events/AddEventModal';
import EventParticipantsModal from '../components/events/EventParticipantsModal';

const EventsPage: React.FC = () => {
    const { events, registerForEvent, unregisterFromEvent } = useData();
    const { user } = useAuth();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    if (!user) return null;

    const openParticipantsModal = (event: Event) => {
        setSelectedEvent(event);
        setIsParticipantsModalOpen(true);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-mycese-text-dark">Eventos</h1>
                {user.role === UserRole.ADMIN && (
                    <button onClick={() => setIsAddModalOpen(true)} className="bg-mycese-orange text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition">
                        <i className="fas fa-plus mr-2"></i> Criar Evento
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => {
                    const isParticipant = event.participants.includes(user.id);
                    const isAdminOrCfo = user.role === UserRole.ADMIN || user.role === UserRole.CFO;
                    return (
                        <Card key={event.id} className="flex flex-col">
                            <div className="flex-grow">
                                <h3 className="text-xl font-bold text-mycese-blue mb-2">{event.title}</h3>
                                <p className="text-sm text-mycese-text-light mb-4">{event.description}</p>
                                <div className="text-sm space-y-2 mb-4">
                                    <p><i className="fas fa-calendar-alt w-5 mr-2 text-mycese-orange"></i> {formatDateTime(event.date)}</p>
                                    <p><i className="fas fa-map-marker-alt w-5 mr-2 text-mycese-orange"></i> {event.location}</p>
                                    <p
                                        className={isAdminOrCfo ? 'cursor-pointer hover:underline' : ''}
                                        onClick={() => isAdminOrCfo && openParticipantsModal(event)}
                                    >
                                        <i className="fas fa-users w-5 mr-2 text-mycese-orange"></i> {event.participants.length} inscritos
                                        {isAdminOrCfo && <i className="fas fa-external-link-alt text-xs ml-2"></i>}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-auto">
                                {isParticipant ? (
                                    <button 
                                        onClick={() => unregisterFromEvent(event.id, user.id)}
                                        className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition"
                                    >
                                        Cancelar Inscrição
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => registerForEvent(event.id, user.id)}
                                        className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition"
                                    >
                                        Inscrever-se
                                    </button>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
            <AddEventModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <EventParticipantsModal isOpen={isParticipantsModalOpen} onClose={() => setIsParticipantsModalOpen(false)} event={selectedEvent} />
        </>
    );
};

export default EventsPage;
