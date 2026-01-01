
import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { User, UserRole, UserStatus, Faculty } from '../types';
import Card from '../components/common/Card';
import { ROLE_NAMES, FACULTY_NAMES } from '../constants';
import EditMemberModal from '../components/members/EditMemberModal';
import AddMemberModal from '../components/members/AddMemberModal';

const MembersPage: React.FC = () => {
    const { users, updateUser } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        role: '',
        status: '',
        faculty: '',
    });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = user.name.toLowerCase().includes(searchLower) ||
                                  user.email.toLowerCase().includes(searchLower) ||
                                  user.myceseNumber.toLowerCase().includes(searchLower);
            
            const matchesRole = filters.role ? user.role === filters.role : true;
            const matchesStatus = filters.status ? user.status === filters.status : true;
            const matchesFaculty = filters.faculty ? user.faculty === filters.faculty : true;
            
            return matchesSearch && matchesRole && matchesStatus && matchesFaculty;
        });
    }, [users, searchTerm, filters]);

    const handleStatusToggle = (user: User) => {
        const newStatus = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
        updateUser(user.id, { status: newStatus });
    };

    return (
        <>
            <Card title="Gestão de Membros">
                 <div className="mb-6 space-y-4 md:space-y-0 md:flex md:justify-between md:items-center">
                    <input
                        type="text"
                        placeholder="Buscar por nome, e-mail ou nº MyCESE..."
                        className="w-full md:w-1/3 p-2 border rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button onClick={() => setIsAddModalOpen(true)} className="bg-mycese-orange text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition">
                        <i className="fas fa-plus mr-2"></i> Criar Membro
                    </button>
                </div>
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <select name="role" value={filters.role} onChange={handleFilterChange} className="p-2 border rounded-lg">
                        <option value="">Todos os Perfis</option>
                        {Object.values(UserRole).map(role => <option key={role} value={role}>{ROLE_NAMES[role]}</option>)}
                    </select>
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="p-2 border rounded-lg">
                        <option value="">Todos os Status</option>
                        <option value={UserStatus.ACTIVE}>Ativo</option>
                        <option value={UserStatus.INACTIVE}>Inativo</option>
                    </select>
                    <select name="faculty" value={filters.faculty} onChange={handleFilterChange} className="p-2 border rounded-lg">
                        <option value="">Todas as Faculdades</option>
                        {Object.values(Faculty).map(fac => <option key={fac} value={fac}>{FACULTY_NAMES[fac]}</option>)}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Nome</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Nº MyCESE</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Perfil</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Status</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4">{user.name}</td>
                                    <td className="py-3 px-4">{user.myceseNumber}</td>
                                    <td className="py-3 px-4">{ROLE_NAMES[user.role]}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === UserStatus.ACTIVE ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                            {user.status === UserStatus.ACTIVE ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 flex items-center gap-2">
                                        <button onClick={() => openEditModal(user)} className="text-blue-500 hover:text-blue-700 text-lg"><i className="fas fa-edit"></i></button>
                                        <button onClick={() => handleStatusToggle(user)} className={`${user.status === UserStatus.ACTIVE ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'} text-lg`}>
                                            <i className={`fas ${user.status === UserStatus.ACTIVE ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            <EditMemberModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={selectedUser} />
            <AddMemberModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        </>
    );
};

export default MembersPage;
