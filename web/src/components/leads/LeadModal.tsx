import { useState, useEffect } from 'react';
import { Lead, LeadHistory, STAGE_LABELS, STAGES } from '../../types/Lead';
import { api } from '../../services/api';
import { ChatModal } from './ChatModal';
import { TicketsPanel } from '../tickets/TicketsPanel';
import { TicketChatModal } from '../tickets/modals/TicketChatModal';
import { ConfirmationModal } from '../ui/modals/ConfirmationModal';
import { ErrorModal } from '../ui/modals/ErrorModal';

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
  const [activeTab, setActiveTab] = useState<'details' | 'tickets'>('details');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    } catch (error: any) {
      console.error('Error actualizando lead:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Error al actualizar el lead');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.deleteLead(lead.id);
      setShowDeleteConfirm(false);
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error eliminando lead:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Error al eliminar el lead');
      setShowErrorModal(true);
      setShowDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
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
            onUpdate();
          }}
        />
      )}
      
      {selectedTicket && (
        <TicketChatModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onTicketUpdated={() => {
            setSelectedTicket(null);
            setActiveTab('tickets');
          }}
        />
      )}
      
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}>
      <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ 
        backgroundColor: 'var(--bmw-surface-card)',
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

          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', borderBottom: '2px solid var(--bmw-hairline)' }}>
            <button
              onClick={() => setActiveTab('details')}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 0',
                fontSize: '14px',
                fontWeight: 700,
                color: activeTab === 'details' ? 'var(--bmw-ink)' : 'var(--bmw-muted)',
                cursor: 'pointer',
                borderBottom: activeTab === 'details' ? '2px solid var(--bmw-ink)' : 'none',
                marginBottom: '-2px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Detalles
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 0',
                fontSize: '14px',
                fontWeight: 700,
                color: activeTab === 'tickets' ? 'var(--bmw-ink)' : 'var(--bmw-muted)',
                cursor: 'pointer',
                borderBottom: activeTab === 'tickets' ? '2px solid var(--bmw-ink)' : 'none',
                marginBottom: '-2px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Tickets
            </button>
          </div>

          {activeTab === 'details' ? (
            <>
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
              onClick={() => setShowDeleteConfirm(true)}
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
            </>
          ) : (
            <TicketsPanel
              leadId={lead.id}
              onTicketSelect={(ticket) => setSelectedTicket(ticket)}
            />
          )}
        </div>
      </div>
    </div>

    <ConfirmationModal
      isOpen={showDeleteConfirm}
      onClose={() => setShowDeleteConfirm(false)}
      onConfirm={handleDelete}
      title="Eliminar Lead"
      message={`¿Estás seguro de que deseas eliminar el lead "${lead.name}"? Esta acción no se puede deshacer y se perderán todos los datos asociados.`}
      confirmText="Eliminar"
      cancelText="Cancelar"
      variant="danger"
      loading={deleteLoading}
    />

    <ErrorModal
      isOpen={showErrorModal}
      onClose={() => setShowErrorModal(false)}
      title="Error"
      message={errorMessage}
    />
    </>
  );
}
