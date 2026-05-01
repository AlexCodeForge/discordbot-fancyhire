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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Detalles del Lead</h2>
            <div className="flex gap-2">
              {lead.discord_id && (
                <button
                  onClick={() => setShowChat(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  Conversar
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={editedLead.name}
                onChange={(e) => setEditedLead({ ...editedLead, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contacto Discord
              </label>
              <input
                type="text"
                value={editedLead.contact_discord}
                onChange={(e) => setEditedLead({ ...editedLead, contact_discord: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Servicio de Interés
              </label>
              <textarea
                value={editedLead.service_interest || ''}
                onChange={(e) => setEditedLead({ ...editedLead, service_interest: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Etapa
              </label>
              <select
                value={editedLead.stage}
                onChange={(e) => setEditedLead({ ...editedLead, stage: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {STAGE_LABELS[stage]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asignado a
              </label>
              <input
                type="text"
                value={editedLead.assigned_to || ''}
                onChange={(e) => setEditedLead({ ...editedLead, assigned_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={editedLead.notes || ''}
                onChange={(e) => setEditedLead({ ...editedLead, notes: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="text-sm text-gray-500">
              <p>Creado: {new Date(editedLead.created_at).toLocaleString('es-ES')}</p>
              <p>Última actualización: {new Date(editedLead.updated_at).toLocaleString('es-ES')}</p>
              <p>Origen: {editedLead.source === 'auto' ? 'Automático' : 'Manual'}</p>
            </div>

            {history.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Historial de Cambios</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {history.map((item) => (
                    <div key={item.id} className="text-sm p-2 bg-gray-50 rounded">
                      <p className="font-medium">{item.action}</p>
                      {item.previous_value && (
                        <p className="text-gray-600">
                          De: {item.previous_value} → A: {item.new_value}
                        </p>
                      )}
                      <p className="text-gray-400 text-xs">
                        {new Date(item.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Eliminar
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
