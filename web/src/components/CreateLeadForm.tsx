import { useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '../services/api';

interface CreateLeadFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface DiscordMember {
  id: string;
  username: string;
  tag: string;
  displayName: string;
  avatar: string | null;
  joinedAt: string | null;
}

export function CreateLeadForm({ onClose, onSuccess }: CreateLeadFormProps) {
  const [members, setMembers] = useState<DiscordMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<DiscordMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<DiscordMember | null>(null);
  const [serviceInterest, setServiceInterest] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMembers(members);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = members.filter(
        (m) =>
          m.username.toLowerCase().includes(term) ||
          m.tag.toLowerCase().includes(term) ||
          m.displayName.toLowerCase().includes(term) ||
          m.id.includes(term)
      );
      setFilteredMembers(filtered);
    }
  }, [searchTerm, members]);

  const loadMembers = async () => {
    try {
      const response = await axios.get('/api/discord/members');
      setMembers(response.data);
      setFilteredMembers(response.data);
    } catch (error) {
      console.error('Error cargando miembros:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMember) {
      alert('Selecciona un miembro del servidor');
      return;
    }

    setLoading(true);
    try {
      await api.createLead({
        name: selectedMember.displayName || selectedMember.username,
        discord_id: selectedMember.id,
        discord_tag: selectedMember.tag,
        contact_discord: `<@${selectedMember.id}>`,
        service_interest: serviceInterest || 'Sin especificar',
        stage: 'nuevo',
        source: 'manual',
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creando lead:', error);
      alert('Error al crear el lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-gray-900">
              Crear Lead desde Discord
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loadingMembers ? (
            <div className="text-center py-8 text-gray-600">
              Cargando miembros del servidor...
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No se encontraron miembros. Asegúrate de que el bot esté conectado.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Miembro *
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, tag o ID..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No se encontraron miembros con ese criterio
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setSelectedMember(member)}
                        className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                          selectedMember?.id === member.id
                            ? 'bg-blue-50 border-l-4 border-blue-600'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {member.displayName || member.username}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {member.tag}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            {member.id}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedMember && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-medium text-blue-900 mb-1">
                    Miembro seleccionado:
                  </div>
                  <div className="text-sm text-blue-700">
                    {selectedMember.displayName || selectedMember.username} (
                    {selectedMember.tag})
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servicio de Interés
                </label>
                <textarea
                  value={serviceInterest}
                  onChange={(e) => setServiceInterest(e.target.value)}
                  rows={3}
                  placeholder="Describe el servicio o proyecto de interés..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedMember}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear Lead'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
