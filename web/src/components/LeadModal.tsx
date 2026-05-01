import { useState, useEffect } from 'react';
import { Lead, LeadHistory, STAGE_LABELS, STAGES } from '../types/Lead';
import { api } from '../services/api';
import { ChatModal } from './ChatModal';

interface LeadModalProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: () => void;
}

export function LeadModal({ lead, onClose, onUpdate }: LeadModalProps) {
  const [editedLead, setEditedLead] = useState<Lead>(lead);
  const [history, setHistory] = useState<LeadHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadHistory();
    if (lead.discord_id) {
      loadUnreadCount();
    }
  }, [lead.id]);

  const loadUnreadCount = async () => {
    try {
      const count = await api.getUnreadCount(lead.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error cargando contador no leídos:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await api.getLeadHistory(lead.id);
      setHistory(data);
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.updateLead(lead.id, editedLead);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error actualizando lead:', error);
      alert('Error al actualizar el lead');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este lead?')) return;
    
    setLoading(true);
    try {
      await api.deleteLead(lead.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error eliminando lead:', error);
      alert('Error al eliminar el lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showChat && (
        <ChatModal
          lead={lead}
          onClose={() => {
            setShowChat(false);
            setUnreadCount(0);
            loadUnreadCount();
          }}
        />
      )}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}>
      <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ 
        backgroundColor: 'var(--bmw-canvas)',
        borderRadius: '0',
        border: '1px solid var(--bmw-hairline)'
      }}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 style={{ fontSize: '32px', lineHeight: '1.15', fontWeight: 700, color: 'var(--bmw-ink)' }}>Detalles del Lead</h2>
            <div className="flex gap-2">
              {lead.discord_id && (
                <button
                  onClick={() => setShowChat(true)}
                  className="bmw-btn-primary flex items-center gap-2"
                  style={{ 
                    backgroundColor: 'var(--bmw-success)',
                    height: '40px',
                    padding: '8px 24px'
                  }}
                >
                  Conversar
                  {unreadCount > 0 && (
                    <span className="bmw-body-sm" style={{ 
                      backgroundColor: 'var(--bmw-error)',
                      color: 'white',
                      fontSize: '12px',
                      borderRadius: '9999px',
                      padding: '2px 8px',
                      fontWeight: 700
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}
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

          <div className="space-y-4">
            <div>
              <label className="bmw-label block mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={editedLead.name}
                onChange={(e) => setEditedLead({ ...editedLead, name: e.target.value })}
                className="bmw-input w-full"
              />
            </div>

            <div>
              <label className="bmw-label block mb-1">
                Contacto Discord
              </label>
              <input
                type="text"
                value={editedLead.contact_discord}
                onChange={(e) => setEditedLead({ ...editedLead, contact_discord: e.target.value })}
                className="bmw-input w-full"
              />
            </div>

            <div>
              <label className="bmw-label block mb-1">
                Servicio de Interés
              </label>
              <textarea
                value={editedLead.service_interest || ''}
                onChange={(e) => setEditedLead({ ...editedLead, service_interest: e.target.value })}
                rows={3}
                className="bmw-input w-full"
                style={{ height: 'auto', resize: 'vertical' }}
              />
            </div>

            <div>
              <label className="bmw-label block mb-1">
                Etapa
              </label>
              <select
                value={editedLead.stage}
                onChange={(e) => setEditedLead({ ...editedLead, stage: e.target.value as any })}
                className="bmw-input w-full"
              >
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {STAGE_LABELS[stage]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="bmw-label block mb-1">
                Asignado a
              </label>
              <input
                type="text"
                value={editedLead.assigned_to || ''}
                onChange={(e) => setEditedLead({ ...editedLead, assigned_to: e.target.value })}
                className="bmw-input w-full"
              />
            </div>

            <div>
              <label className="bmw-label block mb-1">
                Notas
              </label>
              <textarea
                value={editedLead.notes || ''}
                onChange={(e) => setEditedLead({ ...editedLead, notes: e.target.value })}
                rows={4}
                className="bmw-input w-full"
                style={{ height: 'auto', resize: 'vertical' }}
              />
            </div>

            <div className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>
              <p>Creado: {new Date(editedLead.created_at).toLocaleString('es-ES')}</p>
              <p>Última actualización: {new Date(editedLead.updated_at).toLocaleString('es-ES')}</p>
              <p>Origen: {editedLead.source === 'auto' ? 'Automático' : 'Manual'}</p>
            </div>

            {history.length > 0 && (
              <div className="mt-6">
                <h3 className="bmw-title-sm mb-3">Historial de Cambios</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {history.map((item) => (
                    <div key={item.id} className="bmw-body-sm p-2" style={{ 
                      backgroundColor: 'var(--bmw-surface-soft)',
                      borderRadius: '0'
                    }}>
                      <p className="bmw-title-sm" style={{ fontSize: '14px' }}>{item.action}</p>
                      {item.previous_value && (
                        <p style={{ color: 'var(--bmw-body)' }}>
                          De: {item.previous_value} → A: {item.new_value}
                        </p>
                      )}
                      <p style={{ color: 'var(--bmw-muted)', fontSize: '12px' }}>
                        {new Date(item.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6 pt-4" style={{ borderTop: '1px solid var(--bmw-hairline)' }}>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bmw-btn-secondary"
              style={{ 
                backgroundColor: 'transparent',
                color: 'var(--bmw-error)',
                borderColor: 'var(--bmw-error)',
                height: '40px',
                padding: '8px 24px'
              }}
            >
              Eliminar
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="bmw-btn-secondary"
                style={{ height: '40px', padding: '8px 24px' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="bmw-btn-primary"
                style={{ height: '40px', padding: '8px 24px' }}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
