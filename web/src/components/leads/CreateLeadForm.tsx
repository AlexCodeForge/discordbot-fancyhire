import { useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '../../services/api';
import { SuccessModal } from '../ui/modals/SuccessModal';
import { ErrorModal } from '../ui/modals/ErrorModal';

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
  const [successMessage, setSuccessMessage] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      setErrorMessage('Debes seleccionar un miembro del servidor');
      setShowErrorModal(true);
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
      setSuccessMessage({
        title: 'Lead Creado',
        message: 'El lead ha sido agregado correctamente',
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error creando lead:', error);
      const message = error.response?.data?.message || error.response?.data?.error || error.message;
      
      if (message?.includes('duplicate') || message?.includes('unique') || message?.includes('ya existe')) {
        setErrorMessage('Este usuario ya existe como lead en el sistema');
      } else {
        setErrorMessage(message || 'Error al crear el lead. Intenta nuevamente.');
      }
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SuccessModal
        isOpen={!!successMessage}
        onClose={() => {
          setSuccessMessage(null);
          onClose();
        }}
        title={successMessage?.title || ''}
        message={successMessage?.message || ''}
      />

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error al Crear Lead"
        message={errorMessage}
      />

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}>
      <div className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ 
        backgroundColor: 'var(--bmw-surface-card)',
        borderRadius: '0',
        border: '1px solid var(--bmw-hairline)'
      }}>
        <div className="p-6" style={{ borderBottom: '1px solid var(--bmw-hairline)' }}>
          <div className="flex justify-between items-start">
            <h2 style={{ fontSize: '32px', lineHeight: '1.15', fontWeight: 700, color: 'var(--bmw-ink)' }}>
              Crear Lead desde Discord
            </h2>
            <button
              onClick={onClose}
              className="bmw-body-sm"
              style={{ 
                background: 'transparent',
                border: 'none',
                color: 'var(--bmw-muted)',
                fontSize: '32px',
                cursor: 'pointer',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loadingMembers ? (
            <div className="text-center py-8 bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>
              Cargando miembros del servidor...
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>
              No se encontraron miembros. Asegúrate de que el bot esté conectado.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="bmw-label block mb-2">
                  Buscar Miembro *
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, tag o ID..."
                  className="bmw-input w-full"
                />
              </div>

              <div className="max-h-64 overflow-y-auto" style={{ 
                border: '1px solid var(--bmw-hairline)',
                borderRadius: '0'
              }}>
                {filteredMembers.length === 0 ? (
                  <div className="p-4 text-center bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>
                    No se encontraron miembros con ese criterio
                  </div>
                ) : (
                  <div style={{ borderBottom: '1px solid var(--bmw-hairline)' }}>
                    {filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setSelectedMember(member)}
                        className="w-full p-3 text-left transition-colors"
                        style={{
                          borderBottom: '1px solid var(--bmw-hairline)',
                          backgroundColor: selectedMember?.id === member.id ? 'var(--bmw-surface-soft)' : 'transparent',
                          borderLeft: selectedMember?.id === member.id ? '4px solid var(--bmw-primary)' : '4px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedMember?.id !== member.id) {
                            e.currentTarget.style.backgroundColor = 'var(--bmw-surface-soft)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedMember?.id !== member.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center bmw-title-sm" style={{ 
                            borderRadius: '9999px',
                            backgroundColor: 'var(--bmw-surface-strong)',
                            color: 'var(--bmw-body)'
                          }}>
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="bmw-title-sm truncate">
                              {member.displayName || member.username}
                            </div>
                            <div className="bmw-body-sm truncate" style={{ color: 'var(--bmw-muted)' }}>
                              {member.tag}
                            </div>
                          </div>
                          <div className="bmw-body-sm" style={{ 
                            fontSize: '12px',
                            color: 'var(--bmw-muted-soft)',
                            fontFamily: 'monospace'
                          }}>
                            {member.id}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedMember && (
                <div className="p-4" style={{ 
                  backgroundColor: 'var(--bmw-surface-soft)',
                  borderLeft: '4px solid var(--bmw-primary)',
                  border: '1px solid var(--bmw-hairline)',
                  borderRadius: '0'
                }}>
                  <div className="bmw-title-sm mb-1" style={{ color: 'var(--bmw-ink)' }}>
                    Miembro seleccionado:
                  </div>
                  <div className="bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>
                    {selectedMember.displayName || selectedMember.username} (
                    {selectedMember.tag})
                  </div>
                </div>
              )}

              <div>
                <label className="bmw-label block mb-1">
                  Servicio de Interés
                </label>
                <textarea
                  value={serviceInterest}
                  onChange={(e) => setServiceInterest(e.target.value)}
                  rows={3}
                  placeholder="Describe el servicio o proyecto de interés..."
                  className="bmw-input w-full"
                  style={{ height: 'auto', resize: 'vertical' }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--bmw-hairline)' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="bmw-btn-secondary"
                  style={{ height: '40px', padding: '8px 24px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedMember}
                  className="bmw-btn-primary"
                  style={{ height: '40px', padding: '8px 24px' }}
                >
                  {loading ? 'Creando...' : 'Crear Lead'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
